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
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (product.options && product.options.length > 0) {
          onProductClick(product);
      } else {
          addToCart(product, 1);
      }
  };

  return (
    <div 
        onClick={() => onProductClick(product)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name[language]}`}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden group transform hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-cream"
    >
      <div className="relative aspect-square w-full">
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
        )}
        <img 
          src={product.image} 
          alt={product.name[language]} 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>
      <div className="p-2">
        <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{product.name[language]}</p>
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">{product.price.toFixed(2)} {t.currency}</p>
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={handleAddToCartClick}
                    className="w-8 h-8 flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-white rounded-full transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"
                    aria-label={t.addToCart}
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
});