import React, { useState } from 'react';
import type { Product, Language, Promotion } from '../types';
// @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
import { translations } from '../i18n/translations';
import { StarIcon, PlusIcon } from './icons/Icons';
import { formatNumber, getActivePromotionForProduct } from '../utils/helpers';

interface ProductCardProps {
  product: Product;
  language: Language;
  onProductClick: (product: Product) => void;
  addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
  promotions: Promotion[];
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, language, onProductClick, addToCart, promotions }) => {
  // @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
  const t = translations[language];
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const promotion = getActivePromotionForProduct(product.id, promotions);
  const discountedPrice = promotion ? product.price * (1 - promotion.discountPercent / 100) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    