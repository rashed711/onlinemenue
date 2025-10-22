import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Language, Category, Tag } from '../types';
import { translations } from '../i18n/translations';
import { DrinkIcon, DessertIcon, AppetizerIcon, MainCourseIcon, CutleryIcon, ChevronDownIcon, PizzaIcon, SandwichIcon, SaladIcon, BreakfastIcon } from './icons/Icons';

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

const getCategoryIcon = (category: Category) => {
  const name = category.name.en.toLowerCase();
  
  if (name.includes('pizza')) return PizzaIcon;
  if (name.includes('sandwich')) return SandwichIcon;
  if (name.includes('salad')) return SaladIcon;
  if (name.includes('breakfast') || name.includes('coffee') || name.includes('hot')) return BreakfastIcon;
  if (name.includes('drink') || name.includes('beverage')) return DrinkIcon;
  if (name.includes('dessert') || name.includes('sweet')) return DessertIcon;
  if (name.includes('appetizer') || name.includes('starter')) return AppetizerIcon;
  if (name.includes('main') || name.includes('course') || name.includes('dishes')) return MainCourseIcon;

  return CutleryIcon; // Default icon
};


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
  const t = translations[language];
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownsRef = useRef<HTMLDivElement>(null);

  const topLevelCategories = useMemo(() => {
    const sorter = (a: Category, b: Category) => 
        a.name[language].localeCompare(b.name[language], language);

    // Deep copy to avoid mutating original data from context
    const categoriesCopy: Category[] = JSON.parse(JSON.stringify(categories));

    // Sort children of each category
    categoriesCopy.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
            cat.children.sort(sorter);
        }
    });

    // Sort top-level categories
    categoriesCopy.sort(sorter);

    return categoriesCopy;
  }, [categories, language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownsRef.current && !dropdownsRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isCategoryOrChildSelected = useCallback((category: Category): boolean => {
    if (selectedCategory === null) return false;
    if (selectedCategory === category.id) return true;
    return category.children?.some(child => child.id === selectedCategory) || false;
  }, [selectedCategory]);


  return (
    <div id="menu" className="relative z-30 py-8">
      {/* Categories */}
      <div ref={dropdownsRef} className="flex items-start justify-start md:justify-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide py-2 pb-40 -mb-40">
          <button
              onClick={() => { setSelectedCategory(null); setOpenDropdown(null); }}
              className="flex flex-col items-center justify-center gap-2 group flex-shrink-0 transition-transform transform hover:scale-105"
          >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${selectedCategory === null ? 'bg-primary-600 shadow-lg' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50'}`}>
                <span className={`font-bold text-lg ${selectedCategory === null ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{t.allCategories}</span>
              </div>
          </button>
          {topLevelCategories.map((category) => {
              const Icon = getCategoryIcon(category);
              const isSelected = isCategoryOrChildSelected(category);
              const hasChildren = category.children && category.children.length > 0;
              
              const buttonContent = (
                <>
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-primary-600 shadow-lg' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50'}`}>
                        <Icon className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300 group-hover:text-primary-700 dark:group-hover:text-primary-300'}`} />
                    </div>
                    <span className={`flex items-center gap-1 text-xs sm:text-sm font-bold transition-colors ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {category.name[language]}
                        {hasChildren && <ChevronDownIcon className={`w-4 h-4 transition-transform ${openDropdown === category.id ? 'rotate-180' : ''}`} />}
                    </span>
                </>
              );

              if (hasChildren) {
                  return (
                      <div key={category.id} className="relative flex-shrink-0">
                          <button
                              onClick={() => setOpenDropdown(prev => prev === category.id ? null : category.id)}
                              className="flex flex-col items-center justify-center gap-2 group transition-transform transform hover:scale-105"
                          >
                            {buttonContent}
                          </button>
                          {openDropdown === category.id && (
                               <div className="absolute top-full mt-2 start-0 z-30 min-w-full w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in py-1">
                                  <button
                                    onClick={() => { setSelectedCategory(category.id); setOpenDropdown(null); }}
                                    className={`block w-full text-start px-3 py-2 text-sm transition-colors ${selectedCategory === category.id && !category.children?.some(c => c.id === selectedCategory) ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                  >
                                    {t.all} {category.name[language]}
                                  </button>
                                  {category.children!.map(child => (
                                    <button
                                      key={child.id}
                                      onClick={() => { setSelectedCategory(child.id); setOpenDropdown(null); }}
                                      className={`block w-full text-start px-3 py-2 text-sm transition-colors ${selectedCategory === child.id ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    >
                                      {child.name[language]}
                                    </button>
                                  ))}
                                </div>
                          )}
                      </div>
                  );
              }

              return (
                 <button
                    key={category.id}
                    onClick={() => { setSelectedCategory(isSelected ? null : category.id); setOpenDropdown(null); }}
                    className="flex flex-col items-center justify-center gap-2 group flex-shrink-0 transition-transform transform hover:scale-105"
                >
                   {buttonContent}
                </button>
              )
          })}
      </div>
    </div>
  );
};