import React, { useState, useEffect } from 'react';
import type { Product, Language } from '../types';
import { useTranslations } from '../i18n/translations';
import { StarIcon, PlusIcon, CloseIcon } from './icons/Icons';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
  language: Language;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  addToCart,
  language,
}) => {
  const t = useTranslations(language);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
        onClose();
       }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    const defaultOptions: { [key: string]: string } = {};
    product.options?.forEach(option => {
      if (option.values.length > 0) {
        defaultOptions[option.name.en] = option.values[0].name.en;
      }
    });
    setSelectedOptions(defaultOptions);
    setQuantity(1);

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [product, onClose]);

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
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        
        <div className="sticky top-0 right-0 p-2 z-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex justify-end">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 w-10 h-10 flex items-center justify-center" aria-label={t.close}>
                <CloseIcon className="w-6 h-6"/>
            </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 pt-0 grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
          <div className="md:col-span-2 flex items-center justify-center -mt-12 md:mt-0">
             <img src={product.image} alt={product.name[language]} className="w-full h-auto max-h-[75vh] rounded-xl object-cover shadow-lg" />
          </div>
          <div className="md:col-span-3 flex flex-col">
            <h2 className="text-2xl md:text-3xl font-extrabold">{product.name[language]}</h2>
            <div className="flex items-center my-3 gap-3">
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold ms-1 text-sm">{product.rating}</span>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">{product.description[language]}</p>
            
            <div className="flex-grow space-y-5 my-4">
                {product.options?.map(option => (
                <div key={option.name.en}>
                    <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-100">{option.name[language]}</h4>
                    <div className="flex flex-wrap gap-2">
                    {option.values.map(value => (
                        <button
                        key={value.name.en}
                        onClick={() => handleOptionChange(option.name.en, value.name.en)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${selectedOptions[option.name.en] === value.name.en ? 'bg-primary-500 border-primary-500 text-white shadow-md' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500'}`}
                        >
                        {value.name[language]} {value.priceModifier > 0 && `(+${value.priceModifier.toFixed(2)})`}
                        </button>
                    ))}
                    </div>
                </div>
                ))}
            </div>

            <div className="flex items-center my-6">
              <h4 className="font-semibold me-4 text-slate-800 dark:text-slate-100">{t.quantity}:</h4>
              <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-full">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2 text-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-full" aria-label="Decrease quantity">-</button>
                  <span className="px-4 font-bold text-lg w-12 text-center" aria-live="polite">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="px-4 py-2 text-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-full" aria-label="Increase quantity">+</button>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="text-center sm:text-start">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{t.total}</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400">{calculateTotalPrice().toFixed(2)} {t.currency}</p>
                </div>
                <button onClick={handleAddToCart} className="w-full sm:w-auto bg-primary-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2 transition-all text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <PlusIcon className="w-6 h-6" />
                  {t.addToCart}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};
