import React from 'react';
import type { Category, Tag } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';

interface CategoryRowProps {
    category: Category;
    level: number;
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ category, level, onEditCategory, onDeleteCategory, canEdit, canDelete }) => {
    const { language } = useUI();
    const indentStyle = language === 'ar' ? { paddingRight: `${level * 1.5}rem` } : { paddingLeft: `${level * 1.5}rem` };
    
    return (
        <>
            <li className="group">
                <div className={`flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${level > 0 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}>
                    <span className="font-medium text-slate-700 dark:text-slate-200 p-3" style={indentStyle}>
                        {level > 0 && <span className="text-slate-400 dark:text-slate-500 me-2">└─</span>}
                        {category.name[language]}
                    </span>
                    <div className="flex items-center gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && <button onClick={() => onEditCategory(category)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                        {canDelete && <button onClick={() => onDeleteCategory(category.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
                    </div>
                </div>
            </li>
            {category.children && category.children.map(child => (
                <CategoryRow 
                    key={child.id} 
                    category={child} 
                    level={level + 1} 
                    onEditCategory={onEditCategory} 
                    onDeleteCategory={onDeleteCategory}
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
            ))}
        </>
    );
};


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
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.classifications}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Categories Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t.manageCategories}</h3>
                        {canAddCategory && (
                            <button onClick={onAddCategory} className="bg-primary-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow-md transform hover:-translate-y-px">
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewCategory}
                            </button>
                        )}
                    </div>
                    <div className="p-2">
                         <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                            {categories.map(category => (
                                <CategoryRow 
                                    key={category.id} 
                                    category={category} 
                                    level={0}
                                    onEditCategory={onEditCategory}
                                    onDeleteCategory={handleDeleteCategory}
                                    canEdit={canEditCategory}
                                    canDelete={canDeleteCategory}
                                />
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Tags Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t.manageTags}</h3>
                        {canAddTag && (
                            <button onClick={onAddTag} className="bg-primary-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow-md transform hover:-translate-y-px">
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewTag}
                            </button>
                        )}
                    </div>
                    <div className="p-4">
                         <div className="flex flex-wrap gap-3">
                            {tags.map(tag => (
                                <div key={tag.id} className="group relative">
                                    <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 transition-colors group-hover:border-primary-400 dark:group-hover:border-primary-500">
                                        {tag.name[language]}
                                    </span>
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {canEditTag && <button onClick={() => onEditTag(tag)} className="p-2 text-white hover:bg-white/20 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                                        {canDeleteTag && <button onClick={() => handleDeleteTag(tag.id)} className="p-2 text-white hover:bg-white/20 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};