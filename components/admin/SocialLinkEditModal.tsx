import React, { useState, useEffect } from 'react';
import type { SocialLink } from '../../types';
import { CloseIcon } from '../icons/Icons';
import { useTranslations } from '../../i18n/translations';
import type { Language } from '../../types';


interface SocialLinkEditModalProps {
    link: SocialLink | null;
    onClose: () => void;
    onSave: (linkData: SocialLink | Omit<SocialLink, 'id'>) => void;
    language: Language;
}

const emptyLink: Omit<SocialLink, 'id'> = {
    name: '',
    url: '',
    icon: '',
    isVisible: true,
};

export const SocialLinkEditModal: React.FC<SocialLinkEditModalProps> = ({ link, onClose, onSave, language }) => {
    const t = useTranslations(language);
    const [formData, setFormData] = useState<Omit<SocialLink, 'id'>>(emptyLink);

    useEffect(() => {
        if (link) {
            const { id, ...editableData } = link;
            setFormData(editableData);
        } else {
            setFormData(emptyLink);
        }
    }, [link]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, icon: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!link && !formData.icon) {
            alert(t.uploadIconPrompt);
            return;
        }
        if (link) {
            onSave({ ...link, ...formData });
        } else {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">{link ? t.editLink : t.addNewLink}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.name}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={t.linkNamePlaceholder} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{t.url}</label>
                        <input type="text" name="url" value={formData.url} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={t.linkUrlPlaceholder} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.icon}</label>
                        <div className="mt-2 flex items-center gap-4">
                            {formData.icon && <img src={formData.icon} alt={t.iconPreview} className="w-12 h-12 object-contain rounded-md bg-slate-100 dark:bg-slate-700 p-1 border dark:border-slate-600" />}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleIconChange}
                                className="block w-full text-sm text-slate-500 dark:text-slate-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary-50 file:text-primary-700
                                hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-200 dark:hover:file:bg-primary-900"
                            />
                        </div>
                        {/* FIX: Corrected translation key from 'uploadIconHelpText' to 'uploadImageHelpText' */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{t.uploadImageHelpText}</p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="isVisible" checked={formData.isVisible} onChange={handleChange} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm font-medium">{t.visibleOnPage}</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">{t.cancel}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.save}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};