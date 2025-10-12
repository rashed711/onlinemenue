import React, { useMemo } from 'react';
import type { Category, Tag } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';

interface ClassificationsPageProps {
    onAddCategory: () => void;
    onEditCategory: (category: Category) => void;
    onAddTag: () => void;
    onEditTag: (tag: Tag) => void;
}

export const ClassificationsPage: React.FC<ClassificationsPageProps> = (props) => {
    const { onAddCategory, onEditCategory, onAddTag, onEditTag } = props;
    
    const { language, t } = useUI();
    const { categories, tags } = useData();
    const { deleteCategory, deleteTag } = useAdmin();
    const { hasPermission } = useAuth();
    
    const canAddCategory = hasPermission('add_category');
    const canEditCategory = hasPermission('edit_category');
    const canDeleteCategory = hasPermission('delete_category');
    const canAddTag = hasPermission('add_tag');
    const canEditTag = hasPermission('edit_tag');
    const canDeleteTag = hasPermission('delete_tag');

    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => a.name[language].localeCompare(b.name[language], language));
    }, [categories, language]);

    const sortedTags = useMemo(() => {
        return [...tags].sort((a, b) => a.name[language].localeCompare(b.name[language], language));
    }, [tags, language]);
    
    const handleDeleteCategory = (categoryId: number) => {
        if (window.confirm(t.confirmDeleteCategory)) {
            deleteCategory(categoryId);
        }
    };
    
    const handleDeleteTag = (tagId: string) => {
        if (window.confirm(t.confirmDeleteTag)) {
            deleteTag(tagId);
        }
    };

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
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {sortedCategories.map(category => (
                                <li key={category.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <span className="font-medium">{category.name[language]}</span>
                                    <div className="flex items-center gap-2">
                                        {canEditCategory && <button onClick={() => onEditCategory(category)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                                        {canDeleteCategory && <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
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
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
                         <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {sortedTags.map(tag => (
                                <li key={tag.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <span className="font-medium">{tag.name[language]}</span>
                                    <div className="flex items-center gap-2">
                                        {canEditTag && <button onClick={() => onEditTag(tag)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                                        {canDeleteTag && <button onClick={() => handleDeleteTag(tag.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
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