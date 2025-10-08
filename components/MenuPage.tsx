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
import { DeliveryDetailsModal } from './GuestCheckoutModal';
import { HeroSection } from './HeroSection';
import { useTranslations } from '../i18n/translations';
import { calculateTotal, formatDateTime } from '../utils/helpers';

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
    const [isDeliveryDetailsModalOpen, setIsDeliveryDetailsModalOpen] = useState(false);
    const [orderType, setOrderType] = useState<OrderType>('Dine-in');
    const [tableNumber, setTableNumber] = useState('');
    
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptImageUrl, setReceiptImageUrl] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const generateReceiptImage = useCallback((order: Order): Promise<string> => {
      return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');
        
        const dpi = window.devicePixelRatio || 1;
        const fontName = language === 'ar' ? 'Cairo' : 'sans-serif';

        // Load fonts before drawing to ensure RTL characters are rendered correctly
        if (language === 'ar') {
            try {
                const fontPromises = [
                    document.fonts.load(`bold ${16 * dpi}px ${fontName}`),
                    document.fonts.load(`${16 * dpi}px ${fontName}`),
                    document.fonts.load(`bold ${22 * dpi}px ${fontName}`),
                    document.fonts.load(`bold ${24 * dpi}px ${fontName}`),
                    document.fonts.load(`${14 * dpi}px ${fontName}`),
                ];
                await Promise.all(fontPromises);
            } catch (e) {
                console.error("Failed to load Cairo font for receipt:", e);
            }
        }

        if (language === 'ar') {
            ctx.direction = 'rtl';
        }

        const padding = 25 * dpi;
        const headerLineHeight = 32 * dpi;
        const bodyLineHeight = 30 * dpi;
        const itemLineHeight = 26 * dpi;

        const font = `${16 * dpi}px ${fontName}`;
        const fontBold = `bold ${16 * dpi}px ${fontName}`;
        const fontLargeBold = `bold ${22 * dpi}px ${fontName}`;
        const fontHeader = `bold ${24 * dpi}px ${fontName}`;
        const fontSmall = `${14 * dpi}px ${fontName}`;

        const logoSize = 70 * dpi;
        const canvasWidth = 420 * dpi;

        const getWrappedLines = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
            const words = text.split(' ');
            if (words.length === 0) return [];
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

        const detailsText = (label: string, value: string | undefined) => {
            if (!value) return '';
            return `${label}: ${value}`;
        }
        
        let preliminaryHeight = padding * 2;
        preliminaryHeight += logoSize + headerLineHeight + (bodyLineHeight * 1.5);
        
        ctx.font = font;
        let orderDetailsHeight = bodyLineHeight * 3;
        
        if (order.orderType === 'Delivery') {
            orderDetailsHeight += bodyLineHeight * 2;
             if (order.customer.address) {
                const addressText = detailsText(t.address, order.customer.address);
                const addressLines = getWrappedLines(ctx, addressText, canvasWidth - padding * 2);
                orderDetailsHeight += addressLines.length * bodyLineHeight;
            }
        } else if (order.tableNumber) {
            orderDetailsHeight += bodyLineHeight;
        }
        preliminaryHeight += orderDetailsHeight;
        preliminaryHeight += bodyLineHeight * 2;

        const itemTextMaxWidth = canvasWidth - padding * 2 - (100 * dpi);
        order.items.forEach(item => {
            const itemText = `${item.quantity} x ${item.product.name[language]}`;
            const lines = getWrappedLines(ctx, itemText, itemTextMaxWidth);
            preliminaryHeight += lines.length * itemLineHeight;
            if (item.options) {
                 ctx.font = fontSmall;
                 Object.entries(item.options).forEach(([optEn, valEn]) => {
                     const option = item.product.options?.find(o => o.name.en === optEn);
                     const value = option?.values.find(v => v.name.en === valEn);
                     if(option && value) {
                         preliminaryHeight += itemLineHeight;
                     }
                 });
                 ctx.font = font;
            }
            preliminaryHeight += itemLineHeight * 0.2;
        });
        preliminaryHeight += bodyLineHeight * 1.5;
        preliminaryHeight += headerLineHeight * 1.5;

        canvas.width = canvasWidth;
        canvas.height = preliminaryHeight;
        
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
            y += logoSize + (headerLineHeight * 0.5);
            ctx.font = fontHeader;
            ctx.textAlign = 'center';
            ctx.fillText(restaurantInfo.name[language], centerX, y);
            y += headerLineHeight * 1.5;

            ctx.textAlign = mainAlign;
            ctx.font = font;
            
            ctx.fillText(`${t.orderId}: ${order.id}`, mainX, y);
            y += bodyLineHeight;
            ctx.fillText(`${t.date}: ${formatDateTime(order.timestamp)}`, mainX, y);
            y += bodyLineHeight;
            ctx.fillText(`${t.orderType}: ${t[order.orderType === 'Dine-in' ? 'dineIn' : 'delivery']}`, mainX, y);
            y += bodyLineHeight;

            if (order.orderType === 'Delivery') {
                const customerNameText = `${t.name}: ${order.customer.name || 'Guest'} (${order.customer.mobile})`;
                ctx.fillText(customerNameText, mainX, y);
                y += bodyLineHeight;

                const mobileText = `${t.mobileNumber}: ${order.customer.mobile}`;
                ctx.fillText(mobileText, mainX, y);
                y += bodyLineHeight;

                if (order.customer.address) {
                    const addressText = `${t.address}: ${order.customer.address}`;
                    const addressLines = getWrappedLines(ctx, addressText, canvasWidth - padding * 2);
                    addressLines.forEach(line => {
                        ctx.fillText(line, mainX, y);
                        y += bodyLineHeight;
                    });
                }
            } else if (order.tableNumber) {
                ctx.fillText(`${t.tableNumber}: ${order.tableNumber}`, mainX, y);
                y += bodyLineHeight;
            }

            y += bodyLineHeight * 0.5;
            
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 2 * dpi;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            y += bodyLineHeight;

            ctx.font = fontBold;
            ctx.textAlign = mainAlign;
            ctx.fillText(t.item, mainX, y);
            ctx.textAlign = secondaryAlign;
            ctx.fillText(t.price, secondaryX, y);
            y += bodyLineHeight * 1.2;
            
            ctx.font = font;
            order.items.forEach(item => {
                const itemTotal = calculateTotal([item]);
                const itemText = `${item.quantity} x ${item.product.name[language]}`;
                const lines = getWrappedLines(ctx, itemText, itemTextMaxWidth);
                
                ctx.textAlign = secondaryAlign;
                ctx.fillText(itemTotal.toFixed(2), secondaryX, y);
                
                ctx.textAlign = mainAlign;
                lines.forEach((line) => {
                    ctx.fillText(line, mainX, y);
                    y += itemLineHeight;
                });

                if (item.options && item.product.options) {
                    ctx.fillStyle = '#6b7280';
                    ctx.font = fontSmall;
                    Object.entries(item.options).forEach(([optEn, valEn]) => {
                       const option = item.product.options?.find(o => o.name.en === optEn);
                       const value = option?.values.find(v => v.name.en === valEn);
                       if(option && value) {
                           const optionText = `- ${value.name[language]}`;
                           ctx.textAlign = mainAlign;
                           ctx.fillText(optionText, mainX + (isRtl ? -15 * dpi : 15 * dpi), y);
                           y += itemLineHeight;
                       }
                    });
                    ctx.font = font;
                    ctx.fillStyle = '#1f2937';
                }
                 y += itemLineHeight * 0.2;
            });
            
            y += bodyLineHeight * 0.5;
            
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            y += headerLineHeight * 1.2;

            ctx.font = fontLargeBold;
            ctx.textAlign = mainAlign;
            ctx.fillText(`${t.total}:`, mainX, y);
            ctx.textAlign = secondaryAlign;
            const totalText = isRtl ? `${t.currency} ${order.total.toFixed(2)}` : `${order.total.toFixed(2)} ${t.currency}`;
            ctx.fillText(totalText, secondaryX, y);
            resolve(canvas.toDataURL('image/png'));
        };
        
        if (logo.complete) {
            drawContent();
        } else {
            logo.onload = drawContent;
            logo.onerror = () => {
                console.error("Failed to load logo image for receipt.");
                drawContent();
            };
        }
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
        if (orderType === 'Delivery') {
            setIsDeliveryDetailsModalOpen(true);
            return;
        }

        // From here, it's a Dine-in order.
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
            const imageUrl = await generateReceiptImage(newOrder);
            setReceiptImageUrl(imageUrl);
            setIsReceiptModalOpen(true);
        } finally {
            setIsProcessing(false);
        }
    }

    const handleDeliveryConfirm = async (details: { mobile: string; address: string }) => {
        const customerDetails = {
            ...(currentUser && { userId: currentUser.id, name: currentUser.name }),
            mobile: details.mobile,
            address: details.address,
        };

        if (!currentUser) {
            customerDetails.name = `Guest (${details.mobile})`;
        }

        const orderData = {
            items: cartItems,
            total: calculateTotal(cartItems),
            status: 'Pending' as OrderStatus,
            orderType: 'Delivery' as OrderType,
            customer: customerDetails
        };
        const newOrder = placeOrder(orderData);
        clearCart();
        setIsDeliveryDetailsModalOpen(false);
        setIsProcessing(true);
        try {
            const imageUrl = await generateReceiptImage(newOrder);
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
            
            <DeliveryDetailsModal 
                isOpen={isDeliveryDetailsModalOpen}
                onClose={() => setIsDeliveryDetailsModalOpen(false)}
                onConfirm={handleDeliveryConfirm}
                language={language}
                currentUser={currentUser}
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