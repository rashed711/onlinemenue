import React, { useSyncExternalStore, useMemo, useEffect, lazy, Suspense } from 'react';
import { UIProvider, useUI } from './contexts/UIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { CartProvider } from './contexts/CartContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { APP_CONFIG } from './utils/config';

// Lazy load page components for better performance
const MenuPage = lazy(() => import('./components/MenuPage').then(module => ({ default: module.MenuPage })));
const LoginPage = lazy(() => import('./components/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage').then(module => ({ default: module.ProfilePage })));
const AdminPage = lazy(() => import('./components/admin/AdminPage').then(module => ({ default: module.AdminPage })));
const SocialPage = lazy(() => import('./components/SocialPage').then(module => ({ default: module.SocialPage })));
const CheckoutPage = lazy(() => import('./components/checkout/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const ForgotPasswordPage = lazy(() => import('./components/auth/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ActionHandlerPage = lazy(() => import('./components/auth/ActionHandlerPage').then(module => ({ default: module.ActionHandlerPage })));

// Non-page components can be imported directly
import { CompleteProfileModal } from './components/auth/CompleteProfileModal';
import { ToastNotification } from './components/ToastNotification';
import { TopProgressBar } from './components/TopProgressBar';
import { ChangePasswordModal } from './components/profile/ChangePasswordModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DeactivatedScreen } from './components/DeactivatedScreen';


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

const AppContent: React.FC = () => {
  const {
    language,
    toast,
    showToast,
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen,
    isLoading,
    isProcessing,
    transitionStage,
    progress,
    showProgress
  } = useUI();
  const { currentUser, roles, isCompletingProfile } = useAuth();
  const { restaurantInfo } = useData();
  const { users, resetUserPassword } = useAdmin();

  // Routing State
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => '');
  const displayedRoute = useMemo(() => hash || (restaurantInfo?.defaultPage === 'social' ? '#/social' : '#/'), [hash, restaurantInfo]);

  // Set document title dynamically from config
  useEffect(() => {
    document.title = restaurantInfo ? restaurantInfo.name[language] : APP_CONFIG.APP_NAME[language];
  }, [language, restaurantInfo]);



  const renderPage = () => {
    const routeParts = displayedRoute.split('?')[0].split('/');
    const baseRoute = routeParts.slice(0, 3).join('/'); // #/admin/reports

    if (isLoading || !restaurantInfo) {
      return <LoadingOverlay isVisible={true} />;
    }
    
    // System Activation Check Logic
    const isDeactivated = restaurantInfo.activationEndDate && new Date() > new Date(restaurantInfo.activationEndDate);
    const superAdminRole = roles.find(r => r.name.en.toLowerCase() === 'superadmin');
    const isSuperAdmin = currentUser?.role === superAdminRole?.key;

    // A super admin can access any admin page even if deactivated. Anyone can access login.
    const canBypassDeactivation = 
        (isSuperAdmin && baseRoute.startsWith('#/admin')) || 
        baseRoute.startsWith('#/login');

    if (isDeactivated && !canBypassDeactivation) {
        return <DeactivatedScreen />;
    }

    if (baseRoute.startsWith('#/admin')) {
        const adminSubRoute = routeParts[2] || 'orders';
        const reportSubRoute = routeParts[3] || 'dashboard'; // For /reports/dashboard etc.
        return <AdminPage activeSubRoute={adminSubRoute} reportSubRoute={reportSubRoute} />;
    }
    if (baseRoute.startsWith('#/login')) return <LoginPage />;
    if (baseRoute.startsWith('#/forgot-password')) return <ForgotPasswordPage />;
    if (baseRoute.startsWith('#/profile')) return <ProfilePage />;
    if (baseRoute.startsWith('#/checkout')) return <CheckoutPage />;
    if (baseRoute.startsWith('#/social')) return <SocialPage />;
    if (baseRoute.startsWith('#/action')) return <ActionHandlerPage />;
    
    // Fallback to menu page
    return <MenuPage />;
  };
  
  return (
     <>
      <TopProgressBar progress={progress} show={showProgress} />
      <div className={`transition-opacity duration-300 ${transitionStage === 'in' ? 'opacity-100' : 'opacity-0'}`}>
        <Suspense fallback={<LoadingOverlay isVisible={true} />}>
          {renderPage()}
        </Suspense>
      </div>
      <ToastNotification message={toast.message} isVisible={toast.isVisible} />
      <LoadingOverlay isVisible={isProcessing && !isLoading} />
      {isChangePasswordModalOpen && currentUser && (
          <ChangePasswordModal
              onClose={() => setIsChangePasswordModalOpen(false)}
          />
      )}
      {isCompletingProfile && <CompleteProfileModal />}
    </>
  );
};


const App: React.FC = () => {
  return (
    <UIProvider>
      <AuthProvider>
        <DataProvider>
          <CartProvider>
            <AdminProvider>
              <AppContent />
            </AdminProvider>
          </CartProvider>
        </DataProvider>
      </AuthProvider>
    </UIProvider>
  );
};

export default App;
