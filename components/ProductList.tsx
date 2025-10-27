import React, { useRef, useCallback, useEffect } from 'react';
import type { Product, Language, CartItem, Promotion } from '../types';
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
  promotions: Promotion[];
}

export const ProductList: React.FC<ProductListProps> = ({ titleKey, products, language, onProductClick, addToCart, slider = false, promotions }) => {
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
  
  if (products.length === 0) return null;

  if (slider) {
    return (
      <section className="my-12 sm:my-16 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold mb-8 text-slate-900 dark:text-slate-200">{t[titleKey]}</h2>
        <div className="relative -mx-4">
          <div ref={sliderRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide px-2">
            {products.map(product => (
              <div key={product.id} className="w-11/12 sm:w-1/2 md:w-1/3 lg:w-1/4 flex-shrink-0 snap-center p-2">
                <ProductCard 
                  product={product} 
                  language={language}
                  onProductClick={onProductClick}
                  addToCart={addToCart}
                  promotions={promotions}
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

  const gridClasses = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6';

  return (
    <section className="my-12 sm:my-16 animate-fade-in-up">
      <h2 className="text-3xl font-extrabold mb-8 text-slate-900 dark:text-slate-200">{t[titleKey]}</h2>
      <div className={gridClasses}>
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            language={language}
            onProductClick={onProductClick}
            addToCart={addToCart}
            promotions={promotions}
          />
        ))}
      </div>
    </section>
  );
};