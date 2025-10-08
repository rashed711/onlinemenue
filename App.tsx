import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { MenuPage } from './components/MenuPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminPage } from './components/admin/AdminPage';
import { SocialPage } from './components/SocialPage';
import type { Product, CartItem, Language, Theme, User, Order, OrderStatus, UserRole, Promotion, Permission, Category, Tag, RestaurantInfo, OrderStatusColumn } from './types';
import { USER_ROLES } from './types';
import { restaurantInfo as fallbackRestaurantInfo, promotions as initialPromotions, initialCategories, initialTags } from './data/mockData';
import { ToastNotification } from './components/ToastNotification';
import { useTranslations } from './i18n/translations';
import { usePersistentState } from './hooks/usePersistentState';
import { initialRolePermissions } from './data/permissions';
import { calculateTotal } from './utils/helpers';
import { TopProgressBar } from './components/TopProgressBar';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ChangePasswordModal } from './components/profile/ChangePasswordModal';
import { API_BASE_URL } from './utils/config';
import { LoadingOverlay } from './components/LoadingOverlay';


// Subscribes to the browser's hashchange event.
function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => {
    window.removeEventListener('hashchange', callback);
  };
}

// Gets the current value of the browser's hash.
function getSnapshot() {
  return window.location.hash;
}

