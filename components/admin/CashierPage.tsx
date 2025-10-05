import React, { useState, useMemo, useCallback } from 'react';
import type { Language, User, Product, Category, CartItem, Order, OrderStatus, RestaurantInfo } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { calculateTotal } from '../../utils/helpers';
import { ProductModal } from '../ProductModal';
import { MinusIcon, PlusIcon, TrashIcon } from '../icons/Icons';
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

export const CashierPage: React.FC<CashierPageProps> = ({ language, currentUser, allProducts, allCategories, placeOrder, showToast, restaurantInfo }) => {
    const t = useTranslations(language);

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [tableNumber, setTableNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(allCategories[0]?.id || null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
    }, []);

    const handlePlaceOrder = () => {
        if (!tableNumber.trim()) {
            alert(t.enterTableNumber);
            return;
        }
        if (cartItems.length === 0) {
            alert('Cart is empty.');
            return;
        }

        const orderData: Omit<Order, 'id' | 'timestamp'> = {
            items: cartItems,
            total: total,
            status: 'Pending' as OrderStatus,
            orderType: 'Dine-in',
            tableNumber: tableNumber,
            notes: notes,
            customer: {
                name: `${t.table} ${tableNumber}`,
                mobile: tableNumber, // Using table number as a placeholder identifier
            },
        };
        
        placeOrder(orderData);
        showToast(t.orderSentToKitchen);
        clearCart();
    };

    const handleProductClick = (product: Product) => {
        if (product.options && product.options.length > 0) {
            setSelectedProduct(product);
        } else {
            addToCart(product, 1);
        }
    };

    const isPlaceOrderDisabled = cartItems.length === 0 || tableNumber.trim() === '';
    
    return (
        <>
            <div className="flex flex-col md:flex-row h-[calc(100vh-5rem)]">
                {/* Product Selection Panel */}
                <div className="flex-[2] flex flex-col bg-slate-100/50 dark:bg-slate-900/50">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
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

                {/* Cart/Order Panel */}
                <div className="flex-1 w-full md:max-w-md bg-white dark:bg-slate-800 flex flex-col shadow-lg border-l border-slate-200 dark:border-slate-700">
                    <div className="p-4 border-b dark:border-slate-700">
                        <h3 className="text-xl font-bold">{t.new} {t.orders.slice(0,-1)}</h3>
                         <div>
                            <label htmlFor="table-number-cashier" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mt-2 mb-2">{t.tableNumber}</label>
                            <TableSelector
                                tableCount={restaurantInfo.tableCount || 0}
                                selectedTable={tableNumber}
                                onSelectTable={setTableNumber}
                            />
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-3">
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
                                        <p className="text-xs text-slate-500 mt-1">{calculateTotal([item]).toFixed(2)} {t.currency}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateCartQuantity(index, item.quantity - 1)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700"><MinusIcon className="w-4 h-4" /></button>
                                        <span className="font-bold w-6 text-center">{item.quantity}</span>
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