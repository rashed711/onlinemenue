import React, { useState, useEffect } from 'react';
import type { Tag, Language, LocalizedString } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';

interface TagEditModalProps {
    tag: Tag | null;
    onClose: () => void;
    onSave: (tagData: Tag | (Omit<Tag, 'id'> & {id: string})) => void;
    language: Language;
}

const emptyTag: Omit<Tag, 'id'> = {
    name: { en: '', ar: '' },
};

export const TagEditModal: React.FC<TagEditModalProps> = ({ tag, onClose, onSave, language }) => {
    const t = useTranslations(language);
    const [formData, setFormData] = useState<Omit<Tag, 'id'>>(emptyTag);

    useEffect(() => {
        if (tag) {
            const { id, ...editableData } = tag;
            setFormData(editableData);
        } else {
            setFormData(emptyTag);
        }
    }, [tag]);

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
        if (tag) {
             onSave({ ...tag, ...formData });
        } else {
             const newId = formData.name.en.toLowerCase().replace(/\s+/g, '-');
             onSave({ ...formData, id: newId });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">{tag ? t.editTag : t.addNewTag}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.tagNameEn}</label>
                        <input type="text" name="name.en" value={formData.name.en} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                        {!tag && <p className="text-xs text-gray-500 mt-1">The ID will be generated from the English name (e.g., "Spicy Food" becomes "spicy-food").</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.tagNameAr}</label>
                        <input type="text" name="name.ar" value={formData.name.ar} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
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