const App: React.FC = () => {
  // UI State
  const [language, setLanguage] = usePersistentState<Language>('restaurant_language', 'ar');
  const [theme, setTheme] = usePersistentState<Theme>('restaurant_theme', 'light');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [cartItems, setCartItems] = usePersistentState<CartItem[]>('restaurant_cart', []);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = usePersistentState<Order[]>('restaurant_orders', []);
  const [rolePermissions, setRolePermissions] = usePersistentState<Record<UserRole, Permission[]>>('restaurant_role_permissions', initialRolePermissions);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);


  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);


  // Routing State
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => '');
  const route = useMemo(() => hash || '#/', [hash]);
  const t = useTranslations(language);

  // Transition state
  const [transitionStage, setTransitionStage] = useState<'in' | 'out'>('in');
  const [displayedRoute, setDisplayedRoute] = useState(route);
  const [progress, setProgress] = useState(100);
  const [showProgress, setShowProgress] = useState(false);

  const isAdmin = useMemo(() => currentUser?.role !== 'customer', [currentUser]);
  
  const showToast = useCallback((message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, []);
  
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!currentUser) return false;
    // Super Admins always have all permissions, regardless of the roles object
    if (currentUser.role === 'superAdmin') return true;

    // Handle dynamic status permissions
    if (permission.startsWith('view_status_')) {
        const userPermissions = rolePermissions[currentUser.role];
        return userPermissions?.includes(permission) ?? false;
    }
    
    const userPermissions = rolePermissions[currentUser.role];
    return userPermissions?.includes(permission) ?? false;
  }, [currentUser, rolePermissions]);


  // Fetch all initial data on load
  useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const settingsPromise = fetch(`${API_BASE_URL}get_settings.php`);
            const classificationsPromise = fetch(`${API_BASE_URL}get_classifications.php`);
            const promotionsPromise = fetch(`${API_BASE_URL}get_promotions.php`);
            const productsPromise = fetch(`${API_BASE_URL}get_products.php`);

            // FIX: Corrected a typo where 'productsResponse' was used before declaration instead of 'productsPromise'.
            const [settingsResponse, classificationsResponse, promotionsResponse, productsResponse] = await Promise.all([settingsPromise, classificationsPromise, promotionsPromise, productsPromise]);

            // Process Settings
            if (!settingsResponse.ok) throw new Error('Failed to fetch settings');
            const settingsData = await settingsResponse.json();
            if (settingsData.logo && !settingsData.logo.startsWith('http')) settingsData.logo = `${API_BASE_URL}${settingsData.logo}`;
            if (settingsData.heroImage && !settingsData.heroImage.startsWith('http')) settingsData.heroImage = `${API_BASE_URL}${settingsData.heroImage}`;
            setRestaurantInfo(settingsData);
            
            // Process Classifications
            if (!classificationsResponse.ok) throw new Error('Failed to fetch classifications');
            const classificationsData = await classificationsResponse.json();
            setCategories(classificationsData.categories || []);
            setTags(classificationsData.tags || []);

            // Process Promotions
            if (!promotionsResponse.ok) throw new Error('Failed to fetch promotions');
            const promotionsData = await promotionsResponse.json();
            setPromotions(promotionsData || []);
            
            // Process Products
            if (!productsResponse.ok) throw new Error('Failed to fetch products');
            const productsData = await productsResponse.json();
            const resolvedProducts = (productsData || []).map((p: Product) => ({
                ...p,
                image: p.image && !p.image.startsWith('http') ? `${API_BASE_URL}${p.image}` : p.image,
            }));
            setProducts(resolvedProducts);


        } catch (error) {
            console.error("Error fetching initial data:", error);
            // Fallback to mock data if any fetch fails
            setRestaurantInfo(fallbackRestaurantInfo);
            setCategories(initialCategories);
            setTags(initialTags);
            setPromotions([]); // No mock promotions on error
            setProducts([]); // No mock products on error to avoid constraint violations
        } finally {
            setIsLoading(false);
        }
    };
    fetchInitialData();
  }, []);


  // Effect for route-based redirection for authentication
  useEffect(() => {
    // Redirect non-admins trying to access admin pages
    if (route.startsWith('#/admin') && !isAdmin) {
      window.location.hash = '#/login';
    } 
    // Redirect logged-out users trying to access profile page
    else if (route.startsWith('#/profile') && !currentUser) {
      window.location.hash = '#/login';
    }
    // Redirect logged-in users trying to access login/register/forgot-password pages
    else if ((route.startsWith('#/login') || route.startsWith('#/register') || route.startsWith('#/forgot-password')) && currentUser) {
      window.location.hash = isAdmin ? '#/admin' : '#/profile';
    }
  }, [route, currentUser, isAdmin]);

  // Fetch admin-specific data when an admin user logs in
  useEffect(() => {
    const fetchAdminData = async () => {
      // We only fetch the full user list if an admin or superAdmin is logged in.
      if (currentUser && hasPermission('manage_users')) {
        try {
          setIsProcessing(true); // Show loading overlay
          const usersResponse = await fetch(`${API_BASE_URL}get_users.php`);
          if (!usersResponse.ok) {
            const errorData = await usersResponse.text();
            throw new Error(`Failed to fetch users: ${errorData}`);
          }
          const usersData = await usersResponse.json();

          if (!Array.isArray(usersData)) {
            console.error("API did not return a user array:", usersData);
            throw new Error("Invalid data format for users from API.");
          }

          const resolvedUsers: User[] = (usersData || []).map((dbUser: any) => {
            const mappedRole: UserRole = USER_ROLES.includes(dbUser.role as UserRole)
                ? dbUser.role as UserRole
                : 'customer';

            let profilePictureUrl = '';
            if (dbUser.profile_picture && dbUser.profile_picture.trim() !== '') {
                profilePictureUrl = `${API_BASE_URL}${dbUser.profile_picture}`;
            } else {
                const firstLetter = dbUser.name ? dbUser.name.charAt(0).toUpperCase() : 'U';
                profilePictureUrl = `https://placehold.co/512x512/60a5fa/white?text=${firstLetter}`;
            }
            
            return {
              id: Number(dbUser.id),
              name: dbUser.name,
              mobile: dbUser.mobile,
              password: '', // Never store password from a general fetch
              role: mappedRole,
              profilePicture: profilePictureUrl,
            };
          });
          
          setUsers(resolvedUsers);

        } catch (error) {
          console.error("Error fetching admin data (users):", error);
          showToast('Failed to load user list.');
        } finally {
          setIsProcessing(false); // Hide loading overlay
        }
      } else {
        setUsers([]); // Clear user list if not an admin
      }
    };

    fetchAdminData();
  }, [currentUser, hasPermission, showToast, setIsProcessing]);
  
  // Effects for handling page transitions
  useEffect(() => {
    if (route !== displayedRoute) {
      setShowProgress(true);
      setProgress(0); // Start progress
      setTransitionStage('out');

      // Animate progress bar during transition
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 20, 90));
      }, 60);

      // Switch content after animation out
      const timer = setTimeout(() => {
        clearInterval(progressInterval);
        setDisplayedRoute(route);
        setTransitionStage('in');
        setProgress(100); // Finish progress
        setTimeout(() => setShowProgress(false), 400); // Hide after a bit
      }, 300); // Corresponds to CSS duration

      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
      };
    }
  }, [route, displayedRoute]);


  // UI Persistence Effects
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  // Auth Persistence Effect
  useEffect(() => {
      if (currentUser) {
        sessionStorage.setItem('restaurant_currentUser', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('restaurant_currentUser');
      }
  }, [currentUser]);


  // Callbacks
  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), [setTheme]);
  const toggleLanguage = useCallback(() => setLanguage(prev => prev === 'en' ? 'ar' : 'en'), [setLanguage]);
  const clearCart = useCallback(() => setCartItems([]), [setCartItems]);
  
    const updateRestaurantInfo = useCallback(async (updatedInfo: Partial<RestaurantInfo>) => {
    if (!restaurantInfo) return;
    setIsProcessing(true);
    try {
        let finalUpdates = { ...updatedInfo };
        let showSuccessToast = true;

        // Handle logo upload
        if (updatedInfo.logo && updatedInfo.logo.startsWith('data:image')) {
        showSuccessToast = false; // The final save will show the toast
        try {
            const response = await fetch(updatedInfo.logo);
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('image', blob, 'logo.png');
            formData.append('type', 'branding');
            formData.append('imageField', 'logo');

            const uploadResponse = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
            if (!uploadResponse.ok) throw new Error(`Logo upload failed: ${await uploadResponse.text()}`);
            const result = await uploadResponse.json();
            if (result.success && result.url) {
            finalUpdates.logo = `${API_BASE_URL}${result.url}`;
            } else {
            throw new Error(result.error || 'Failed to get logo URL');
            }
        } catch (error) {
            console.error("Logo upload error:", error);
            showToast('Failed to update logo.');
            return;
        }
        }

        // Handle hero image upload
        if (updatedInfo.heroImage && updatedInfo.heroImage.startsWith('data:image')) {
        showSuccessToast = false;
        try {
            const response = await fetch(updatedInfo.heroImage);
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('image', blob, 'hero.png');
            formData.append('type', 'branding');
            formData.append('imageField', 'heroImage');
            
            const uploadResponse = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
            if (!uploadResponse.ok) throw new Error(`Hero image upload failed: ${await uploadResponse.text()}`);
            const result = await uploadResponse.json();
            if (result.success && result.url) {
            finalUpdates.heroImage = `${API_BASE_URL}${result.url}`;
            } else {
            throw new Error(result.error || 'Failed to get hero image URL');
            }
        } catch (error) {
            console.error("Hero image upload error:", error);
            showToast('Failed to update hero image.');
            return;
        }
        }

        const dbPayload: Partial<RestaurantInfo> = { ...finalUpdates };
        if (dbPayload.logo) dbPayload.logo = dbPayload.logo.replace(API_BASE_URL, '');
        if (dbPayload.heroImage) dbPayload.heroImage = dbPayload.heroImage.replace(API_BASE_URL, '');
        
        const response = await fetch(`${API_BASE_URL}update_settings.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbPayload)
        });

        if (!response.ok) throw new Error(`Failed to update settings: ${await response.text()}`);
        const result = await response.json();
        if (result.success) {
            setRestaurantInfo(prev => prev ? ({...prev, ...finalUpdates}) : null);
            if (showSuccessToast) showToast(t.settingsUpdatedSuccess);
        } else {
            throw new Error(result.error || 'Update failed');
        }

    } catch (error) {
        console.error("Error updating restaurant info:", error);
        showToast(t.settingsUpdateFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [restaurantInfo, showToast, t.settingsUpdatedSuccess, t.settingsUpdateFailed]);

  // Auth Callbacks
  const login = useCallback(async (mobile: string, password: string): Promise<string | null> => {
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, password })
        });

        const result = await response.json();

        if (!response.ok) {
            return result.error || t.invalidCredentials;
        }

        const dbUser = result;
        
        const roleFromApi = String(dbUser.role || 'customer');
        const matchedRole = USER_ROLES.find(r => r.toLowerCase() === roleFromApi.toLowerCase());
        const mappedRole: UserRole = matchedRole || 'customer';
        
        let profilePictureUrl = '';
        if (dbUser.profile_picture && dbUser.profile_picture.trim() !== '') {
            profilePictureUrl = `${API_BASE_URL}${dbUser.profile_picture}`;
        } else {
            const firstLetter = dbUser.name ? dbUser.name.charAt(0).toUpperCase() : 'U';
            profilePictureUrl = `https://placehold.co/512x512/60a5fa/white?text=${firstLetter}`;
        }

        const frontendUser: User = {
            id: Number(dbUser.id),
            name: dbUser.name,
            mobile: dbUser.mobile,
            password: '', // Never store raw password in state
            role: mappedRole,
            profilePicture: profilePictureUrl,
        };
        
        setCurrentUser(frontendUser);
        return null; // Success
    } catch (error) {
        console.error('Login error:', error);
        return t.invalidCredentials;
    } finally {
        setIsProcessing(false);
    }
  }, [setCurrentUser, t.invalidCredentials]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    window.location.hash = '#/'; // Redirect to home page on logout
  }, []);

  const register = useCallback(async (newUserData: Omit<User, 'id' | 'role' | 'profilePicture'>): Promise<string | null> => {
    setIsProcessing(true);
    try {
        const payload = { ...newUserData, role: 'customer' };
        const response = await fetch(`${API_BASE_URL}add_user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to register.');
        }

        const dbUser = result.user;
        let profilePictureUrl = '';
        if (dbUser.profile_picture && dbUser.profile_picture.trim() !== '') {
            profilePictureUrl = `${API_BASE_URL}${dbUser.profile_picture}`;
        } else {
            const firstLetter = dbUser.name ? dbUser.name.charAt(0).toUpperCase() : 'U';
            profilePictureUrl = `https://placehold.co/512x512/60a5fa/white?text=${firstLetter}`;
        }

        const frontendUser: User = {
            id: Number(dbUser.id),
            name: dbUser.name,
            mobile: dbUser.mobile,
            password: '', 
            role: 'customer',
            profilePicture: profilePictureUrl,
        };
        
        setCurrentUser(frontendUser);
        setUsers(prev => [frontendUser, ...prev]);

        return null; // Success
    } catch (error: any) {
        console.error('Registration error:', error);
        return error.message || 'Registration failed. Please try again.';
    } finally {
        setIsProcessing(false);
    }
  }, [setCurrentUser, setUsers, setIsProcessing]);
  
  const updateUserProfile = useCallback(async (userId: number, updates: { name?: string; profilePicture?: string }) => {
    setIsProcessing(true);
    try {
        const userToUpdate = users.find(u => u.id === userId) || currentUser;
        if (!userToUpdate) throw new Error("User not found.");

        let relativeImagePath: string | undefined = undefined;
        let newProfilePictureUrl: string | undefined = undefined;

        // Step 1: Upload image if provided
        if (updates.profilePicture && updates.profilePicture.startsWith('data:image')) {
            const response = await fetch(updates.profilePicture);
            const blob = await response.blob();
            
            const formData = new FormData();
            formData.append('image', blob, 'profile.png');
            formData.append('type', 'users');
            formData.append('userId', userId.toString());

            const uploadResponse = await fetch(`${API_BASE_URL}upload_image.php`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Image upload failed: ${errorText}`);
            }

            const result = await uploadResponse.json();
            if (result.success && result.url) {
                relativeImagePath = result.url; // The relative path, e.g., 'uploads/users/1.png'
                newProfilePictureUrl = `${API_BASE_URL}${result.url}`; // The full URL for UI state update
            } else {
                throw new Error(result.error || 'Failed to get URL from server');
            }
        }

        // Step 2: Prepare payload if there are any changes
        const hasNameUpdate = updates.name && updates.name !== userToUpdate.name;
        if (hasNameUpdate || relativeImagePath) {
            const dbPayload = {
                id: userId,
                name: hasNameUpdate ? updates.name : userToUpdate.name,
                mobile: userToUpdate.mobile,
                role: userToUpdate.role,
                ...(relativeImagePath && { profile_picture: relativeImagePath })
            };
            
            const updateResponse = await fetch(`${API_BASE_URL}update_user.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbPayload)
            });

            const result = await updateResponse.json();
            if (!updateResponse.ok || !result.success) {
                throw new Error(result.error || 'Failed to update user profile in database.');
            }
        }

        // Step 3: Update local state if the API call was successful
        let updatedUser: User | null = null;
        const finalUsers = users.map(u => {
            if (u.id === userId) {
                updatedUser = { 
                    ...u, 
                    ...(hasNameUpdate && { name: updates.name! }),
                    ...(newProfilePictureUrl && { profilePicture: newProfilePictureUrl })
                };
                return updatedUser;
            }
            return u;
        });
        setUsers(finalUsers);
        
        if (currentUser?.id === userId && updatedUser) {
            setCurrentUser(updatedUser);
        }
        
        showToast(t.profileUpdatedSuccess);

    } catch (error) {
        console.error("Error updating profile:", error);
        showToast('Failed to update profile.');
    } finally {
        setIsProcessing(false);
    }
}, [users, setUsers, currentUser, setCurrentUser, showToast, t.profileUpdatedSuccess]);

  const resetUserPassword = useCallback(async (user: User, newPassword: string): Promise<boolean> => {
        setIsProcessing(true);
        try {
            const payload = {
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                password: newPassword,
            };

            const response = await fetch(`${API_BASE_URL}update_user.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to reset password.');
            }
            return true;
        } catch (error: any) {
            console.error('Password reset error:', error);
            showToast(error.message || 'Failed to reset password.');
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [showToast, setIsProcessing]);

  const changeCurrentUserPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<string | null> => {
      if (!currentUser) return 'No user logged in.';
      setIsProcessing(true);
      try {
        const verifyResponse = await fetch(`${API_BASE_URL}login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: currentUser.mobile, password: currentPassword })
        });

        if (!verifyResponse.ok) {
            return t.incorrectCurrentPassword;
        }

        const updatePayload = {
            id: currentUser.id,
            name: currentUser.name,
            mobile: currentUser.mobile,
            role: currentUser.role,
            password: newPassword,
        };
        const updateResponse = await fetch(`${API_BASE_URL}update_user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });

        const result = await updateResponse.json();
        if (!updateResponse.ok || !result.success) {
            throw new Error(result.error || 'Failed to change password.');
        }

        showToast(t.passwordChangedSuccess);
        return null; // Success
      } catch (error: any) {
          console.error('Change password error:', error);
          return error.message || 'Failed to change password.';
      } finally {
          setIsProcessing(false);
      }
  }, [currentUser, showToast, t.incorrectCurrentPassword, t.passwordChangedSuccess]);

  // Cart Callbacks
  const addToCart = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
    setCartItems(prevItems => {
      const itemVariantId = product.id + JSON.stringify(options || {});
      const existingItem = prevItems.find(item => (item.product.id + JSON.stringify(item.options || {})) === itemVariantId);
      
      if (existingItem) {
        return prevItems.map(item =>
          (item.product.id + JSON.stringify(item.options || {})) === itemVariantId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity, options }];
    });
    showToast(t.addedToCart);
  }, [showToast, t.addedToCart, setCartItems]);

  const updateCartQuantity = useCallback((productId: number, options: { [key: string]: string } | undefined, newQuantity: number) => {
    const itemVariantId = productId + JSON.stringify(options || {});
    setCartItems(prevItems => {
      if (newQuantity <= 0) {
        return prevItems.filter(item => (item.product.id + JSON.stringify(item.options || {})) !== itemVariantId);
      }
      return prevItems.map(item =>
        (item.product.id + JSON.stringify(item.options || {})) === itemVariantId 
            ? { ...item, quantity: newQuantity } 
            : item
      );
    });
  }, [setCartItems]);

  // Order Callbacks
  const placeOrder = useCallback((order: Omit<Order, 'id' | 'timestamp'>): Order => {
    const newOrder: Order = {
        ...order,
        id: `ORD-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        status: restaurantInfo?.orderStatusColumns[0]?.id || 'pending', // Default to first status
        createdBy: currentUser?.id, // Tag order with creator's ID
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }, [currentUser, restaurantInfo, setOrders]);

  const updateOrder = useCallback((orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => {
      const order = orders.find(o => o.id === orderId);
      if (!order || !restaurantInfo) return;
  
      let canUpdate = false;
      let finalPayload: Partial<Order> = { ...payload };

      const isContentEdit = payload.items || typeof payload.notes !== 'undefined' || typeof payload.tableNumber !== 'undefined';
      const isFeedback = !!payload.customerFeedback;

      if (isContentEdit) {
          if (hasPermission('edit_orders')) {
              canUpdate = true;
              if (payload.items) {
                  finalPayload.total = calculateTotal(payload.items);
              }
          }
      } else if (isFeedback) {
          if (currentUser?.id === order.customer.userId && order.status === 'completed') {
              canUpdate = true;
          }
      } else { // It must be a status change or refusal reason
          if(hasPermission('manage_orders')) {
            canUpdate = true;
          } else if (currentUser?.role === 'driver' && order.status === 'out_for_delivery' && (payload.status === 'completed' || payload.status === 'refused')) {
            canUpdate = true;
          }
      }
  
      if (canUpdate) {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...finalPayload } : o));
      } else {
          showToast(t.permissionDenied);
      }
  }, [orders, currentUser, hasPermission, showToast, t.permissionDenied, setOrders, restaurantInfo]);


  // Admin Callbacks
 const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'rating'>) => {
    if (!hasPermission('manage_menu')) { showToast(t.permissionDenied); return; }
    setIsProcessing(true);
    try {
        let finalProductData = { ...productData };

        if (finalProductData.image && finalProductData.image.startsWith('data:image')) {
            const response = await fetch(finalProductData.image);
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('image', blob, 'product.png');
            formData.append('type', 'products');

            const uploadResponse = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
            const result = await uploadResponse.json();
            if (uploadResponse.ok && result.success && result.url) {
                finalProductData.image = result.url; 
            } else {
                throw new Error(result.error || 'Failed to get image URL');
            }
        }

        const response = await fetch(`${API_BASE_URL}add_product.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalProductData)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || t.productAddFailed);
        
        const newProduct = result.product as Product;
        const resolvedProduct = {
            ...newProduct,
            image: newProduct.image && !newProduct.image.startsWith('http')
                ? `${API_BASE_URL}${newProduct.image}`
                : newProduct.image,
        };
        setProducts(prev => [resolvedProduct, ...prev]);
        showToast(t.productAddedSuccess);
    } catch (error: any) {
        console.error("Error adding product:", error);
        showToast(error.message || t.productAddFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t]);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    if (!hasPermission('manage_menu')) { showToast(t.permissionDenied); return; }
    setIsProcessing(true);
    try {
        let finalProductData = { ...updatedProduct };

        if (finalProductData.image && finalProductData.image.startsWith('data:image')) {
            const response = await fetch(finalProductData.image);
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('image', blob, 'product.png');
            formData.append('type', 'products');
            formData.append('productId', finalProductData.id.toString());

            const uploadResponse = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
            const result = await uploadResponse.json();
            if (uploadResponse.ok && result.success && result.url) {
                finalProductData.image = result.url; // Relative URL
            } else {
                throw new Error(result.error || 'Failed to get image URL');
            }
        }
        
        const response = await fetch(`${API_BASE_URL}update_product.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalProductData)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(t.productUpdateFailed);
        
        const fullyResolvedProduct = {
             ...finalProductData,
             image: finalProductData.image && !finalProductData.image.startsWith('http') ? `${API_BASE_URL}${finalProductData.image}` : finalProductData.image
        };
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? fullyResolvedProduct : p));
        showToast(t.productUpdatedSuccess);
    } catch (error: any) {
        console.error("Error updating product:", error);
        showToast(error.message || t.productUpdateFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t]);

  const deleteProduct = useCallback(async (productId: number) => {
    if (!hasPermission('manage_menu')) { showToast(t.permissionDenied); return; }
    if (promotions.some(p => p.productId === productId && p.isActive)) {
        showToast(t.deleteProductError);
        return;
    }
    if (!window.confirm(t.confirmDelete)) return;
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}delete_product.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: productId })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || t.productDeleteFailed);
        
        setProducts(prev => prev.filter(p => p.id !== productId));
        showToast(t.productDeletedSuccess);
    } catch (error: any) {
        console.error(error);
        showToast(error.message || t.productDeleteFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t, promotions]);

  const addPromotion = useCallback(async (promotionData: Omit<Promotion, 'id'>) => {
    if (!hasPermission('manage_promotions')) { showToast(t.permissionDenied); return; }
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}add_promotion.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promotionData)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || t.promotionAddFailed);
        
        setPromotions(prev => [result.promotion, ...prev]);
        showToast(t.promotionAddedSuccess);
    } catch (error: any) {
        console.error(error);
        showToast(error.message || t.promotionAddFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t]);

  const updatePromotion = useCallback(async (updatedPromotion: Promotion) => {
    if (!hasPermission('manage_promotions')) { showToast(t.permissionDenied); return; }
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}update_promotion.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPromotion)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(t.promotionUpdateFailed);
        
        setPromotions(prev => prev.map(p => Number(p.id) === Number(updatedPromotion.id) ? updatedPromotion : p));
        showToast(t.promotionUpdatedSuccess);
    } catch (error: any) {
        console.error(error);
        showToast(error.message || t.promotionUpdateFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t]);

  const deletePromotion = useCallback(async (promotionId: number) => {
    if (!hasPermission('manage_promotions')) { showToast(t.permissionDenied); return; }
    if (!window.confirm(t.confirmDeletePromotion)) return;
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}delete_promotion.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: promotionId })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(t.promotionDeleteFailed);
        
        setPromotions(prev => prev.filter(p => p.id !== promotionId));
        showToast(t.promotionDeletedSuccess);
    } catch (error: any) {
        console.error(error);
        showToast(error.message || t.promotionDeleteFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t]);
  
  const addUser = useCallback(async (userData: Omit<User, 'id' | 'profilePicture'>) => {
    if (!hasPermission('manage_users')) { showToast(t.permissionDenied); return; }
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}add_user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to add user.');
        }

        const dbUser = result.user;
        const mappedRole: UserRole = USER_ROLES.includes(dbUser.role as UserRole)
            ? dbUser.role as UserRole
            : 'customer';

        let profilePictureUrl = '';
        if (dbUser.profile_picture && dbUser.profile_picture.trim() !== '') {
            profilePictureUrl = `${API_BASE_URL}${dbUser.profile_picture}`;
        } else {
            const firstLetter = dbUser.name ? dbUser.name.charAt(0).toUpperCase() : 'U';
            profilePictureUrl = `https://placehold.co/512x512/60a5fa/white?text=${firstLetter}`;
        }

        const newUser: User = {
            id: Number(dbUser.id),
            name: dbUser.name,
            mobile: dbUser.mobile,
            password: '', // Never store password
            role: mappedRole,
            profilePicture: profilePictureUrl,
        };

        setUsers(prev => [newUser, ...prev]);
        showToast('User added successfully.');
    } catch (error: any) {
        console.error("Error adding user:", error);
        showToast(error.message || 'Failed to add user.');
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t.permissionDenied, setUsers]);
  
  const updateUser = useCallback(async (updatedUser: User) => {
    if (!hasPermission('manage_users')) { showToast(t.permissionDenied); return; }
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}update_user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to update user.');
        }

        const finalUser = { ...updatedUser, password: '' }; // Ensure password is not stored in state
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? finalUser : u));
        showToast('User updated successfully.');
    } catch (error: any) {
        console.error("Error updating user:", error);
        showToast(error.message || 'Failed to update user.');
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t.permissionDenied, setUsers]);

  const deleteUser = useCallback(async (userId: number) => {
    if (!hasPermission('manage_users')) { showToast(t.permissionDenied); return; }
    const isUserInUse = orders.some(o => o.customer.userId === userId || o.createdBy === userId);
    if (isUserInUse) {
        showToast(t.deleteUserError);
        return;
    }
    if (!window.confirm(t.confirmDeleteUser)) return;
    
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}delete_user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to delete user.');
        }
        setUsers(prev => prev.filter(u => u.id !== userId));
        showToast('User deleted successfully.');
    } catch (error: any) {
        console.error("Error deleting user:", error);
        showToast(error.message || 'Failed to delete user.');
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t, orders, setUsers]);
  
  const updateRolePermissions = useCallback((role: UserRole, permissions: Permission[]) => {
    if (!hasPermission('manage_roles')) {
        showToast(t.permissionDenied);
        return;
    }
    setRolePermissions(prev => ({...prev, [role]: permissions}));
  }, [hasPermission, showToast, t.permissionDenied, setRolePermissions]);

  const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}add_category.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || t.categoryAddFailed);
        
        setCategories(prev => [result.category, ...prev]);
        showToast(t.categoryAddedSuccess);
    } catch (error: any) {
        console.error("Error adding category:", error);
        showToast(error.message || t.categoryAddFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t]);

  const updateCategory = useCallback(async (categoryData: Category) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}update_category.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || t.categoryUpdateFailed);
        
        setCategories(prev => prev.map(c => c.id === categoryData.id ? categoryData : c));
        showToast(t.categoryUpdatedSuccess);
    } catch (error: any) {
        console.error("Error updating category:", error);
        showToast(error.message || t.categoryUpdateFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t]);

  const deleteCategory = useCallback(async (categoryId: number) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    if (products.some(p => p.categoryId === categoryId)) {
        showToast(t.deleteCategoryError);
        return;
    }
    if (!window.confirm(t.confirmDeleteCategory)) return;
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}delete_category.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: categoryId })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || t.categoryDeleteFailed);
        
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        showToast(t.categoryDeletedSuccess);
    } catch (error: any) {
        console.error("Error deleting category:", error);
        showToast(error.message || t.categoryDeleteFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t, products]);

  const addTag = useCallback(async (tagData: Omit<Tag, 'id'> & { id: string }) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    if (tags.some(t => t.id === tagData.id)) {
        showToast(t.addTagError);
        return;
    }
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}add_tag.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tagData)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || t.tagAddFailed);
        
        setTags(prev => [result.tag, ...prev]);
        showToast(t.tagAddedSuccess);
    } catch (error: any) {
        console.error("Error adding tag:", error);
        showToast(error.message || t.tagAddFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t, tags]);

  const updateTag = useCallback(async (tagData: Tag) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}update_tag.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tagData)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || t.tagUpdateFailed);
        
        setTags(prev => prev.map(tag => tag.id === tagData.id ? tagData : tag));
        showToast(t.tagUpdatedSuccess);
    } catch (error: any) {
        console.error("Error updating tag:", error);
        showToast(error.message || t.tagUpdateFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t]);

  const deleteTag = useCallback(async (tagId: string) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    if (products.some(p => p.tags.includes(tagId))) {
        showToast(t.deleteTagError);
        return;
    }
    if (!window.confirm(t.confirmDeleteTag)) return;
    setIsProcessing(true);
    try {
        const response = await fetch(`${API_BASE_URL}delete_tag.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: tagId })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || t.tagDeleteFailed);
        
        setTags(prev => prev.filter(tag => tag.id !== tagId));
        showToast(t.tagDeletedSuccess);
    } catch (error: any) {
        console.error("Error deleting tag:", error);
        showToast(error.message || t.tagDeleteFailed);
    } finally {
        setIsProcessing(false);
    }
  }, [hasPermission, showToast, t, products]);

  // Render Logic
  const renderPage = () => {
    // Handling route with potential query params (e.g. for password reset tokens)
    const [baseRoute] = displayedRoute.split('?');

    if (isLoading || !restaurantInfo) {
      return <LoadingOverlay isVisible={true} />;
    }

    if (baseRoute.startsWith('#/admin')) {
      return (
        <AdminPage
          language={language}
          currentUser={currentUser}
          allProducts={products}
          allCategories={categories}
          allTags={tags}
          allUsers={users}
          restaurantInfo={restaurantInfo}
          allOrders={orders}
          allPromotions={promotions}
          placeOrder={placeOrder}
          showToast={showToast}
          updateOrder={updateOrder}
          logout={logout}
          addProduct={addProduct}
          updateProduct={updateProduct}
          deleteProduct={deleteProduct}
          addPromotion={addPromotion}
          updatePromotion={updatePromotion}
          deletePromotion={deletePromotion}
          addUser={addUser}
          updateUser={updateUser}
          deleteUser={deleteUser}
          rolePermissions={rolePermissions}
          updateRolePermissions={updateRolePermissions}
          addCategory={addCategory}
          updateCategory={updateCategory}
          deleteCategory={deleteCategory}
          addTag={addTag}
          updateTag={updateTag}
          deleteTag={deleteTag}
          updateRestaurantInfo={updateRestaurantInfo}
          setProgress={setProgress}
          setShowProgress={setShowProgress}
          onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
        />
      );
    }
    if (baseRoute.startsWith('#/login')) return <LoginPage language={language} login={login} isProcessing={isProcessing} />;
    if (baseRoute.startsWith('#/register')) return <RegisterPage language={language} register={register} />;
    if (baseRoute.startsWith('#/forgot-password')) return <ForgotPasswordPage language={language} users={users} onPasswordReset={resetUserPassword} />;
    if (baseRoute.startsWith('#/profile')) {
      return currentUser ? (
        <ProfilePage
          language={language}
          currentUser={currentUser}
          orders={orders.filter(o => o.customer.userId === currentUser.id)}
          restaurantInfo={restaurantInfo}
          logout={logout}
          onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
          onUpdateProfile={updateUserProfile}
          updateOrder={updateOrder}
        />
      ) : null; // Redirects handled by useEffect
    }

    // Default Routes
    if (baseRoute.startsWith('#/social')) {
       return <SocialPage language={language} restaurantInfo={restaurantInfo} />
    }
    
    // Fallback to menu page, including '#/' or invalid hashes
    return (
      <MenuPage
        language={language}
        theme={theme}
        toggleLanguage={toggleLanguage}
        toggleTheme={toggleTheme}
        cartItems={cartItems}
        addToCart={addToCart}
        updateCartQuantity={updateCartQuantity}
        clearCart={clearCart}
        currentUser={currentUser}
        logout={logout}
        placeOrder={placeOrder}
        products={products}
        promotions={promotions}
        categories={categories}
        tags={tags}
        restaurantInfo={restaurantInfo}
        setIsProcessing={setIsProcessing}
      />
    );
  };
  
  return (
    <>
      <TopProgressBar progress={progress} show={showProgress} />
      <div className={`transition-opacity duration-300 ${transitionStage === 'in' ? 'opacity-100' : 'opacity-0'}`}>
        {renderPage()}
      </div>
      <ToastNotification message={toast.message} isVisible={toast.isVisible} />
      <LoadingOverlay isVisible={isProcessing && !isLoading} />
      {isChangePasswordModalOpen && currentUser && (
          <ChangePasswordModal
              language={language}
              onClose={() => setIsChangePasswordModalOpen(false)}
              onSave={changeCurrentUserPassword}
              isProcessing={isProcessing}
          />
      )}
    </>
  );
};

export default App;