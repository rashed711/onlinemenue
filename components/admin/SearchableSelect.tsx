import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useUI } from '../../contexts/UIContext';
import { ChevronDownIcon, SearchIcon } from '../icons/Icons';
import { normalizeArabic } from '../../utils/helpers';

interface SearchableSelectProps {
  options: { value: string | number; label: string }[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  placeholder: string;
  disabled?: boolean;
}

const DropdownPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const el = document.getElementById('portal-root');
    if (!el) return null;
    return ReactDOM.createPortal(children, el);
};


export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, disabled }) => {
    const { t, language } = useUI();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const updateDropdownPosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom,
                left: rect.left,
                width: rect.width,
            });
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        
        if (isOpen) {
            updateDropdownPosition();
            const handleScroll = () => setIsOpen(false);
            window.addEventListener('scroll', handleScroll, true); // Use capture phase
            return () => {
                document.removeEventListener('mousedown', handleClickOutside, true);
                window.removeEventListener('scroll', handleScroll, true);
            }
        }
        
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, [isOpen, updateDropdownPosition]);


    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const normalizedSearch = normalizeArabic(searchTerm.toLowerCase());
        return options.filter(opt => 
            normalizeArabic(opt.label.toLowerCase()).includes(normalizedSearch)
        );
    }, [searchTerm, options]);

    const handleSelect = (selectedValue: string | number) => {
        onChange(selectedValue);
        setSearchTerm('');
        setIsOpen(false);
    };

    const selectedLabel = useMemo(() => {
        return options.find(opt => opt.value === value)?.label || placeholder;
    }, [options, value, placeholder]);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <button 
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white flex justify-between items-center text-start text-sm"
                disabled={disabled}
            >
                <span className={`truncate ${value ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {selectedLabel}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <DropdownPortal>
                    <div 
                        className="fixed z-[60] bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 max-h-60 flex flex-col animate-fade-in"
                        style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            width: `${dropdownPosition.width}px`,
                        }}
                    >
                        <div className="p-2 border-b dark:border-slate-700">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t.search + '...'}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full p-2 ps-8 text-sm border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    autoFocus
                                />
                                <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-2.5 w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                        <ul className="overflow-y-auto">
                            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                                <li key={opt.value}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full text-start p-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${opt.value === value ? 'font-bold bg-slate-100 dark:bg-slate-700' : ''}`}
                                    >
                                        {opt.label}
                                    </button>
                                </li>
                            )) : <li className="p-3 text-sm text-center text-slate-500">{language === 'ar' ? 'لا توجد نتائج' : 'No results found'}</li>}
                        </ul>
                    </div>
                </DropdownPortal>
            )}
        </div>
    );
};