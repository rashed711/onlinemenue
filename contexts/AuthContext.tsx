import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import type { User, Permission, UserRole, Role } from '../types';
import { API_BASE_URL } from '../utils/config';
import { useUI } from './UIContext';
import { 
    auth, 
    onAuthStateChanged, 
    signOut, 
    getRedirectResult, 
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    sendPasswordResetEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
    type FirebaseUser
} from '../firebase';


interface AuthContextType {
    currentUser: User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    setRolePermissions: React.Dispatch<React.SetStateAction<Record<UserRole, Permission[]>>>;
    staffLogin: (mobile: string, password: string) => Promise<string | null>;
    logout: () => void;
    
    // New Email/Password methods
    registerWithEmailPassword: (details: { name: string; mobile: string; email: string; password: string }) => Promise<string | null>;
    loginWithEmailPassword: (email: string, password: string) => Promise<string | null>;
    sendPasswordResetLink: (email: string) => Promise<string | null>;

    completeProfile: (details: { name: string, mobile: string }) => Promise<void>;
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

                const isEmailPassProvider = firebaseUser.providerData.some(p => p.providerId === 'password');
                if (isEmailPassProvider && !firebaseUser.emailVerified) {
                    showToast(t.pleaseVerifyEmail);
                    await logout();
                    if(isMounted) setIsProcessing(false);
                    return;
                }

