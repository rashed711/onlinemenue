
import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { MenuPage } from './components/MenuPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminPage } from './components/admin/AdminPage';
import type { Product, CartItem, Language, Theme, User, Order, OrderStatus, UserRole, Promotion, Permission } from './types';
import { products as initialProducts, restaurantInfo, users as initialUsers, promotions as initialPromotions } from './data/mockData';
import { ToastNotification } from './components/ToastNotification';
import { useTranslations } from './i18n/translations';
import { initialRolePermissions } from './data/permissions';

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
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('restaurant_language') as Language) || 'ar');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('restaurant_theme') as Theme) || 'light');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });

  // Data State
  const [products, setProducts] = useState<Product[]>(() => {
    const savedProducts = localStorage.getItem('restaurant_products');
    return savedProducts ? JSON.parse(savedProducts) : initialProducts;
  });

  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const savedPromotions = localStorage.getItem('restaurant_promotions');
    return savedPromotions ? JSON.parse(savedPromotions) : initialPromotions;
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('restaurant_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Could not parse cart from localStorage", error);
      return [];
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('restaurant_users');
    return savedUsers ? JSON.parse(savedUsers) : initialUsers;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
      const savedOrders = localStorage.getItem('restaurant_orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
  });
  
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>(() => {
    const saved = localStorage.getItem('restaurant_role_permissions');
    return saved ? JSON.parse(saved) : initialRolePermissions;
  });

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const savedUser = sessionStorage.getItem('restaurant_currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
  });

  // Routing State
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => '');
  const route = useMemo(() => hash || '#/', [hash]);
  const t = useTranslations(language);

  const isAdmin = useMemo(() => currentUser?.role === 'admin' || currentUser?.role === 'superAdmin', [currentUser]);


  // Effect for route-based redirection for authentication
  useEffect(() => {
    // Redirect non-admins trying to access admin pages
    if (route.startsWith('#/admin') && !isAdmin) {
      window.location.hash = '#/login';
    } 
    // Redirect non-customers trying to access profile page
    else if (route.startsWith('#/profile') && currentUser?.role !== 'customer') {
      window.location.hash = '#/login';
    }
    // Redirect logged-in users trying to access login/register pages
    else if ((route.startsWith('#/login') || route.startsWith('#/register')) && currentUser) {
      window.location.hash = isAdmin ? '#/admin' : '#/profile';
    }
  }, [route, currentUser, isAdmin]);


  // UI Persistence Effects
  useEffect(() => {
    localStorage.setItem('restaurant_language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    localStorage.setItem('restaurant_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  // Data Persistence Effects
  useEffect(() => {
    localStorage.setItem('restaurant_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('restaurant_promotions', JSON.stringify(promotions));
  }, [promotions]);

  useEffect(() => {
    localStorage.setItem('restaurant_cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  useEffect(() => {
      localStorage.setItem('restaurant_users', JSON.stringify(users));
  }, [users]);
  
  useEffect(() => {
      localStorage.setItem('restaurant_orders', JSON.stringify(orders));
  }, [orders]);
  
  useEffect(() => {
      localStorage.setItem('restaurant_role_permissions', JSON.stringify(rolePermissions));
  }, [rolePermissions]);
  
  useEffect(() => {
      if (currentUser) {
        sessionStorage.setItem('restaurant_currentUser', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('restaurant_currentUser');
      }
  }, [currentUser]);


  // Callbacks
  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);
  const toggleLanguage = useCallback(() => setLanguage(prev => prev === 'en' ? 'ar' : 'en'), []);
  const clearCart = useCallback(() => setCartItems([]), []);
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
    const userPermissions = rolePermissions[currentUser.role];
    return userPermissions?.includes(permission) ?? false;
  }, [currentUser, rolePermissions]);

  // Auth Callbacks
  const login = useCallback((user: User) => setCurrentUser(user), []);
  const logout = useCallback(() => {
    setCurrentUser(null);
    window.location.hash = '#/'; // Redirect to home page on logout
  }, []);
  const register = useCallback((newUser: Omit<User, 'id' | 'role'>) => {
      const userWithId: User = { ...newUser, id: Date.now(), role: 'customer' };
      setUsers(prev => [...prev, userWithId]);
      login(userWithId);
  }, [login]);

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
  }, [showToast, t]);

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
  }, []);

  // Order Callbacks
  const placeOrder = useCallback((order: Omit<Order, 'id' | 'timestamp'>): Order => {
    const newOrder: Order = {
        ...order,
        id: `ORD-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString()
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    if (!hasPermission('manage_orders')) {
        showToast(t.permissionDenied);
        return;
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, [hasPermission, showToast, t.permissionDenied]);

  // Admin Callbacks
  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    if (!hasPermission('manage_menu')) {
        showToast(t.permissionDenied);
        return;
    }
    setProducts(prev => {
        const newProduct: Product = {
            ...productData,
            id: Date.now(), // Simple ID generation
        };
        return [newProduct, ...prev];
    });
  }, [hasPermission, showToast, t.permissionDenied]);

  const updateProduct = useCallback((updatedProduct: Product) => {
    if (!hasPermission('manage_menu')) {
        showToast(t.permissionDenied);
        return;
    }
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }, [hasPermission, showToast, t.permissionDenied]);

  const deleteProduct = useCallback((productId: number) => {
    if (!hasPermission('manage_menu')) {
        showToast(t.permissionDenied);
        return;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, [hasPermission, showToast, t.permissionDenied]);

  const addPromotion = useCallback((promotionData: Omit<Promotion, 'id'>) => {
    if (!hasPermission('manage_promotions')) {
        showToast(t.permissionDenied);
        return;
    }
    setPromotions(prev => {
        const newPromotion: Promotion = {
            ...promotionData,
            id: Date.now(),
        };
        return [newPromotion, ...prev];
    });
  }, [hasPermission, showToast, t.permissionDenied]);

  const updatePromotion = useCallback((updatedPromotion: Promotion) => {
    if (!hasPermission('manage_promotions')) {
        showToast(t.permissionDenied);
        return;
    }
    setPromotions(prev => prev.map(p => p.id === updatedPromotion.id ? updatedPromotion : p));
  }, [hasPermission, showToast, t.permissionDenied]);

  const deletePromotion = useCallback((promotionId: number) => {
    if (!hasPermission('manage_promotions')) {
        showToast(t.permissionDenied);
        return;
    }
    setPromotions(prev => prev.filter(p => p.id !== promotionId));
  }, [hasPermission, showToast, t.permissionDenied]);
  
  const addUser = useCallback((userData: Omit<User, 'id'>) => {
    if (!hasPermission('manage_users')) {
        showToast(t.permissionDenied);
        return;
    }
    setUsers(prev => {
        const newUser: User = { ...userData, id: Date.now() };
        return [newUser, ...prev];
    });
  }, [hasPermission, showToast, t.permissionDenied]);
  
  const updateUser = useCallback((updatedUser: User) => {
    if (!hasPermission('manage_users')) {
        showToast(t.permissionDenied);
        return;
    }
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, [hasPermission, showToast, t.permissionDenied]);

  const deleteUser = useCallback((userId: number) => {
    if (!hasPermission('manage_users')) {
        showToast(t.permissionDenied);
        return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, [hasPermission, showToast, t.permissionDenied]);
  
  const updateRolePermissions = useCallback((role: UserRole, permissions: Permission[]) => {
    if (!hasPermission('manage_roles')) {
        showToast(t.permissionDenied);
        return;
    }
    setRolePermissions(prev => ({...prev, [role]: permissions}));
  }, [hasPermission, showToast, t.permissionDenied]);


  // Router
  const renderContent = () => {
    if (route.startsWith('#/login')) {
      return currentUser ? null : <LoginPage language={language} users={users} login={login} />;
    }
    if (route.startsWith('#/register')) {
      return currentUser ? null : <RegisterPage language={language} register={register} />;
    }
    if (route.startsWith('#/admin')) {
      return isAdmin ? (
        <AdminPage 
            language={language} 
            currentUser={currentUser}
            allProducts={products}
            allUsers={users}
            restaurantInfo={restaurantInfo} 
            allOrders={orders} 
            allPromotions={promotions}
            updateOrderStatus={updateOrderStatus} 
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
        />
      ) : null;
    }
    if (route.startsWith('#/profile')) {
       return currentUser?.role === 'customer' ? <ProfilePage language={language} currentUser={currentUser} orders={orders} logout={logout} restaurantInfo={restaurantInfo}/> : null;
    }

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
      />
    );
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-gray-200 transition-colors duration-300 ${language === 'ar' ? 'font-cairo' : 'font-sans'}`}>
      {renderContent()}
      <ToastNotification message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
};

export default App;