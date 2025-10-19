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
    const { restaurantInfo, products, setProducts, promotions, setPromotions, categories, setCategories, tags, setTags, fetchAllData } = useData();

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
            const fetchOptions = { method: 'GET' };
            const ordersRes = await fetch(`${API_BASE_URL}get_orders.php`, fetchOptions);
            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            const allOrders = (await ordersRes.json() || []).map((o: any) => ({ ...o, paymentReceiptUrl: resolveImageUrl(o.paymentReceiptUrl)}));

            if (isAdmin) {
                setOrders(allOrders);
                const usersRes = await fetch(`${API_BASE_URL}get_users.php`, fetchOptions);
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
                const fetchOptions = { method: 'GET' };
                const permissionsRes = await fetch(`${API_BASE_URL}get_permissions.php`, fetchOptions);
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
                    // The URL from the PHP script is already the correct relative path.
                    orderForDb.paymentReceiptUrl = result.url.split('?v=')[0];
                } else {
                    throw new Error(result.error || 'Failed to get URL for receipt');
                }
            }
            const statusId = restaurantInfo?.orderStatusColumns?.[0]?.id || 'pending';
            const payload = { ...orderForDb, id: `ORD-${Math.floor(Math.random() * 900000) + 100000}`, status: statusId, createdBy: currentUser?.id };
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
                
                const res = await fetch(`${API_BASE_URL}update_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, payload: dbPayload }) });
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
        
        setIsProcessing(true);
        try {
            const res = await fetch(`${API_BASE_URL}delete_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId }) });
            if (!res.ok || !(await res.json()).success) throw new Error(t.orderDeleteFailed);
            showToast(t.orderDeletedSuccess);
        } catch (error: any) { 
            showToast(error.message);
            setOrders(originalOrders); // Revert on failure
        } finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing, orders]);
    
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
                
                finalProductData.image = result.url.split('?v=')[0];
            }

            const response = await fetch(`${API_BASE_URL}add_product.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalProductData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.productAddFailed);
            
            const newProduct = { ...result.product, image: resolveImageUrl(result.product.image) };
            setProducts(prev => [newProduct, ...prev].sort((a,b) => a.name[t.language as 'en'|'ar'].localeCompare(b.name[t.language as 'en'|'ar'])));
            showToast(t.productAddedSuccess);
        } catch (error: any) { showToast(error.message || t.productAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, setProducts, showToast, setIsProcessing]);
    
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
                formData.append('productId', updatedProduct.id.toString());
                const uploadRes = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (!uploadRes.ok || !result.success) throw new Error(result.error || 'Image upload failed');
                
                serverImageUrl = result.url;
                finalProductData.image = serverImageUrl.split('?v=')[0];
            } else {
                 const domain = new URL(API_BASE_URL).origin + '/';
                 finalProductData.image = updatedProduct.image ? updatedProduct.image.split('?v=')[0].replace(domain, '') : '';
            }
            
            const response = await fetch(`${API_BASE_URL}update_product.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalProductData) });
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
            const response = await fetch(`${API_BASE_URL}delete_product.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: productId }) });
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
            const response = await fetch(`${API_BASE_URL}add_promotion.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(promotionData) });
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
            const response = await fetch(`${API_BASE_URL}update_promotion.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedPromotion) });
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
            const response = await fetch(`${API_BASE_URL}delete_promotion.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: promotionId }) });
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
            const response = await fetch(`${API_BASE_URL}add_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
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
            
            const response = await fetch(`${API_BASE_URL}update_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.userUpdateFailed);
            showToast(t.userUpdatedSuccess);
        } catch (error: any) {
            showToast(error.message || t.userUpdateFailed);
            setUsers(originalUsers); // Revert
            if (currentUser?.id === updatedUser.id) {
                const originalSelf = originalUsers.find(u => u.id === currentUser.id);
                setCurrentUser(prev => prev ? { ...prev, ...originalSelf } : null);
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
            const response = await fetch(`${API_BASE_URL}delete_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: userId }) });
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
            const response = await fetch(`${API_BASE_URL}update_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: user.id, password: newPassword }) });
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
        
        const originalPermissions = { ...rolePermissions };
        const newPermissions = { ...rolePermissions, [roleKey]: permissions };
        setRolePermissions(newPermissions);
        setAuthRolePermissions(newPermissions);

        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}update_permissions.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ roleName: roleKey, permissions }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.permissionsUpdateFailed);
            showToast(t.permissionsUpdatedSuccess);
        } catch(error: any) {
            showToast(error.message || t.permissionsUpdateFailed);
            setRolePermissions(originalPermissions);
            setAuthRolePermissions(originalPermissions);
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, rolePermissions, setAuthRolePermissions, showToast, setIsProcessing]);

    const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
        if (!hasPermission('add_category')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}add_category.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(categoryData) });
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
            const response = await fetch(`${API_BASE_URL}update_category.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(categoryData) });
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

    const deleteCategory = useCallback(async (categoryId: number) => {
        if (!hasPermission('delete_category') || !window.confirm(t.confirmDeleteCategory)) { return; }
        const originalCategories = categories;
        
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}delete_category.php`, { method: 'POST', body: JSON.stringify({ id: categoryId }) });
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
            const response = await fetch(`${API_BASE_URL}add_tag.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(tagData) });
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
            const response = await fetch(`${API_BASE_URL}update_tag.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(tagData) });
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
            const response = await fetch(`${API_BASE_URL}delete_tag.php`, { method: 'POST', body: JSON.stringify({ id: tagId }) });
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