                try {
                    const providerId = firebaseUser.providerData[0]?.providerId;
                    const isEmailBased = providerId === 'google.com' || providerId === 'password';
                    
                    const endpoint = isEmailBased ? 'get_user_by_email.php' : 'get_user_by_fid.php';
                    const body = isEmailBased ? { email: firebaseUser.email } : { firebase_uid: firebaseUser.uid };

                    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    
                    if (!response.ok && response.status !== 404) {
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
                               const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
                               if (customerRole && String(dbUser.role_id) === customerRole.key) {
                                   window.location.hash = '#/profile';
                               } else {
                                   window.location.hash = '#/admin';
                               }
                            }
                        }
                    } else if (response.status === 404 && result.error.includes("not found")) {
                        if (isMounted) {
                            setNewUserFirebaseData({
                                uid: firebaseUser.uid,
                                phoneNumber: firebaseUser.phoneNumber,
                                email: firebaseUser.email,
                                name: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                providerId: providerId
                            });
                            setIsCompletingProfile(true);
                        }
                    } else {
                        throw new Error(result.error || "An unknown backend error occurred.");
                    }
                } catch (error) {
                    console.error("Auth state change error:", error);
                    showToast(t.accountVerificationFailed);
                    if (isMounted) await logout();
                } finally {
                    if (isMounted) setIsProcessing(false);
                }
            } else {
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
    }, [roles, setIsProcessing, showToast, logout, t.pleaseVerifyEmail, t.accountVerificationFailed]);

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
            if (!response.ok || !result.success) {
                if (result.error && result.error.toLowerCase().includes('invalid credentials')) {
                    return t.invalidCredentials;
                }
                return result.error || t.invalidCredentials;
            }

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

    const registerWithEmailPassword = useCallback(async (details: { name: string; mobile: string; email: string; password: string }): Promise<string | null> => {
        setIsProcessing(true);
        try {
            // Step 1: Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, details.email, details.password);
            const firebaseUser = userCredential.user;
            await updateProfile(firebaseUser, { displayName: details.name });

            // Step 2: Create user in our backend database
            const addUserPayload = {
                name: details.name,
                mobile: details.mobile,
                email: details.email,
                firebase_uid: firebaseUser.uid,
                role: 'customer' // Explicitly set role
            };
            const addUserResponse = await fetch(`${API_BASE_URL}add_user.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addUserPayload),
            });
            const addUserResult = await addUserResponse.json();
            if (!addUserResponse.ok || !addUserResult.success) {
                // If backend creation fails, we should ideally delete the Firebase user to prevent orphans.
                // For now, we'll just throw the error.
                await firebaseUser.delete(); // Attempt to clean up Firebase user
                throw new Error(addUserResult.error || "Failed to create user profile in database.");
            }

            // Step 3: Send verification email and sign out
            await sendEmailVerification(firebaseUser);
            await signOut(auth); // Log out until they verify
            showToast(t.emailVerificationSent);
            return null;
        } catch (error: any) {
            console.error("Email registration error:", error);
            if (error.code === 'auth/network-request-failed') {
                return t.networkRequestFailed;
            }
            return error.message || "Registration failed.";
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, showToast, t.emailVerificationSent, t.networkRequestFailed]);
    
    const loginWithEmailPassword = useCallback(async (email: string, password: string): Promise<string | null> => {
        setIsProcessing(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return null; // onAuthStateChanged will handle the rest
        } catch (error: any) {
            console.error("Email login error:", error);
            if (error.code === 'auth/network-request-failed') {
                return t.networkRequestFailed;
            }
            if (error.code === 'auth/invalid-credential') {
                return t.invalidCredentials;
            }
            return error.message || "Login failed.";
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, t.invalidCredentials, t.networkRequestFailed]);
    
    const sendPasswordResetLink = useCallback(async (email: string): Promise<string | null> => {
        setIsProcessing(true);
        try {
            await sendPasswordResetEmail(auth, email);
            return null;
        } catch (error: any) {
            console.error("Password reset error:", error);
            if (error.code === 'auth/network-request-failed') {
                return t.networkRequestFailed;
            }
            return error.message || "Failed to send reset link.";
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, t.networkRequestFailed]);


    const completeProfile = useCallback(async (details: { name: string, mobile: string }) => {
        if (!newUserFirebaseData) return;
        setIsProcessing(true);
        try {
            const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
            const payload: any = {
                name: details.name,
                mobile: details.mobile,
                role: customerRole?.key || 'customer'
            };
    
            if (newUserFirebaseData.providerId === 'google.com') {
                payload.google_id = newUserFirebaseData.uid;
                payload.email = newUserFirebaseData.email;
                payload.profile_picture = newUserFirebaseData.photoURL;
            } else { // phone or email
                payload.firebase_uid = newUserFirebaseData.uid;
                payload.email = newUserFirebaseData.email;
            }
            
            const response = await fetch(`${API_BASE_URL}add_user.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to create profile.');
            }
            
            // Manually log the user in with the data returned from the backend
            const dbUser = result.user;
            const profilePictureUrl = resolveImageUrl(dbUser.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${(dbUser.name || 'U').charAt(0).toUpperCase()}`;
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
            setNewUserFirebaseData(null);
    
            // Redirect if they are on the login page
            if (window.location.hash.startsWith('#/login')) {
               window.location.hash = '#/';
            }
            
        } catch (error: any) {
            showToast(error.message || t.profileSaveFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [newUserFirebaseData, setIsProcessing, showToast, setCurrentUser, roles, t.profileSaveFailed]);

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
            showToast(t.profileUpdateFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [currentUser, showToast, t.profileUpdatedSuccess, t.profileUpdateFailed, setIsProcessing]);

    const changeCurrentUserPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<string | null> => {
        if (!currentUser) return 'No user logged in.';
        setIsProcessing(true);

        const firebaseUser: FirebaseUser | null = auth.currentUser;

        // Check if it's a customer (Firebase user with an email provider)
        if (firebaseUser && firebaseUser.email && (currentUser.firebase_uid || currentUser.google_id)) {
            try {
                const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
                await reauthenticateWithCredential(firebaseUser, credential);
                await updatePassword(firebaseUser, newPassword);
                showToast(t.passwordChangedSuccess);
                return null;
            } catch (error: any) {
                console.error("Firebase password change error:", error);
                 if (error.code === 'auth/network-request-failed') {
                    return t.networkRequestFailed;
                }
                if (error.code === 'auth/wrong-password') {
                    return t.incorrectCurrentPassword;
                }
                return error.message || 'Failed to change password.';
            } finally {
                setIsProcessing(false);
            }
        } else {
            // Staff flow (local database)
            try {
                const verifyResponse = await fetch(`${API_BASE_URL}login.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile: currentUser.mobile, password: currentPassword })
                });

                const verifyResult = await verifyResponse.json();
                if (!verifyResponse.ok || !verifyResult.success) {
                    return t.incorrectCurrentPassword;
                }

                const updateResponse = await fetch(`${API_BASE_URL}update_user.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: currentUser.id, password: newPassword })
                });
                
                const updateResult = await updateResponse.json();
                if (!updateResponse.ok || !updateResult.success) {
                    throw new Error(updateResult.error || 'Failed to change password.');
                }
                
                showToast(t.passwordChangedSuccess);
                return null;
            } catch (error: any) {
                return error.message || 'Failed to change password.';
            } finally {
                setIsProcessing(false);
            }
        }
    }, [currentUser, setIsProcessing, showToast, t.passwordChangedSuccess, t.incorrectCurrentPassword, t.networkRequestFailed]);

    const value: AuthContextType = {
        currentUser,
        setCurrentUser,
        setRolePermissions,
        staffLogin,
        logout,
        registerWithEmailPassword,
        loginWithEmailPassword,
        sendPasswordResetLink,
        completeProfile,
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