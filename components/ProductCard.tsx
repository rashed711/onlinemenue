import React from 'react';
import type { Product, Language } from '../types';
import { useTranslations } from '../i18n/translations';
import { StarIcon, PlusIcon } from './icons/Icons';

interface ProductCardProps {
  product: Product;
  language: Language;
  onProductClick: (product: Product) => void;
  addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, language, onProductClick, addToCart }) => {
  const t = useTranslations(language);
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.options && product.options.length > 0) {
        onProductClick(product); // Open modal if there are options
    } else {
        addToCart(product, 1);
    }
  }

  return (
    <div 
        onClick={() => onProductClick(product)}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden group transform hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col border border-slate-200 dark:border-slate-700/50"
    >
      <div className="relative">
        <img src={product.image} alt={product.name[language]} className="w-full h-40 sm:h-48 object-cover" />
        {product.isNew && <div className="absolute top-3 end-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">{t.newItems.slice(0,-1)}</div>}
        {product.isPopular && !product.isNew && <div className="absolute top-3 end-3 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">{t.mostPopular}</div>}
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 h-10 sm:h-12 line-clamp-2">{product.name[language]}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 flex-grow line-clamp-2">{product.description[language]}</p>
        
        <div className="flex justify-between items-center mt-4">
          <p className="text-lg sm:text-xl font-extrabold text-primary-600 dark:text-primary-400">
            {product.price.toFixed(2)} <span className="text-xs sm:text-sm font-semibold">{t.currency}</span>
          </p>
           <div className="flex items-center bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold ms-1 text-xs sm:text-sm">{product.rating}</span>
          </div>
        </div>
      </div>
       <div className="p-3 pt-0">
         <button
          onClick={handleAddToCart}
          className="w-full bg-primary-500 text-white font-bold py-2 sm:py-3 px-4 rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 shadow-sm hover:shadow-lg transform hover:scale-105 text-xs sm:text-sm"
        >
          <PlusIcon className="w-5 h-5" />
          {t.addToCart}
        </button>
      </div>
    </div>
  );
};