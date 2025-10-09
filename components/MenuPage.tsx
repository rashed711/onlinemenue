import React, { useState, useMemo, useCallback } from 'react';
import type { User, Order, Language, Theme, Product, CartItem, OrderStatus, Promotion, OrderType, Category, Tag, RestaurantInfo } from '../types';
import { Header } from './Header';
import { SearchAndFilter } from './SearchAndFilter';
import { ProductList } from './ProductList';
import { CartSidebar } from './CartSidebar';
import { ProductModal } from './ProductModal';
import { PromotionSection } from './PromotionSection';
import { Footer } from './Footer';
import { ReceiptModal } from './ReceiptModal';
import { HeroSection } from './HeroSection';
import { useTranslations } from '../i18n/translations';
import { calculateTotal, generateReceiptImage } from '../utils/helpers';

interface MenuPageProps {
    language: Language;
    theme: Theme;
    toggleLanguage: () => void;
    toggleTheme: () => void;
    cartItems: CartItem[];
    addToCart: (product: Product, quantity: number, options?: { [key: string]: string; }) => void;
    updateCartQuantity: (productId: number, options: { [key: string]: string; } | undefined, newQuantity: number) => void;
    clearCart: () => void;
    currentUser: User | null;
    logout: () => void;
    placeOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Order;
    products: Product[];
    promotions: Promotion[];
    categories: Category[];
    tags: Tag[];
    restaurantInfo: RestaurantInfo;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MenuPage: React.FC<MenuPageProps> = (props) => {
    const {
        language, theme, toggleLanguage, toggleTheme,
        cartItems, addToCart, updateCartQuantity, clearCart,
        currentUser, logout, placeOrder, products, promotions,
        categories, tags, restaurantInfo, setIsProcessing
    } = props;
    
    const t = useTranslations(language);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [orderType, setOrderType] = useState<OrderType>('Dine-in');
    const [tableNumber, setTableNumber] = useState('');
    
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptImageUrl, setReceiptImageUrl] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const visibleProducts = useMemo(() => products.filter(p => p.isVisible), [products]);

    const filteredProducts = useMemo(() => {
        return visibleProducts.filter(product => {
          const name = product.name[language] || product.name['en'];
          const description = product.description[language] || product.description['en'];
    
          const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || description.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = selectedCategory === null || product.categoryId === selectedCategory;
          const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => product.tags.includes(tag));
          
          return matchesSearch && matchesCategory && matchesTags;
        });
      }, [searchTerm, selectedCategory, selectedTags, language, visibleProducts]);
      
    const popularProducts = useMemo(() => visibleProducts.filter(p => p.isPopular).slice(0, 8), [visibleProducts]);
    const newProducts = useMemo(() => visibleProducts.filter(p => p.isNew).slice(0, 4), [visibleProducts]);

    const handleAddToCartWithoutOpeningCart = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
        addToCart(product, quantity, options);
    }, [addToCart]);
      
    const handlePlaceOrder = async () => {
        // This is for Dine-in orders from the main cart sidebar
        const customerDetails = currentUser
            ? { userId: currentUser.id, name: currentUser.name, mobile: currentUser.mobile }
            : { name: `${t.table} ${tableNumber}`, mobile: `table-${tableNumber}` }; // Guest user for Dine-in

        const orderData = {
            items: cartItems,
            total: calculateTotal(cartItems),
            status: 'Pending' as OrderStatus,
            orderType: 'Dine-in' as OrderType,
            tableNumber: tableNumber,
            customer: customerDetails,
        };

        const newOrder = placeOrder(orderData);
        clearCart();
        setIsProcessing(true);
        try {
            const imageUrl = await generateReceiptImage(newOrder, restaurantInfo, t, language);
            setReceiptImageUrl(imageUrl);
            setIsReceiptModalOpen(true);
        } finally {
            setIsProcessing(false);
        }
    }
    
    return (
        <>
            <Header
                language={language}
                theme={theme}
                toggleLanguage={toggleLanguage}
                toggleTheme={toggleTheme}
                cartItemCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                onCartClick={() => setIsCartOpen(true)}
                restaurantInfo={restaurantInfo}
                currentUser={currentUser}
                logout={logout}
            />
            
            <HeroSection language={language} restaurantInfo={restaurantInfo} />

            <div className="container mx-auto max-w-7xl px-4 py-8">
                <main>
                    <PromotionSection promotions={promotions} products={visibleProducts} language={language} onProductClick={setSelectedProduct} />

                    <ProductList 
                        titleKey="mostPopular" 
                        products={popularProducts} 
                        language={language} 
                        onProductClick={setSelectedProduct} 
                        addToCart={handleAddToCartWithoutOpeningCart}
                        slider={true}
                    />

                    <ProductList 
                        titleKey="newItems"
                        products={newProducts} 
                        language={language} 
                        onProductClick={setSelectedProduct} 
                        addToCart={handleAddToCartWithoutOpeningCart}
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
                        onProductClick={setSelectedProduct} 
                        addToCart={handleAddToCartWithoutOpeningCart}
                        slider={false}
                    />
                </main>
            </div>


            <Footer language={language} restaurantInfo={restaurantInfo} />

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cartItems={cartItems}
                updateCartQuantity={updateCartQuantity}
                clearCart={clearCart}
                language={language}
                onPlaceOrder={handlePlaceOrder}
                orderType={orderType}
                setOrderType={setOrderType}
                tableNumber={tableNumber}
                setTableNumber={setTableNumber}
                restaurantInfo={restaurantInfo}
            />

            {selectedProduct && (
                <ProductModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                addToCart={handleAddToCartWithoutOpeningCart}
                language={language}
                />
            )}

            <ReceiptModal
              isOpen={isReceiptModalOpen}
              onClose={() => {
                  setIsReceiptModalOpen(false);
                  setTableNumber('');
              }}
              receiptImageUrl={receiptImageUrl}
              language={language}
              whatsappNumber={restaurantInfo.whatsappNumber}
              clearCart={clearCart}
            />
        </>
    )
}