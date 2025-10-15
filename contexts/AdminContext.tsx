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
    const { currentUser, hasPermission, roles: authRoles, setCurrentUser, setRolePermissions: setAuthRolePermissions } = useAuth();
    const { restaurantInfo, setProducts, setPromotions, fetchAllData } = useData();

    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>({});
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [refusingOrder, setRefusingOrder] = useState<Order | null>(null);

    const fetchAdminData = useCallback(async () => {
        if (!currentUser) {
            setOrders([]);
            setUsers([]);
            return;
        }

        const isAdmin = hasPermission('view_orders_page');

        try {
            const cacheBuster = `?v=${Date.now()}`;
            const ordersRes = await fetch(`${API_BASE_URL}get_orders.php${cacheBuster}`, { cache: 'no-cache' });
            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            const allOrders = (await ordersRes.json() || []).map((o: any) => ({ ...o, paymentReceiptUrl: resolveImageUrl(o.paymentReceiptUrl)}));

            if (isAdmin) {
                setOrders(allOrders);
                const usersRes = await fetch(`${API_BASE_URL}get_users.php${cacheBuster}`, { cache: 'no-cache' });
                if (usersRes.ok) {
                    setUsers((await usersRes.json() || []).map((u: any) => ({ id: Number(u.id), name: u.name, mobile: u.mobile, password: '', role: String(u.role_id), profilePicture: resolveImageUrl(u.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${u.name.charAt(0).toUpperCase()}` })));
                }
            } else {
                setOrders(allOrders.filter((o: Order) => o.customer.userId === currentUser.id));
                setUsers([]);
            }
        } catch (error) {
            console.error("Failed to load admin data:", error);
            showToast("Failed to load user data.");
        }
    }, [currentUser, hasPermission, showToast]);


    useEffect(() => {
        const fetchPermissions = async () => {
            if (!currentUser) {
                setRolePermissions({});
                return;
            }
            try {
                const permissionsRes = await fetch(`${API_BASE_URL}get_permissions.php?v=${Date.now()}`, { cache: 'no-cache' });
                if (permissionsRes.ok) {
                    const permissions = await permissionsRes.json() || {};
                    setRolePermissions(permissions);
                    setAuthRolePermissions(permissions);
                }
            } catch (error) {
                console.error("Failed to load permissions:", error);
            }
        };
        fetchPermissions();
        fetchAdminData();
    }, [currentUser, setAuthRolePermissions, fetchAdminData]);

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
                if (result.success && result.url) {
                    const relativeUrl = new URL(result.url, API_BASE_URL).pathname.substring(1);
                    orderForDb.paymentReceiptUrl = relativeUrl.split('?v=')[0];
                } else {
                    throw new Error(result.error || 'Failed to get URL for receipt');
                }
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
                
                await fetchAdminData(); // Refetch data to ensure consistency

                setViewingOrder(prev => (prev && prev.id === orderId) ? { ...prev, ...payload } : prev);
                showToast('Order updated.');
            } catch (error: any) { showToast(error.message); } finally { setIsProcessing(false); }
        } else { showToast(t.permissionDenied); }
    }, [orders, currentUser, hasPermission, showToast, t.permissionDenied, setIsProcessing, fetchAdminData, setViewingOrder]);

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
    
    const apiCall = useCallback(async <T,>(endpoint: string, payload: any, successMessage: string, failureMessage: string): Promise<T | null> => {
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || failureMessage);
            showToast(successMessage);
            return result;
        } catch (error: any) {
            showToast(error.message || failureMessage);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, showToast]);
    
    const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'rating'>, imageFile?: File | null) => {
        if (!hasPermission('add_product')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            let finalProductData = { ...productData };
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('type', 'products');
                const uploadRes = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (!uploadRes.ok || !result.success) throw new Error(result.error || 'Image upload failed');
                
                finalProductData.image = result.url.split('?v=')[0]; // Save clean URL to DB
            }

            const response = await fetch(`${API_BASE_URL}add_product.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalProductData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.productAddFailed);
            
            const newProduct = { ...result.product, image: resolveImageUrl(result.product.image) };
            setProducts(prev => [newProduct, ...prev]);
            showToast(t.productAddedSuccess);
        } catch (error: any) { showToast(error.message || t.productAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, setProducts, showToast, setIsProcessing]);
    
    const updateProduct = useCallback(async (updatedProduct: Product, imageFile?: File | null) => {
        if (!hasPermission('edit_product')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            let finalProductData = { ...updatedProduct };
            let serverImageUrl = '';

            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('type', 'products');
                formData.append('productId', updatedProduct.id.toString());
                const uploadRes = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (!uploadRes.ok || !result.success) throw new Error(result.error || 'Image upload failed');
                
                serverImageUrl = result.url; // This URL might have a cache buster
                finalProductData.image = serverImageUrl.split('?v=')[0]; // Save clean URL to DB
            } else {
                 const domain = new URL(API_BASE_URL).origin + '/';
                 finalProductData.image = updatedProduct.image ? updatedProduct.image.split('?v=')[0].replace(domain, '') : '';
            }
            
            const response = await fetch(`${API_BASE_URL}update_product.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalProductData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.productUpdateFailed);

            // Use the URL from the server if a new image was uploaded, otherwise use the existing (cleaned) one
            const resolvedImageUrl = serverImageUrl ? resolveImageUrl(serverImageUrl) : resolveImageUrl(finalProductData.image);
            const resolvedProduct = { ...finalProductData, image: resolvedImageUrl };

            setProducts(prev => prev.map(p => p.id === resolvedProduct.id ? resolvedProduct : p));
            showToast(t.productUpdatedSuccess);
        } catch (error: any) { showToast(error.message || t.productUpdateFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, setProducts, showToast, setIsProcessing]);

    const deleteProduct = useCallback(async (productId: number) => {
        if (!hasPermission('delete_product') || !window.confirm(t.confirmDelete)) return;
        const result = await apiCall('delete_product.php', { id: productId }, t.productDeletedSuccess, t.productDeleteFailed);
        if (result) {
            setProducts(prev => prev.filter(p => p.id !== productId));
        }
    }, [hasPermission, t, apiCall, setProducts]);
    
    const addPromotion = useCallback(async (promotionData: Omit<Promotion, 'id'>) => {
        if (!hasPermission('add_promotion')) { showToast(t.permissionDenied); return; }
        const result = await apiCall<{ promotion: Promotion }>('add_promotion.php', promotionData, t.promotionAddedSuccess, t.promotionAddFailed);
        if (result?.promotion) setPromotions(prev => [...prev, result.promotion]);
    }, [hasPermission, t, apiCall, setPromotions]);

    const updatePromotion = useCallback(async (updatedPromotion: Promotion) => {
        if (!hasPermission('edit_promotion')) { showToast(t.permissionDenied); return; }
        const result = await apiCall('update_promotion.php', updatedPromotion, t.promotionUpdatedSuccess, t.promotionUpdateFailed);
        if (result) setPromotions(prev => prev.map(p => p.id === updatedPromotion.id ? updatedPromotion : p));
    }, [hasPermission, t, apiCall, setPromotions]);

    const deletePromotion = useCallback(async (promotionId: number) => {
        if (!hasPermission('delete_promotion') || !window.confirm(t.confirmDeletePromotion)) return;
        const result = await apiCall('delete_promotion.php', { id: promotionId }, t.promotionDeletedSuccess, t.promotionDeleteFailed);
        if (result) setPromotions(prev => prev.filter(p => p.id !== promotionId));
    }, [hasPermission, t, apiCall, setPromotions]);

    const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
        if (!hasPermission('add_user')) { showToast(t.permissionDenied); return; }
        const roleName = authRoles.find(r => r.key === userData.role)?.name.en;
        if (!roleName) {
            showToast("Invalid role selected.");
            return;
        }
        const payload = {
            name: userData.name,
            mobile: userData.mobile,
            password: userData.password,
            role: roleName,
        };
        const result = await apiCall<{ user: any }>('add_user.php', payload, 'User added successfully.', 'Failed to add user.');
        if (result?.user) {
            const roleDetails = authRoles.find(r => r.name.en === result.user.role);
            const newUser: User = {
                id: Number(result.user.id),
                name: result.user.name,
                mobile: result.user.mobile,
                password: '',
                role: roleDetails ? roleDetails.key : '',
                profilePicture: resolveImageUrl(result.user.profilePicture) || `https://placehold.co/512x512/60a5fa/white?text=${result.user.name.charAt(0).toUpperCase()}`
            };
            setUsers(prev => [...prev, newUser]);
        }
    }, [hasPermission, t, apiCall, setUsers, authRoles, showToast]);

    const updateUser = useCallback(async (updatedUser: User) => {
        if (!hasPermission('edit_user')) { showToast(t.permissionDenied); return; }
        
        const roleName = authRoles.find(r => r.key === updatedUser.role)?.name.en;
        if (!roleName) {
            showToast("Invalid role selected.");
            return;
        }

        const payload: any = {
            id: updatedUser.id,
            name: updatedUser.name,
            mobile: updatedUser.mobile,
            role: roleName,
        };

        if (updatedUser.password) {
            payload.password = updatedUser.password;
        }
        
        const result = await apiCall('update_user.php', payload, 'User updated.', 'Failed to update user.');
        if (result) {
            const updatedUserInState = { ...updatedUser, password: '' };
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUserInState : u));
            if (currentUser?.id === updatedUser.id) {
                setCurrentUser(prev => prev ? { ...prev, ...updatedUserInState } : null);
            }
        }
    }, [hasPermission, t, apiCall, currentUser, setCurrentUser, setUsers, authRoles, showToast]);

    const deleteUser = useCallback(async (userId: number) => {
        if (currentUser?.id === userId) { showToast(t.deleteUserError); return; }
        if (!hasPermission('delete_user') || !window.confirm(t.confirmDeleteUser)) return;
        const result = await apiCall('delete_user.php', { id: userId }, 'User deleted.', 'Failed to delete user.');
        if (result) setUsers(prev => prev.filter(u => u.id !== userId));
    }, [hasPermission, t, apiCall, currentUser, setUsers]);
    
    const resetUserPassword = useCallback(async (user: User, newPassword: string): Promise<boolean> => {
        const result = await apiCall('update_user.php', { id: user.id, password: newPassword }, t.passwordResetSuccess, 'Failed to reset password.');
        return !!result;
    }, [apiCall, t.passwordResetSuccess]);
    
    const updateRolePermissions = useCallback(async (roleKey: string, permissions: Permission[]) => {
        if (!hasPermission('manage_permissions')) { showToast(t.permissionDenied); return; }
        const result = await apiCall('update_permissions.php', { roleName: roleKey, permissions }, t.permissionsUpdatedSuccess, 'Failed to update permissions.');
        if (result) {
            const newPermissions = { ...rolePermissions, [roleKey]: permissions };
            setRolePermissions(newPermissions);
            setAuthRolePermissions(newPermissions);
        }
    }, [hasPermission, t, apiCall, rolePermissions, setAuthRolePermissions]);

    const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
        if (!hasPermission('add_category')) { showToast(t.permissionDenied); return; }
        const result = await apiCall<{ category: Category }>('add_category.php', categoryData, t.categoryAddedSuccess, t.categoryAddFailed);
        if (result?.category) await fetchAllData(); // Refetch all to rebuild tree
    }, [hasPermission, t, apiCall, fetchAllData]);
    
    const updateCategory = useCallback(async (categoryData: Category) => {
        if (!hasPermission('edit_category')) { showToast(t.permissionDenied); return; }
        const result = await apiCall('update_category.php', categoryData, t.categoryUpdatedSuccess, t.categoryUpdateFailed);
        if (result) await fetchAllData(); // Refetch all to rebuild tree
    }, [hasPermission, t, apiCall, fetchAllData]);

    const deleteCategory = useCallback(async (categoryId: number) => {
        if (!hasPermission('delete_category')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}delete_category.php`, { method: 'POST', body: JSON.stringify({ id: categoryId }) });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.errorKey && t[result.errorKey as keyof typeof t]) {
                    throw new Error(t[result.errorKey as keyof typeof t]);
                }
                throw new Error(result.error || t.categoryDeleteFailed);
            }
            showToast(t.categoryDeletedSuccess);
            await fetchAllData();
        } catch (error: any) {
            showToast(error.message || t.categoryDeleteFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, setIsProcessing, showToast, fetchAllData]);

    const addTag = useCallback(async (tagData: Omit<Tag, 'id'> & { id: string }) => {
        if (!hasPermission('add_tag')) { showToast(t.permissionDenied); return; }
        const result = await apiCall<{ tag: Tag }>('add_tag.php', tagData, t.tagAddedSuccess, t.tagAddFailed);
        if (result?.tag) await fetchAllData();
    }, [hasPermission, t, apiCall, fetchAllData]);
    
    const updateTag = useCallback(async (tagData: Tag) => {
        if (!hasPermission('edit_tag')) { showToast(t.permissionDenied); return; }
        const result = await apiCall('update_tag.php', tagData, t.tagUpdatedSuccess, t.tagUpdateFailed);
        if (result) await fetchAllData();
    }, [hasPermission, t, apiCall, fetchAllData]);

    const deleteTag = useCallback(async (tagId: string) => {
        if (!hasPermission('delete_tag')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}delete_tag.php`, { method: 'POST', body: JSON.stringify({ id: tagId }) });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.errorKey && t[result.errorKey as keyof typeof t]) {
                    throw new Error(t[result.errorKey as keyof typeof t]);
                }
                throw new Error(result.error || t.tagDeleteFailed);
            }
            showToast(t.tagDeletedSuccess);
            await fetchAllData();
        } catch (error: any) {
            showToast(error.message || t.tagDeleteFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, setIsProcessing, showToast, fetchAllData]);
    
    const addRole = async (roleData: Omit<Role, 'isSystem' | 'key'>) => {
        // This should probably trigger a full auth data refresh
    };
    const updateRole = async (roleData: Role) => {};
    const deleteRole = async (roleKey: string) => {};
    
    const value: AdminContextType = {
        orders, 
        users, 
        roles: authRoles, 
        rolePermissions,
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
        deleteCategory,
        addTag, 
        updateTag, 
        deleteTag,
        addRole, 
        updateRole, 
        deleteRole,
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