
import React, { createContext, useState, useCallback, useContext } from 'react';
import type { Treasury, TreasuryTransaction } from '../types';
import { APP_CONFIG } from '../utils/config';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';

interface TreasuryContextType {
    treasuries: Treasury[];
    transactions: TreasuryTransaction[];
    isTreasuryLoading: boolean;
    fetchTreasuryData: (filters?: any) => Promise<void>;
    addManualTransaction: (data: {
        treasury_id: number;
        transaction_type: 'deposit' | 'withdrawal';
        amount: number;
        description?: string;
    }) => Promise<boolean>;
}

const TreasuryContext = createContext<TreasuryContextType | undefined>(undefined);

export const TreasuryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsProcessing, showToast, t } = useUI();
    const { currentUser } = useAuth();
    
    const [treasuries, setTreasuries] = useState<Treasury[]>([]);
    const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
    const [isTreasuryLoading, setIsTreasuryLoading] = useState(true);

    const fetchTreasuryData = useCallback(async (filters: any = {}) => {
        setIsTreasuryLoading(true);
        try {
            const params = new URLSearchParams(filters).toString();
            const transactionsUrl = `${APP_CONFIG.API_BASE_URL}get_treasury_transactions.php?${params}`;

            const [statusRes, transactionsRes] = await Promise.all([
                fetch(`${APP_CONFIG.API_BASE_URL}get_treasury_status.php`),
                fetch(transactionsUrl)
            ]);
            
            if (statusRes.ok) {
                setTreasuries(await statusRes.json() || []);
            }
            if (transactionsRes.ok) {
                setTransactions(await transactionsRes.json() || []);
            }
        } catch (e) {
            console.error("Failed to fetch treasury data:", e);
            showToast(t.dataRefreshFailed);
        } finally {
            setIsTreasuryLoading(false);
        }
    }, [showToast, t.dataRefreshFailed]);

    const addManualTransaction = useCallback(async (data: {
        treasury_id: number;
        transaction_type: 'deposit' | 'withdrawal';
        amount: number;
        description?: string;
    }): Promise<boolean> => {
        if (!currentUser) return false;
        setIsProcessing(true);
        try {
            const payload = { ...data, user_id: currentUser.id };
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_manual_transaction.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || t.transactionAddFailed);
            }
            showToast(t.transactionAddedSuccess);
            await fetchTreasuryData(); // Refetch data after adding
            return true;
        } catch (error: any) {
            showToast(error.message || t.transactionAddFailed);
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [currentUser, setIsProcessing, showToast, t, fetchTreasuryData]);

    const value: TreasuryContextType = {
        treasuries,
        transactions,
        isTreasuryLoading,
        fetchTreasuryData,
        addManualTransaction
    };
    
    return <TreasuryContext.Provider value={value}>{children}</TreasuryContext.Provider>;
};

export const useTreasury = () => {
    const context = useContext(TreasuryContext);
    if (context === undefined) {
        throw new Error('useTreasury must be used within a TreasuryProvider');
    }
    return context;
};
