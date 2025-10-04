

import React from 'react';
import type { Language, Category, Tag } from '../types';
import { useTranslations } from '../i18n/translations';
import { SearchIcon } from './icons/Icons';

interface SearchAndFilterProps {
  language: Language;
  categories: Category[];
  tags: Tag[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  language,
  categories,
  tags,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedTags,
  setSelectedTags,
}) => {
  const t = useTranslations(language);

  const handleTagChange = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
  };

  return (
    <div id="menu" className="mb-12 p-4 sm:p-6 bg-white dark:bg-slate-900/50 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 space-y-6">
      <div className="relative">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 ps-12 text-lg border-2 border-slate-200 dark:border-slate-700 rounded-full bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <div className="absolute top-1/2 -translate-y-1/2 start-4 text-slate-400 dark:text-slate-500">
          <SearchIcon className="w-6 h-6" />
        </div>
      </div>
      
      <div>
        <div className="flex overflow-x-auto space-x-2 space-x-reverse pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <button
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === null ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
            >
                {t.allCategories}
            </button>
            {categories.map(category => (
                <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === category.id ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                >
                {category.name[language]}
                </button>
            ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <span className="font-semibold text-sm text-slate-600 dark:text-slate-300">{t.filterByTags}</span>
        {tags.map(tag => (
          <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTags.includes(tag.id)}
              onChange={() => handleTagChange(tag.id)}
              className="sr-only peer"
            />
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-slate-300 dark:border-slate-600 peer-checked:bg-primary-100 dark:peer-checked:bg-primary-900/50 peer-checked:border-primary-500 peer-checked:text-primary-700 dark:peer-checked:text-primary-300 transition-colors">
              {tag.name[language]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
