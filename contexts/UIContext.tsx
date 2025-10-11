import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import type { Language, Theme } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { useTranslations, translations } from '../i18n/translations';

interface UIContextType {
    language: Language;
    theme: Theme;
    toggleLanguage: () => void;
    toggleTheme: () => void;
    toast: { message: string; isVisible: boolean };
    showToast: (message: string) => void;
    isChangePasswordModalOpen: boolean;
    setIsChangePasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    isProcessing: boolean;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    t: typeof translations['en'];
    progress: number;
    setProgress: React.Dispatch<React.SetStateAction<number>>;
    showProgress: boolean;
    setShowProgress: React.Dispatch<React.SetStateAction<boolean>>;
    transitionStage: 'in' | 'out';
    setTransitionStage: React.Dispatch<React.SetStateAction<'in' | 'out'>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = usePersistentState<Language>('restaurant_language', 'ar');
    const [theme, setTheme] = usePersistentState<Theme>('restaurant_theme', 'light');
    const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Translation hook
    const t = useTranslations(language);

    // Progress Bar State
    const [progress, setProgress] = useState(100);
    const [showProgress, setShowProgress] = useState(false);

    // Page transition state
    const [transitionStage, setTransitionStage] = useState<'in' | 'out'>('in');
    
    // UI Persistence Effects
    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), [setTheme]);
    const toggleLanguage = useCallback(() => setLanguage(prev => prev === 'en' ? 'ar' : 'en'), [setLanguage]);

    const showToast = useCallback((message: string) => {
        setToast({ message, isVisible: true });
        setTimeout(() => {
            setToast(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    }, []);

    const value: UIContextType = {
        language,
        theme,
        toggleLanguage,
        toggleTheme,
        toast,
        showToast,
        isChangePasswordModalOpen,
        setIsChangePasswordModalOpen,
        isLoading,
        setIsLoading,
        isProcessing,
        setIsProcessing,
        t,
        progress,
        setProgress,
        showProgress,
        setShowProgress,
        transitionStage,
        setTransitionStage,
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};