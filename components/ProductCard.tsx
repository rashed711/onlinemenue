import React, { useState } from 'react';
import type { Product, Language } from '../types';
// @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
import { translations } from '../i18n/translations';
import { StarIcon, PlusIcon } from './icons/Icons';
import { formatNumber } from '../utils/helpers';

interface ProductCardProps {
  product: Product;
  language: Language;
  onProductClick: (product: Product) => void;
  addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, language, onProductClick, addToCart }) => {
  // @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
  const t = translations[language];
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onProductClick(product);
    }
  }

  return (
    <div 
        onClick={() => onProductClick(product)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name[language]}`}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden group transform hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-cream"
    >
      <div className="relative h-40 sm:h-48">
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
        )}
        <img 
          src={product.image} 
          alt={product.name[language]} 
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 h-10 sm:h-12 line-clamp-2">{product.name[language]}</h3>
        
        <div className="flex justify-between items-center mt-2">
          <p className="text-lg sm:text-xl font-extrabold text-primary-700 dark:text-primary-400">
            {product.price.toFixed(2)} <span className="text-xs sm:text-sm font-semibold">{t.currency}</span>
          </p>
        </div>
      </div>
    </div>
  );
});