import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import type { Product, Category, Tag, Promotion, RestaurantInfo, SocialLink, OnlinePaymentMethod, OrderStatusColumn, LocalizedString } from '../types';
import { restaurantInfo as fallbackRestaurantInfo, initialCategories, initialTags } from '../data/mockData';
import { APP_CONFIG } from '../utils/config';
import { useUI } from './UIContext';
import { resolveImageUrl } from '../utils/helpers';

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

const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsLoading, setShowProgress, setProgress, showToast, t, setIsProcessing } = useUI();
    
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

            const fetchOptions = { method: 'GET' };

            const [settingsRes, classificationsRes, promotionsRes, productsRes] = await Promise.all([
                fetch(`${APP_CONFIG.API_BASE_URL}get_settings.php`, fetchOptions),
                fetch(`${APP_CONFIG.API_BASE_URL}get_classifications.php`, fetchOptions),
                fetch(`${APP_CONFIG.API_BASE_URL}get_promotions.php`, fetchOptions),
                fetch(`${APP_CONFIG.API_BASE_URL}get_products.php`, fetchOptions),
            ]);

            if (progressInterval) clearInterval(progressInterval);

            if (settingsRes.ok) {
                const data = await settingsRes.json();
                
                if (data.activationEndDate && typeof data.activationEndDate === 'string') {
                    if (data.activationEndDate.startsWith('0000-00-00')) {
                        data.activationEndDate = null;
                    } else {
                        // FIX: Assume DB datetime string is UTC and append 'Z' to parse correctly, preventing timezone errors.
                        const utcDateString = data.activationEndDate.replace(' ', 'T') + 'Z';
                        const dateObj = new Date(utcDateString);
                        if (!isNaN(dateObj.getTime())) {
                            data.activationEndDate = dateObj.toISOString();
                        } else {
                            data.activationEndDate = null;
                        }
                    }
                }
                
                if (data.deactivationMessage && typeof data.deactivationMessage === 'string') {
                    try {
                        data.deactivationMessage = JSON.parse(data.deactivationMessage);
                    } catch (e) {
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
            if (promotionsRes.ok) {
                const rawPromotions: any[] = (await promotionsRes.json()) || [];
                // FIX: Ensure endDate from the database (which might lack timezone info) is parsed as UTC.
                const processedPromotions = rawPromotions.map((promo) => {
                    // Check if endDate exists and is a string before processing
                    if (promo.endDate && typeof promo.endDate === 'string' && !promo.endDate.endsWith('Z')) {
                        // Converts "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SSZ"
                        return { ...promo, endDate: promo.endDate.replace(' ', 'T') + 'Z' };
                    }
                    return promo;
                });
                setPromotions(processedPromotions);
            }
            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts((data || []).map((p: Product) => ({ ...p, image: resolveImageUrl(p.image) })));
            }
        } catch (error) {
            console.error("Error fetching public data:", error);
            if (isInitialLoad) setRestaurantInfo(fallbackRestaurantInfo);
            else showToast(t.dataRefreshFailed);
        } finally {
            if (isInitialLoad) setIsLoading(false);
            else { setProgress(100); setTimeout(() => setShowProgress(false), 500); }
        }
    }, [setIsLoading, setShowProgress, setProgress, showToast, t.dataRefreshFailed]);

    useEffect(() => {
        fetchAllData(true);
    }, [fetchAllData]);

    const updateRestaurantInfo = useCallback(async (updatedInfo: Partial<RestaurantInfo>) => {
        if (!restaurantInfo || Object.keys(updatedInfo).length === 0) return;
        setIsProcessing(true);
        try {
            const dbPayload: { [key: string]: any } = {};
            const uiUpdates: Partial<RestaurantInfo> = {};

            const uploadImage = async (file: File, type: 'branding' | 'icons' | 'payment', oldPath?: string): Promise<string | null> => {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('type', type);
                if (oldPath) {
                    const relativeOldPath = oldPath.split('?')[0].replace(new URL(APP_CONFIG.API_BASE_URL).origin + '/', '');
                    formData.append('oldPath', relativeOldPath);
                }

                const uploadRes = await fetch(`${APP_CONFIG.API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error(`Upload failed: ${await uploadRes.text()}`);
                const result = await uploadRes.json();
                if (result.success && result.url) return result.url;
                throw new Error(result.error || `Failed to get URL from upload`);
            };

            for (const key of Object.keys(updatedInfo) as Array<keyof RestaurantInfo>) {
                const value = updatedInfo[key];

                switch (key) {
                    case 'logo':
                    case 'heroImage':
                        // FIX: Ensure value is a string before using string methods or assigning to string properties.
                        if (typeof value === 'string') {
                            if (value.startsWith('data:image')) {
                                const file = dataUrlToFile(value, `${key}.png`);
                                const oldPath = restaurantInfo[key];
                                const imageUrl = await uploadImage(file, 'branding', oldPath);
                                if (imageUrl) {
                                    dbPayload[key] = imageUrl.split('?v=')[0];
                                    uiUpdates[key] = resolveImageUrl(imageUrl);
                                }
                            } else {
                                dbPayload[key] = value;
                                uiUpdates[key] = value;
                            }
                        }
                        break;
                    case 'socialLinks':
                    case 'onlinePaymentMethods':
                        const originalItems = restaurantInfo[key] as any[];
                        const items = value as any[];
                        const type = key === 'socialLinks' ? 'icons' : 'payment';
                        const processedItems = await Promise.all(
                            items.map(async (item, i) => {
                                if (item.icon && item.icon.startsWith('data:image')) {
                                    const file = dataUrlToFile(item.icon, `${type}_icon_${i}.png`);
                                    const originalItem = item.id ? originalItems.find(orig => orig.id === item.id) : null;
                                    const oldPath = originalItem ? originalItem.icon : undefined;
                                    const uploadResult = await uploadImage(file, type, oldPath);
                                    const relativeUrl = uploadResult ? uploadResult.split('?v=')[0] : item.icon;
                                    return { ...item, icon: relativeUrl };
                                }
                                return item;
                            })
                        );
                        dbPayload[key] = processedItems;
                        (uiUpdates as any)[key] = processedItems.map((item: any) => ({...item, icon: resolveImageUrl(item.icon)}));
                        break;
                    default:
                        // @FIX: Correctly cast `dbPayload` to `any` to handle dynamic assignment of properties with different types.
                        // This prevents TypeScript from inferring a narrow type for `dbPayload`'s values based on earlier assignments in the loop.
                        (dbPayload as any)[key] = value;
                        (uiUpdates as any)[key] = value;
                        break;
                }
            }
            
            if (Object.keys(dbPayload).length === 0) {
                 setIsProcessing(false);
                 return;
            }

            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_settings.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dbPayload) });
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