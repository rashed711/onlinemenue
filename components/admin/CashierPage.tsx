import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { User, Product, Category, CartItem, Order, RestaurantInfo, OrderType, Tag } from '../../types';
import { calculateTotal, formatNumber, calculateItemUnitPrice, calculateItemTotal } from '../../utils/helpers';
import { ProductModal } from '../ProductModal';
import { MinusIcon, PlusIcon, TrashIcon, CloseIcon, CartIcon, SearchIcon, FilterIcon, ChevronUpIcon, ChevronDownIcon, ChevronRightIcon } from '../icons/Icons';
import { TableSelector } from '../TableSelector';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';

const getDescendantCategoryIds = (categoryId: number, categories: Category[]): number[] => {
    const ids: number[] = [];

    const findCategory = (cats: Category[], id: number): Category | null => {
        for (const cat of cats) {
            if (cat.id === id) return cat;
            if (cat.children) {
                const foundInChildren = findCategory(cat.children, id);
                if (foundInChildren) return foundInChildren;
            }
        }
        return null;
    };

    const collectAllIds = (category: Category) => {
        ids.push(category.id);
        if (category.children) {
            for (const child of category.children) {
                collectAllIds(child);
            }
        }
    };

    const startCategory = findCategory(categories, categoryId);
    if (startCategory) {
        collectAllIds(startCategory);
    }
    return ids;
};

interface CashierCartPanelProps {
    isMobile: boolean;
    onClose?: () => void;
    cartItems: CartItem[];
    updateCartQuantity: (index: number, quantity: number) => void;
    clearCart: () => void;
    notes: string;
    setNotes: (notes: string) => void;
    orderType: OrderType;
    handleOrderTypeChange: (type: OrderType) => void;
    tableNumber: string;
    setTableNumber: (table: string) => void;
    customerName: string;
    setCustomerName: (name: string) => void;
    customerMobile: string;
    setCustomerMobile: (mobile: string) => void;
    customerAddress: string;
    setCustomerAddress: (address: string) => void;
    handlePlaceOrder: () => void;
    total: number;
    isPlaceOrderDisabled: boolean;
    mobileStep: 'info' | 'cart';
    setMobileStep: (step: 'info' | 'cart') => void;
    canProceedFromInfo: boolean;
}

