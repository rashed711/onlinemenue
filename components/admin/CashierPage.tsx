import React, { useState, useMemo, useCallback } from 'react';
import type { Language, User, Product, Category, CartItem, Order, OrderStatus, RestaurantInfo, OrderType } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { calculateTotal, formatNumber } from '../../utils/helpers';
import { ProductModal } from '../ProductModal';
import { MinusIcon, PlusIcon, TrashIcon, CloseIcon, CartIcon } from '../icons/Icons';
import { TableSelector } from '../TableSelector';

interface CashierPageProps {
    language: Language;
    currentUser: User | null;
    allProducts: Product[];
    allCategories: Category[];
    placeOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Order;
    showToast: (message: string) => void;
    restaurantInfo: RestaurantInfo;
}

const calculateItemTotal = (item: CartItem): number => {
    let itemPrice = item.product.price;
    if (item.options && item.product.options) {
        Object.entries(item.options).forEach(([optionKey, valueKey]) => {
            const option = item.product.options?.find(opt => opt.name.en === optionKey);
            const value = option?.values.find(val => val.name.en === valueKey);
            if (value) {
                itemPrice += value.priceModifier;
            }
        });
    }
    return itemPrice * item.quantity;
}

export const CashierPage: React.FC<CashierPageProps> = ({ language, currentUser, allProducts, allCategories, placeOrder, showToast, restaurantInfo }) => {
    const t = useTranslations(language);

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [notes, setNotes] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(allCategories[0]?.id || null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Order Type and Customer Info State
    const [orderType, setOrderType] = useState<OrderType>('Dine-in');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');


    const visibleProducts = useMemo(() => allProducts.filter(p => p.isVisible), [allProducts]);
    
    const filteredProducts = useMemo(() => {
        if (selectedCategory === null) return visibleProducts;
        return visibleProducts.filter(p => p.categoryId === selectedCategory);
    }, [selectedCategory, visibleProducts]);

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

    const handleOrderTypeChange = (type: OrderType) => {
        const oldOrderType = orderType;
        setOrderType(type);

        if (type === 'Takeaway') {
            setCustomerName(t.takeawayCustomer);
        } else if (oldOrderType === 'Takeaway') {
            setCustomerName('');
        }
    };

    const isPlaceOrderDisabled = useMemo(() => {
        if (cartItems.length === 0) return true;
        if (orderType === 'Dine-in' && !tableNumber.trim()) return true;
        if (orderType === 'Takeaway' && !customerName.trim()) return true;
        if (orderType === 'Delivery' && (!customerName.trim() || !customerMobile.trim() || !customerAddress.trim())) return true;
        return false;
    }, [cartItems, orderType, tableNumber, customerName, customerMobile, customerAddress]);

    const handlePlaceOrder = () => {
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
        
        placeOrder(orderData);
        showToast(t.orderSentToKitchen);
        clearCart();
        setIsCartOpen(false);
    };

    const handleProductClick = (product: Product) => {
        if (product.options && product.options.length > 0) {
            setSelectedProduct(product);
        } else {
            addToCart(product, 1);
        }
    };
    
    const orderTypeClasses = "w-full py-2.5 text-sm font-bold transition-colors duration-200 rounded-md";
    const activeOrderTypeClasses = "bg-primary-600 text-white shadow";
    const inactiveOrderTypeClasses = "text-slate-700 dark:text-slate-200";

    return (
        <>
            <div className="flex flex-col md:flex-row h-[calc(100vh-5rem)] overflow-hidden">
                {/* Product Selection Panel */}
                <div className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/50">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
                        <div className="flex overflow-x-auto space-x-2 space-x-reverse pb-2 scrollbar-hide">
                            {allCategories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === category.id ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
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
                                        <h4 className="text-sm font-semibold leading-tight line-clamp-2">{product.name[language]}</h4>
                                        <p className="text-xs text-primary-600 dark:text-primary-400 font-bold mt-1">{product.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile overlay background */}
                 <div
                    className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 md:hidden ${
                    isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={() => setIsCartOpen(false)}
                    aria-hidden="true"
                />

                {/* Cart/Order Panel */}
                <div className={`
                    fixed bottom-0 inset-x-0 h-[85vh] transition-transform duration-300 ease-in-out z-50
                    md:relative md:h-auto md:w-[400px] md:translate-y-0 md:flex-shrink-0
                    bg-white dark:bg-slate-800 flex flex-col shadow-lg 
                    border-l border-slate-200 dark:border-slate-700
                    ${ isCartOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0' }
                `}>
                    <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-bold">{t.newOrder}</h3>
                        <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden">
                            <CloseIcon className="w-6 h-6"/>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
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
                                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t.customer + ' ' + t.name} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                                    <input type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} placeholder={t.mobileNumber + ` (${t.yourComment})`} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            )}
                            
                            {orderType === 'Delivery' && (
                                <div className="space-y-3">
                                     <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t.customer + ' ' + t.name} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                                     <input type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} placeholder={t.mobileNumber} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                                     <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder={t.address} rows={2} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                                </div>
                            )}

                        </div>

                        <div className="p-4 space-y-3">
                            {cartItems.length === 0 ? (
                                 <p className="text-center text-slate-500 py-10">{t.emptyCart}</p>
                            ) : (
                                cartItems.map((item, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm">{item.product.name[language]}</p>
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
                                            <p className="text-xs text-slate-500 mt-1">{calculateItemTotal(item).toFixed(2)} {t.currency}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateCartQuantity(index, item.quantity - 1)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700"><MinusIcon className="w-4 h-4" /></button>
                                            <span className="font-bold w-6 text-center">{formatNumber(item.quantity)}</span>
                                            <button onClick={() => updateCartQuantity(index, item.quantity + 1)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700"><PlusIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t dark:border-slate-700 space-y-4 bg-slate-50 dark:bg-slate-800/50">
                             <div>
                                 <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.orderNotes} rows={2} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"></textarea>
                            </div>
                            <div className="flex justify-between font-bold text-xl">
                                <span>{t.total}</span>
                                <span>{total.toFixed(2)} {t.currency}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={clearCart} className="w-1/4 bg-red-500 text-white p-3 rounded-lg font-bold hover:bg-red-600 flex items-center justify-center"><TrashIcon className="w-6 h-6"/></button>
                                <button 
                                    onClick={handlePlaceOrder} 
                                    className="w-3/4 bg-green-500 text-white p-3 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    disabled={isPlaceOrderDisabled}
                                >
                                    {t.placeOrder}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button for Mobile */}
            {!isCartOpen && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="md:hidden fixed bottom-6 end-6 z-30 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all duration-300 flex items-center justify-center p-4"
                    aria-label={t.viewOrder}
                >
                    <CartIcon className="w-6 h-6" />
                     {cartItems.length > 0 && (
                         <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {formatNumber(cartItems.reduce((acc, item) => acc + item.quantity, 0))}
                        </span>
                     )}
                </button>
            )}

             {selectedProduct && (
                <ProductModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                addToCart={addToCart}
                language={language}
                />
            )}
        </>
    );
};