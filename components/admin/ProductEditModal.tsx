
import React, { useState, useEffect } from 'react';
import type { Product, Language, LocalizedString } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';
import { categories } from '../../data/mockData';

interface ProductEditModalProps {
    product: Product | null;
    onClose: () => void;
    onSave: (productData: Product | Omit<Product, 'id' | 'rating'>) => void;
    language: Language;
}

const emptyProduct: Omit<Product, 'id' | 'rating'> = {
    code: '',
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    price: 0,
    image: '',
    categoryId: categories[0]?.id || 1,
    tags: [],
};


export const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, onClose, onSave, language }) => {
    const t = useTranslations(language);
    const [formData, setFormData] = useState<Omit<Product, 'id' | 'rating'>>(emptyProduct);

    useEffect(() => {
        if (product) {
            const { id, rating, ...editableData } = product;
            setFormData(editableData);
        } else {
            setFormData(emptyProduct);
        }
    }, [product]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [field, lang] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [field]: { ...(prev[field as keyof typeof prev] as LocalizedString), [lang]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product) {
             onSave({ ...product, ...formData });
        } else {
             onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <h2 className="text-xl font-bold">{product ? t.editProduct : t.addNewProduct}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.productNameEn}</label>
                            <input type="text" name="name.en" value={formData.name.en} onChange={handleTextChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.productNameAr}</label>
                            <input type="text" name="name.ar" value={formData.name.ar} onChange={handleTextChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{t.code}</label>
                        <input type="text" name="code" value={formData.code} onChange={handleTextChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium mb-1">{t.descriptionEn}</label>
                            <textarea name="description.en" value={formData.description.en} onChange={handleTextChange} rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required></textarea>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">{t.descriptionAr}</label>
                            <textarea name="description.ar" value={formData.description.ar} onChange={handleTextChange} rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required></textarea>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.price}</label>
                            <input type="number" name="price" value={formData.price} onChange={handleNumberChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required step="0.01" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.category}</label>
                            <select name="categoryId" value={formData.categoryId} onChange={handleNumberChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name[language]}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.imageURL}</label>
                        <input type="text" name="image" value={formData.image} onChange={handleTextChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required placeholder="https://picsum.photos/seed/example/400/300" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">{t.cancel}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">{t.save}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
