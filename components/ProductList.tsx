import React from 'react';
import type { Product, Language, CartItem } from '../types';
import { ProductCard } from './ProductCard';
import { useTranslations } from '../i18n/translations';

interface ProductListProps {
  titleKey: keyof ReturnType<typeof useTranslations>;
  products: Product[];
  language: Language;
  onProductClick: (product: Product) => void;
  addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ titleKey, products, language, onProductClick, addToCart }) => {
  const t = useTranslations(language);
  
  if (products.length === 0) return null;

  return (
    <section className="my-12">
      <h2 className="text-3xl font-bold mb-6 border-b-4 border-primary-500 pb-2 inline-block">{t[titleKey]}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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