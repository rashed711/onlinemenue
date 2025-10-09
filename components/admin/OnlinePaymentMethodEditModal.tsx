import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { OnlinePaymentMethod, Language, LocalizedString } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';

interface OnlinePaymentMethodEditModalProps {
    method: OnlinePaymentMethod | null;
    onClose: () => void;
    onSave: (methodData: OnlinePaymentMethod | Omit<OnlinePaymentMethod, 'id'>) => void;
    language: Language;
}

const emptyMethod: Omit<OnlinePaymentMethod, 'id'> = {
    name: { en: '', ar: '' },
    type: 'number',
    details: '',
    icon: '',
    isVisible: true,
};

export const OnlinePaymentMethodEditModal: React.FC<OnlinePaymentMethodEditModalProps> = ({ method, onClose, onSave, language }) => {
    const t = useTranslations(language);
    const [formData, setFormData] = useState<Omit<OnlinePaymentMethod, 'id'>>(emptyMethod);

    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    useEffect(() => {
        if (method) {
            const { id, ...editableData } = method;
            setFormData(editableData);
        } else {
            setFormData(emptyMethod);
        }
    }, [method]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (name.includes('.')) {
            const [field, lang] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [field]: { ...(prev[field as 'name'] as LocalizedString), [lang]: value }
            }));
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
        if (!method && !formData.icon) {
            alert(t.uploadIconPrompt);
            return;
        }
        if (method) {
            onSave({ ...method, ...formData });
        } else {
            onSave(formData);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">{method ? t.editPaymentMethod : t.addNewPaymentMethod}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.methodNameEn}</label>
                            <input type="text" name="name.en" value={formData.name.en} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.methodNameAr}</label>
                            <input type="text" name="name.ar" value={formData.name.ar} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{t.methodType}</label>
                        <div className="flex items-center space-x-4 rtl:space-x-reverse bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg">
                           <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md flex-1 justify-center transition-colors" data-active={formData.type === 'number'}>
                               <input type="radio" name="type" value="number" checked={formData.type === 'number'} onChange={handleChange} className="w-4 h-4 text-primary-600 focus:ring-primary-500" />
                               <span className='font-medium'>{t.numberText}</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md flex-1 justify-center transition-colors" data-active={formData.type === 'link'}>
                               <input type="radio" name="type" value="link" checked={formData.type === 'link'} onChange={handleChange} className="w-4 h-4 text-primary-600 focus:ring-primary-500" />
                               <span className='font-medium'>{t.linkUrl}</span>
                           </label>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{t.methodDetails}</label>
                        <input type="text" name="details" value={formData.details} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={formData.type === 'number' ? 'e.g., 01012345678' : 'e.g., https://...'} required />
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
        </div>,
        portalRoot
    );
};