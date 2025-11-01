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

// Base64 encoded public domain notification sound to prevent pathing issues.
const notificationSoundDataUri = 'data:audio/mpeg;base64,SUQzBAAAAAAAIBAFVVTEQAAAACAAADSAAAAAP8A/i4ADgAQAFhZWU5DAAAABAAD//wDE5/naa4f1eA4yAABJIIAA3/s/y3P+Yf5v/w7/AP/t/wH/1v+f/qP/kv+j/wH/rv+V/zL/AP/T/2P+Y/5j/w7+AP/q/wL/rv/D/zX/AP/b/wH+Y/5T/w3/AP/r/wP/sP/H/zL/AP/a/wL+Y/5T/w3/AP/q/wP/sP/F/zL/AP/W/wH/Y/5j/w7/AP/q/wP/sP+///8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A/8z/AP/M/wD/zP8A';

// FIX: Wrap logic in a provider component and export it.
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // FIX: All hooks and state logic moved inside the provider.
    const { setIsLoading, showToast, t, isProcessing, setIsProcessing } = useUI();
    const { currentUser, hasPermission } = useAuth();
    const { restaurantInfo, products, fetchAllData: refetchData } = useData();
    const { fetchInventoryData } = useInventory();
    const { fetchTreasuryData } = useTreasury();

    const [orders, setOrders] = useState<Order[]>([]);
    const [isOrdersLoading, setIsOrdersLoading] = useState(true);
    
    // For modals
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [refusingOrder, setRefusingOrder] = useState<Order | null>(null);

    const [isSoundEnabled] = usePersistentState<boolean>('admin_sound_enabled', true);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
    const lastPlayedForOrder = useRef<Set<string>>(new Set());
    const lastPlayedForStatus = useRef<Map<string, string>>(new Map());

    // Effect to create the audio object
    useEffect(() => {
        const audio = new Audio(notificationSoundDataUri);
        audio.preload = 'auto';
        notificationAudioRef.current = audio;
    }, []);

    // Effect to play notification sound
    useEffect(() => {
        if (!isSoundEnabled || isOrdersLoading || !restaurantInfo || !notificationAudioRef.current) return;

        const soundStatuses = new Set(
            restaurantInfo.orderStatusColumns
                .filter(col => col.playSound)
                .map(col => col.id)
        );

        if (soundStatuses.size === 0) return;

        orders.forEach(order => {
            const shouldPlay = soundStatuses.has(order.status);
            const alreadyPlayedForThisStatus = lastPlayedForStatus.current.get(order.id) === order.status;

            if (shouldPlay && !alreadyPlayedForThisStatus) {
                console.log(`Playing sound for order ${order.id} with status ${order.status}`);
                notificationAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
                lastPlayedForStatus.current.set(order.id, order.status);
            }
        });
    }, [orders, isSoundEnabled, isOrdersLoading, restaurantInfo]);
    
    // Fetch orders periodically
    useEffect(() => {
        let isMounted = true;
        const fetchOrders = async () => {
            if (!currentUser || !hasPermission('view_orders_page')) {
                setOrders([]);
                setIsOrdersLoading(false);
                return;
            }
            try {
                const response = await fetch(`${APP_CONFIG.API_BASE_URL}get_orders.php`);
                if (response.ok && isMounted) {
                    const data = await response.json();
                    setOrders(data || []);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                if (isMounted) setIsOrdersLoading(false);
            }
        };

        fetchOrders(); // Initial fetch
        const interval = setInterval(fetchOrders, 10000); // Poll every 10 seconds

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [currentUser, hasPermission]);


    const placeOrder = useCallback(async (order: Omit<Order, 'id' | 'timestamp'>): Promise<Order> => {
        setIsProcessing(true);
        try {
            const payload = {
                ...order,
                createdBy: currentUser?.id
            };
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}place_order.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to place order.');
            }
            
            // Refetch inventory and treasury data after successful order
            await Promise.all([
                fetchInventoryData(),
                fetchTreasuryData()
            ]);

            return result.order;
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, currentUser, fetchInventoryData, fetchTreasuryData]);
    
    const updateOrder = useCallback(async (orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => {
        const originalOrder = orders.find(o => o.id === orderId);
        if (!originalOrder) return;
        
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...payload } : o));
        
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_order.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, ...payload })
            });
            if (!response.ok || !(await response.json()).success) throw new Error(t.orderUpdateFailed);

            // If status changed to something that affects stock, refetch product data
            if ('status' in payload && payload.status === 'completed') {
                await refetchData();
                await fetchTreasuryData();
            }

            showToast(t.orderUpdatedSuccess);
        } catch (error: any) {
            setOrders(prev => prev.map(o => o.id === orderId ? originalOrder : o));
            showToast(error.message || t.orderUpdateFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [orders, t.orderUpdateFailed, t.orderUpdatedSuccess, showToast, setIsProcessing, refetchData, fetchTreasuryData]);
    
    const deleteOrder = useCallback(async (orderId: string) => {
        if (!hasPermission('delete_order') || !window.confirm(t.confirmDeleteOrder)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_order.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId })
            });
            if (!response.ok || !(await response.json()).success) throw new Error(t.orderDeleteFailed);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            showToast(t.orderDeletedSuccess);
        } catch (error: any) {
            showToast(error.message || t.orderDeleteFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, showToast, setIsProcessing]);
    
    const value: OrderContextType = {
        orders,
        isOrdersLoading,
        placeOrder,
        updateOrder,
        deleteOrder,
        viewingOrder, setViewingOrder,
        refusingOrder, setRefusingOrder
    };
    
    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

// FIX: Add the missing custom hook export.
export const useOrders = () => {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrders must be used within an OrderProvider');
    }
    return context;
};