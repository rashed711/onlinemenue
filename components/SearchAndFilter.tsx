
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
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="mb-8 space-y-6">
      <div className="relative">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 ps-12 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <div className="absolute top-1/2 -translate-y-1/2 start-4 text-gray-400">
          <SearchIcon className="w-6 h-6" />
        </div>
      </div>
      
      <div>
        <div className="flex overflow-x-auto space-x-2 space-x-reverse pb-2">
            <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${selectedCategory === null ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            >
                {t.allCategories}
            </button>
            {categories.map(category => (
                <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${selectedCategory === category.id ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                {category.name[language]}
                </button>
            ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-semibold">{t.filterByTags}</span>
        {tags.map(tag => (
          <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTags.includes(tag.id)}
              onChange={() => handleTagChange(tag.id)}
              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <span>{tag.name[language]}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
