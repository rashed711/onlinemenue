import React, { useState } from 'react';
import type { Category, Tag } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';

interface SubCategoryItemProps {
    category: Category;
    level: number;
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

const SubCategoryItem: React.FC<SubCategoryItemProps> = (props) => {
    const { category, level, onEditCategory, onDeleteCategory, canEdit, canDelete } = props;
    const { language } = useUI();
    const indentStyle = language === 'ar' 
        ? { paddingRight: `${level * 1.5 + 1.5}rem` } 
        : { paddingLeft: `${level * 1.5 + 1.5}rem` };
    
    return (
        <>
            <li className="group flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <span className="font-medium text-slate-700 dark:text-slate-200 p-3" style={indentStyle}>
                    <span className="text-slate-400 dark:text-slate-500 me-2">└─</span>
                    {category.name[language]}
                </span>
                <div className="flex items-center gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && <button onClick={() => onEditCategory(category)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                    {canDelete && <button onClick={() => onDeleteCategory(category.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
                </div>
            </li>
            {category.children && category.children.map(child => (
                <SubCategoryItem 
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
    const { deleteCategory, deleteTag, updateCategoryOrder } = useAdmin();
    const { hasPermission } = useAuth();
    
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

    const canAddCategory = hasPermission('add_category');
    const canEditCategory = hasPermission('edit_category');
    const canDeleteCategory = hasPermission('delete_category');
    const canAddTag = hasPermission('add_tag');
    const canEditTag = hasPermission('edit_tag');
    const canDeleteTag = hasPermission('delete_tag');

    const toggleExpansion = (categoryId: number) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };
    
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
    
    const topLevelCategories = React.useMemo(() => {
        return categories
            .filter(c => !c.parent_id)
            .sort((a, b) => a.sort_order - b.sort_order);
    }, [categories]);

    const handleMoveCategory = (indexToMove: number, direction: 'up' | 'down') => {
        if (direction === 'up' && indexToMove === 0) return;
        if (direction === 'down' && indexToMove === topLevelCategories.length - 1) return;

        const newOrderedList = [...topLevelCategories];
        const targetIndex = direction === 'up' ? indexToMove - 1 : indexToMove + 1;
        
        const itemToMove = newOrderedList[indexToMove];
        newOrderedList[indexToMove] = newOrderedList[targetIndex];
        newOrderedList[targetIndex] = itemToMove;

        const newOrderedIds = newOrderedList.map(c => c.id);
        updateCategoryOrder(newOrderedIds);
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
                    <div className="p-2 space-y-2">
                         {topLevelCategories.map((category, index) => {
                            const isExpanded = expandedCategories.includes(category.id);
                            const hasChildren = category.children && category.children.length > 0;

                            return (
                                <div key={category.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <div className="group flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="flex items-center flex-grow min-w-0">
                                            {canEditCategory && (
                                                <div className="flex flex-col px-1 self-stretch border-e dark:border-slate-700">
                                                    <button onClick={() => handleMoveCategory(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label={t.moveUp}><ChevronUpIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleMoveCategory(index, 'down')} disabled={index === topLevelCategories.length - 1} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label={t.moveDown}><ChevronDownIcon className="w-5 h-5"/></button>
                                                </div>
                                            )}
                                            <div 
                                                className="p-3 font-semibold text-slate-800 dark:text-slate-200 flex-grow cursor-pointer truncate"
                                                onClick={hasChildren ? () => toggleExpansion(category.id) : undefined}
                                            >
                                                {category.name[language]}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 p-2 flex-shrink-0">
                                            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canEditCategory && <button onClick={() => onEditCategory(category)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                                                {canDeleteCategory && <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
                                            </div>
                                            {hasChildren && (
                                                <button 
                                                    onClick={() => toggleExpansion(category.id)} 
                                                    className="p-2 text-slate-500"
                                                    aria-expanded={isExpanded}
                                                    aria-label={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {hasChildren && (
                                        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                            <div className="overflow-hidden">
                                                <ul className="py-1 border-t border-slate-200 dark:border-slate-700">
                                                    {category.children!.map(child => (
                                                        <SubCategoryItem
                                                            key={child.id}
                                                            category={child}
                                                            level={1}
                                                            onEditCategory={onEditCategory}
                                                            onDeleteCategory={handleDeleteCategory}
                                                            canEdit={canEditCategory}
                                                            canDelete={canDeleteCategory}
                                                        />
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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