const CashierCartPanel: React.FC<CashierCartPanelProps> = ({
    isMobile,
    onClose,
    cartItems,
    updateCartQuantity,
    clearCart,
    notes,
    setNotes,
    orderType,
    handleOrderTypeChange,
    tableNumber,
    setTableNumber,
    customerName,
    setCustomerName,
    customerMobile,
    setCustomerMobile,
    customerAddress,
    setCustomerAddress,
    handlePlaceOrder,
    total,
    isPlaceOrderDisabled,
    mobileStep,
    setMobileStep,
    canProceedFromInfo
}) => {
    const { t, language } = useUI();
    const { restaurantInfo } = useData();

    if (!restaurantInfo) return null;

    const orderTypeClasses = "w-full py-2.5 text-sm font-bold transition-colors duration-200 rounded-md";
    const activeOrderTypeClasses = "bg-primary-600 text-white shadow";
    const inactiveOrderTypeClasses = "text-slate-700 dark:text-slate-200";

    return (
        <>
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.newOrder}</h3>
                {isMobile && onClose && (
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                 <div className={!isMobile || mobileStep === 'info' ? 'block' : 'hidden'}>
                     <div className="p-4 border-b dark:border-slate-700 space-y-4">
                        <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900">
                            <button onClick={() => handleOrderTypeChange('Dine-in')} className={`${orderTypeClasses} ${orderType === 'Dine-in' ? activeOrderTypeClasses : inactiveOrderTypeClasses}`}>{t.dineIn}</button>
                            <button onClick={() => handleOrderTypeChange('Takeaway')} className={`${orderTypeClasses} ${orderType === 'Takeaway' ? activeOrderTypeClasses : inactiveOrderTypeClasses}`}>{t.takeaway}</button>
                            <button onClick={() => handleOrderTypeChange('Delivery')} className={`${orderTypeClasses} ${orderType === 'Delivery' ? activeOrderTypeClasses : inactiveOrderTypeClasses}`}>{t.delivery}</button>
                        </div>
                        {orderType === 'Dine-in' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.tableNumber}</label>
                                <TableSelector
                                    tableCount={restaurantInfo.tableCount || 0}
                                    selectedTable={tableNumber}
                                    onSelectTable={setTableNumber}
                                />
                            </div>
                        )}
                        {orderType === 'Takeaway' && (
                            <div className="space-y-3">
                                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t.customer + ' ' + t.name} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                                <input type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} placeholder={t.mobileNumber + ` (${t.yourComment})`} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </div>
                        )}
                        {orderType === 'Delivery' && (
                            <div className="space-y-3">
                                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t.customer + ' ' + t.name} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                                <input type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} placeholder={t.mobileNumber} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                                <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder={t.address} rows={2} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                            </div>
                        )}
                    </div>
                </div>

                <div className={!isMobile || mobileStep === 'cart' ? 'block' : 'hidden'}>
                    <div className="p-4 space-y-3">
                        {cartItems.length === 0 ? (
                            <p className="text-center text-slate-500 py-10">{t.emptyCart}</p>
                        ) : (
                            cartItems.map((item, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.product.name[language]}</p>
                                        {item.options && Object.keys(item.options).length > 0 && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {Object.entries(item.options).map(([optionKey, valueKey]) => {
                                                    const option = item.product.options?.find(o => o.name.en === optionKey);
                                                    const value = option?.values.find(v => v.name.en === valueKey);
                                                    if (option && value) {
                                                        const priceModifierText = value.priceModifier > 0
                                                            ? ` (+${value.priceModifier.toFixed(2)} ${t.currency})`
                                                            : '';
                                                        return <div key={optionKey}>+ {value.name[language]}{priceModifierText}</div>;
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            @ {calculateItemUnitPrice(item).toFixed(2)} {t.currency}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateCartQuantity(index, item.quantity - 1)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">
                                                {item.quantity === 1 ? <TrashIcon className="w-4 h-4 text-red-500" /> : <MinusIcon className="w-4 h-4" />}
                                            </button>
                                            <span className="font-bold w-6 text-center text-slate-800 dark:text-slate-200">{formatNumber(item.quantity)}</span>
                                            <button onClick={() => updateCartQuantity(index, item.quantity + 1)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                            {calculateItemTotal(item).toFixed(2)} {t.currency}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                         {cartItems.length > 0 && !isMobile && (
                            <div className="pt-2">
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.orderNotes} rows={1} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:text-white dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500"></textarea>
                            </div>
                         )}
                    </div>
                </div>
            </div>

            <div className="p-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 mt-auto shrink-0">
                {isMobile ? (
                    <div className="space-y-3">
                        {mobileStep === 'info' ? (
                            <>
                                <div className="flex justify-between font-bold text-xl text-slate-800 dark:text-slate-100">
                                    <span>{t.total}</span>
                                    <span>{total.toFixed(2)} {t.currency}</span>
                                </div>
                                <button
                                    onClick={() => setMobileStep('cart')}
                                    disabled={!canProceedFromInfo}
                                    className="w-full bg-primary-600 text-white p-2.5 rounded-lg font-bold hover:bg-primary-700 disabled:bg-slate-400"
                                >
                                    {t.nextStep}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between font-bold text-xl text-slate-800 dark:text-slate-100">
                                    <span>{t.total}</span>
                                    <span>{total.toFixed(2)} {t.currency}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setMobileStep('info')} className="w-1/3 bg-slate-200 text-slate-800 p-2.5 rounded-lg font-bold hover:bg-slate-300">
                                        {t.previousStep}
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        className="w-2/3 bg-green-500 text-white p-2.5 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        disabled={isPlaceOrderDisabled}
                                    >
                                        {t.placeOrder}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                     <div className="space-y-3">
                        <div className="flex justify-between font-bold text-xl text-slate-800 dark:text-slate-100">
                            <span>{t.total}</span>
                            <span>{total.toFixed(2)} {t.currency}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={clearCart} className="bg-red-500 text-white p-2.5 rounded-lg font-bold hover:bg-red-600 flex items-center justify-center px-4"><TrashIcon className="w-5 h-5"/></button>
                            <button
                                onClick={handlePlaceOrder}
                                className="flex-grow bg-green-500 text-white p-2.5 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={isPlaceOrderDisabled}
                            >
                                {t.placeOrder}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};


export const CashierPage: React.FC = () => {
    const { language, t, showToast } = useUI();
    const { currentUser } = useAuth();
    const { products: allProducts, categories: allCategories, tags: allTags, restaurantInfo } = useData();
    const { placeOrder } = useAdmin();

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [notes, setNotes] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [mobileStep, setMobileStep] = useState<'info' | 'cart'>('info');

    const [orderType, setOrderType] = useState<OrderType>('Dine-in');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (cartItems.length === 0) {
            setMobileStep('info');
            setIsCartOpen(false);
        }
    }, [cartItems.length]);

    const visibleProducts = useMemo(() => allProducts.filter(p => p.isVisible), [allProducts]);
    
    const filteredProducts = useMemo(() => {
        return visibleProducts.filter(product => {
            let matchesCategory = true;
            if (selectedCategory !== null) {
                const categoryIdsToMatch = getDescendantCategoryIds(selectedCategory, allCategories);
                matchesCategory = categoryIdsToMatch.includes(product.categoryId);
            }
            
            const name = product.name[language] || product.name['en'];
            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => product.tags.includes(tag));
            
            return matchesCategory && matchesSearch && matchesTags;
        });
    }, [selectedCategory, visibleProducts, searchTerm, selectedTags, language, allCategories]);

    const total = useMemo(() => calculateTotal(cartItems), [cartItems]);

    const addToCart = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
        setCartItems(prevItems => {
            const itemVariantId = product.id + JSON.stringify(options || {});
            const existingItem = prevItems.find(item => (item.product.id + JSON.stringify(item.options || {})) === itemVariantId);

            if (existingItem) {
                return prevItems.map(item =>
                    (item.product.id + JSON.stringify(item.options || {})) === itemVariantId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevItems, { product, quantity, options }];
        });
    }, []);

    const updateCartQuantity = useCallback((itemIndex: number, newQuantity: number) => {
        setCartItems(prevItems => {
            if (newQuantity <= 0) {
                return prevItems.filter((_, index) => index !== itemIndex);
            }
            return prevItems.map((item, index) => 
                index === itemIndex ? { ...item, quantity: newQuantity } : item
            );
        });
    }, []);
    
    const clearCart = useCallback(() => {
        setCartItems([]);
        setTableNumber('');
        setNotes('');
        setOrderType('Dine-in');
        setCustomerName('');
        setCustomerMobile('');
        setCustomerAddress('');
    }, []);

    const handleTagChange = (tagId: string) => {
        setSelectedTags(prev => 
            prev.includes(tagId) 
            ? prev.filter(t => t !== tagId) 
            : [...prev, tagId]
        );
    };

    const handleOrderTypeChange = (type: OrderType) => {
        const oldOrderType = orderType;
        setOrderType(type);

        if (type === 'Takeaway' && (customerName === '' || customerName === t.takeawayCustomer)) {
             setCustomerName(t.takeawayCustomer);
        } else if (oldOrderType === 'Takeaway' && customerName === t.takeawayCustomer) {
            setCustomerName('');
        }
    };

    const canProceedFromInfo = useMemo(() => {
        if (cartItems.length === 0) return false;
        if (orderType === 'Dine-in') return tableNumber.trim() !== '';
        if (orderType === 'Takeaway') return customerName.trim() !== '';
        if (orderType === 'Delivery') return customerName.trim() !== '' && customerMobile.trim() !== '' && customerAddress.trim() !== '';
        return false;
    }, [cartItems.length, orderType, tableNumber, customerName, customerMobile, customerAddress]);


    const isPlaceOrderDisabled = useMemo(() => {
        if (cartItems.length === 0) return true;
        if (orderType === 'Dine-in' && !tableNumber.trim()) return true;
        if (orderType === 'Takeaway' && !customerName.trim()) return true;
        if (orderType === 'Delivery' && (!customerName.trim() || !customerMobile.trim() || !customerAddress.trim())) return true;
        return false;
    }, [cartItems, orderType, tableNumber, customerName, customerMobile, customerAddress]);

    const handlePlaceOrder = async () => {
        if (isPlaceOrderDisabled) return;

        let customerData: Order['customer'];
        let specificData: Partial<Order> = {};

        if (orderType === 'Dine-in') {
            customerData = {
                name: `${t.table} ${tableNumber}`,
                mobile: tableNumber,
            };
            specificData = { tableNumber };
        } else if (orderType === 'Takeaway') {
            customerData = {
                name: customerName,
                mobile: customerMobile,
            };
        } else { // Delivery
            customerData = {
                name: customerName,
                mobile: customerMobile,
                address: customerAddress,
            };
        }

        const orderData: Omit<Order, 'id' | 'timestamp'> = {
            items: cartItems,
            total: total,
            status: 'pending', 
            orderType: orderType,
            notes: notes,
            customer: customerData,
            createdBy: currentUser?.id,
            paymentMethod: orderType === 'Delivery' ? 'cod' : undefined,
            ...specificData,
        };
        
        try {
            await placeOrder(orderData);
            showToast(t.orderSentToKitchen);
            clearCart();
            setIsCartOpen(false);
        } catch (error) {
            console.error("Failed to place order from cashier:", error);
        }
    };

    const handleProductClick = (product: Product) => {
        if (product.options && product.options.length > 0) {
            setSelectedProduct(product);
        } else {
            addToCart(product, 1);
        }
    };

    const isCategoryOrChildSelected = useCallback((category: Category): boolean => {
        if (selectedCategory === null) return false;
        if (selectedCategory === category.id) return true;
        if (!category.children) return false;
        
        const childIds = category.children.map(c => c.id);
        return childIds.includes(selectedCategory);
    }, [selectedCategory]);
    
    if (!restaurantInfo) {
        return null;
    }

    const cartPanelProps = {
        cartItems,
        updateCartQuantity,
        clearCart,
        notes,
        setNotes,
        orderType,
        handleOrderTypeChange,
        tableNumber,
        setTableNumber,
        customerName,
        setCustomerName,
        customerMobile,
        setCustomerMobile,
        customerAddress,
        setCustomerAddress,
        handlePlaceOrder,
        total,
        isPlaceOrderDisabled,
        mobileStep,
        setMobileStep,
        canProceedFromInfo,
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:h-[calc(100vh-5rem)] md:overflow-hidden">
                <div className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 md:pb-0">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700 shrink-0 space-y-3 z-10">
                        <div className="flex flex-row gap-2 items-center">
                            <div className="relative w-full flex-grow">
                                <input
                                    type="text"
                                    placeholder={t.search}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-2 ps-9 text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 start-2.5 text-slate-400 dark:text-slate-500">
                                    <SearchIcon className="w-5 h-5" />
                                </div>
                            </div>
                             <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg font-bold text-sm transition-colors ${isFilterOpen ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500 text-primary-700 dark:text-primary-300' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-primary-400 dark:hover:border-primary-500'}`}
                            >
                                <FilterIcon className="w-5 h-5" />
                                <span>{t.tags}</span>
                                {selectedTags.length > 0 && (
                                    <span className="bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {formatNumber(selectedTags.length)}
                                    </span>
                                )}
                            </button>
                        </div>
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? 'max-h-40 opacity-100 pt-3 border-t border-slate-200 dark:border-slate-700' : 'max-h-0 opacity-0'}`}>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            {allTags.map(tag => (
                                <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedTags.includes(tag.id)}
                                    onChange={() => handleTagChange(tag.id)}
                                    className="sr-only peer"
                                />
                                <span className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 peer-checked:bg-primary-100 dark:peer-checked:bg-primary-900/50 peer-checked:border-primary-500 peer-checked:text-primary-700 dark:peer-checked:text-primary-300 transition-colors">
                                    {tag.name[language]}
                                </span>
                                </label>
                            ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="flex items-start gap-2 overflow-x-auto scrollbar-hide py-1">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === null ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                >
                                    {t.allCategories}
                                </button>
                                {allCategories.map(category => {
                                    const hasChildren = category.children && category.children.length > 0;
                                    const isActive = isCategoryOrChildSelected(category);
                                    
                                    const activeClasses = 'bg-primary-600 text-white shadow-lg';
                                    const inactiveClasses = 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600';
                                    const buttonClasses = `px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${isActive ? activeClasses : inactiveClasses}`;

                                    if (hasChildren) {
                                        return (
                                            <div key={category.id} className="relative" ref={openDropdown === category.id ? dropdownRef : null}>
                                                <button
                                                    onClick={() => setOpenDropdown(openDropdown === category.id ? null : category.id)}
                                                    className={buttonClasses}
                                                >
                                                    <span>{category.name[language]}</span>
                                                    <ChevronRightIcon className={`w-4 h-4 transition-transform ${language === 'ar' ? 'transform -scale-x-100' : ''} ${openDropdown === category.id ? 'rotate-90' : ''}`} />
                                                </button>
                                                {openDropdown === category.id && (
                                                    <div className="absolute top-full mt-2 z-20 min-w-max bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in py-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedCategory(category.id); setOpenDropdown(null); }}
                                                            className={`block w-full text-start px-4 py-2 text-sm transition-colors ${selectedCategory === category.id && (!category.children || !category.children.some(c => c.id === selectedCategory)) ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                        >
                                                            {t.all} {category.name[language]}
                                                        </button>
                                                        {category.children!.map(child => (
                                                            <button
                                                                key={child.id}
                                                                onClick={(e) => { e.stopPropagation(); setSelectedCategory(child.id); setOpenDropdown(null); }}
                                                                className={`block w-full text-start px-4 py-2 text-sm transition-colors ${selectedCategory === child.id ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                            >
                                                                {child.name[language]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === category.id ? activeClasses : inactiveClasses}`}
                                        >
                                            {category.name[language]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="overflow-y-auto p-4 flex-grow">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} onClick={() => handleProductClick(product)} className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer text-center flex flex-col">
                                    <img src={product.image} alt={product.name[language]} className="w-full h-24 object-cover rounded-t-lg" />
                                    <div className="p-2 flex-grow flex flex-col justify-center">
                                        <h4 className="text-sm font-semibold leading-tight line-clamp-2 text-slate-800 dark:text-slate-100">{product.name[language]}</h4>
                                        <p className="text-xs text-primary-600 dark:text-primary-400 font-bold mt-1">{product.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Desktop Cart/Order Panel */}
                <div className="hidden md:flex md:w-[400px] md:flex-shrink-0 bg-white dark:bg-slate-800 flex-col shadow-lg border-l border-slate-200 dark:border-slate-700">
                    <CashierCartPanel {...cartPanelProps} isMobile={false} />
                </div>
            </div>

            {/* Mobile Cart Summary Bar */}
            <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-3 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] z-20">
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="w-full bg-primary-600 text-white p-3 rounded-lg font-bold flex justify-between items-center text-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
                    disabled={cartItems.length === 0}
                >
                    <span className="flex items-center gap-2"><CartIcon className="w-6 h-6" /> {cartItems.length} {t.items}</span>
                    <span>{t.viewOrder}</span>
                    <span>{total.toFixed(2)} {t.currency}</span>
                </button>
            </div>


            {/* Mobile Cart Bottom Sheet */}
            {isCartOpen && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsCartOpen(false)}>
                    <div
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <CashierCartPanel {...cartPanelProps} isMobile={true} onClose={() => setIsCartOpen(false)} />
                    </div>
                </div>
            )}


             {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    addToCart={addToCart}
                />
            )}
        </>
    );
};