import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import type { User, Permission, UserRole, Role } from '../types';
import { API_BASE_URL } from '../utils/config';
import { useUI } from './UIContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut, getRedirectResult, GoogleAuthProvider } from '../firebase';
import type { ConfirmationResult, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
    currentUser: User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    setRolePermissions: React.Dispatch<React.SetStateAction<Record<UserRole, Permission[]>>>;
    staffLogin: (mobile: string, password: string) => Promise<string | null>;
    register: (details: { name: string; mobile: string; password: string }) => Promise<string | null>;
    logout: () => void;
    sendOtp: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
    verifyOtp: (otp: string) => Promise<string | null>;
    completeProfile: (details: { name: string, mobile: string }) => Promise<void>;
    confirmationResult: ConfirmationResult | null;
    isCompletingProfile: boolean;
    newUserFirebaseData: { uid: string; phoneNumber: string | null; email?: string | null, name?: string | null, photoURL?: string | null, providerId: string } | null;
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
        const savedUser = localStorage.getItem('restaurant_currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>({});
    
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [isCompletingProfile, setIsCompletingProfile] = useState(false);
    const [newUserFirebaseData, setNewUserFirebaseData] = useState<{ uid: string; phoneNumber: string | null; email?: string | null, name?: string | null, photoURL?: string | null, providerId: string } | null>(null);

    useEffect(() => {
        const fetchBaseAuthData = async () => {
             try {
                const cacheBuster = `?v=${Date.now()}`;
                const [rolesResponse, permissionsResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}get_roles.php${cacheBuster}`, { cache: 'no-cache' }),
                    fetch(`${API_BASE_URL}get_permissions.php${cacheBuster}`, { cache: 'no-cache' })
                ]);
                if (rolesResponse.ok) setRoles(await rolesResponse.json() || []);
                if (permissionsResponse.ok) setRolePermissions(await permissionsResponse.json() || {});
             } catch (e) { console.error("Failed to fetch base auth data", e); }
        };
        fetchBaseAuthData();
    }, []);

    useEffect(() => {
      if (currentUser) localStorage.setItem('restaurant_currentUser', JSON.stringify(currentUser));
      else localStorage.removeItem('restaurant_currentUser');
    }, [currentUser]);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out from Firebase:", error);
        }
        setConfirmationResult(null);
        setCurrentUser(null);
        window.location.hash = '#/';
    }, []);

     useEffect(() => {
        let isMounted = true;
        
        getRedirectResult(auth)
            .then(result => {
                if (result && isMounted) {
                    setIsProcessing(true);
                }
            })
            .catch(error => {
                console.error("Google Sign-In Redirect Error", error);
                if (isMounted) {
                    showToast(`Google Sign-In Error: ${error.message}`);
                    setIsProcessing(false);
                }
            });

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!isMounted) return;
            
            if (roles.length === 0 && firebaseUser) {
                setIsProcessing(true);
                return;
            }

            if (firebaseUser) {
                setIsProcessing(true);
                try {
                    const isGoogle = firebaseUser.providerData[0]?.providerId === 'google.com';
                    const endpoint = isGoogle ? 'get_user_by_email.php' : 'get_user_by_fid.php';
                    const body = isGoogle ? { email: firebaseUser.email } : { firebase_uid: firebaseUser.uid };

                    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Server connection failed: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    if (result.success && result.user) {
                        const dbUser = result.user;
                        const profilePictureUrl = resolveImageUrl(dbUser.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${(dbUser.name || 'U').charAt(0).toUpperCase()}`;
                        if(isMounted) {
                            setCurrentUser({ 
                                id: Number(dbUser.id), 
                                name: dbUser.name, 
                                mobile: dbUser.mobile, 
                                email: dbUser.email,
                                password: '', 
                                role: String(dbUser.role_id), 
                                profilePicture: profilePictureUrl,
                                firebase_uid: dbUser.firebase_uid,
                                google_id: dbUser.google_id
                            });
                            setIsCompletingProfile(false);
                            if (window.location.hash.startsWith('#/login')) {
                               window.location.hash = '#/';
                            }
                        }
                    } else if (result.success === false && result.error.includes("not found")) {
                         // User exists in Firebase but not in our DB -> complete profile
                        if (isMounted) {
                            setNewUserFirebaseData({
                                uid: firebaseUser.uid,
                                phoneNumber: firebaseUser.phoneNumber,
                                email: firebaseUser.email,
                                name: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                providerId: firebaseUser.providerData[0]?.providerId
                            });
                            setIsCompletingProfile(true);
                        }
                    } else {
                        // Other backend error
                        throw new Error(result.error || "An unknown backend error occurred.");
                    }
                } catch (error) {
                    console.error("Auth state change error:", error);
                    // Instead of silent logout, show an error to the user.
                    // This prevents the confusing login loop.
                    showToast(t.language === 'ar' ? 'فشل التحقق من الحساب مع الخادم. يرجى المحاولة مرة أخرى.' : 'Could not verify account with server. Please try again.');
                    if (isMounted) await logout();
                } finally {
                    if (isMounted) setIsProcessing(false);
                }
            } else {
                // User is signed out from Firebase.
                setCurrentUser(prevUser => {
                    if (!prevUser) return null;
                    if (prevUser.firebase_uid || prevUser.google_id) {
                        return null; 
                    }
                    return prevUser;
                });
                if(isMounted) setIsProcessing(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [roles, setIsProcessing, showToast, logout, t.language]);

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

    const staffLogin = useCallback(async (mobile: string, password: string): Promise<string | null> => {
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}login.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile, password }) });
            const result = await response.json();
            if (!response.ok || !result.success) return result.error || t.invalidCredentials;

            const dbUser = result.user;
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

    const register = useCallback(async (details: { name: string; mobile: string; password: string }): Promise<string | null> => {
        setIsProcessing(true);
        try {
            const payload = { ...details, role: 'Customer' };
            const response = await fetch(`${API_BASE_URL}add_user.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Registration failed.');
            
            const dbUser = result.user;
            const profilePictureUrl = resolveImageUrl(dbUser.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${(dbUser.name || 'U').charAt(0).toUpperCase()}`;
            setCurrentUser({ id: Number(dbUser.id), name: dbUser.name, mobile: dbUser.mobile, password: '', role: String(dbUser.role_id), profilePicture: profilePictureUrl });
            return null;
        } catch (error: any) {
            return error.message || "An unknown error occurred.";
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing]);
    
    const sendOtp = useCallback(async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
        setIsProcessing(true);
    
        const timeoutPromise = new Promise<ConfirmationResult>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out.')), 10000)
        );
    
        try {
            if ((window as any).recaptchaVerifier) {
                (window as any).recaptchaVerifier.clear();
                const recaptchaContainer = document.getElementById('recaptcha-container');
                if (recaptchaContainer) {
                    recaptchaContainer.innerHTML = '';
                }
            }
    
            const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });
            (window as any).recaptchaVerifier = verifier;
    
            const confirmation = await Promise.race([
                signInWithPhoneNumber(auth, phoneNumber, verifier),
                timeoutPromise
            ]);
    
            setConfirmationResult(confirmation);
            return { success: true };
        } catch (error: any) {
            console.error("Firebase OTP send error:", error);
            if ((window as any).recaptchaVerifier) {
                (window as any).recaptchaVerifier.clear();
            }
    
            let errorMessage = error.message;
            if (error.message === 'Request timed out.') {
                errorMessage = t.language === 'ar' 
                    ? 'انتهت مهلة الطلب. قد تكون بيئة التشغيل تمنع التحقق (reCAPTCHA). جرب على موقعك المباشر.'
                    : 'Request timed out. The environment may be blocking reCAPTCHA. Please try on your live site.';
            } else if (error.code === 'auth/invalid-phone-number') {
                errorMessage = t.language === 'ar' 
                    ? 'رقم الهاتف غير صالح. يرجى التأكد من تضمين رمز البلد (مثال: +201012345678).' 
                    : 'Invalid phone number format. Please ensure you include the country code (e.g., +201012345678).';
            } else if (error.code === 'auth/internal-error') {
                errorMessage = t.language === 'ar'
                    ? 'حدث خطأ داخلي في Firebase. يرجى التأكد من تفعيل "تسجيل الدخول بالهاتف" في لوحة تحكم Firebase وأن نطاق الموقع مُصرح به.'
                    : 'A Firebase internal error occurred. Please ensure Phone Number Sign-in is enabled in your Firebase console and the website domain is authorized.';
            }
            
            return { success: false, error: errorMessage };
        } finally {
            setIsProcessing(false);
        }
    }, [setConfirmationResult, setIsProcessing, t.language]);

    const verifyOtp = useCallback(async (otp: string): Promise<string | null> => {
        if (!confirmationResult) return "No confirmation result. Please try again.";
        setIsProcessing(true);
        try {
            await confirmationResult.confirm(otp);
            return null;
        } catch (error: any) {
            console.error("Firebase OTP verify error:", error);
            return error.message || "Invalid OTP or request expired.";
        } finally {
            setIsProcessing(false);
        }
    }, [confirmationResult, setIsProcessing]);

    const completeProfile = useCallback(async (details: { name: string, mobile: string }) => {
        if (!newUserFirebaseData) return;
        setIsProcessing(true);
        try {
            const payload: any = {
                name: details.name,
                mobile: details.mobile,
                role: 'Customer'
            };

            if (newUserFirebaseData.providerId === 'google.com') {
                payload.google_id = newUserFirebaseData.uid;
                payload.email = newUserFirebaseData.email;
                payload.profile_picture = newUserFirebaseData.photoURL;
            } else { // phone
                payload.firebase_uid = newUserFirebaseData.uid;
            }
            
            const response = await fetch(`${API_BASE_URL}add_user.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to create profile.');
            
            setIsCompletingProfile(false);
            setNewUserFirebaseData(null);
            
        } catch (error: any) {
            showToast(error.message || 'Failed to save profile.');
        } finally {
            setIsProcessing(false);
        }
    }, [newUserFirebaseData, setIsProcessing, showToast]);

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
                    dbPayload.profile_picture = result.url.split('?v=')[0];
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
        setRolePermissions,
        staffLogin,
        register,
        logout,
        sendOtp,
        verifyOtp,
        completeProfile,
        confirmationResult,
        isCompletingProfile,
        newUserFirebaseData,
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