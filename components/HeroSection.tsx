import React from 'react';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';

export const HeroSection: React.FC = () => {
    const { restaurantInfo } = useData();
    const { t, language } = useUI();

    if (!restaurantInfo) {
        return null;
    }

    const visibleLinks = restaurantInfo.socialLinks.filter(link => link.isVisible);

    return (
        <div 
            className="relative h-[45vh] min-h-[300px] max-h-[400px] bg-cover bg-center text-white"
            style={{ backgroundImage: `url(${restaurantInfo.heroImage})` }}
        >
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative h-full flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight animate-fade-in-up" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)', animationDelay: '100ms' }}>
                    {restaurantInfo.heroTitle[language]}
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-slate-200 animate-fade-in-up" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)', animationDelay: '200ms' }}>
                    {restaurantInfo.description[language]}
                </p>
                
                <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
                    {visibleLinks.map((link, index) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-14 h-14 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white rounded-full transition-all transform hover:scale-110 inline-flex items-center justify-center shadow-lg hover:shadow-xl social-button-entry-animate"
                            aria-label={link.name}
                            title={link.name}
                            style={{ animationDelay: `${400 + index * 100}ms` }}
                        >
                           <img 
                                src={link.icon} 
                                alt={link.name} 
                                className="w-7 h-7 object-contain animate-float"
                                style={{ animationDelay: `${(400 + index * 100) + 600}ms` }}
                           />
                        </a>
                    ))}
                </div>

            </div>
        </div>
    );
};