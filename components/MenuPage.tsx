import React, { useState, useMemo, useCallback } from 'react';
import type { Product, CartItem, Order, OrderStatus, OrderType, Category, Promotion } from '../types';
import { Header } from './Header';
import { SearchAndFilter } from './SearchAndFilter';
import { ProductList } from './ProductList';
import { CartSidebar } from './CartSidebar';
import { ProductModal } from './ProductModal';
import { PromotionSection } from './PromotionSection';
import { BottomNavBar } from './BottomNavBar';
import { HeroSection } from './HeroSection';
import { calculateTotal } from '../utils/helpers';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useCart } from '../contexts/CartContext';
import { useAdmin } from '../contexts/AdminContext';
import { Modal } from './Modal';
import { CheckCircleIcon } from './icons/Icons';

const getDescendantCategoryIds = (categoryId: number, categories: Category[]): number[] => {
    const ids: number[] = [];

    // Helper to find a category by its ID in the tree
    const findCategory = (cats: Category[], id: number): Category | null => {
        for (const cat of cats) {
            if (cat.id === id) {
                return cat;
            }
            if (cat.children) {
                const foundInChildren = findCategory(cat.children, id);
                if (foundInChildren) {
                    return foundInChildren;
                }
            }
        }
        return null;
    };

    // Helper to recursively collect all child IDs, including the parent's
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


export const MenuPage: React.FC = () => {
    const { language, setIsProcessing, t } = useUI();
    const { currentUser, isAdmin } = useAuth();
    const { products, promotions, categories, tags, restaurantInfo } = useData();
    const { cartItems, addToCart, updateCartQuantity, clearCart } = useCart();
    const { placeOrder } = useAdmin();
    
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [orderType, setOrderType] = useState<OrderType>('Dine-in');
    const [tableNumber, setTableNumber] = useState('');
    
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const handleCartClick = useCallback(() => setIsCartOpen(true), []);
    const handleProductClick = useCallback((product: Product) => setSelectedProduct(product), []);
    const handleCloseProductModal = useCallback(() => setSelectedProduct(null), []);

    const visibleProducts = useMemo(() => products.filter(p => p.isVisible), [products]);

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

    const filteredProducts = useMemo(() => {
        return visibleProducts.filter(product => {
          const name = product.name[language] || product.name['en'];
          const description = product.description[language] || product.description['en'];
    
          const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || description.toLowerCase().includes(searchTerm.toLowerCase());
          
          let matchesCategory = true;
          if (selectedCategory !== null) {
              const categoryIdsToMatch = getDescendantCategoryIds(selectedCategory, categories);
              matchesCategory = categoryIdsToMatch.includes(product.categoryId);
          }

          const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => product.tags.includes(tag));
          
          return matchesSearch && matchesCategory && matchesTags;
        });
      }, [searchTerm, selectedCategory, selectedTags, language, visibleProducts, categories]);
      
    const popularProducts = useMemo(() => visibleProducts.filter(p => p.isPopular).slice(0, 8), [visibleProducts]);
    const newProducts = useMemo(() => visibleProducts.filter(p => p.isNew).slice(0, 8), [visibleProducts]);

    const handleAddToCartWithoutOpeningCart = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
        addToCart(product, quantity, options);
    }, [addToCart]);
      
    const handlePlaceOrder = async () => {
        if (!restaurantInfo) return;
        const customerDetails = currentUser
            ? { userId: currentUser.id, name: currentUser.name, mobile: currentUser.mobile }
            : { name: `${t.table} ${tableNumber}`, mobile: `table-${tableNumber}` };

        const orderData: Omit<Order, 'id' | 'timestamp'> = {
            items: cartItems,
            total: calculateTotal(cartItems),
            status: 'pending' as OrderStatus,
            orderType: 'Dine-in' as OrderType,
            tableNumber: tableNumber,
            customer: customerDetails,
            createdBy: currentUser?.id,
        };
        
        setIsProcessing(true);
        try {
            await placeOrder(orderData);
            clearCart();
            setIsConfirmationOpen(true);
        } catch (error) {
            console.error("Failed to place order:", error);
        }
        finally {
            setIsProcessing(false);
        }
    }
    
    if (!restaurantInfo) return null;

    return (
        <div className="pb-24 bg-cream dark:bg-slate-950">
            <div className="hidden md:block">
                <Header onCartClick={handleCartClick} />
            </div>
            
            {displayablePromotions.length > 0 ? (
                <PromotionSection promotions={promotions} products={visibleProducts} onProductClick={handleProductClick} />
            ) : (
                <HeroSection />
            )}

            <div className="container mx-auto max-w-7xl px-4">
                <main>
                    <ProductList 
                        titleKey="mostPopular"
                        products={popularProducts} 
                        language={language} 
                        onProductClick={handleProductClick} 
                        addToCart={handleAddToCartWithoutOpeningCart}
                        slider={true}
                    />

                    <ProductList 
                        titleKey="newItems"
                        products={newProducts} 
                        language={language} 
                        onProductClick={handleProductClick} 
                        addToCart={handleAddToCartWithoutOpeningCart}
                        slider={true}
                    />

                    <SearchAndFilter
                        language={language}
                        categories={categories}
                        tags={tags}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        selectedTags={selectedTags}
                        setSelectedTags={setSelectedTags}
                    />

                    <ProductList 
                        titleKey="fullMenu"
                        products={filteredProducts} 
                        language={language} 
                        onProductClick={handleProductClick} 
                        addToCart={handleAddToCartWithoutOpeningCart}
                        slider={false}
                    />
                </main>
            </div>

            <BottomNavBar onCartClick={handleCartClick} />

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onPlaceOrder={handlePlaceOrder}
                orderType={orderType}
                setOrderType={setOrderType}
                tableNumber={tableNumber}
                setTableNumber={setTableNumber}
            />

            {selectedProduct && (
                <ProductModal
                product={selectedProduct}
                onClose={handleCloseProductModal}
                addToCart={handleAddToCartWithoutOpeningCart}
                />
            )}

            {isConfirmationOpen && (
                <Modal title={t.successTitle} onClose={() => {
                    setIsConfirmationOpen(false);
                    setTableNumber('');
                }}>
                    <div className="p-6 text-center">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">{t.orderReceivedTitle}</h2>
                        <p className="text-slate-600 dark:text-slate-300">{t.orderReceivedBody}</p>
                        <p className="text-slate-600 dark:text-slate-300 mt-4">
                            {t.orderInquiryText}
                            <br />
                            <a href={`https://wa.me/${restaurantInfo.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="font-bold text-primary-600" dir="ltr">{restaurantInfo.whatsappNumber}</a>
                        </p>
                        <button
                            onClick={() => {
                                setIsConfirmationOpen(false);
                                setTableNumber('');
                            }}
                            className="mt-6 w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700"
                        >
                            {language === 'ar' ? 'حسناً' : 'OK'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}