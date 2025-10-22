import React, { useRef, useCallback, useEffect } from 'react';
import type { Product, Language, CartItem } from '../types';
import { ProductCard } from './ProductCard';
// @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
import { translations } from '../i18n/translations';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface ProductListProps {
  // @FIX: Corrected type for titleKey to use the imported translations object instead of a non-existent hook.
  titleKey: keyof typeof translations['en'];
  products: Product[];
  language: Language;
  onProductClick: (product: Product) => void;
  addToCart: (product: Product, quantity: number, options?: { [key:string]: string }) => void;
  slider?: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({ titleKey, products, language, onProductClick, addToCart, slider = false }) => {
  // @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
  const t = translations[language];
  const sliderRef = useRef<HTMLDivElement>(null);
  const isRtl = language === 'ar';

  const handleScroll = (direction: 'prev' | 'next') => {
    if (sliderRef.current?.children[0]) {
      const slider = sliderRef.current;
      const card = slider.children[0] as HTMLElement;
      let scrollAmount = card.offsetWidth;
      if (direction === 'prev') {
        scrollAmount = -scrollAmount;
      }
      
      slider.scrollBy({ left: isRtl ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  
  if (slider) {
    if (products.length === 0) return null;

    return (
      <section className="my-[10px] animate-fade-in-up">
        <h2 className="text-3xl font-extrabold mb-8 text-slate-900 dark:text-slate-200">{t[titleKey]}</h2>
        <div className="relative -mx-4">
          <div ref={sliderRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide px-2">
            {products.map(product => (
              <div key={product.id} className="w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 flex-shrink-0 snap-center p-2">
                <ProductCard 
                  product={product} 
                  language={language}
                  onProductClick={onProductClick}
                  addToCart={addToCart}
                />
              </div>
            ))}
          </div>
          {products.length > 4 && (
             <>
                <button
                    onClick={() => handleScroll('prev')}
                    className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} z-10 p-2 bg-white/70 dark:bg-slate-900/70 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-900 transition-colors disabled:opacity-0`}
                    aria-label="Previous Product"
                >
                    {isRtl ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
                </button>
                <button
                    onClick={() => handleScroll('next')}
                    className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-4' : 'right-4'} z-10 p-2 bg-white/70 dark:bg-slate-900/70 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-900 transition-colors disabled:opacity-0`}
                    aria-label="Next Product"
                >
                     {isRtl ? <ChevronLeftIcon className="w-6 h-6" /> : <ChevronRightIcon className="w-6 h-6" />}
                </button>
             </>
          )}
        </div>
      </section>
    );
  }

  const isFullMenu = titleKey === 'fullMenu';
  const gridClasses = isFullMenu
    ? 'grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4'
    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6';
  
  const titleClasses = isFullMenu
    ? "text-2xl font-bold mb-4 text-slate-700 dark:text-slate-200 text-center bg-slate-200 dark:bg-slate-800 p-3 rounded-lg"
    : "text-3xl font-extrabold mb-8 text-slate-900 dark:text-slate-200";

  if (products.length === 0) {
    if (isFullMenu) {
      return (
        <section className="py-12 sm:py-16 text-center">
            <h2 className={titleClasses}>{t[titleKey]}</h2>
            <p className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'لم يتم العثور على منتجات تطابق بحثك.' : 'No products match your search.'}</p>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="py-[10px] sm:py-[10px] animate-fade-in-up">
      <h2 className={titleClasses}>{t[titleKey]}</h2>
      <div className={gridClasses}>
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            language={language}
            onProductClick={onProductClick}
            addToCart={addToCart}
          />
        ))}
      </div>
    </section>
  );
};