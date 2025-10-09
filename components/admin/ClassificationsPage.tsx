import React from 'react';
import type { Language, Category, Tag } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons/Icons';

interface ClassificationsPageProps {
    language: Language;
    categories: Category[];
    tags: Tag[];
    onAddCategory: () => void;
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: number) => void;
    onAddTag: () => void;
    onEditTag: (tag: Tag) => void;
    onDeleteTag: (tagId: string) => void;
    canAddCategory: boolean;
    canEditCategory: boolean;
    canDeleteCategory: boolean;
    canAddTag: boolean;
    canEditTag: boolean;
    canDeleteTag: boolean;
}

export const ClassificationsPage: React.FC<ClassificationsPageProps> = (props) => {
    const { 
        language, categories, tags, 
        onAddCategory, onEditCategory, onDeleteCategory, 
        onAddTag, onEditTag, onDeleteTag,
        canAddCategory, canEditCategory, canDeleteCategory,
        canAddTag, canEditTag, canDeleteTag,
    } = props;
    const t = useTranslations(language);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">{t.classifications}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Categories Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">{t.manageCategories}</h3>
                        {canAddCategory && (
                            <button onClick={onAddCategory} className="bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm">
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewCategory}
                            </button>
                        )}
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {categories.map(category => (
                                <li key={category.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-gray-700/50">
                                    <span className="font-medium">{category.name[language]}</span>
                                    <div className="flex items-center gap-2">
                                        {canEditCategory && <button onClick={() => onEditCategory(category)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                                        {canDeleteCategory && <button onClick={() => onDeleteCategory(category.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Tags Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">{t.manageTags}</h3>
                        {canAddTag && (
                            <button onClick={onAddTag} className="bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm">
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewTag}
                            </button>
                        )}
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                         <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {tags.map(tag => (
                                <li key={tag.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-gray-700/50">
                                    <span className="font-medium">{tag.name[language]}</span>
                                    <div className="flex items-center gap-2">
                                        {canEditTag && <button onClick={() => onEditTag(tag)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                                        {canDeleteTag && <button onClick={() => onDeleteTag(tag.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};