import React, { useMemo } from 'react';
import type { CartItem, Language } from '../types';
import { useTranslations } from '../i18n/translations';
import { PlusIcon, MinusIcon, CloseIcon } from './icons/Icons';

interface CartContentsProps {
  cartItems: CartItem[];
  updateCartQuantity: (productId: number, options: { [key: string]: string } | undefined, newQuantity: number) => void;
  clearCart: () => void;
  language: Language;
  onPlaceOrder: () => void;
  isSidebar?: boolean;
  onClose?: () => void;
}

export const CartContents: React.FC<CartContentsProps> = ({
  cartItems,
  updateCartQuantity,
  clearCart,
  language,
  onPlaceOrder,
  isSidebar = false,
  onClose,
}) => {
  const t = useTranslations(language);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
        let itemPrice = item.product.price;
        if(item.options && item.product.options) {
            Object.entries(item.options).forEach(([optionKey, valueKey]) => {
                const option = item.product.options?.find(opt => opt.name.en === optionKey);
                const value = option?.values.find(val => val.name.en === valueKey);
                if(value) {
                    itemPrice += value.priceModifier;
                }
            });
        }
        return total + itemPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  const handlePlaceOrderClick = () => {
      onPlaceOrder();
      if (isSidebar && onClose) {
          onClose();
      }
  }

  const getItemVariantId = (item: CartItem) => {
      return item.product.id + JSON.stringify(item.options || {});
  }

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">{t.cart}</h2>
        {isSidebar && onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <CloseIcon className="w-6 h-6"/>
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="flex-grow flex items-center justify-center p-4 min-h-[200px]">
          <p className="text-gray-500">{t.emptyCart}</p>
        </div>
      ) : (
        <div className="overflow-y-auto p-4 space-y-4 max-h-[50vh]">
          {cartItems.map(item => (
            <div key={getItemVariantId(item)} className="flex items-start gap-4">
              <img src={item.product.image} alt={item.product.name[language]} className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-grow">
                <h3 className="font-semibold">{item.product.name[language]}</h3>
                {item.options && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {Object.entries(item.options).map(([optionKey, valueKey]) => {
                            const option = item.product.options?.find(o => o.name.en === optionKey);
                            const value = option?.values.find(v => v.name.en === valueKey);
                            if (option && value) {
                                return <div key={optionKey}>{option.name[language]}: {value.name[language]}</div>
                            }
                            return null;
                        })}
                    </div>
                )}
                <p className="font-bold text-primary-500 mt-1">{(item.product.price).toFixed(2)} {t.currency}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-full">
                  <button onClick={() => updateCartQuantity(item.product.id, item.options, item.quantity - 1)} className="p-2"><MinusIcon className="w-4 h-4" /></button>
                  <span className="px-2 font-semibold">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.product.id, item.options, item.quantity + 1)} className="p-2"><PlusIcon className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4 shrink-0">
          <div className="flex justify-between font-bold text-lg">
            <span>{t.total}</span>
            <span>{subtotal.toFixed(2)} {t.currency}</span>
          </div>
          <button
            onClick={handlePlaceOrderClick}
            className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex justify-center items-center"
          >
            {t.placeOrder}
          </button>
           <button
            onClick={clearCart}
            className="w-full text-center text-red-500 hover:text-red-700 text-sm"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
};