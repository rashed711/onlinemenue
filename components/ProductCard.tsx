
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col"
    >
      <div className="relative">
        <img src={product.image} alt={product.name[language]} className="w-full h-48 object-cover" />
        {product.isNew && <div className="absolute top-3 end-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">{t.newItems.slice(0,-1)}</div>}
        {product.isPopular && !product.isNew && <div className="absolute top-3 end-3 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full">{t.mostPopular}</div>}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold truncate">{product.name[language]}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex-grow h-10">{product.description[language]}</p>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            <StarIcon className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-700 dark:text-gray-300 font-semibold ms-1">{product.rating}</span>
          </div>
          <p className="text-xl font-extrabold text-primary-600 dark:text-primary-400">
            {product.price.toFixed(2)} <span className="text-sm">{t.currency}</span>
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          className="w-full mt-4 bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2 transition-colors duration-300"
        >
          <PlusIcon className="w-5 h-5" />
          {t.addToCart}
        </button>
      </div>
    </div>
  );
};