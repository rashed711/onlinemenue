import React, { useState, useMemo, useCallback } from 'react';
import type { Product, CartItem, Order, OrderStatus, OrderType } from '../types';
import { Header } from './Header';
import { SearchAndFilter } from './SearchAndFilter';
import { ProductList } from './ProductList';
import { CartSidebar } from './CartSidebar';
import { ProductModal } from './ProductModal';
import { PromotionSection } from './PromotionSection';
import { Footer } from './Footer';
import { ReceiptModal } from './ReceiptModal';
import { HeroSection } from './HeroSection';
import { calculateTotal, generateReceiptImage } from '../utils/helpers';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useCart } from '../contexts/CartContext';
import { useAdmin } from '../contexts/AdminContext';

export const MenuPage: React.FC = () => {
    const { language, setIsProcessing, t } = useUI();
    const { currentUser } = useAuth();
    const { products, promotions, categories, tags, restaurantInfo } = useData();
    const { cartItems, addToCart, updateCartQuantity, clearCart } = useCart();
    const { placeOrder } = useAdmin();
    
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
            const newOrder = await placeOrder(orderData);
            clearCart();
            const imageUrl = await generateReceiptImage(newOrder, restaurantInfo, t, language, currentUser?.name);
            setReceiptImageUrl(imageUrl);
            setIsReceiptModalOpen(true);
        } catch (error) {
            console.error("Failed to place order and generate receipt:", error);
        }
        finally {
            setIsProcessing(false);
        }
    }
    
    if (!restaurantInfo) return null;

    return (
        <>
            <Header onCartClick={() => setIsCartOpen(true)} />
            
            <HeroSection language={language} restaurantInfo={restaurantInfo} />

            <div className="container mx-auto max-w-7xl px-4 py-8">
                <main>
                    <PromotionSection promotions={promotions} products={visibleProducts} onProductClick={setSelectedProduct} />

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

            <Footer />

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
                onClose={() => setSelectedProduct(null)}
                addToCart={handleAddToCartWithoutOpeningCart}
                />
            )}

            <ReceiptModal
              isOpen={isReceiptModalOpen}
              onClose={() => {
                  setIsReceiptModalOpen(false);
                  setTableNumber('');
              }}
              receiptImageUrl={receiptImageUrl}
            />
        </>
    )
}