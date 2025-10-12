import React, { useSyncExternalStore, useMemo } from 'react';
import { UIProvider, useUI } from './contexts/UIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { CartProvider } from './contexts/CartContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';

import { MenuPage } from './components/MenuPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminPage } from './components/admin/AdminPage';
import { SocialPage } from './components/SocialPage';
import { CheckoutPage } from './components/checkout/CheckoutPage';
import { ToastNotification } from './components/ToastNotification';
import { TopProgressBar } from './components/TopProgressBar';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
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
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen,
    isLoading,
    isProcessing,
    transitionStage,
    progress,
    showProgress
  } = useUI();
  const { currentUser, roles } = useAuth();
  const { restaurantInfo } = useData();
  const { users, resetUserPassword } = useAdmin();

  // Routing State
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => '');
  const displayedRoute = useMemo(() => hash || (restaurantInfo?.defaultPage === 'social' ? '#/social' : '#/'), [hash, restaurantInfo]);

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

    // A super admin can access settings even if deactivated. Anyone can access login.
    const canBypassDeactivation = 
        (isSuperAdmin && baseRoute.startsWith('#/admin/settings')) || 
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
    if (baseRoute.startsWith('#/register')) return <RegisterPage />;
    if (baseRoute.startsWith('#/forgot-password')) return <ForgotPasswordPage language={language} users={users} onPasswordReset={resetUserPassword} />;
    if (baseRoute.startsWith('#/profile')) return <ProfilePage />;
    if (baseRoute.startsWith('#/checkout')) return <CheckoutPage />;
    if (baseRoute.startsWith('#/social')) return <SocialPage />;
    
    // Fallback to menu page
    return <MenuPage />;
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
              onClose={() => setIsChangePasswordModalOpen(false)}
          />
      )}
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