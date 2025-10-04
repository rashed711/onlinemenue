

import React, { useRef, useCallback, useEffect } from 'react';
import type { Product, Language, CartItem } from '../types';
import { ProductCard } from './ProductCard';
import { useTranslations } from '../i18n/translations';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface ProductListProps {
  titleKey: keyof ReturnType<typeof useTranslations>;
  products: Product[];
  language: Language;
  onProductClick: (product: Product) => void;
  addToCart: (product: Product, quantity: number, options?: { [key:string]: string }) => void;
  slider?: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({ titleKey, products, language, onProductClick, addToCart, slider = false }) => {
  const t = useTranslations(language);
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
        <h2 className="text-3xl font-extrabold mb-8">{t[titleKey]}</h2>
        <div className="relative -mx-4">
          <div ref={sliderRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide px-2">
            {products.map(product => (
              <div key={product.id} className="w-[85%] sm:w-1/2 md:w-1/3 lg:w-1/4 flex-shrink-0 snap-center p-2">
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

  // Use a 2-column layout for the main menu for better readability, and multi-column for featured sections.
  const gridClasses = titleKey === 'fullMenu' 
    ? 'grid grid-cols-2 gap-4 sm:gap-6 md:gap-8' 
    : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8';

  return (
    <section className="my-12 sm:my-16 animate-fade-in-up">
      <h2 className="text-3xl font-extrabold mb-8">{t[titleKey]}</h2>
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
