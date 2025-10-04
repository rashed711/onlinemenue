import React from 'react';
import type { Language } from '../types';
import { useTranslations } from '../i18n/translations';

interface HeroSectionProps {
  language: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ language }) => {
  const t = useTranslations(language);

  const handleScrollToMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const menuElement = document.getElementById('menu');
    if (menuElement) {
      menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative h-[60vh] min-h-[400px] max-h-[600px] flex items-center justify-center text-white text-center">
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <img 
        src="https://picsum.photos/seed/foods/1600/900" 
        alt="Delicious food spread" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-20 p-4 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
          {t.heroTitle}
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>
          {t.heroSubtitle}
        </p>
        <a 
          href="#menu"
          onClick={handleScrollToMenu}
          className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 inline-block"
        >
          {t.viewMenu}
        </a>
      </div>
    </section>
  );
};