
import React, { useState, useEffect } from 'react';
import type { Product, Language } from '../types';
import { useTranslations } from '../i18n/translations';
import { StarIcon, PlusIcon, CloseIcon } from './icons/Icons';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
  language: Language;
  recommendedProducts: Product[];
  onRecommendedClick: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  addToCart,
  language,
  recommendedProducts,
  onRecommendedClick,
}) => {
  const t = useTranslations(language);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const defaultOptions: { [key: string]: string } = {};
    product.options?.forEach(option => {
      if (option.values.length > 0) {
        defaultOptions[option.name.en] = option.values[0].name.en;
      }
    });
    setSelectedOptions(defaultOptions);
    setQuantity(1);
  }, [product]);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedOptions);
    onClose();
  };

  const handleOptionChange = (optionKey: string, valueKey: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionKey]: valueKey }));
  };
  
  const calculateTotalPrice = () => {
    let basePrice = product.price;
    product.options?.forEach(option => {
        const selectedValueKey = selectedOptions[option.name.en];
        const selectedValue = option.values.find(v => v.name.en === selectedValueKey);
        if (selectedValue) {
            basePrice += selectedValue.priceModifier;
        }
    });
    return basePrice * quantity;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-end">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <CloseIcon className="w-6 h-6"/>
            </button>
        </div>
        <div className="p-2 md:p-8 md:pt-0 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <img src={product.image} alt={product.name[language]} className="w-full h-auto rounded-xl object-cover" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-3xl font-extrabold">{product.name[language]}</h2>
            <div className="flex items-center my-3">
              <StarIcon className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold ms-1">{product.rating}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{product.description[language]}</p>
            
            {product.options?.map(option => (
              <div key={option.name.en} className="my-2">
                <h4 className="font-semibold mb-2">{option.name[language]}</h4>
                <div className="flex flex-wrap gap-2">
                  {option.values.map(value => (
                    <button
                      key={value.name.en}
                      onClick={() => handleOptionChange(option.name.en, value.name.en)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedOptions[option.name.en] === value.name.en ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      {value.name[language]} {value.priceModifier > 0 && `(+${value.priceModifier.toFixed(2)})`}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center my-6">
              <h4 className="font-semibold me-4">{t.quantity}:</h4>
              <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-full">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 text-lg">-</button>
                  <span className="px-4 font-bold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="p-3 text-lg">+</button>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-500">{t.total}</span>
                  <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">{calculateTotalPrice().toFixed(2)} {t.currency}</p>
                </div>
                <button onClick={handleAddToCart} className="bg-primary-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-600 flex items-center gap-2 transition-colors">
                  <PlusIcon className="w-6 h-6" />
                  {t.addToCart}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {recommendedProducts.length > 0 && (
          <div className="p-8 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-xl font-bold mb-4">{t.recommendedItems}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {recommendedProducts.map(recProduct => (
                      <div key={recProduct.id} onClick={() => onRecommendedClick(recProduct)} className="cursor-pointer group">
                          <img src={recProduct.image} alt={recProduct.name[language]} className="rounded-lg h-24 w-full object-cover mb-2 transition-transform group-hover:scale-105" />
                          <h4 className="font-semibold text-sm truncate">{recProduct.name[language]}</h4>
                          <p className="text-primary-500 font-bold text-xs">{recProduct.price.toFixed(2)} {t.currency}</p>
                      </div>
                  ))}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};
