import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { MenuPage } from './components/MenuPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminPage } from './components/admin/AdminPage';
import type { Product, CartItem, Language, Theme, User, Order, OrderStatus } from './types';
import { products as initialProducts, restaurantInfo, users as initialUsers } from './data/mockData';

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
  
  // Data State
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

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const savedUser = sessionStorage.getItem('restaurant_currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
  });

  // Routing State
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => '');
  const route = useMemo(() => hash || '#/', [hash]);

  // Effect for route-based redirection for authentication
  useEffect(() => {
    // Redirect non-admins trying to access admin pages
    if (route.startsWith('#/admin') && currentUser?.role !== 'admin') {
      window.location.hash = '#/login';
    } 
    // Redirect non-customers trying to access profile page
    else if (route.startsWith('#/profile') && currentUser?.role !== 'customer') {
      window.location.hash = '#/login';
    }
    // Redirect logged-in users trying to access login/register pages
    else if ((route.startsWith('#/login') || route.startsWith('#/register')) && currentUser) {
      window.location.hash = currentUser.role === 'admin' ? '#/admin' : '#/profile';
    }
  }, [route, currentUser]);


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
    localStorage.setItem('restaurant_cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  useEffect(() => {
      localStorage.setItem('restaurant_users', JSON.stringify(users));
  }, [users]);
  
  useEffect(() => {
      localStorage.setItem('restaurant_orders', JSON.stringify(orders));
  }, [orders]);
  
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
  }, []);

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
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  // Router
  const renderContent = () => {
    if (route.startsWith('#/login')) {
      return currentUser ? null : <LoginPage language={language} users={users} login={login} />;
    }
    if (route.startsWith('#/register')) {
      return currentUser ? null : <RegisterPage language={language} register={register} />;
    }
    if (route.startsWith('#/admin')) {
      return currentUser?.role === 'admin' ? <AdminPage language={language} allProducts={initialProducts} restaurantInfo={restaurantInfo} allOrders={orders} updateOrderStatus={updateOrderStatus} /> : null;
    }
    if (route.startsWith('#/profile')) {
       return currentUser?.role === 'customer' ? <ProfilePage language={language} currentUser={currentUser} orders={orders} /> : null;
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
      />
    );
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 ${language === 'ar' ? 'font-cairo' : 'font-sans'}`}>
      {renderContent()}
    </div>
  );
};

export default App;
