import React, { createContext, useState, useCallback, useContext, useEffect, useRef } from 'react';
import type { Order, Product, Promotion, User, Permission, UserRole, Role, Category, Tag, Supplier, PurchaseInvoice, SalesInvoice } from '../types';
import { APP_CONFIG } from '../utils/config';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { calculateTotal } from '../utils/helpers';
// FIX: Import the missing `usePersistentState` hook to resolve the "Cannot find name" error.
import { usePersistentState } from '../hooks/usePersistentState';

interface AdminContextType {
    orders: Order[];
    users: User[];
    roles: Role[];
    suppliers: Supplier[];
    purchaseInvoices: PurchaseInvoice[];
    salesInvoices: SalesInvoice[];
    placeOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Promise<Order>;
    updateOrder: (orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;
    addProduct: (productData: Omit<Product, 'id' | 'rating'>, imageFile?: File | null) => Promise<void>;
    updateProduct: (updatedProduct: Product, imageFile?: File | null) => Promise<void>;
    deleteProduct: (productId: number) => Promise<void>;
    addPromotion: (promotionData: Omit<Promotion, 'id'>) => Promise<void>;
    updatePromotion: (updatedPromotion: Promotion) => Promise<void>;
    deletePromotion: (promotionId: number) => Promise<void>;
    addUser: (userData: Omit<User, 'id'>) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: number) => Promise<void>;
    resetUserPassword: (user: User, newPassword: string) => Promise<boolean>;
    updateRolePermissions: (roleKey: string, permissions: Permission[]) => Promise<void>;
    addCategory: (categoryData: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (categoryData: Category) => Promise<void>;
    updateCategoryOrder: (orderedCategories: Category[]) => Promise<void>;
    // FIX: Add missing `deleteCategory` function to the AdminContextType interface.
    deleteCategory: (categoryId: number) => Promise<void>;
    addTag: (tagData: Omit<Tag, 'id'> & { id: string }) => Promise<void>;
    updateTag: (tagData: Tag) => Promise<void>;
    deleteTag: (tagId: string) => Promise<void>;
    addRole: (roleData: Omit<Role, 'isSystem' | 'key'>) => Promise<void>;
    updateRole: (roleData: Role) => Promise<void>;
    deleteRole: (roleKey: string) => Promise<void>;
    addSupplier: (supplierData: Omit<Supplier, 'id'>) => Promise<void>;
    updateSupplier: (supplierData: Supplier) => Promise<void>;
    deleteSupplier: (supplierId: number) => Promise<void>;
    addPurchaseInvoice: (invoiceData: Omit<PurchaseInvoice, 'id'|'invoice_number'|'supplier_name'|'invoice_date'>) => Promise<void>;
    updatePurchaseInvoice: (invoiceData: PurchaseInvoice) => Promise<void>;
    deletePurchaseInvoice: (invoiceId: number) => Promise<void>;
    addSalesInvoice: (invoiceData: Omit<SalesInvoice, 'id' | 'invoice_number' | 'created_by_name' | 'invoice_date' | 'created_by'>) => Promise<void>;
    deleteSalesInvoice: (invoiceId: number) => Promise<void>;
    viewingOrder: Order | null;
    setViewingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    refusingOrder: Order | null;
    setRefusingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const resolveImageUrl = (path: string | undefined): string => {
  if (!path || path.startsWith('http') || path.startsWith('data:')) return path || '';
  const domain = new URL(APP_CONFIG.API_BASE_URL).origin;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${domain}/${cleanPath}`;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsProcessing, showToast, t, language } = useUI();
    const { currentUser, hasPermission, roles: authRoles, setCurrentUser, refetchAuthData } = useAuth();
    const { restaurantInfo, products, setProducts, promotions, setPromotions, categories, setCategories, tags, setTags, fetchAllData } = useData();

    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
    const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [refusingOrder, setRefusingOrder] = useState<Order | null>(null);

    // --- Sound Notification Logic ---
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    useEffect(() => {
        const initAudio = async () => {
            try {
                if (!audioCtxRef.current) {
                    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                    if (AudioContext) {
                        audioCtxRef.current = new AudioContext();
                    } else {
                        console.error("Web Audio API is not supported in this browser.");
                        return;
                    }
                }
                const audioCtx = audioCtxRef.current;
                const response = await fetch('https://cdn.jsdelivr.net/gh/cosmo-project/cosmo-ui/assets/sounds/notify.mp3');
                if (!response.ok) {
                    throw new Error(`Sound file not found (status: ${response.status})`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                audioBufferRef.current = audioBuffer;
            } catch (e) {
                console.error("Failed to load sound for Web Audio API:", e);
            }
        };
        initAudio();
        return () => {
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
            }
        };
    }, []);

    const playNotificationSound = useCallback(() => {
        const audioCtx = audioCtxRef.current;
        const audioBuffer = audioBufferRef.current;

        if (audioCtx && audioBuffer) {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start(0);
        } else {
            // Fallback to simple audio if Web Audio API failed
            console.log("Falling back to simple Audio playback for notification.");
            const audio = new Audio('https://cdn.jsdelivr.net/gh/cosmo-project/cosmo-ui/assets/sounds/notify.mp3');
            audio.play().catch(e => console.error("Could not play notification sound (fallback):", e));
        }
    }, []);

    const [isSoundEnabled] = usePersistentState<boolean>('admin_sound_enabled', true);
    const orderStatusMapRef = useRef<Map<string, string>>(new Map());
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        if (!restaurantInfo || !hasPermission('view_orders_page')) return;
    
        if (isInitialLoadRef.current) {
            const initialMap = new Map<string, string>();
            if (orders.length > 0) {
                orders.forEach(o => initialMap.set(o.id, o.status));
            }
            orderStatusMapRef.current = initialMap;
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
                    break; // Found one sound-triggering event, no need to check further
                }
            }
        }
    
        if (soundShouldBePlayed && isSoundEnabled) {
            playNotificationSound();
        }
    
        // Update the map for the next render cycle with the current state of all orders
        const newStatusMap = new Map<string, string>();
        orders.forEach(o => newStatusMap.set(o.id, o.status));
        orderStatusMapRef.current = newStatusMap;
    }, [orders, restaurantInfo, isSoundEnabled, hasPermission, playNotificationSound]);

    const fetchAdminData = useCallback(async () => {
        if (!currentUser) {
            setOrders([]);
            setUsers([]);
            setSuppliers([]);
            setPurchaseInvoices([]);
            setSalesInvoices([]);
            return;
        }
    
        const canViewAllOrders = hasPermission('view_orders_page');
        const canViewUsers = hasPermission('view_users_page');
        const canViewInventory = hasPermission('view_inventory_page');
        const fetchOptions = { method: 'GET' };
    
        try {
            const ordersRes = await fetch(`${APP_CONFIG.API_BASE_URL}get_orders.php`, fetchOptions);
            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            const allOrders = (await ordersRes.json() || []).map((o: any) => ({ ...o, paymentReceiptUrl: resolveImageUrl(o.paymentReceiptUrl) }));
            
            if (canViewAllOrders) {
                setOrders(allOrders);
            } else {
                setOrders(allOrders.filter((o: Order) => o.customer.userId === currentUser.id));
            }
            
            if (canViewUsers) {
                try {
                    const usersRes = await fetch(`${APP_CONFIG.API_BASE_URL}get_users.php`, fetchOptions);
                    if (usersRes.ok) {
                        setUsers((await usersRes.json() || []).map((u: any) => ({ 
                            id: Number(u.id), 
                            name: u.name, 
                            mobile: u.mobile, 
                            email: u.email,
                            password: '', 
                            role: String(u.role_id), 
                            profilePicture: resolveImageUrl(u.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${u.name.charAt(0).toUpperCase()}` 
                        })));
                    } else { console.error('Failed to fetch users:', await usersRes.text()); }
                } catch (e) { console.error('Error fetching users:', e); }
            } else {
                setUsers([]);
            }
    
            if (canViewInventory) {
                try {
                    const suppliersRes = await fetch(`${APP_CONFIG.API_BASE_URL}get_suppliers.php`, fetchOptions);
                    if (suppliersRes.ok) setSuppliers(await suppliersRes.json() || []);
                    else { console.error('Failed to fetch suppliers:', await suppliersRes.text()); }
                } catch (e) { console.error('Error fetching suppliers:', e); }
    
                try {
                    const invoicesRes = await fetch(`${APP_CONFIG.API_BASE_URL}get_purchase_invoices.php`, fetchOptions);
                    if (invoicesRes.ok) setPurchaseInvoices(await invoicesRes.json() || []);
                    else { console.error('Failed to fetch purchase invoices:', await invoicesRes.text()); }
                } catch (e) { console.error('Error fetching purchase invoices:', e); }
    
                try {
                    const salesInvoicesRes = await fetch(`${APP_CONFIG.API_BASE_URL}get_sales_invoices.php`, fetchOptions);
                    if (salesInvoicesRes.ok) setSalesInvoices(await salesInvoicesRes.json() || []);
                    else { console.error('Failed to fetch sales invoices:', await salesInvoicesRes.text()); }
                } catch (e) { console.error('Error fetching sales invoices:', e); }
            } else {
                setSuppliers([]);
                setPurchaseInvoices([]);
                setSalesInvoices([]);
            }
    
        } catch (error) {
            console.error("Failed to load admin data:", error);
            showToast("Failed to load some user or order data.");
        }
    }, [currentUser, hasPermission, showToast]);


    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

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
                } else {
                    throw new Error(result.error || 'Failed to get URL for receipt');
                }
            }
            const statusId = restaurantInfo?.orderStatusColumns?.[0]?.id || 'pending';

            const payload = {
                ...orderForDb,
                id: `ORD-${Math.floor(Math.random() * 900000) + 100000}`,
                status: statusId,
                createdBy: currentUser?.id,
            };

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
            // Optimistic update
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
            } catch (error: any) { 
                showToast(error.message);
                // Revert on failure
                setOrders(originalOrders);
                setViewingOrder(prev => (prev && prev.id === orderId) ? order : prev);
            } finally { 
                setIsProcessing(false); 
            }
        } else { showToast(t.permissionDenied); }
    }, [orders, currentUser, hasPermission, showToast, t.permissionDenied, setIsProcessing, setViewingOrder, t.orderUpdatedSuccess]);

    const deleteOrder = useCallback(async (orderId: string) => {
        if (!hasPermission('delete_order') || !window.confirm(t.confirmDeleteOrder)) return;
    
        const originalOrders = orders;
        setOrders(prev => prev.filter(o => o.id !== orderId)); // Optimistic delete
        setViewingOrder(null); // Close the modal immediately
    
        setIsProcessing(true);
        try {
            const res = await fetch(`${APP_CONFIG.API_BASE_URL}delete_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId }) });
            if (!res.ok || !(await res.json()).success) throw new Error(t.orderDeleteFailed);
            showToast(t.orderDeletedSuccess);
        } catch (error: any) {
            showToast(error.message);
            setOrders(originalOrders); // Revert on failure
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, setIsProcessing, orders, setOrders, showToast, setViewingOrder]);
    
    const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'rating'>, imageFile?: File | null) => {
        if (!hasPermission('add_product')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            let finalProductData = { ...productData };
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('type', 'products');
                const uploadRes = await fetch(`${APP_CONFIG.API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (!uploadRes.ok || !result.success) throw new Error(result.error || 'Image upload failed');
                
                finalProductData.image = result.url.split('?v=')[0];
            }

            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_product.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalProductData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.productAddFailed);
            
            const newProduct = { ...result.product, image: resolveImageUrl(result.product.image) };
            setProducts(prev => [newProduct, ...prev].sort((a,b) => a.name[language].localeCompare(b.name[language])));
            showToast(t.productAddedSuccess);
        } catch (error: any) { showToast(error.message || t.productAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, language, setProducts, showToast, setIsProcessing]);
    
    const updateProduct = useCallback(async (updatedProduct: Product, imageFile?: File | null) => {
        if (!hasPermission('edit_product')) { showToast(t.permissionDenied); return; }
        
        const originalProducts = products;
        const resolvedImageForOptimisticUpdate = imageFile ? URL.createObjectURL(imageFile) : updatedProduct.image;
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? { ...updatedProduct, image: resolvedImageForOptimisticUpdate } : p));
        
        setIsProcessing(true);
        try {
            let finalProductData = { ...updatedProduct };
            let serverImageUrl = '';

            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('type', 'products');
                const relativeOldPath = updatedProduct.image.split('?')[0].replace(new URL(APP_CONFIG.API_BASE_URL).origin + '/', '');
                formData.append('oldPath', relativeOldPath);
                const uploadRes = await fetch(`${APP_CONFIG.API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (!uploadRes.ok || !result.success) throw new Error(result.error || 'Image upload failed');
                
                serverImageUrl = result.url;
                finalProductData.image = serverImageUrl.split('?v=')[0];
            } else {
                 const domain = new URL(APP_CONFIG.API_BASE_URL).origin + '/';
                 finalProductData.image = updatedProduct.image ? updatedProduct.image.split('?v=')[0].replace(domain, '') : '';
            }
            
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_product.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalProductData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.productUpdateFailed);

            const resolvedImageUrl = serverImageUrl ? resolveImageUrl(serverImageUrl) : resolveImageUrl(finalProductData.image);
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? { ...updatedProduct, image: resolvedImageUrl } : p));
            showToast(t.productUpdatedSuccess);
        } catch (error: any) { 
            showToast(error.message || t.productUpdateFailed);
            setProducts(originalProducts); // Revert on failure
        }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, products, setProducts, showToast, setIsProcessing]);

    const deleteProduct = useCallback(async (productId: number) => {
        if (!hasPermission('delete_product') || !window.confirm(t.confirmDelete)) return;
        
        const originalProducts = products;
        setProducts(prev => prev.filter(p => p.id !== productId));
        
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_product.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: productId }) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.productDeleteFailed);
            showToast(t.productDeletedSuccess);
        } catch (error: any) {
            showToast(error.message || t.productDeleteFailed);
            setProducts(originalProducts);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, products, setProducts, setIsProcessing, showToast]);
    
    const addPromotion = useCallback(async (promotionData: Omit<Promotion, 'id'>) => {
        if (!hasPermission('add_promotion')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_promotion.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(promotionData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.promotionAddFailed);
            setPromotions(prev => [...prev, result.promotion]);
            showToast(t.promotionAddedSuccess);
        } catch (error: any) {
            showToast(error.message || t.promotionAddFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, setPromotions, showToast, setIsProcessing]);

    const updatePromotion = useCallback(async (updatedPromotion: Promotion) => {
        if (!hasPermission('edit_promotion')) { showToast(t.permissionDenied); return; }
        const originalPromotions = promotions;
        setPromotions(prev => prev.map(p => p.id === updatedPromotion.id ? updatedPromotion : p));
        
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_promotion.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedPromotion) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.promotionUpdateFailed);
            showToast(t.promotionUpdatedSuccess);
        } catch(error: any) {
            showToast(error.message || t.promotionUpdateFailed);
            setPromotions(originalPromotions);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, promotions, setPromotions, showToast, setIsProcessing]);

    const deletePromotion = useCallback(async (promotionId: number) => {
        if (!hasPermission('delete_promotion') || !window.confirm(t.confirmDeletePromotion)) return;
        const originalPromotions = promotions;
        setPromotions(prev => prev.filter(p => p.id !== promotionId));

        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_promotion.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: promotionId }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.promotionDeleteFailed);
            showToast(t.promotionDeletedSuccess);
        } catch (error: any) {
            showToast(error.message || t.promotionDeleteFailed);
            setPromotions(originalPromotions);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, promotions, setPromotions, showToast, setIsProcessing]);

    const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
        if (!hasPermission('add_user')) { showToast(t.permissionDenied); return; }
        const roleName = authRoles.find(r => r.key === userData.role)?.name.en;
        if (!roleName) { showToast("Invalid role selected."); return; }

        setIsProcessing(true);
        try {
            const payload = { name: userData.name, mobile: userData.mobile, password: userData.password, role: roleName };
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.userAddFailed);
            
            const roleDetails = authRoles.find(r => r.name.en === result.user.role);
            const newUser: User = { id: Number(result.user.id), name: result.user.name, mobile: result.user.mobile, password: '', role: roleDetails ? roleDetails.key : '', profilePicture: resolveImageUrl(result.user.profilePicture) || `https://placehold.co/512x512/60a5fa/white?text=${result.user.name.charAt(0).toUpperCase()}` };
            setUsers(prev => [...prev, newUser]);
            showToast(t.userAddedSuccess);
        } catch (error: any) {
            showToast(error.message || t.userAddFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, authRoles, showToast, setIsProcessing]);

    const updateUser = useCallback(async (updatedUser: User) => {
        if (!hasPermission('edit_user')) { showToast(t.permissionDenied); return; }
        const roleName = authRoles.find(r => r.key === updatedUser.role)?.name.en;
        if (!roleName) { showToast("Invalid role selected."); return; }

        const originalUsers = users;
        const updatedUserInState = { ...updatedUser, password: '' };
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUserInState : u));
        if (currentUser?.id === updatedUser.id) {
            setCurrentUser(prev => prev ? { ...prev, ...updatedUserInState } : null);
        }

        setIsProcessing(true);
        try {
            const payload: any = { id: updatedUser.id, name: updatedUser.name, mobile: updatedUser.mobile, role: roleName };
            if (updatedUser.password) payload.password = updatedUser.password;
            
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.userUpdateFailed);
            showToast(t.userUpdatedSuccess);
        } catch (error: any) {
            showToast(error.message || t.userUpdateFailed);
            setUsers(originalUsers); // Revert
            if (currentUser?.id === updatedUser.id) {
                const originalSelf = originalUsers.find(u => u.id === currentUser.id);
                if (originalSelf) {
                    setCurrentUser(prev => prev ? { ...prev, ...originalSelf, password: '' } : null);
                }
            }
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, currentUser, setCurrentUser, users, authRoles, showToast, setIsProcessing]);

    const deleteUser = useCallback(async (userId: number) => {
        if (currentUser?.id === userId) { showToast(t.deleteUserError); return; }
        if (!hasPermission('delete_user') || !window.confirm(t.confirmDeleteUser)) return;

        const originalUsers = users;
        setUsers(prev => prev.filter(u => u.id !== userId));

        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: userId }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.userDeleteFailed);
            showToast(t.userDeletedSuccess);
        } catch(error: any) {
            showToast(error.message || t.userDeleteFailed);
            setUsers(originalUsers);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, currentUser, users, showToast, setIsProcessing]);
    
    const resetUserPassword = useCallback(async (user: User, newPassword: string): Promise<boolean> => {
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: user.id, password: newPassword }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.passwordResetFailed);
            showToast(t.passwordResetSuccess);
            return true;
        } catch (error: any) {
            showToast(error.message || t.passwordResetFailed);
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, showToast, t]);
    
    const updateRolePermissions = useCallback(async (roleKey: string, permissions: Permission[]) => {
        if (!hasPermission('manage_permissions')) { showToast(t.permissionDenied); return; }
        
        // This function now only needs to make the API call. The state is in AuthContext.
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_permissions.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ roleName: roleKey, permissions }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.permissionsUpdateFailed);
            await refetchAuthData(); // Refetch permissions into AuthContext
            showToast(t.permissionsUpdatedSuccess);
        } catch(error: any) {
            showToast(error.message || t.permissionsUpdateFailed);
            await refetchAuthData(); // Refetch to revert to original state on failure
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, refetchAuthData, showToast, setIsProcessing]);

    const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
        if (!hasPermission('add_category')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_category.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(categoryData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.categoryAddFailed);
            await fetchAllData(); // Refetch all to rebuild tree
            showToast(t.categoryAddedSuccess);
        } catch(error: any) {
            showToast(error.message || t.categoryAddFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, fetchAllData, showToast, setIsProcessing]);
    
    const updateCategory = useCallback(async (categoryData: Category) => {
        if (!hasPermission('edit_category')) { showToast(t.permissionDenied); return; }
        const originalCategories = categories;
        // Local update requires complex tree manipulation. Refetching is simpler here.
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_category.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(categoryData) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.categoryUpdateFailed);
            await fetchAllData();
            showToast(t.categoryUpdatedSuccess);
        } catch (error: any) {
            showToast(error.message || t.categoryUpdateFailed);
            setCategories(originalCategories);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, categories, setCategories, fetchAllData, showToast, setIsProcessing]);

    const updateCategoryOrder = useCallback(async (orderedCategories: Category[]) => {
        if (!hasPermission('edit_category')) {
            showToast(t.permissionDenied);
            return;
        }
        setIsProcessing(true);
        try {
            const payload: { id: number, display_order: number }[] = [];
            
            const buildPayload = (categoryList: Category[]) => {
                categoryList.forEach((cat, index) => {
                    payload.push({ id: cat.id, display_order: index });
                    if (cat.children && cat.children.length > 0) {
                        buildPayload(cat.children);
                    }
                });
            };
    
            buildPayload(orderedCategories);

            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_category_order.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                 const errorText = await response.text();
                 throw new Error(`Server Error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || t.orderSaveFailed);
            }

            await fetchAllData();
            showToast(t.orderSavedSuccess);
        } catch (error: any) {
            console.error("Failed to update category order:", error);
            showToast(error.message || t.orderSaveFailed);
            await fetchAllData();
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, setIsProcessing, showToast, fetchAllData]);

    const deleteCategory = useCallback(async (categoryId: number) => {
        if (!hasPermission('delete_category') || !window.confirm(t.confirmDeleteCategory)) { return; }
        const originalCategories = categories;
        
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_category.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: categoryId }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.errorKey && t[result.errorKey as keyof typeof t]) throw new Error(t[result.errorKey as keyof typeof t]);
                throw new Error(result.error || t.categoryDeleteFailed);
            }
            // Optimistic update would be complex for tree, refetch is better
            await fetchAllData();
            showToast(t.categoryDeletedSuccess);
        } catch (error: any) {
            showToast(error.message || t.categoryDeleteFailed);
            setCategories(originalCategories);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, categories, setCategories, setIsProcessing, showToast, fetchAllData]);

    const addTag = useCallback(async (tagData: Omit<Tag, 'id'> & { id: string }) => {
        if (!hasPermission('add_tag')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_tag.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(tagData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.tagAddFailed);
            setTags(prev => [...prev, result.tag]);
            showToast(t.tagAddedSuccess);
        } catch (error: any) {
            showToast(error.message || t.tagAddFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, setTags, showToast, setIsProcessing]);
    
    const updateTag = useCallback(async (tagData: Tag) => {
        if (!hasPermission('edit_tag')) { showToast(t.permissionDenied); return; }
        const originalTags = tags;
        setTags(prev => prev.map(tag => tag.id === tagData.id ? tagData : tag));
        
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_tag.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(tagData) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.tagUpdateFailed);
            showToast(t.tagUpdatedSuccess);
        } catch (error: any) {
            showToast(error.message || t.tagUpdateFailed);
            setTags(originalTags);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, tags, setTags, showToast, setIsProcessing]);

    const deleteTag = useCallback(async (tagId: string) => {
        if (!hasPermission('delete_tag') || !window.confirm(t.confirmDeleteTag)) { return; }
        const originalTags = tags;
        setTags(prev => prev.filter(tag => tag.id !== tagId));
        
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_tag.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tagId }) });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.errorKey && t[result.errorKey as keyof typeof t]) throw new Error(t[result.errorKey as keyof typeof t]);
                throw new Error(result.error || t.tagDeleteFailed);
            }
            showToast(t.tagDeletedSuccess);
        } catch (error: any) {
            showToast(error.message || t.tagDeleteFailed);
            setTags(originalTags);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, tags, setTags, setIsProcessing, showToast]);
    
    const addRole = useCallback(async (roleData: Omit<Role, 'isSystem' | 'key'>) => {
        if (!hasPermission('add_role')) {
            showToast(t.permissionDenied);
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_role.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleData),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || t.roleAddFailed);
            }
            showToast(t.roleAddedSuccess);
            await refetchAuthData();
        } catch (error: any) {
            showToast(error.message || t.roleAddFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing, refetchAuthData]);

    const updateRole = useCallback(async (roleData: Role) => {
        if (!hasPermission('edit_role')) {
            showToast(t.permissionDenied);
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_role.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleData),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || t.roleUpdateFailed);
            }
            showToast(t.roleUpdatedSuccess);
            await refetchAuthData();
        } catch (error: any) {
            showToast(error.message || t.roleUpdateFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing, refetchAuthData]);

    const deleteRole = useCallback(async (roleKey: string) => {
        if (!hasPermission('delete_role')) {
            showToast(t.permissionDenied);
            return;
        }
    
        const roleToDelete = authRoles.find(r => r.key === roleKey);
        if (!roleToDelete || roleToDelete.isSystem) {
            showToast("Cannot delete system roles.");
            return;
        }
    
        if (!window.confirm(t.confirmDeleteRole)) return;
    
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_role.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: roleKey }),
            });
            const result = await response.json();
    
            if (!response.ok || !result.success) {
                if (result.errorKey === 'deleteRoleError') {
                    throw new Error(t.deleteRoleError);
                }
                throw new Error(result.error || t.roleDeleteFailed);
            }
    
            showToast(t.roleDeletedSuccess);
            await refetchAuthData(); // Refetch roles and permissions
            
        } catch (error: any) {
            showToast(error.message || t.roleDeleteFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, authRoles, refetchAuthData, showToast, t, setIsProcessing]);

    const addSupplier = useCallback(async (supplierData: Omit<Supplier, 'id'>) => {
        if (!hasPermission('manage_suppliers')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_supplier.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(supplierData),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.supplierAddFailed);
            setSuppliers(prev => [...prev, result.supplier].sort((a,b) => a.name.localeCompare(b.name)));
            showToast(t.supplierAddedSuccess);
        } catch (error: any) {
            showToast(error.message || t.supplierAddFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing]);

    const updateSupplier = useCallback(async (supplierData: Supplier) => {
        if (!hasPermission('manage_suppliers')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        const originalSuppliers = suppliers;
        setSuppliers(prev => prev.map(s => s.id === supplierData.id ? supplierData : s));
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_supplier.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(supplierData),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.supplierUpdateFailed);
            showToast(t.supplierUpdatedSuccess);
        } catch (error: any) {
            showToast(error.message || t.supplierUpdateFailed);
            setSuppliers(originalSuppliers); // Revert
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing, suppliers]);

    const deleteSupplier = useCallback(async (supplierId: number) => {
        if (!hasPermission('manage_suppliers') || !window.confirm(t.confirmDeleteSupplier)) return;
        setIsProcessing(true);
        const originalSuppliers = suppliers;
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_supplier.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: supplierId }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (response.status === 409) {
                     throw new Error(t.deleteSupplierError);
                }
                throw new Error(result.error || t.supplierDeleteFailed);
            }
            showToast(t.supplierDeletedSuccess);
        } catch (error: any) {
            showToast(error.message || t.supplierDeleteFailed);
            setSuppliers(originalSuppliers); // Revert
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing, suppliers]);
    
    const addPurchaseInvoice = useCallback(async (invoiceData: Omit<PurchaseInvoice, 'id' | 'invoice_number' | 'supplier_name' | 'invoice_date'>) => {
        if (!hasPermission('add_purchase_invoice')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const payload = { ...invoiceData, created_by: currentUser?.id };
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_purchase_invoice.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.invoiceAddFailed);
            
            showToast(t.invoiceAddedSuccess);
            await fetchAdminData();
            await fetchAllData();
            
        } catch (error: any) {
            showToast(error.message || t.invoiceAddFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing, currentUser, fetchAllData, fetchAdminData]);

    const updatePurchaseInvoice = useCallback(async (invoiceData: PurchaseInvoice) => {
        if (!hasPermission('add_purchase_invoice')) { // Assuming edit uses same permission as add
            showToast(t.permissionDenied);
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_purchase_invoice.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || t.invoiceUpdateFailed);
            }
            showToast(t.invoiceUpdatedSuccess);
            await fetchAdminData(); // Refreshes invoices list
            await fetchAllData(); // Refreshes product stock/cost
        } catch (error: any) {
            showToast(error.message || t.invoiceUpdateFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing, fetchAdminData, fetchAllData]);

    const deletePurchaseInvoice = useCallback(async (invoiceId: number) => {
        if (!hasPermission('add_purchase_invoice')) { // Assuming same permission for delete for now
            showToast(t.permissionDenied);
            return;
        }
        if (!window.confirm(t.confirmDeleteInvoice)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_purchase_invoice.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: invoiceId }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.invoiceDeleteFailed);

            showToast(t.invoiceDeletedSuccess);
            await fetchAdminData();
            await fetchAllData(); // Refetch products data

        } catch (error: any) {
            showToast(error.message || t.invoiceDeleteFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing, fetchAdminData, fetchAllData]);
    
    const addSalesInvoice = useCallback(async (invoiceData: Omit<SalesInvoice, 'id' | 'invoice_number' | 'invoice_date' | 'created_by' | 'created_by_name'>) => {
        if (!hasPermission('manage_sales_invoices')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const payload = { ...invoiceData, created_by: currentUser?.id };
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_sales_invoice.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.salesInvoiceAddFailed);
            
            showToast(t.salesInvoiceAddedSuccess);
            await fetchAdminData();
            await fetchAllData();
            
        } catch (error: any) {
            showToast(error.message || t.salesInvoiceAddFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing, currentUser, fetchAllData, fetchAdminData]);

    const deleteSalesInvoice = useCallback(async (invoiceId: number) => {
        if (!hasPermission('manage_sales_invoices')) {
            showToast(t.permissionDenied);
            return;
        }
        if (!window.confirm(t.confirmDeleteSalesInvoice)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_sales_invoice.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: invoiceId }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.invoiceDeleteFailed);

            showToast(t.invoiceDeletedSuccess);
            await fetchAdminData();
            await fetchAllData();

        } catch (error: any) {
            showToast(error.message || t.invoiceDeleteFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, showToast, t, setIsProcessing, fetchAdminData, fetchAllData]);
    
    const value: AdminContextType = {
        orders, 
        users, 
        roles: authRoles,
        suppliers,
        purchaseInvoices,
        salesInvoices,
        placeOrder, 
        updateOrder, 
        deleteOrder,
        addProduct, 
        updateProduct, 
        deleteProduct,
        addPromotion, 
        updatePromotion, 
        deletePromotion,
        addUser, 
        updateUser, 
        deleteUser,
        resetUserPassword, 
        updateRolePermissions,
        addCategory, 
        updateCategory,
        updateCategoryOrder, 
        deleteCategory,
        addTag, 
        updateTag, 
        deleteTag,
        addRole, 
        updateRole, 
        deleteRole,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPurchaseInvoice,
        updatePurchaseInvoice,
        deletePurchaseInvoice,
        addSalesInvoice,
        deleteSalesInvoice,
        viewingOrder,
        setViewingOrder,
        refusingOrder,
        setRefusingOrder,
    };

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) throw new Error('useAdmin must be used within an AdminProvider');
    return context;
};