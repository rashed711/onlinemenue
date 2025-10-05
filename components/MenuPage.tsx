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
import { GuestCheckoutModal } from './GuestCheckoutModal';
import { HeroSection } from './HeroSection';
import { useTranslations } from '../i18n/translations';
import { calculateTotal } from '../utils/helpers';

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
}

export const MenuPage: React.FC<MenuPageProps> = (props) => {
    const {
        language, theme, toggleLanguage, toggleTheme,
        cartItems, addToCart, updateCartQuantity, clearCart,
        currentUser, logout, placeOrder, products, promotions,
        categories, tags, restaurantInfo
    } = props;
    
    const t = useTranslations(language);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isGuestCheckoutOpen, setIsGuestCheckoutOpen] = useState(false);
    const [orderType, setOrderType] = useState<OrderType>('Dine-in');
    const [tableNumber, setTableNumber] = useState('');
    
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptImageUrl, setReceiptImageUrl] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const generateReceiptImage = useCallback((order: Order): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');

        const dpi = window.devicePixelRatio || 1;
        const padding = 25 * dpi;
        const lineHeight = 28 * dpi;
        const itemLineHeight = 24 * dpi;
        const fontName = language === 'ar' ? 'Cairo' : 'sans-serif';
        const font = `${16 * dpi}px ${fontName}`;
        const fontBold = `bold ${16 * dpi}px ${fontName}`;
        const fontLarge = `bold ${20 * dpi}px ${fontName}`;
        const fontSmall = `${13 * dpi}px ${fontName}`;
        const logoSize = 60 * dpi;
        const canvasWidth = 420 * dpi;
        
        const getWrappedLines = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
            const words = text.split(' ');
            const lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = context.measureText(currentLine + ' ' + word).width;
                if (width < maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        }

        // Pre-calculate canvas height
        let canvasHeight = padding * 2 + logoSize + lineHeight * 6;
        ctx.font = font; // Set font for measurement
        const textMaxWidth = canvasWidth - padding * 2 - (80 * dpi);
        order.items.forEach(item => {
            const itemText = `${item.quantity} x ${item.product.name[language]}`;
            const lines = getWrappedLines(ctx, itemText, textMaxWidth);
            canvasHeight += lines.length * itemLineHeight;
            if (item.options) {
                canvasHeight += Object.keys(item.options).length * (itemLineHeight * 0.9);
            }
        });
        canvasHeight += lineHeight * 5; // Footer and buffer

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1f2937';
        
        const isRtl = language === 'ar';
        const mainX = isRtl ? canvas.width - padding : padding;
        const secondaryX = isRtl ? padding : canvas.width - padding;
        const mainAlign = isRtl ? 'right' : 'left';
        const secondaryAlign = isRtl ? 'left' : 'right';
        const centerX = canvas.width / 2;

        let y = padding;

        const logo = new Image();
        logo.crossOrigin = "Anonymous";
        logo.src = restaurantInfo.logo;

        const drawContent = () => {
            if (logo.complete && logo.naturalHeight !== 0) {
              ctx.drawImage(logo, centerX - logoSize / 2, y, logoSize, logoSize);
            }
            y += logoSize + lineHeight;
            ctx.font = fontLarge;
            ctx.textAlign = 'center';
            ctx.fillText(restaurantInfo.name[language], centerX, y);
            y += lineHeight * 1.5;

            ctx.textAlign = mainAlign;
            ctx.font = font;
            ctx.fillText(`${t.orderId}: ${order.id}`, mainX, y);
            y += lineHeight;
            ctx.fillText(`${t.date}: ${new Date(order.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}`, mainX, y);
            y += lineHeight;
            ctx.fillText(`${t.orderType}: ${t[order.orderType === 'Dine-in' ? 'dineIn' : 'delivery']}`, mainX, y);
            if(order.tableNumber){
                 y += lineHeight;
                 ctx.fillText(`${t.tableNumber}: ${order.tableNumber}`, mainX, y);
            }
            y += lineHeight * 1.5;
            
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1 * dpi;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            y += lineHeight;

            ctx.font = fontBold;
            ctx.fillText(t.item, mainX, y);
            ctx.textAlign = secondaryAlign;
            ctx.fillText(t.price, secondaryX, y);
            y += itemLineHeight * 1.5;
            
            ctx.font = font;
            order.items.forEach(item => {
                const itemTotal = calculateTotal([item]);
                const itemText = `${item.quantity} x ${item.product.name[language]}`;
                const lines = getWrappedLines(ctx, itemText, textMaxWidth);
                
                ctx.textAlign = secondaryAlign;
                ctx.fillText(itemTotal.toFixed(2), secondaryX, y);

                ctx.textAlign = mainAlign;
                lines.forEach((line, index) => {
                    ctx.fillText(line, mainX, y + (index * itemLineHeight));
                });
                y += lines.length * itemLineHeight;

                if (item.options && item.product.options) {
                    ctx.fillStyle = '#6b7280';
                    ctx.font = fontSmall;
                    Object.entries(item.options).forEach(([optEn, valEn]) => {
                       const option = item.product.options?.find(o => o.name.en === optEn);
                       const value = option?.values.find(v => v.name.en === valEn);
                       if(option && value) {
                           ctx.textAlign = mainAlign;
                           ctx.fillText(`  - ${value.name[language]}`, mainX, y);
                           y += itemLineHeight * 0.9;
                       }
                    });
                    ctx.font = font;
                    ctx.fillStyle = '#1f2937';
                }
                 y += itemLineHeight * 0.3; // Padding after each item
            });
            
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            y += lineHeight;

            ctx.font = fontLarge;
            ctx.textAlign = mainAlign;
            ctx.fillText(`${t.total}:`, mainX, y);
            ctx.textAlign = secondaryAlign;
            ctx.fillText(`${order.total.toFixed(2)} ${t.currency}`, secondaryX, y);
            resolve(canvas.toDataURL('image/png'));
        };
        logo.onload = drawContent;
        logo.onerror = drawContent; 
      });
    }, [language, t, restaurantInfo]);

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
        if(currentUser) {
            const orderData = {
                items: cartItems,
                total: calculateTotal(cartItems),
                status: 'Pending' as OrderStatus,
                orderType: orderType,
                tableNumber: orderType === 'Dine-in' ? tableNumber : undefined,
                customer: {
                    userId: currentUser.id,
                    name: currentUser.name,
                    mobile: currentUser.mobile
                }
            };
            const newOrder = placeOrder(orderData);
            const imageUrl = await generateReceiptImage(newOrder);
            setReceiptImageUrl(imageUrl);
            setIsReceiptModalOpen(true);
        } else {
            setIsGuestCheckoutOpen(true);
        }
    }

    const handleGuestCheckoutConfirm = async (mobile: string) => {
         const orderData = {
            items: cartItems,
            total: calculateTotal(cartItems),
            status: 'Pending' as OrderStatus,
            orderType: orderType,
            tableNumber: orderType === 'Dine-in' ? tableNumber : undefined,
            customer: { mobile }
        };
        const newOrder = placeOrder(orderData);
        setIsGuestCheckoutOpen(false);
        const imageUrl = await generateReceiptImage(newOrder);
        setReceiptImageUrl(imageUrl);
        setIsReceiptModalOpen(true);
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


            <Footer language={language}/>

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
            
            <GuestCheckoutModal 
                isOpen={isGuestCheckoutOpen}
                onClose={() => setIsGuestCheckoutOpen(false)}
                onConfirm={handleGuestCheckoutConfirm}
                language={language}
            />

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