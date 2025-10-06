

import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { MenuPage } from './components/MenuPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminPage } from './components/admin/AdminPage';
import type { Product, CartItem, Language, Theme, User, Order, OrderStatus, UserRole, Promotion, Permission, Category, Tag, RestaurantInfo, OrderStatusColumn } from './types';
import { products as initialProducts, restaurantInfo as initialRestaurantInfo, users as initialUsers, promotions as initialPromotions, initialCategories, initialTags } from './data/mockData';
import { ToastNotification } from './components/ToastNotification';
import { useTranslations } from './i18n/translations';
import { initialRolePermissions } from './data/permissions';
import { calculateTotal } from './utils/helpers';
import { ChevronRightIcon } from './components/icons/Icons';
import { TopProgressBar } from './components/TopProgressBar';


// --- NEW COMPONENT: SocialPage ---
const SocialPage: React.FC<{ language: Language, restaurantInfo: RestaurantInfo }> = ({ language, restaurantInfo }) => {
    const t = useTranslations(language);
    const visibleLinks = restaurantInfo.socialLinks.filter(link => link.isVisible);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950 p-4 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-950">
            {/* Main content card with glassmorphism effect */}
            <div className="w-full max-w-md mx-auto text-center animate-fade-in-up bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/30 dark:border-slate-800">
                
                {/* Header section */}
                <img src={restaurantInfo.logo} alt="logo" className="w-28 h-28 rounded-full mx-auto mb-4 shadow-lg border-4 border-white dark:border-slate-800" />
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">{restaurantInfo.name[language]}</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">{restaurantInfo.description[language]}</p>

                {/* Social links grid */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    {visibleLinks.map((link, index) => (
                        <a 
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center justify-center gap-2 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl border border-white/50 dark:border-slate-700/50 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <img src={link.icon} alt={`${link.name} icon`} className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110" />
                            <span className="font-semibold text-base text-slate-700 dark:text-slate-200">{link.name}</span>
                        </a>
                    ))}
                </div>

                {/* View Menu Button */}
                <div>
                    <a
                        href="#/menu"
                        onClick={(e) => handleNav(e, '/menu')}
                        className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
                    >
                        <span>{t.viewMenu}</span>
                        <ChevronRightIcon className={`w-6 h-6 transition-transform ${language === 'ar' ? 'transform -scale-x-100' : ''}`} />
                    </a>
                </div>
            </div>
        </div>
    );
};


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
  
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('restaurant_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [tags, setTags] = useState<Tag[]>(() => {
    const saved = localStorage.getItem('restaurant_tags');
    return saved ? JSON.parse(saved) : initialTags;
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
  
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(() => {
    const saved = localStorage.getItem('restaurant_info');
    return saved ? JSON.parse(saved) : initialRestaurantInfo;
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

  // Transition state
  const [transitionStage, setTransitionStage] = useState<'in' | 'out'>('in');
  const [displayedRoute, setDisplayedRoute] = useState(route);
  const [progress, setProgress] = useState(100);
  const [showProgress, setShowProgress] = useState(false);

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
    localStorage.setItem('restaurant_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('restaurant_tags', JSON.stringify(tags));
  }, [tags]);

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

  useEffect(() => {
    localStorage.setItem('restaurant_info', JSON.stringify(restaurantInfo));
  }, [restaurantInfo]);


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

    // Handle dynamic status permissions
    if (permission.startsWith('view_status_')) {
        const userPermissions = rolePermissions[currentUser.role];
        return userPermissions?.includes(permission) ?? false;
    }
    
    const userPermissions = rolePermissions[currentUser.role];
    return userPermissions?.includes(permission) ?? false;
  }, [currentUser, rolePermissions]);
  
  const updateRestaurantInfo = useCallback((updatedInfo: Partial<RestaurantInfo>) => {
    setRestaurantInfo(prev => ({...prev, ...updatedInfo}));
  }, []);

  // Auth Callbacks
  const login = useCallback((user: User) => setCurrentUser(user), []);
  const logout = useCallback(() => {
    setCurrentUser(null);
    window.location.hash = '#/'; // Redirect to home page on logout
  }, []);
  const register = useCallback((newUser: Omit<User, 'id' | 'role'>) => {
    setUsers(prev => {
      const newId = prev.length > 0 ? Math.max(...prev.map(u => u.id)) + 1 : 1;
      const userWithId: User = { ...newUser, id: newId, role: 'customer' };
      login(userWithId);
      return [...prev, userWithId];
    });
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
        timestamp: new Date().toISOString(),
        status: restaurantInfo.orderStatusColumns[0]?.id || 'pending', // Default to first status
        createdBy: currentUser?.id, // Tag order with creator's ID
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }, [currentUser, restaurantInfo.orderStatusColumns]);

  const updateOrder = useCallback((orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
  
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
  }, [orders, currentUser, hasPermission, showToast, t.permissionDenied]);


  // Admin Callbacks
  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    if (!hasPermission('manage_menu')) {
        showToast(t.permissionDenied);
        return;
    }
    setProducts(prev => {
        const newProduct: Product = {
            ...productData,
            id: prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1,
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
    const isProductInUse = promotions.some(p => p.productId === productId);
    if (isProductInUse) {
        showToast(t.deleteProductError);
        return;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, [hasPermission, showToast, t.permissionDenied, promotions, t.deleteProductError]);

  const addPromotion = useCallback((promotionData: Omit<Promotion, 'id'>) => {
    if (!hasPermission('manage_promotions')) {
        showToast(t.permissionDenied);
        return;
    }
    setPromotions(prev => {
        const newPromotion: Promotion = {
            ...promotionData,
            id: prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1,
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
        const newUser: User = { 
          ...userData, 
          id: prev.length > 0 ? Math.max(...prev.map(u => u.id)) + 1 : 1,
        };
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
    const isUserInUse = orders.some(o => o.customer.userId === userId || o.createdBy === userId);
    if (isUserInUse) {
        showToast(t.deleteUserError);
        return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, [hasPermission, showToast, t.permissionDenied, orders, t.deleteUserError]);
  
  const updateRolePermissions = useCallback((role: UserRole, permissions: Permission[]) => {
    if (!hasPermission('manage_roles')) {
        showToast(t.permissionDenied);
        return;
    }
    setRolePermissions(prev => ({...prev, [role]: permissions}));
  }, [hasPermission, showToast, t.permissionDenied]);

  const addCategory = useCallback((categoryData: Omit<Category, 'id'>) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    setCategories(prev => {
        const newCategory: Category = { 
            ...categoryData, 
            id: prev.length > 0 ? Math.max(...prev.map(c => c.id)) + 1 : 1 
        };
        return [newCategory, ...prev];
    });
  }, [hasPermission, showToast, t.permissionDenied]);

  const updateCategory = useCallback((updatedCategory: Category) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  }, [hasPermission, showToast, t.permissionDenied]);

  const deleteCategory = useCallback((categoryId: number) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    const isCategoryInUse = products.some(p => p.categoryId === categoryId);
    if (isCategoryInUse) {
        showToast(t.deleteCategoryError);
        return;
    }
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  }, [hasPermission, showToast, t.permissionDenied, products, t.deleteCategoryError]);

  const addTag = useCallback((tagData: Tag) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    if (tags.some(tag => tag.id === tagData.id)) {
        showToast(t.addTagError);
        return;
    }
    setTags(prev => [tagData, ...prev]);
  }, [hasPermission, showToast, t.permissionDenied, tags, t.addTagError]);

  const updateTag = useCallback((updatedTag: Tag) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    setTags(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t));
  }, [hasPermission, showToast, t.permissionDenied]);

  const deleteTag = useCallback((tagId: string) => {
    if (!hasPermission('manage_classifications')) { showToast(t.permissionDenied); return; }
    setTags(prev => prev.filter(t => t.id !== tagId));
  }, [hasPermission, showToast, t.permissionDenied]);

  // Order Status Columns Callbacks
    const addOrderStatusColumn = useCallback((column: OrderStatusColumn) => {
        if (!hasPermission('manage_roles')) { showToast(t.permissionDenied); return; }
        
        // Add column to restaurant info
        updateRestaurantInfo({ orderStatusColumns: [...restaurantInfo.orderStatusColumns, column] });

        // Add new permission to superAdmin role
        const newPermission: Permission = `view_status_${column.id}`;
        setRolePermissions(prev => {
            const newPerms = { ...prev };
            newPerms.superAdmin = [...newPerms.superAdmin, newPermission];
            return newPerms;
        });
    }, [hasPermission, showToast, t.permissionDenied, updateRestaurantInfo, restaurantInfo.orderStatusColumns]);

    const updateOrderStatusColumn = useCallback((updatedColumn: OrderStatusColumn) => {
        if (!hasPermission('manage_roles')) { showToast(t.permissionDenied); return; }
        const updatedColumns = restaurantInfo.orderStatusColumns.map(c => c.id === updatedColumn.id ? updatedColumn : c);
        updateRestaurantInfo({ orderStatusColumns: updatedColumns });
    }, [hasPermission, showToast, t.permissionDenied, updateRestaurantInfo, restaurantInfo.orderStatusColumns]);

    const deleteOrderStatusColumn = useCallback((columnId: string) => {
        if (!hasPermission('manage_roles')) { showToast(t.permissionDenied); return; }

        if (orders.some(order => order.status === columnId)) {
            showToast(t.deleteStatusError);
            return;
        }

        // Remove column from restaurant info
        const updatedColumns = restaurantInfo.orderStatusColumns.filter(c => c.id !== columnId);
        updateRestaurantInfo({ orderStatusColumns: updatedColumns });

        // Remove permission from all roles
        const permissionToRemove: Permission = `view_status_${columnId}`;
        setRolePermissions(prev => {
            const newPerms = { ...prev };
            for (const role in newPerms) {
                newPerms[role as UserRole] = newPerms[role as UserRole].filter(p => p !== permissionToRemove);
            }
            return newPerms;
        });
    }, [hasPermission, showToast, t.permissionDenied, t.deleteStatusError, orders, updateRestaurantInfo, restaurantInfo.orderStatusColumns]);


  // Router
  const renderContent = () => {
    if (displayedRoute.startsWith('#/login')) {
      return currentUser ? null : <LoginPage language={language} users={users} login={login} />;
    }
    if (displayedRoute.startsWith('#/register')) {
      return currentUser ? null : <RegisterPage language={language} register={register} />;
    }
    if (displayedRoute.startsWith('#/admin')) {
      return isAdmin ? (
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
            addOrderStatusColumn={addOrderStatusColumn}
            updateOrderStatusColumn={updateOrderStatusColumn}
            deleteOrderStatusColumn={deleteOrderStatusColumn}
            setProgress={setProgress}
            setShowProgress={setShowProgress}
        />
      ) : null;
    }
    if (displayedRoute.startsWith('#/profile')) {
       return currentUser?.role === 'customer' ? <ProfilePage language={language} currentUser={currentUser} orders={orders} logout={logout} restaurantInfo={restaurantInfo} updateOrder={updateOrder}/> : null;
    }

    if (displayedRoute.startsWith('#/social')) {
      return <SocialPage language={language} restaurantInfo={restaurantInfo} />;
    }

    const menuPageComponent = (
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
      />
    );
    
    if (displayedRoute.startsWith('#/menu')) {
        return menuPageComponent;
    }

    if (displayedRoute === '#/' || displayedRoute === '') {
        if (restaurantInfo.defaultPage === 'social') {
            return <SocialPage language={language} restaurantInfo={restaurantInfo} />;
        }
    }

    return menuPageComponent;
  };

  return (
    <div className={`min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-gray-200 transition-colors duration-300 ${language === 'ar' ? 'font-cairo' : 'font-sans'}`}>
      <TopProgressBar progress={progress} show={showProgress} />
      <div 
        className={`transition-all duration-300 ease-in-out ${
            transitionStage === 'out' 
                ? 'opacity-0 -translate-y-5' 
                : 'opacity-100 translate-y-0'
        }`}
      >
        {renderContent()}
      </div>
      <ToastNotification message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
};

export default App;