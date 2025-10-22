import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import type { Promotion, Product } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
import { useUI } from '../contexts/UIContext';
import { formatNumber } from '../utils/helpers';

interface PromotionCardProps {
  promotion: Promotion;
  product: Product;
  onProductClick: (product: Product) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, product, onProductClick }) => {
    const { t, language } = useUI();
    const { days, hours, minutes, seconds } = useCountdown(promotion.endDate);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    if (!product) {
        return null;
    }
    
    const discountedPrice = product.price * (1 - promotion.discountPercent / 100);
    const discountText = `-${formatNumber(promotion.discountPercent)}%`;

    return (
        <div onClick={() => onProductClick(product)} className="relative aspect-[16/9] sm:aspect-[2/1] md:aspect-[2.5/1] w-full bg-slate-800 text-white rounded-2xl overflow-hidden shadow-xl cursor-pointer group">
            {/* Background Image */}
            {!isImageLoaded && <div className="absolute inset-0 bg-primary-400/50 animate-pulse"></div>}
            <img 
                src={product.image} 
                alt={product.name[language]} 
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setIsImageLoaded(true)}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
            
            {/* Discount Badge */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-600 text-white text-xs sm:text-sm font-bold px-3 py-1 rounded-full shadow-lg transform group-hover:scale-110 transition-transform z-10">
                {discountText}
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-4 sm:p-5">
                 <div className="mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold drop-shadow-lg">{promotion.title[language]}</h3>
                    <p className="mt-1 text-sm opacity-90 line-clamp-1 drop-shadow-md">{product.name[language]}</p>
                </div>
                
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
                    {/* Prices */}
                    <div className="flex items-baseline gap-2 drop-shadow-lg">
                        <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">{discountedPrice.toFixed(2)}</span>
                        <span className="text-xl sm:text-2xl font-bold text-amber-400">{t.currency}</span>
                        <span className="line-through text-md sm:text-lg opacity-70">{product.price.toFixed(2)}</span>
                    </div>
                    {/* Countdown */}
                    <div className="flex-shrink-0">
                        <div className="flex rtl:flex-row-reverse gap-1.5 text-sm sm:text-base font-bold">
                            <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-lg w-12 sm:w-14 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold font-sans">{String(days).padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase opacity-75 -mt-1">{t.days}</span>
                            </div>
                             <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-lg w-12 sm:w-14 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold font-sans">{String(hours).padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase opacity-75 -mt-1">{t.hours}</span>
                            </div>
                             <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-lg w-12 sm:w-14 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold font-sans">{String(minutes).padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase opacity-75 -mt-1">{t.minutes}</span>
                            </div>
                             <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-lg w-12 sm:w-14 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold font-sans">{String(seconds).padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase opacity-75 -mt-1">{t.seconds}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface PromotionSectionProps {
  promotions: Promotion[];
  products: Product[];
  onProductClick: (product: Product) => void;
}

export const PromotionSection: React.FC<PromotionSectionProps> = ({ promotions, products, onProductClick }) => {
  const { t, language } = useUI();
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const isRtl = language === 'ar';
  
  const displayablePromotions = useMemo(() => {
    const now = new Date();
    return promotions
      .map(promo => {
        const product = products.find(p => p.id === promo.productId);
        if (!promo.isActive || new Date(promo.endDate) <= now || !product || !product.isVisible) {
          return null;
        }
        return { promo, product };
      })
      .filter((item): item is { promo: Promotion; product: Product } => item !== null);
  }, [promotions, products]);

  const handleScroll = (direction: 'prev' | 'next') => {
    if (sliderRef.current?.children[0]) {
      const slider = sliderRef.current;
      const card = slider.children[0] as HTMLElement;
      let scrollAmount = card.offsetWidth;
      if (direction === 'prev') {
        scrollAmount = -scrollAmount;
      }
      
      slider.scrollBy({ left: isRtl ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollNext = useCallback(() => {
    if (sliderRef.current?.children[0]) {
      const slider = sliderRef.current;
      const cardWidth = (slider.children[0] as HTMLElement).offsetWidth;
      const maxScroll = slider.scrollWidth - slider.clientWidth;

      const isNearEnd = isRtl
        ? slider.scrollLeft <= 1
        : slider.scrollLeft >= maxScroll - 1;

      if (isNearEnd) {
        slider.scrollTo({ left: isRtl ? maxScroll : 0, behavior: 'smooth' });
      } else {
        slider.scrollBy({ left: isRtl ? -cardWidth : cardWidth, behavior: 'smooth' });
      }
    }
  }, [isRtl]);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (displayablePromotions.length > 1) {
        intervalRef.current = window.setInterval(scrollNext, 3500);
    }
  }, [scrollNext, displayablePromotions.length]);

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay]);
  
  if (displayablePromotions.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto max-w-7xl px-4 pt-8 animate-fade-in">
        <h2 className="text-3xl font-extrabold mb-6 text-slate-900 dark:text-slate-200 hidden sm:block">{t.todaysOffers}</h2>
        <div className="relative" onMouseEnter={stopAutoPlay} onMouseLeave={startAutoPlay} onTouchStart={stopAutoPlay} onTouchEnd={startAutoPlay}>
            <div ref={sliderRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide -mx-2">
                {displayablePromotions.map(({ promo, product }) => {
                    return (
                        <div key={promo.id} className="w-full flex-shrink-0 snap-center p-2">
                             <PromotionCard promotion={promo} product={product} onProductClick={onProductClick} />
                        </div>
                    );
                })}
            </div>
            {displayablePromotions.length > 1 && (
                <>
                    <button
                        onClick={() => handleScroll('prev')}
                        className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} z-10 p-2 items-center justify-center bg-white/70 dark:bg-slate-900/70 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-900 transition-colors`}
                        aria-label="Previous Offer"
                    >
                        {isRtl ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
                    </button>
                    <button
                        onClick={() => handleScroll('next')}
                        className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-4' : 'right-4'} z-10 p-2 items-center justify-center bg-white/70 dark:bg-slate-900/70 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-900 transition-colors`}
                        aria-label="Next Offer"
                    >
                        {isRtl ? <ChevronLeftIcon className="w-6 h-6" /> : <ChevronRightIcon className="w-6 h-6" />}
                    </button>
                </>
            )}
        </div>
    </section>
  )
}