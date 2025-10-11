

import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { Order, Product, Promotion, User, Permission, UserRole, Role, Category, Tag } from '../types';
import { API_BASE_URL } from '../utils/config';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { calculateTotal } from '../utils/helpers';

interface AdminContextType {
    orders: Order[];
    users: User[];
    roles: Role[];
    rolePermissions: Record<UserRole, Permission[]>;
    placeOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Promise<Order>;
    updateOrder: (orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;
    addProduct: (productData: Omit<Product, 'id' | 'rating'>) => Promise<void>;
    updateProduct: (updatedProduct: Product) => Promise<void>;
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
    deleteCategory: (categoryId: number) => Promise<void>;
    addTag: (tagData: Omit<Tag, 'id'> & { id: string }) => Promise<void>;
    updateTag: (tagData: Tag) => Promise<void>;
    deleteTag: (tagId: string) => Promise<void>;
    addRole: (roleData: Omit<Role, 'isSystem' | 'key'>) => Promise<void>;
    updateRole: (roleData: Role) => Promise<void>;
    deleteRole: (roleKey: string) => Promise<void>;
    viewingOrder: Order | null;
    setViewingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    refusingOrder: Order | null;
    setRefusingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const resolveImageUrl = (path: string | undefined): string => {
  if (!path || path.startsWith('http') || path.startsWith('data:')) return path || '';
  const domain = new URL(API_BASE_URL).origin;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${domain}/${cleanPath}`;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsProcessing, showToast, t } = useUI();
    const { currentUser, hasPermission, roles: authRoles, setCurrentUser } = useAuth();
    const { restaurantInfo, setProducts, setPromotions, setCategories, setTags } = useData();

    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>({});
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [refusingOrder, setRefusingOrder] = useState<Order | null>(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            if (!currentUser || !hasPermission('view_orders_page')) {
                setOrders([]); setUsers([]); setRolePermissions({});
                return;
            }
            try {
                const [ordersRes, usersRes, permissionsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}get_orders.php`, { cache: 'no-cache' }),
                    fetch(`${API_BASE_URL}get_users.php`, { cache: 'no-cache' }),
                    fetch(`${API_BASE_URL}get_permissions.php`, { cache: 'no-cache' })
                ]);
                if (ordersRes.ok) setOrders((await ordersRes.json() || []).map((o: any) => ({ ...o, paymentReceiptUrl: resolveImageUrl(o.paymentReceiptUrl)})));
                if (usersRes.ok) setUsers((await usersRes.json() || []).map((u: any) => ({ id: Number(u.id), name: u.name, mobile: u.mobile, password: '', role: String(u.role_id), profilePicture: resolveImageUrl(u.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${u.name.charAt(0).toUpperCase()}` })));
                if (permissionsRes.ok) setRolePermissions(await permissionsRes.json() || {});
            } catch (error) { showToast("Failed to load admin data."); }
        };
        fetchAdminData();
    }, [currentUser, hasPermission, showToast]);

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
                const uploadRes = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (result.success && result.url) orderForDb.paymentReceiptUrl = result.url;
                else throw new Error(result.error || 'Failed to get URL for receipt');
            }
            const statusId = restaurantInfo?.orderStatusColumns?.[0]?.id || 'pending';
            const payload = { ...orderForDb, id: `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5)}`, status: statusId, createdBy: currentUser?.id };
            const response = await fetch(`${API_BASE_URL}add_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        let canUpdate = hasPermission('manage_order_status');
        if (payload.items || payload.notes !== undefined || payload.tableNumber !== undefined) canUpdate = hasPermission('edit_order_content');
        if (payload.customerFeedback) canUpdate = currentUser?.id === order.customer.userId && order.status === 'completed';

        if (canUpdate) {
            setIsProcessing(true);
            try {
                if (payload.items) payload.total = calculateTotal(payload.items);
                const res = await fetch(`${API_BASE_URL}update_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, payload }) });
                if (!res.ok || !(await res.json()).success) throw new Error('Failed to update order.');
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...payload } : o));
                showToast('Order updated.');
            } catch (error: any) { showToast(error.message); } finally { setIsProcessing(false); }
        } else { showToast(t.permissionDenied); }
    }, [orders, currentUser, hasPermission, showToast, t.permissionDenied, setIsProcessing]);

    const deleteOrder = useCallback(async (orderId: string) => {
        if (!hasPermission('delete_order') || !window.confirm(t.confirmDeleteOrder)) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`${API_BASE_URL}delete_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId }) });
            if (!res.ok || !(await res.json()).success) throw new Error(t.orderDeleteFailed);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            showToast(t.orderDeletedSuccess);
        } catch (error: any) { showToast(error.message); } finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing]);
    
    // Placeholder implementations for other admin functions
    const addProduct = async (productData: Omit<Product, 'id' | 'rating'>) => {};
    const updateProduct = async (updatedProduct: Product) => {};
    const deleteProduct = async (productId: number) => {};
    const addPromotion = async (promotionData: Omit<Promotion, 'id'>) => {};
    const updatePromotion = async (updatedPromotion: Promotion) => {};
    const deletePromotion = async (promotionId: number) => {};
    const addUser = async (userData: Omit<User, 'id'>) => {};
    const updateUser = useCallback(async (updatedUser: User) => {
        if (!hasPermission('edit_user')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            // This assumes password is not being updated here. A separate flow is needed for that.
            const { password, ...payload } = updatedUser;
            const res = await fetch(`${API_BASE_URL}update_user.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok || !(await res.json()).success) throw new Error('Failed to update user.');
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
            showToast('User updated.');
        } catch (error: any) { showToast(error.message); } finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t.permissionDenied, setIsProcessing, currentUser, setCurrentUser]);

    const deleteUser = async (userId: number) => {};
    const resetUserPassword = async (user: User, newPassword: string): Promise<boolean> => { return false; };
    const updateRolePermissions = async (roleKey: string, permissions: Permission[]) => {};
    const addCategory = async (categoryData: Omit<Category, 'id'>) => {};
    const updateCategory = async (categoryData: Category) => {};
    const deleteCategory = async (categoryId: number) => {};
    const addTag = async (tagData: Omit<Tag, 'id'> & { id: string }) => {};
    const updateTag = async (tagData: Tag) => {};
    const deleteTag = async (tagId: string) => {};
    const addRole = async (roleData: Omit<Role, 'isSystem' | 'key'>) => {};
    const updateRole = async (roleData: Role) => {};
    const deleteRole = async (roleKey: string) => {};
    
    const value: AdminContextType = {
        orders, users, roles: authRoles, rolePermissions,
        placeOrder, updateOrder, deleteOrder,
        addProduct, updateProduct, deleteProduct,
        addPromotion, updatePromotion, deletePromotion,
        addUser, updateUser, deleteUser,
        resetUserPassword, updateRolePermissions,
        addCategory, updateCategory, deleteCategory,
        addTag, updateTag, deleteTag,
        addRole, updateRole, deleteRole,
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