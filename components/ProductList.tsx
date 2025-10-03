
import React from 'react';
import type { Product, Language, CartItem } from '../types';
import { ProductCard } from './ProductCard';
import { useTranslations } from '../i18n/translations';

interface ProductListProps {
  titleKey: keyof ReturnType<typeof useTranslations>;
  products: Product[];
  language: Language;
  onProductClick: (product: Product) => void;
  addToCart: (product: Product, quantity: number, options?: { [key:string]: string }) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ titleKey, products, language, onProductClick, addToCart }) => {
  const t = useTranslations(language);
  
  if (products.length === 0) return null;

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