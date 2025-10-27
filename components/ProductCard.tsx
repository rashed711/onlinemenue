import React, { useState } from 'react';
import type { Product, Language, Promotion } from '../types';
// @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
import { translations } from '../i18n/translations';
import { StarIcon, PlusIcon } from './icons/Icons';
import { formatNumber, getActivePromotionForProduct } from '../utils/helpers';

interface ProductCardProps {
  product: Product;
  language: Language;
  onProductClick: (product: Product) => void;
  addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
  promotions: Promotion[];
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, language, onProductClick, addToCart, promotions }) => {
  // @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
  const t = translations[language];
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const promotion = getActivePromotionForProduct(product.id, promotions);
  const discountedPrice = promotion ? product.price * (1 - promotion.discountPercent / 100) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.options && product.options.length > 0) {
        onProductClick(product); // Open modal if there are options
    } else {
        addToCart(product, 1);
    }
  }

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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden group transform hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col border border-slate-200 dark:border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
    >
      <div className="relative h-40 sm:h-48">
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
        {promotion && <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">-{promotion.discountPercent}%</div>}
        {product.isNew && <div className="absolute top-3 end-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">{t.newItem}</div>}
        {product.isPopular && !product.isNew && !promotion && <div className="absolute top-3 end-3 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">{t.mostPopular}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 h-10 sm:h-12 line-clamp-2">{product.name[language]}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 flex-grow line-clamp-2 whitespace-pre-wrap">{product.description[language]}</p>
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-lg sm:text-xl font-extrabold text-primary-600 dark:text-primary-400">
            {discountedPrice ? (
                <div className="flex items-baseline gap-2">
                    <span>{discountedPrice.toFixed(2)}</span>
                    <span className="text-sm line-through text-slate-500 dark:text-slate-400 font-normal">{product.price.toFixed(2)}</span>
                </div>
            ) : (
                <span>{product.price.toFixed(2)}</span>
            )}
            <span className="text-xs sm:text-sm font-semibold">{t.currency}</span>
          </div>
           <div className="flex items-center bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold ms-1 text-xs sm:text-sm">{formatNumber(product.rating)}</span>
          </div>
        </div>
      </div>
       <div className="p-3 pt-0">
         <button
          onClick={handleAddToCart}
          className="w-full bg-primary-500 text-white font-bold py-2 sm:py-3 px-4 rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 shadow-sm hover:shadow-lg transform hover:scale-105 text-xs sm:text-sm"
          aria-label={`Add ${product.name[language]} to cart`}
        >
          <PlusIcon className="w-5 h-5" />
          {t.addToCart}
        </button>
      </div>
    </div>
  );
});