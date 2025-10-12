import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import type { Product, Category, Tag, Promotion, RestaurantInfo, SocialLink, OnlinePaymentMethod, OrderStatusColumn, LocalizedString } from '../types';
import { restaurantInfo as fallbackRestaurantInfo, initialCategories, initialTags } from '../data/mockData';
import { API_BASE_URL } from '../utils/config';
import { useUI } from './UIContext';

interface DataContextType {
    restaurantInfo: RestaurantInfo | null;
    products: Product[];
    categories: Category[];
    tags: Tag[];
    promotions: Promotion[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
    fetchAllData: (isInitialLoad?: boolean) => Promise<void>;
    updateRestaurantInfo: (updatedInfo: Partial<RestaurantInfo>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const resolveImageUrl = (path: string | undefined): string => {
  if (!path || path.startsWith('http') || path.startsWith('data:')) {
    return path || '';
  }
  const domain = new URL(API_BASE_URL).origin;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${domain}/${cleanPath}`;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsLoading, setShowProgress, setProgress, showToast, t, setIsProcessing } = useUI();
    
    // Data State
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [promotions, setPromotions] = useState<Promotion[]>([]);

    const fetchAllData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setIsLoading(true); else { setShowProgress(true); setProgress(0); }

        try {
            let progressInterval: number | undefined;
            if (!isInitialLoad) {
                progressInterval = window.setInterval(() => setProgress(p => Math.min(p + 20, 90)), 80);
            }

            const fetchOptions = { cache: 'no-cache' as RequestCache };
            const cacheBuster = `?v=${Date.now()}`;

            const [settingsRes, classificationsRes, promotionsRes, productsRes] = await Promise.all([
                fetch(`${API_BASE_URL}get_settings.php${cacheBuster}`, fetchOptions),
                fetch(`${API_BASE_URL}get_classifications.php${cacheBuster}`, fetchOptions),
                fetch(`${API_BASE_URL}get_promotions.php${cacheBuster}`, fetchOptions),
                fetch(`${API_BASE_URL}get_products.php${cacheBuster}`, fetchOptions),
            ]);

            if (progressInterval) clearInterval(progressInterval);

            // Process responses...
            if (settingsRes.ok) {
                const data = await settingsRes.json();
                
                // Robustly handle activationEndDate from DB
                if (data.activationEndDate && typeof data.activationEndDate === 'string') {
                    if (data.activationEndDate.startsWith('0000-00-00')) {
                        data.activationEndDate = null;
                    } else {
                        const localDateString = data.activationEndDate.replace(' ', 'T');
                        const dateObj = new Date(localDateString);
                        if (!isNaN(dateObj.getTime())) {
                            data.activationEndDate = dateObj.toISOString();
                        } else {
                            console.warn("Invalid activationEndDate received from server:", data.activationEndDate);
                            data.activationEndDate = null;
                        }
                    }
                }

                // Robustly handle deactivationMessage (might be a JSON string from DB)
                if (data.deactivationMessage && typeof data.deactivationMessage === 'string') {
                    try {
                        data.deactivationMessage = JSON.parse(data.deactivationMessage);
                    } catch (e) {
                        console.error("Failed to parse deactivationMessage, treating as plain text:", e);
                        data.deactivationMessage = { en: data.deactivationMessage, ar: data.deactivationMessage };
                    }
                }
                
                data.logo = resolveImageUrl(data.logo);
                data.heroImage = resolveImageUrl(data.heroImage);
                if (data.socialLinks) data.socialLinks = data.socialLinks.map((l: SocialLink) => ({ ...l, icon: resolveImageUrl(l.icon) }));
                if (data.onlinePaymentMethods) data.onlinePaymentMethods = data.onlinePaymentMethods.map((m: OnlinePaymentMethod) => ({ ...m, icon: resolveImageUrl(m.icon) }));
                if (data.orderStatusColumns) data.orderStatusColumns = data.orderStatusColumns.map((c: OrderStatusColumn) => ({ ...c, id: String(c.id) }));
                setRestaurantInfo(data);
            } else if (isInitialLoad) throw new Error('Failed to fetch settings');

            if (classificationsRes.ok) {
                const data = await classificationsRes.json();
                setCategories(data.categories || []);
                setTags(data.tags || []);
            }
            if (promotionsRes.ok) setPromotions(await promotionsRes.json() || []);
            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts((data || []).map((p: Product) => ({ ...p, image: resolveImageUrl(p.image) })));
            }
        } catch (error) {
            console.error("Error fetching public data:", error);
            if (isInitialLoad) setRestaurantInfo(fallbackRestaurantInfo);
            else showToast("Couldn't refresh data.");
        } finally {
            if (isInitialLoad) setIsLoading(false);
            else { setProgress(100); setTimeout(() => setShowProgress(false), 500); }
        }
    }, [setIsLoading, setShowProgress, setProgress, showToast]);

    useEffect(() => {
        fetchAllData(true);
    }, []);

    const updateRestaurantInfo = useCallback(async (updatedInfo: Partial<RestaurantInfo>) => {
        if (!restaurantInfo || Object.keys(updatedInfo).length === 0) return;
        setIsProcessing(true);
        try {
            const dbPayload: { [key: string]: any } = {};
            const uiUpdates: Partial<RestaurantInfo> = {};

            const urlToStrip = new URL(API_BASE_URL).origin + '/';
            const stripUrl = (url: string) => (url && url.startsWith(urlToStrip)) ? url.replace(urlToStrip, '') : url;

            const uploadImage = async (base64: string, type: string, field: string): Promise<string | null> => {
                if (!base64 || !base64.startsWith('data:image')) return stripUrl(base64);
                const res = await fetch(base64);
                const blob = await res.blob();
                const formData = new FormData();
                formData.append('image', blob, `${field}.png`);
                formData.append('type', type);
                const uploadRes = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error(`Upload failed for ${field}: ${await uploadRes.text()}`);
                const result = await uploadRes.json();
                if (result.success && result.url) return result.url;
                throw new Error(result.error || `Failed to get URL for ${field}`);
            };

            for (const key of Object.keys(updatedInfo) as Array<keyof RestaurantInfo>) {
                const value = updatedInfo[key];

                switch (key) {
                    case 'name': case 'description': case 'heroTitle': case 'codNotes': case 'onlinePaymentNotes': case 'deactivationMessage':
                        const localizedValue = value as LocalizedString;
                        if (localizedValue) {
                           dbPayload[key] = localizedValue;
                        }
                        (uiUpdates as any)[key] = value;
                        break;
                    case 'logo': case 'heroImage':
                        const relativeUrl = await uploadImage(value as string, 'branding', key);
                        if (relativeUrl !== null) {
                            dbPayload[key] = relativeUrl;
                            (uiUpdates as any)[key] = resolveImageUrl(relativeUrl);
                        }
                        break;
                    case 'socialLinks':
                    case 'onlinePaymentMethods':
                        const items = value as any[];
                        const type = key === 'socialLinks' ? 'icons' : 'payment';
                        const processedItems = await Promise.all(
                            items.map(async (item, i) => ({ ...item, icon: await uploadImage(item.icon, type, `${key}_${i}_icon`) }))
                        );
                        dbPayload[key] = processedItems;
                        (uiUpdates as any)[key] = processedItems.map(item => ({...item, icon: resolveImageUrl(item.icon)}));
                        break;
                    case 'activationEndDate':
                        // Pass ISO string or null directly, the PHP backend will format it.
                        dbPayload[key] = value;
                        (uiUpdates as any)[key] = value;
                        break;
                    default:
                        dbPayload[key] = value;
                        (uiUpdates as any)[key] = value;
                        break;
                }
            }
            
            if (Object.keys(dbPayload).length === 0) {
                 setIsProcessing(false);
                 return;
            }

            const response = await fetch(`${API_BASE_URL}update_settings.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dbPayload) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Update failed');

            setRestaurantInfo(prev => prev ? { ...prev, ...uiUpdates } : null);
            showToast(t.settingsUpdatedSuccess);
        } catch (error) {
            console.error("Error updating restaurant info:", error);
            showToast(t.settingsUpdateFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [restaurantInfo, showToast, t.settingsUpdatedSuccess, t.settingsUpdateFailed, setIsProcessing]);


    const value: DataContextType = {
        restaurantInfo,
        products,
        setProducts,
        categories,
        setCategories,
        tags,
        setTags,
        promotions,
        setPromotions,
        fetchAllData,
        updateRestaurantInfo
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};