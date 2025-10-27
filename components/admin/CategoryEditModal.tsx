import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Category, Language, LocalizedString } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';

interface CategoryEditModalProps {
    category: Category | null;
    onClose: () => void;
    onSave: (categoryData: Category | Omit<Category, 'id'>) => void;
    language: Language;
}

const emptyCategory: Omit<Category, 'id'> = {
    name: { en: '', ar: '' },
};

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ category, onClose, onSave, language }) => {
    const t = useTranslations(language);
    const [formData, setFormData] = useState<Omit<Category, 'id'>>(emptyCategory);

    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    useEffect(() => {
        if (category) {
            const { id, ...editableData } = category;
            setFormData(editableData);
        } else {
            setFormData(emptyCategory);
        }
    }, [category]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [field, lang] = name.split('.');
        setFormData(prev => ({
            ...prev,
            [field]: { ...(prev[field as keyof typeof prev] as LocalizedString), [lang]: value }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (category) {
             onSave({ ...category, ...formData });
        } else {
             onSave(formData);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">{category ? t.editCategory : t.addNewCategory}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.categoryNameEn}</label>
                        <input type="text" name="name.en" value={formData.name.en} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.categoryNameAr}</label>
                        <input type="text" name="name.ar" value={formData.name.ar} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
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