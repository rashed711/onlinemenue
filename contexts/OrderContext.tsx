import React, { createContext, useState, useCallback, useContext, useEffect, useRef } from 'react';
import type { Order, CartItem, RestaurantInfo } from '../types';
import { APP_CONFIG } from '../utils/config';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { calculateTotal, resolveImageUrl } from '../utils/helpers';
import { usePersistentState } from '../hooks/usePersistentState';
import { useInventory } from './InventoryContext';
import { useTreasury } from './TreasuryContext';

interface OrderContextType {
    orders: Order[];
    isOrdersLoading: boolean;
    placeOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Promise<Order>;
    updateOrder: (orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;
    viewingOrder: Order | null;
    setViewingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    refusingOrder: Order | null;
    setRefusingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsProcessing, showToast, t, language } = useUI();
    const { currentUser, hasPermission } = useAuth();
    const { restaurantInfo } = useData();
    const { fetchInventoryData } = useInventory();
    const { fetchTreasuryData } = useTreasury();

    const [orders, setOrders] = useState<Order[]>([]);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [refusingOrder, setRefusingOrder] = useState<Order | null>(null);
    const [isOrdersLoading, setIsOrdersLoading] = useState(true);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const [isSoundEnabled] = usePersistentState<boolean>('admin_sound_enabled', true);
    const orderStatusMapRef = useRef<Map<string, string>>(new Map());
    const isInitialLoadRef = useRef(true);

