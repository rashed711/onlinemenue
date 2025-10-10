import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import type { User, Permission, UserRole, Role } from '../types';
import { API_BASE_URL } from '../utils/config';
import { useUI } from './UIContext';

interface AuthContextType {
    currentUser: User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    login: (mobile: string, password: string) => Promise<string | null>;
    logout: () => void;
    register: (newUserData: Omit<User, 'id' | 'role' | 'profilePicture'>) => Promise<string | null>;
    updateUserProfile: (userId: number, updates: { name?: string; profilePicture?: string }) => Promise<void>;
    changeCurrentUserPassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
    hasPermission: (permission: Permission) => boolean;
    isAdmin: boolean;
    roles: Role[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const resolveImageUrl = (path: string | undefined): string => {
  if (!path || path.startsWith('http') || path.startsWith('data:')) {
    return path || '';
  }
  const domain = new URL(API_BASE_URL).origin;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${domain}/${cleanPath}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsProcessing, showToast, t } = useUI();
    
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const savedUser = sessionStorage.getItem('restaurant_currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>({});

    useEffect(() => {
        const fetchBaseAuthData = async () => {
             try {
                const [rolesResponse, permissionsResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}get_roles.php`, { cache: 'no-cache' }),
                    fetch(`${API_BASE_URL}get_permissions.php`, { cache: 'no-cache' })
                ]);
                if (rolesResponse.ok) setRoles(await rolesResponse.json() || []);
                if (permissionsResponse.ok) setRolePermissions(await permissionsResponse.json() || {});
             } catch (e) { console.error("Failed to fetch base auth data", e); }
        };
        fetchBaseAuthData();
    }, []);

    useEffect(() => {
      if (currentUser) sessionStorage.setItem('restaurant_currentUser', JSON.stringify(currentUser));
      else sessionStorage.removeItem('restaurant_currentUser');
    }, [currentUser]);

    const userRoleDetails = useMemo(() => roles.find(r => r.key === currentUser?.role), [roles, currentUser]);
    
    const isAdmin = useMemo(() => {
        if (!userRoleDetails) return false;
        const roleName = userRoleDetails.name.en.toLowerCase();
        return roleName !== 'customer';
    }, [userRoleDetails]);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!currentUser || !userRoleDetails) return false;
        if (userRoleDetails.name.en.toLowerCase() === 'superadmin') return true;
        const userPermissions = rolePermissions[currentUser.role] ?? [];
        return userPermissions.includes(permission);
    }, [currentUser, rolePermissions, userRoleDetails]);

    const login = useCallback(async (mobile: string, password: string): Promise<string | null> => {
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}login.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile, password }) });
            const result = await response.json();
            if (!response.ok) return result.error || t.invalidCredentials;

            const dbUser = result;
            const roleFromApi = String(dbUser.role_id || '9');
            const profilePictureUrl = resolveImageUrl(dbUser.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${(dbUser.name || 'U').charAt(0).toUpperCase()}`;

            setCurrentUser({ id: Number(dbUser.id), name: dbUser.name, mobile: dbUser.mobile, password: '', role: roleFromApi, profilePicture: profilePictureUrl });
            return null;
        } catch (error) {
            console.error('Login error:', error);
            return t.invalidCredentials;
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, t.invalidCredentials]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        window.location.hash = '#/';
    }, []);

    const register = useCallback(async (newUserData: Omit<User, 'id' | 'role' | 'profilePicture'>): Promise<string | null> => {
        setIsProcessing(true);
        try {
            const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
            const payload = { ...newUserData, role: customerRole?.key };
            const response = await fetch(`${API_BASE_URL}add_user.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Failed to register.');

            const dbUser = result.user;
            const profilePictureUrl = resolveImageUrl(dbUser.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${(dbUser.name || 'U').charAt(0).toUpperCase()}`;
            setCurrentUser({ id: Number(dbUser.id), name: dbUser.name, mobile: dbUser.mobile, password: '', role: customerRole?.key || '9', profilePicture: profilePictureUrl });
            return null;
        } catch (error: any) {
            return error.message || 'Registration failed.';
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, roles]);

    const updateUserProfile = useCallback(async (userId: number, updates: { name?: string; profilePicture?: string }) => {
        if (!currentUser || currentUser.id !== userId) return;
        setIsProcessing(true);
        try {
            let dbPayload: any = { id: userId };
            let uiUpdates: Partial<User> = {};

            if (updates.profilePicture && updates.profilePicture.startsWith('data:image')) {
                const response = await fetch(updates.profilePicture);
                const blob = await response.blob();
                const formData = new FormData();
                formData.append('image', blob, 'profile.png');
                formData.append('type', 'users');
                formData.append('userId', userId.toString());
                const uploadRes = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error(`Image upload failed: ${await uploadRes.text()}`);
                const result = await uploadRes.json();
                if (result.success && result.url) {
                    dbPayload.profile_picture = result.url;
                    uiUpdates.profilePicture = resolveImageUrl(result.url);
                } else throw new Error(result.error || 'Failed to get URL');
            }

            if (updates.name && updates.name !== currentUser.name) {
                dbPayload.name = updates.name;
                uiUpdates.name = updates.name;
            }

            if (Object.keys(dbPayload).length > 1) {
                const updateResponse = await fetch(`${API_BASE_URL}update_user.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dbPayload) });
                if (!updateResponse.ok) throw new Error('Failed to update user profile.');
            }

            setCurrentUser(prev => prev ? { ...prev, ...uiUpdates } : null);
            showToast(t.profileUpdatedSuccess);
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast('Failed to update profile.');
        } finally {
            setIsProcessing(false);
        }
    }, [currentUser, showToast, t.profileUpdatedSuccess, setIsProcessing]);

    const changeCurrentUserPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<string | null> => {
      if (!currentUser) return 'No user logged in.';
      setIsProcessing(true);
      try {
        const verifyResponse = await fetch(`${API_BASE_URL}login.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile: currentUser.mobile, password: currentPassword }) });
        if (!verifyResponse.ok) return t.incorrectCurrentPassword;
        const updateResponse = await fetch(`${API_BASE_URL}update_user.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: currentUser.id, password: newPassword }) });
        const result = await updateResponse.json();
        if (!updateResponse.ok || !result.success) throw new Error(result.error || 'Failed to change password.');
        showToast(t.passwordChangedSuccess);
        return null;
      } catch (error: any) {
          return error.message || 'Failed to change password.';
      } finally {
          setIsProcessing(false);
      }
    }, [currentUser, showToast, t.incorrectCurrentPassword, t.passwordChangedSuccess, setIsProcessing]);

    const value: AuthContextType = {
        currentUser,
        setCurrentUser,
        login,
        logout,
        register,
        updateUserProfile,
        changeCurrentUserPassword,
        hasPermission,
        isAdmin,
        roles,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};