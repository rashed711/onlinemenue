import React, { useState } from 'react';
import type { Language, OrderStatusColumn, RestaurantInfo, SocialLink } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { SocialLinkEditModal } from './SocialLinkEditModal';

interface SettingsPageProps {
    language: Language;
    restaurantInfo: RestaurantInfo;
    updateRestaurantInfo: (updatedInfo: Partial<RestaurantInfo>) => void;
    onAddOrderStatus: () => void;
    onEditOrderStatus: (column: OrderStatusColumn) => void;
    onDeleteOrderStatus: (columnId: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const { language, restaurantInfo, updateRestaurantInfo, onAddOrderStatus, onEditOrderStatus, onDeleteOrderStatus } = props;
    const t = useTranslations(language);
    const [editingLink, setEditingLink] = useState<SocialLink | 'new' | null>(null);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const [field, lang] = name.split('.');

        const currentLocalized = restaurantInfo[field as 'name' | 'description' | 'heroTitle'] || { en: '', ar: '' };

        const newInfo = {
            ...restaurantInfo,
            [field]: {
                ...currentLocalized,
                [lang]: value,
            }
        };
        updateRestaurantInfo(newInfo);
    };

    const handleNonLocalizedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (parseInt(value, 10) || 0) : value;
        updateRestaurantInfo({ [name]: finalValue });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateRestaurantInfo({ logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleHomepageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateRestaurantInfo({ defaultPage: e.target.value as 'menu' | 'social' });
    };

    const handleToggleVisibility = (linkId: number) => {
        const updatedLinks = restaurantInfo.socialLinks.map(link => 
            link.id === linkId ? { ...link, isVisible: !link.isVisible } : link
        );
        updateRestaurantInfo({ socialLinks: updatedLinks });
    };

    const handleDeleteLink = (linkId: number) => {
        if (window.confirm("Are you sure you want to delete this link?")) {
            const updatedLinks = restaurantInfo.socialLinks.filter(link => link.id !== linkId);
            updateRestaurantInfo({ socialLinks: updatedLinks });
        }
    };
    
    const handleSaveLink = (linkData: SocialLink | Omit<SocialLink, 'id'>) => {
        if ('id' in linkData) { // Editing existing
            const updatedLinks = restaurantInfo.socialLinks.map(link => link.id === linkData.id ? linkData : link);
            updateRestaurantInfo({ socialLinks: updatedLinks });
        } else { // Adding new
            const newLink: SocialLink = {
                ...linkData,
                id: restaurantInfo.socialLinks.length > 0 ? Math.max(...restaurantInfo.socialLinks.map(l => l.id)) + 1 : 1,
            };
            updateRestaurantInfo({ socialLinks: [...restaurantInfo.socialLinks, newLink] });
        }
        setEditingLink(null);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Restaurant Info Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Restaurant Information</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Logo</label>
                        <div className="mt-2 flex items-center gap-4">
                            <img src={restaurantInfo.logo} alt="Logo preview" className="w-16 h-16 object-contain rounded-full bg-slate-100 dark:bg-slate-700 p-1 border dark:border-slate-600" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary-50 file:text-primary-700
                                hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-200 dark:hover:file:bg-primary-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Hero Image URL</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                name="heroImage"
                                value={restaurantInfo.heroImage || ''}
                                onChange={handleNonLocalizedChange}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="https://example.com/hero.jpg"
                            />
                            {restaurantInfo.heroImage && (
                                <img
                                    src={restaurantInfo.heroImage}
                                    alt="Hero preview"
                                    className="w-24 h-16 object-cover rounded-md bg-slate-100 dark:bg-slate-700 p-1 border dark:border-slate-600"
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name (English)</label>
                            <input type="text" name="name.en" value={restaurantInfo.name.en} onChange={handleInfoChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Name (Arabic)</label>
                            <input type="text" name="name.ar" value={restaurantInfo.name.ar} onChange={handleInfoChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.heroTitleEn}</label>
                            <input type="text" name="heroTitle.en" value={restaurantInfo.heroTitle?.en || ''} onChange={handleInfoChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.heroTitleAr}</label>
                            <input type="text" name="heroTitle.ar" value={restaurantInfo.heroTitle?.ar || ''} onChange={handleInfoChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.descriptionEn}</label>
                            <textarea name="description.en" value={restaurantInfo.description?.en || ''} onChange={handleInfoChange} rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.descriptionAr}</label>
                            <textarea name="description.ar" value={restaurantInfo.description?.ar || ''} onChange={handleInfoChange} rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                        </div>
                    </div>
                </div>
            </div>

             {/* Table Management Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Table Management</h3>
                <div>
                    <label className="block text-sm font-medium mb-1">Total Number of Tables</label>
                    <input 
                        type="number" 
                        name="tableCount" 
                        value={restaurantInfo.tableCount || 0} 
                        onChange={handleNonLocalizedChange} 
                        className="w-full max-w-xs p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        min="0"
                    />
                </div>
            </div>

            {/* Order Status Management */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{t.orderStatusManagement}</h3>
                    <button onClick={onAddOrderStatus} className="bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm">
                        <PlusIcon className="w-5 h-5" />
                        {t.addNewStatus}
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {restaurantInfo.orderStatusColumns.map(status => (
                            <li key={status.id} className="p-4 flex flex-wrap justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-gray-700/50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-4 h-4 rounded-full bg-${status.color}-500`}></div>
                                    <div>
                                        <div className="font-medium">{status.name[language]}</div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">{status.id}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onEditOrderStatus(status)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>
                                    <button onClick={() => { if(window.confirm(t.confirmDeleteStatus)) onDeleteOrderStatus(status.id); }} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>


            {/* Homepage Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4">Homepage Settings</h3>
                <div className="flex items-center space-x-6 rtl:space-x-reverse">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="homepage" value="menu" checked={restaurantInfo.defaultPage === 'menu'} onChange={handleHomepageChange} className="w-5 h-5 text-primary-600 focus:ring-primary-500" />
                        <span>Menu Page</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="homepage" value="social" checked={restaurantInfo.defaultPage === 'social'} onChange={handleHomepageChange} className="w-5 h-5 text-primary-600 focus:ring-primary-500" />
                        <span>Social Links Page</span>
                    </label>
                </div>
            </div>

            {/* Social Links Management */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Social & Contact Links</h3>
                    <button onClick={() => setEditingLink('new')} className="bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm">
                        <PlusIcon className="w-5 h-5" />
                        Add New Link
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {restaurantInfo.socialLinks.map(link => (
                            <li key={link.id} className="p-4 flex flex-wrap justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-gray-700/50">
                                <div className="flex items-center gap-4">
                                    <img src={link.icon} alt={`${link.name} icon`} className="w-6 h-6 object-contain" />
                                    <div>
                                        <div className="font-medium">{link.name}</div>
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline truncate max-w-xs block">{link.url}</a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={link.isVisible} onChange={() => handleToggleVisibility(link.id)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                    <button onClick={() => setEditingLink(link)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            {editingLink && (
                <SocialLinkEditModal
                    link={editingLink === 'new' ? null : editingLink}
                    onClose={() => setEditingLink(null)}
                    onSave={handleSaveLink}
                />
            )}
        </div>
    );
};