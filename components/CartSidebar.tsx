import React from 'react';
import type { CartItem, Language, OrderType } from '../types';
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
}

export const CartSidebar: React.FC<CartSidebarProps> = (props) => {
  const { isOpen, onClose } = props;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ltr:right-0 rtl:left-0 ${
          isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
      >
        <CartContents {...props} isSidebar={true} onClose={onClose} />
      </div>
    </>
  );
};
