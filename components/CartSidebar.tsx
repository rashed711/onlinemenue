import React from 'react';
import ReactDOM from 'react-dom';
import type { CartItem, Language, OrderType, RestaurantInfo } from '../types';
import { CartContents } from './CartContents';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  updateCartQuantity: (productId: number, options: { [key: string]: string } | undefined, newQuantity: number) => void;
  clearCart: () => void;
  language: Language;
  onPlaceOrder: () => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  restaurantInfo: RestaurantInfo;
}

export const CartSidebar: React.FC<CartSidebarProps> = (props) => {
  const { isOpen, onClose } = props;

  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed bottom-0 inset-x-0 sm:top-0 ltr:sm:right-0 rtl:sm:left-0 w-full sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out rounded-t-2xl sm:rounded-none max-h-[85vh] sm:max-h-full ${
          isOpen ? 'translate-y-0' : 'translate-y-full ltr:sm:translate-x-full rtl:sm:-translate-x-full sm:translate-y-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
      >
        <CartContents {...props} isSidebar={true} onClose={onClose} />
      </div>
    </>,
    portalRoot
  );
};