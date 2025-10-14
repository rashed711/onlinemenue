import React, { useState, useEffect } from 'react';
import type { Category, Language, LocalizedString } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';

interface CategoryEditModalProps {
    category: Category | null;
    onClose: () => void;
    onSave: (categoryData: Category | Omit<Category, 'id'>) => void;
}

const emptyCategory: Omit<Category, 'id'> = {
    name: { en: '', ar: '' },
};

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ category, onClose, onSave }) => {
    const { language } = useUI();
    const t = useTranslations(language);
    const [formData, setFormData] = useState<Omit<Category, 'id'>>(emptyCategory);

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

    return (
        <Modal title={category ? t.editCategory : t.addNewCategory} onClose={onClose} size="md">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.categoryNameEn}</label>
                    <input type="text" name="name.en" value={formData.name.en} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.categoryNameAr}</label>
                    <input type="text" name="name.ar" value={formData.name.ar} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};