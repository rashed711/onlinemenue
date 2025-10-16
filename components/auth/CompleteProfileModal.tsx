import React, { useState, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../Modal';

export const CompleteProfileModal: React.FC = () => {
    const { t, isProcessing } = useUI();
    const { completeProfile, newUserFirebaseData } = useAuth();
    
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');

    useEffect(() => {
        if (newUserFirebaseData?.name) {
            setName(newUserFirebaseData.name);
        }
        if (newUserFirebaseData?.phoneNumber) {
            setMobile(newUserFirebaseData.phoneNumber);
        }
    }, [newUserFirebaseData]);
    
    const isGoogleSignIn = newUserFirebaseData?.providerId === 'google.com';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && mobile.trim()) {
            completeProfile({ name: name.trim(), mobile: mobile.trim() });
        }
    };

    return (
        <Modal 
            title={t.language === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete Your Profile'} 
            onClose={() => { /* Prevent closing */ }} 
            size="sm"
        >
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                 <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                    {t.language === 'ar' ? 'مرحباً بك! نحتاج بعض المعلومات الإضافية.' : 'Welcome! We just need a little more info.'}
                </p>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">{t.fullName}</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                        autoFocus
                    />
                </div>

                {isGoogleSignIn && (
                     <div>
                        <label htmlFor="mobile" className="block text-sm font-medium mb-1">{t.mobileNumber}</label>
                        <input
                            id="mobile"
                            type="tel"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                             className="w-full p-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="e.g. 01012345678"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">{t.language === 'ar' ? 'نحتاج رقم هاتفك لإتمام الطلبات.' : 'We need your phone number for orders.'}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isProcessing || !name.trim() || !mobile.trim()}
                    className="w-full mt-4 bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isProcessing 
                        ? (t.language === 'ar' ? 'جار الحفظ...' : 'Saving...') 
                        : (t.language === 'ar' ? 'حفظ ومتابعة' : 'Save & Continue')}
                </button>
            </form>
        </Modal>
    );
};