    const fetchOrders = useCallback(async () => {
        if (!currentUser) {
            setOrders([]);
            setIsOrdersLoading(false);
            return;
        }
        setIsOrdersLoading(true);
        try {
            const res = await fetch(`${APP_CONFIG.API_BASE_URL}get_orders.php`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            const allOrders = (await res.json() || []).map((o: any) => ({ ...o, paymentReceiptUrl: resolveImageUrl(o.paymentReceiptUrl) }));

            if (hasPermission('view_orders_page')) {
                setOrders(allOrders);
            } else {
                setOrders(allOrders.filter((o: Order) => o.customer.userId === currentUser.id));
            }
        } catch (error) {
            console.error("Failed to load order data:", error);
            showToast("Failed to load order data.");
        } finally {
            setIsOrdersLoading(false);
        }
    }, [currentUser, hasPermission, showToast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    useEffect(() => {
        const initAudio = async () => {
            try {
                if (!audioCtxRef.current) {
                    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                    if (AudioContext) audioCtxRef.current = new AudioContext();
                }
                if (!audioCtxRef.current) return;
                const response = await fetch('https://cdn.jsdelivr.net/gh/cosmo-project/cosmo-ui/assets/sounds/notify.mp3');
                if (!response.ok) throw new Error(`Sound file not found`);
                const arrayBuffer = await response.arrayBuffer();
                audioBufferRef.current = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            } catch (e) { console.error("Failed to load sound:", e); }
        };
        initAudio();
        return () => { audioCtxRef.current?.close().catch(e => {}); };
    }, []);

    const playNotificationSound = useCallback(() => {
        const audioCtx = audioCtxRef.current;
        const audioBuffer = audioBufferRef.current;
        if (audioCtx && audioBuffer) {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start(0);
        }
    }, []);

    useEffect(() => {
        if (!restaurantInfo || !hasPermission('view_orders_page') || isOrdersLoading) return;
        if (isInitialLoadRef.current) {
            orderStatusMapRef.current = new Map(orders.map(o => [o.id, o.status]));
            isInitialLoadRef.current = false;
            return;
        }
        let soundShouldBePlayed = false;
        for (const order of orders) {
            const oldStatus = orderStatusMapRef.current.get(order.id);
            const newStatus = order.status;
            if (oldStatus !== newStatus) {
                const statusConfig = restaurantInfo.orderStatusColumns.find(col => col.id === newStatus);
                if (statusConfig?.playSound) {
                    soundShouldBePlayed = true;
                    break;
                }
            }
        }
        if (soundShouldBePlayed && isSoundEnabled) playNotificationSound();
        orderStatusMapRef.current = new Map(orders.map(o => [o.id, o.status]));
    }, [orders, restaurantInfo, isSoundEnabled, hasPermission, playNotificationSound, isOrdersLoading]);

    const placeOrder = useCallback(async (order: Omit<Order, 'id' | 'timestamp'>): Promise<Order> => {
        setIsProcessing(true);
        try {
            let orderForDb = { ...order };
            if (orderForDb.paymentReceiptUrl?.startsWith('data:image')) {
                const res = await fetch(orderForDb.paymentReceiptUrl);
                const blob = await res.blob();
                const formData = new FormData();
                formData.append('image', blob, 'receipt.png');
                formData.append('type', 'payment');
                const uploadRes = await fetch(`${APP_CONFIG.API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (result.success && result.url) {
                    orderForDb.paymentReceiptUrl = result.url.split('?v=')[0];
                } else throw new Error(result.error || 'Failed to get URL for receipt');
            }
            const statusId = restaurantInfo?.orderStatusColumns?.[0]?.id || 'pending';
            const payload = { ...orderForDb, id: `ORD-${Math.floor(Math.random() * 900000) + 100000}`, status: statusId, createdBy: currentUser?.id };
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to place order.');
            const newOrder = { ...result.order, paymentReceiptUrl: resolveImageUrl(result.order.paymentReceiptUrl) };
            setOrders(prev => [newOrder, ...prev]);
            return newOrder;
        } catch (error: any) {
            showToast(error.message || 'Failed to place order.');
            throw error;
        } finally { setIsProcessing(false); }
    }, [currentUser, restaurantInfo, setIsProcessing, showToast]);

    const updateOrder = useCallback(async (orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => {
        const originalOrders = orders;
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        let canUpdate = hasPermission('manage_order_status');
        if (payload.items || payload.notes !== undefined || payload.tableNumber !== undefined) canUpdate = hasPermission('edit_order_content');
        if (payload.customerFeedback) canUpdate = currentUser?.id === order.customer.userId && order.status === 'completed';

        if (canUpdate) {
            const updatedOrder = { ...order, ...payload, total: payload.items ? calculateTotal(payload.items) : order.total };
            setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            setViewingOrder(prev => (prev && prev.id === orderId) ? updatedOrder : prev);
            setIsProcessing(true);
            try {
                let dbPayload = { ...payload };
                if (dbPayload.items) dbPayload.total = calculateTotal(dbPayload.items);
                const res = await fetch(`${APP_CONFIG.API_BASE_URL}update_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, payload: dbPayload }) });
                if (!res.ok || !(await res.json()).success) throw new Error('Failed to update order.');
                showToast(t.orderUpdatedSuccess);
                
                const oldStatus = order.status;
                const newStatus = payload.status;
                const completedStatusId = restaurantInfo?.orderStatusColumns.find(col => col.color === 'green')?.id || 'completed';
        
                if (newStatus && newStatus !== oldStatus) {
                    if (newStatus === completedStatusId || oldStatus === completedStatusId) {
                        await Promise.all([fetchInventoryData(), fetchTreasuryData()]);
                    }
                }

            } catch (error: any) {
                showToast(error.message);
                setOrders(originalOrders);
                setViewingOrder(prev => (prev && prev.id === orderId) ? order : prev);
            } finally { setIsProcessing(false); }
        } else { showToast(t.permissionDenied); }
    }, [orders, currentUser, hasPermission, showToast, t, setIsProcessing, restaurantInfo, fetchInventoryData, fetchTreasuryData]);

    const deleteOrder = useCallback(async (orderId: string) => {
        if (!hasPermission('delete_order') || !window.confirm(t.confirmDeleteOrder)) return;
        const originalOrders = orders;
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setViewingOrder(null);
        setIsProcessing(true);
        try {
            const res = await fetch(`${APP_CONFIG.API_BASE_URL}delete_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId }) });
            if (!res.ok || !(await res.json()).success) throw new Error(t.orderDeleteFailed);
            showToast(t.orderDeletedSuccess);
        } catch (error: any) {
            showToast(error.message);
            setOrders(originalOrders);
        } finally { setIsProcessing(false); }
    }, [hasPermission, t, orders, setIsProcessing, showToast]);

    const value: OrderContextType = { orders, isOrdersLoading, placeOrder, updateOrder, deleteOrder, viewingOrder, setViewingOrder, refusingOrder, setRefusingOrder };
    
    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrders = () => {
    const context = useContext(OrderContext);
    if (context === undefined) throw new Error('useOrders must be used within an OrderProvider');
    return context;
};