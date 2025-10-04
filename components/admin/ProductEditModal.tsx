import React, { useState, useEffect } from 'react';
import type { Product, Language, LocalizedString, Category, ProductOption, ProductOptionValue } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon, PlusIcon, TrashIcon } from '../icons/Icons';

interface ProductEditModalProps {
    product: Product | null;
    categories: Category[];
    onClose: () => void;
    onSave: (productData: Product | Omit<Product, 'id' | 'rating'>) => void;
    language: Language;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, categories, onClose, onSave, language }) => {
    const t = useTranslations(language);
    
    const emptyProduct: Omit<Product, 'id' | 'rating'> = {
        code: '',
        name: { en: '', ar: '' },
        description: { en: '', ar: '' },
        price: 0,
        image: '',
        categoryId: categories[0]?.id || 1,
        isPopular: false,
        isNew: false,
        isVisible: true,
        tags: [],
        options: [],
    };

    const [formData, setFormData] = useState<Omit<Product, 'id' | 'rating'>>(emptyProduct);

    useEffect(() => {
        if (product) {
            const { id, rating, ...editableData } = product;
            setFormData({
                ...editableData,
                options: editableData.options ? JSON.parse(JSON.stringify(editableData.options)) : [] // Deep copy
            });
        } else {
            setFormData(emptyProduct);
        }
    }, [product, categories]);

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

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product) {
             onSave({ ...product, ...formData });
        } else {
             onSave(formData);
        }
    };
    
    // --- Option Handlers ---
    const addOptionGroup = () => {
        const newGroup: ProductOption = { name: { en: '', ar: '' }, values: [] };
        setFormData(prev => ({ ...prev, options: [...(prev.options || []), newGroup] }));
    };

    const removeOptionGroup = (groupIndex: number) => {
        setFormData(prev => ({ ...prev, options: prev.options?.filter((_, i) => i !== groupIndex) }));
    };

    const handleOptionGroupChange = (groupIndex: number, field: 'name.en' | 'name.ar', value: string) => {
        const [name, lang] = field.split('.');
        setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            (newOptions[groupIndex].name as any)[lang] = value;
            return { ...prev, options: newOptions };
        });
    };

    const addOptionValue = (groupIndex: number) => {
        const newValue: ProductOptionValue = { name: { en: '', ar: '' }, priceModifier: 0 };
        setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            newOptions[groupIndex].values.push(newValue);
            return { ...prev, options: newOptions };
        });
    };

    const removeOptionValue = (groupIndex: number, valueIndex: number) => {
        setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            newOptions[groupIndex].values = newOptions[groupIndex].values.filter((_, i) => i !== valueIndex);
            return { ...prev, options: newOptions };
        });
    };
    
    const handleOptionValueChange = (groupIndex: number, valueIndex: number, field: 'name.en' | 'name.ar' | 'priceModifier', value: string) => {
         setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            const targetValue = newOptions[groupIndex].values[valueIndex];
            if (field === 'priceModifier') {
                targetValue.priceModifier = parseFloat(value) || 0;
            } else {
                 const [name, lang] = field.split('.');
                (targetValue.name as any)[lang] = value;
            }
            return { ...prev, options: newOptions };
        });
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <h2 className="text-xl font-bold">{product ? t.editProduct : t.addNewProduct}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Basic Info */}
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
                     <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="isPopular" checked={formData.isPopular} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm font-medium">{t.popular}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="isNew" checked={formData.isNew} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-green-600 focus:ring-green-500" />
                            <span className="text-sm font-medium">{t.new}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="isVisible" checked={formData.isVisible} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium">{t.visibleInMenu}</span>
                        </label>
                    </div>

                    {/* Options Editor */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg font-semibold mb-2">{t.productOptions}</h3>
                        <div className="space-y-4">
                            {formData.options?.map((option, groupIndex) => (
                                <div key={groupIndex} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold">{`Group #${groupIndex + 1}`}</h4>
                                        <button type="button" onClick={() => removeOptionGroup(groupIndex)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="text" placeholder={t.optionNameEn} value={option.name.en} onChange={e => handleOptionGroupChange(groupIndex, 'name.en', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                        <input type="text" placeholder={t.optionNameAr} value={option.name.ar} onChange={e => handleOptionGroupChange(groupIndex, 'name.ar', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <hr className="dark:border-gray-600" />
                                    <div className="space-y-2">
                                        <h5 className="text-sm font-medium">{t.optionValues}</h5>
                                        {option.values.map((value, valueIndex) => (
                                            <div key={valueIndex} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
                                                <input type="text" placeholder={t.valueNameEn} value={value.name.en} onChange={e => handleOptionValueChange(groupIndex, valueIndex, 'name.en', e.target.value)} className="md:col-span-3 w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                                <input type="text" placeholder={t.valueNameAr} value={value.name.ar} onChange={e => handleOptionValueChange(groupIndex, valueIndex, 'name.ar', e.target.value)} className="md:col-span-2 w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                                <input type="number" placeholder={t.priceModifier} value={value.priceModifier} onChange={e => handleOptionValueChange(groupIndex, valueIndex, 'priceModifier', e.target.value)} className="md:col-span-1 w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600" step="0.01" />
                                                <button type="button" onClick={() => removeOptionValue(groupIndex, valueIndex)} className="md:col-span-1 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 justify-self-center">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addOptionValue(groupIndex)} className="text-sm text-green-600 hover:text-green-800 font-semibold flex items-center gap-1">
                                            <PlusIcon className="w-4 h-4" /> {t.addValue}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addOptionGroup} className="mt-4 text-sm font-bold bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                           <PlusIcon className="w-5 h-5" /> {t.addOptionGroup}
                        </button>
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
