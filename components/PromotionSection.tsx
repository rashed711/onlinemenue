
import React from 'react';
import type { Promotion, Language, Product } from '../types';
import { useTranslations } from '../i18n/translations';
import { useCountdown } from '../hooks/useCountdown';
import { products } from '../data/mockData';

interface PromotionCardProps {
  promotion: Promotion;
  language: Language;
  onProductClick: (product: Product) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, language, onProductClick }) => {
    const t = useTranslations(language);
    const { days, hours, minutes, seconds } = useCountdown(promotion.endDate);
    const product = products.find(p => p.id === promotion.productId);

    if (!product || (days + hours + minutes + seconds <= 0)) {
        return null;
    }
    
    const discountedPrice = product.price * (1 - promotion.discountPercent / 100);

    return (
        <div onClick={() => onProductClick(product)} className="bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-2xl cursor-pointer transform hover:scale-105 transition-transform duration-300">
            <img src={product.image} alt={product.name[language]} className="w-32 h-32 rounded-full object-cover border-4 border-primary-300" />
            <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold">{promotion.title[language]}</h3>
                <p className="mt-1">{promotion.description[language]}</p>
                <div className="flex items-baseline gap-2 mt-2 justify-center md:justify-start">
                    <span className="text-3xl font-extrabold">{discountedPrice.toFixed(2)} {t.currency}</span>
                    <span className="line-through text-lg opacity-80">{product.price.toFixed(2)} {t.currency}</span>
                </div>
            </div>
            <div className="text-center">
                <p className="font-semibold uppercase text-sm opacity-90">{t.expiresIn}</p>
                <div className="flex gap-2 text-2xl font-mono font-bold mt-1">
                    <div className="bg-white/20 p-2 rounded-md">{String(days).padStart(2,'0')}<span className="text-xs">{t.days}</span></div>
                    <div className="bg-white/20 p-2 rounded-md">{String(hours).padStart(2,'0')}<span className="text-xs">{t.hours}</span></div>
                    <div className="bg-white/20 p-2 rounded-md">{String(minutes).padStart(2,'0')}<span className="text-xs">{t.minutes}</span></div>
                    <div className="bg-white/20 p-2 rounded-md">{String(seconds).padStart(2,'0')}<span className="text-xs">{t.seconds}</span></div>
                </div>
            </div>
        </div>
    )
}

interface PromotionSectionProps {
  promotions: Promotion[];
  language: Language;
  onProductClick: (product: Product) => void;
}

export const PromotionSection: React.FC<PromotionSectionProps> = ({ promotions, language, onProductClick }) => {
  const t = useTranslations(language);
  
  if (!promotions || promotions.length === 0) {
    return null;
  }

  return (
    <section className="my-12">
        <h2 className="text-3xl font-bold mb-6 border-b-4 border-primary-500 pb-2 inline-block">{t.todaysOffers}</h2>
        <div className="space-y-6">
            {promotions.map(promo => (
                <PromotionCard key={promo.id} promotion={promo} language={language} onProductClick={onProductClick} />
            ))}
        </div>
    </section>
  )
}
