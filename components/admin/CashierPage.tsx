import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { User, Product, Category, CartItem, Order, RestaurantInfo, OrderType, Tag } from '../../types';
import { calculateTotal, formatNumber } from '../../utils/helpers';
import { ProductModal } from '../ProductModal';
import { MinusIcon, PlusIcon, TrashIcon, CloseIcon, CartIcon, SearchIcon, FilterIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';
import { TableSelector } from '../TableSelector';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';


export const CashierPage: React.FC = () => {
    const { language, t, showToast } = useUI();
    const { currentUser } = useAuth();
    const { products: allProducts, categories: allCategories, tags: allTags, restaurantInfo } = useData();
    const { placeOrder } = useAdmin();

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [notes, setNotes] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    
    // New state for search and filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // New state for mobile multi-step UI
    const [mobileStep, setMobileStep] = useState<'info' | 'cart'>('info');


    // Order Type and Customer Info State
    const [orderType, setOrderType] = useState<OrderType>('Dine-in');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

    useEffect(() => {
        if (allCategories.length > 0 && selectedCategory === null) {
            setSelectedCategory(allCategories[0].id);
        }
    }, [allCategories, selectedCategory]);

    useEffect(() => {
        // When cart becomes empty, always go back to the info step on mobile
        if (cartItems.length === 0) {
            setMobileStep('info');
        }
    }, [cartItems.length]);


    const visibleProducts = useMemo(() => allProducts.filter(p => p.isVisible), [allProducts]);
    
    const filteredProducts = useMemo(() => {
        return visibleProducts.filter(product => {
            const matchesCategory = selectedCategory === null || product.categoryId === selectedCategory;
            
            const name = product.name[language] || product.name['en'];
            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => product.tags.includes(tag));
            
            return matchesCategory && matchesSearch && matchesTags;
        });
    }, [selectedCategory, visibleProducts, searchTerm, selectedTags, language]);

    const total = useMemo(() => calculateTotal(cartItems), [cartItems]);

    const addToCart = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
        setCartItems(prevItems => {
            const itemVariantId = product.id + JSON.stringify(options || {});
            const existingItem = prevItems.find(item => (item.product.id + JSON.stringify(item.options || {})) === itemVariantId);
            
            if (prevItems.length === 0) {
                setIsCartExpanded(true); // Auto-expand cart on mobile when first item is added
            }

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
            setIsCartExpanded(false);
        } catch (error) {
            // Error is handled and shown by the placeOrder function in App.tsx
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
    
    if (!restaurantInfo) {
        return null; // or a loading spinner
    }

    const orderTypeClasses = "w-full py-2.5 text-sm font-bold transition-colors duration-200 rounded-md";
    const activeOrderTypeClasses = "bg-primary-600 text-white shadow";
    const inactiveOrderTypeClasses = "text-slate-700 dark:text-slate-200";

    return (
        <>
            <div className="flex flex-col md:flex-row h-[calc(100vh-5rem)] overflow-hidden">
                {/* Product Selection Panel */}
                <div className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 overflow-y-hidden">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700 shrink-0 space-y-3">
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

                        <div className="flex overflow-x-auto space-x-2 space-x-reverse pb-2 scrollbar-hide">
                            {allCategories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === category.id ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                >
                                    {category.name[language]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-y-auto p-4">
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

                {/* Cart/Order Panel */}
                <div className="md:w-[400px] md:flex-shrink-0 bg-white dark:bg-slate-800 flex flex-col shadow-lg border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700">
                    <div
                        onClick={() => setIsCartExpanded(!isCartExpanded)}
                        className="p-4 border-b dark:border-slate-700 flex justify-between items-center shrink-0 cursor-pointer md:cursor-default"
                    >
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.newOrder}</h3>
                        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden pointer-events-none">
                            {isCartExpanded ? <ChevronDownIcon className="w-6 h-6" /> : <ChevronUpIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    
                    <div className={`flex-1 overflow-y-auto transition-all duration-500 ease-in-out ${isCartExpanded ? 'max-h-[40vh]' : 'max-h-0'} md:max-h-none`}>
                         <div className={`md:block ${mobileStep === 'info' ? '' : 'hidden'}`}>
                             <div className="p-4 border-b dark:border-slate-700 space-y-4">
                                <div className="flex items-center p-1 rounded-lg bg-slate-200 dark:bg-slate-900">
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

                        <div className={`md:block ${mobileStep === 'cart' ? '' : 'hidden'}`}>
                            <div className="p-4 space-y-3">
                                {cartItems.length === 0 ? (
                                    <p className="text-center text-slate-500 py-10">{t.emptyCart}</p>
                                ) : (
                                    cartItems.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="flex-grow">
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-300">{item.product.name[language]}</p>
                                                {item.options && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-2">
                                                        {Object.entries(item.options).map(([optionKey, valueKey]) => {
                                                            const option = item.product.options?.find(o => o.name.en === optionKey);
                                                            const value = option?.values.find(v => v.name.en === valueKey);
                                                            if (option && value) {
                                                                return <div key={optionKey}>- {value.name[language]}</div>
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                )}
                                                <p className="text-xs text-slate-500 mt-1">{calculateTotal([item]).toFixed(2)} {t.currency}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateCartQuantity(index, item.quantity - 1)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700"><MinusIcon className="w-4 h-4" /></button>
                                                <span className="font-bold w-6 text-center text-slate-800 dark:text-slate-300">{formatNumber(item.quantity)}</span>
                                                <button onClick={() => updateCartQuantity(index, item.quantity + 1)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700"><PlusIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                                 {cartItems.length > 0 && (
                                    <div className="pt-2">
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.orderNotes} rows={1} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:text-white dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500"></textarea>
                                    </div>
                                 )}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 mt-auto shrink-0">
                        {/* Mobile Footer */}
                        <div className="md:hidden space-y-3">
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

                        {/* Desktop Footer */}
                        <div className="hidden md:block space-y-3">
                            <div>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.orderNotes} rows={1} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:text-white dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500"></textarea>
                            </div>
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
                    </div>
                </div>
            </div>

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