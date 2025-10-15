import React, { useMemo } from 'react';
import type { CartItem, Language, OrderType, RestaurantInfo } from '../types';
import { PlusIcon, MinusIcon, CloseIcon } from './icons/Icons';
import { calculateTotal, formatNumber } from '../utils/helpers';
import { TableSelector } from './TableSelector';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';

interface CartContentsProps {
  onPlaceOrder: () => void; // For Dine-in from sidebar
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  tableNumber?: string;
  setTableNumber?: (table: string) => void;
  isSidebar?: boolean;
  onClose?: () => void;
}

export const CartContents: React.FC<CartContentsProps> = ({
  onPlaceOrder,
  orderType,
  setOrderType,
  tableNumber,
  setTableNumber,
  isSidebar = false,
  onClose,
}) => {
  const { cartItems, updateCartQuantity, clearCart } = useCart();
  const { language, t } = useUI();
  const { restaurantInfo } = useData();

  const subtotal = useMemo(() => calculateTotal(cartItems), [cartItems]);

  const handleCheckout = () => {
      if (onClose) onClose();
      window.location.hash = '#/checkout';
  }

  const handlePlaceOrderClick = () => {
      if (orderType === 'Delivery' || orderType === 'Takeaway') {
          handleCheckout();
      } else {
          onPlaceOrder();
          if (isSidebar && onClose) {
              onClose();
          }
      }
  }

  const getItemVariantId = (item: CartItem) => {
      return item.product.id + JSON.stringify(item.options || {});
  }
  
  const orderTypeClasses = "w-full py-2.5 text-sm font-bold transition-colors duration-200 rounded-md";
  const activeOrderTypeClasses = "bg-primary-600 text-white shadow";
  const inactiveOrderTypeClasses = "text-slate-700 dark:text-slate-200";
  
  const isPlaceOrderDisabled = cartItems.length === 0 || (orderType === 'Dine-in' && !tableNumber?.trim());
  const placeOrderButtonText = (orderType === 'Delivery' || orderType === 'Takeaway') ? t.checkout : t.placeOrder;

  if (!restaurantInfo) return null;

  return (
    <>
      <div className="relative flex justify-between items-center p-4 pt-5 sm:pt-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full sm:hidden" aria-hidden="true"></div>
        <h2 id="cart-heading" className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.cart}</h2>
        {isSidebar && onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t.close}>
              <CloseIcon className="w-6 h-6"/>
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="flex-grow flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-slate-500 dark:text-slate-400">{t.emptyCart}</p>
            <a href="#menu" onClick={onClose} className="mt-2 text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              {language === 'ar' ? 'ابدأ التسوق' : 'Start Shopping'}
            </a>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto p-4 space-y-4 flex-grow">
          {cartItems.map(item => (
            <div key={getItemVariantId(item)} className="flex items-start gap-4">
              <img src={item.product.image} alt={item.product.name[language]} className="w-20 h-20 rounded-lg object-cover" loading="lazy" />
              <div className="flex-grow">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{item.product.name[language]}</h3>
                {item.options && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {Object.entries(item.options).map(([optionKey, valueKey]) => {
                            const option = item.product.options?.find(o => o.name.en === optionKey);
                            const value = option?.values.find(v => v.name.en === valueKey);
                            if (option && value) return <div key={optionKey}>{option.name[language]}: {value.name[language]}</div>
                            return null;
                        })}
                    </div>
                )}
                <p className="font-bold text-primary-500 mt-1">{(item.product.price).toFixed(2)} {t.currency}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-full">
                  <button onClick={() => updateCartQuantity(item.product.id, item.options, item.quantity - 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-full" aria-label="Decrease quantity"><MinusIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" /></button>
                  <span className="px-2 font-semibold text-sm text-slate-800 dark:text-slate-100" aria-live="polite">{formatNumber(item.quantity)}</span>
                  <button onClick={() => updateCartQuantity(item.product.id, item.options, item.quantity + 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r-full" aria-label="Increase quantity"><PlusIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4 shrink-0 bg-slate-50 dark:bg-slate-900/50">
           <div className="flex items-center p-1 rounded-lg bg-slate-200 dark:bg-slate-800">
            <button onClick={() => setOrderType('Dine-in')} className={`${orderTypeClasses} ${orderType === 'Dine-in' ? activeOrderTypeClasses : inactiveOrderTypeClasses}`}>{t.dineIn}</button>
            <button onClick={() => setOrderType('Takeaway')} className={`${orderTypeClasses} ${orderType === 'Takeaway' ? activeOrderTypeClasses : inactiveOrderTypeClasses}`}>{t.takeaway}</button>
            <button onClick={() => setOrderType('Delivery')} className={`${orderTypeClasses} ${orderType === 'Delivery' ? activeOrderTypeClasses : inactiveOrderTypeClasses}`}>{t.delivery}</button>
          </div>

           {orderType === 'Dine-in' && setTableNumber && (
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.tableNumber}</label>
                 <TableSelector tableCount={restaurantInfo.tableCount || 0} selectedTable={tableNumber || ''} onSelectTable={setTableNumber} />
            </div>
           )}

          <div className="flex justify-between font-bold text-lg text-slate-800 dark:text-slate-100">
            <span>{t.total}</span>
            <span>{subtotal.toFixed(2)} {t.currency}</span>
          </div>
          <button onClick={handlePlaceOrderClick} disabled={isPlaceOrderDisabled} className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-all flex justify-center items-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
            {placeOrderButtonText}
          </button>
           <button onClick={clearCart} className="w-full text-center text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-semibold">Clear Cart</button>
        </div>
      )}
    </>
  );
};