import React from 'react';
import type { CartItem, Language } from '../types';
import { CartContents } from './CartContents';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  updateCartQuantity: (productId: number, options: { [key: string]: string } | undefined, newQuantity: number) => void;
  clearCart: () => void;
  language: Language;
  onPlaceOrder: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = (props) => {
  const { isOpen, onClose, language } = props;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 bottom-0 ${language === 'ar' ? 'end-0' : 'start-0'} w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
        }`}
      >
        <CartContents {...props} isSidebar={true} onClose={onClose} />
      </div>
    </>
  );
};