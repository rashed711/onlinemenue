import type { CartItem, Order, RestaurantInfo, Language, Product, Promotion, Category, PurchaseInvoice, SalesInvoice, SalesInvoiceItem } from '../types';
import { translations } from '../i18n/translations';
import { APP_CONFIG } from './config';

export const getActivePromotionForProduct = (productId: number, promotions: Promotion[]): Promotion | undefined => {
    const now = new Date();
    return promotions.find(promo => 
        promo.productId === productId && 
        promo.isActive && 
        new Date(promo.endDate) > now
    );
};

export const formatNumber = (num: number): string => {
  try {
    return new Intl.NumberFormat().format(num);
  } catch (e) {
    return String(num);
  }
};

export const calculateOriginalItemUnitPrice = (item: CartItem): number => {
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
    return itemPrice;
};

export const calculateItemUnitPrice = (item: CartItem): number => {
    let itemPrice = calculateOriginalItemUnitPrice(item);
    if (item.appliedDiscountPercent) {
        itemPrice = itemPrice * (1 - item.appliedDiscountPercent / 100);
    }
    return itemPrice;
};

export const calculateOriginalItemTotal = (item: CartItem): number => {
    return calculateOriginalItemUnitPrice(item) * item.quantity;
};


export const calculateItemTotal = (item: CartItem): number => {
    return calculateItemUnitPrice(item) * item.quantity;
};


export const calculateTotal = (cartItems: CartItem[]): number => {
  return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
};

export const calculateTotalSavings = (cartItems: CartItem[]): number => {
    const originalTotal = cartItems.reduce((total, item) => total + calculateOriginalItemTotal(item), 0);
    const finalTotal = calculateTotal(cartItems);
    return originalTotal - finalTotal;
};

export const formatDate = (isoString: string): string => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (isoString: string): string => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
        const img = new Image();

        const resolveWithPlaceholder = () => {
            const placeholder = new Image(1, 1);
            placeholder.onload = () => resolve(placeholder);
            placeholder.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        };

        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(`Failed to load image: ${src}`, err);
            resolveWithPlaceholder();
        };

        if (!src) {
            resolveWithPlaceholder();
            return;
        }

        if (!src.startsWith('data:')) {
            img.crossOrigin = 'Anonymous';
        }

        img.src = src;
    });
};

export const resolveImageUrl = (path: string | undefined): string => {
  if (!path || path.startsWith('http') || path.startsWith('data:')) {
    return path || '';
  }
  const domain = new URL(APP_CONFIG.API_BASE_URL).origin;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${domain}/${cleanPath}`;
};

const getWrappedTextLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    if (words.length === 0) return [];
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};

export const normalizeArabic = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/أ|إ|آ/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[\u064B-\u0652]/g, '');
};

export const generateReceiptImage = async (
  order: Order,
  restaurantInfo: RestaurantInfo,
  t: typeof translations['en'],
  language: Language,
  creatorName?: string
): Promise<string> => {
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const isRtl = language === 'ar';
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    const FONT_FAMILY_SANS = isRtl ? 'Cairo, sans-serif' : 'sans-serif';
    const width = 500;
    const padding = 25;
    const contentWidth = width - (padding * 2);
    const COLORS = { BG: '#F8F9FA', PAPER: '#FFFFFF', TEXT_DARK: '#1E293B', TEXT_LIGHT: '#64748B', PRIMARY: '#F59E0B', GREEN: '#10B981', BLUE: '#3B82F6', ORANGE: '#F97316', BORDER: '#E2E8F0', RED: '#EF4444' };
    
    const H_DETAIL = 22;
    const H_ITEM_NAME = 24;
    const H_ITEM_OPTION = 18;
    const H_ITEM_DISCOUNT = 18;
    const H_TOTAL_LINE = 28;

    let totalHeight = 0;
    totalHeight += 215; 

    const details = [
        { label: t.orderId, value: order.id },
        { label: t.date, value: formatDateTime(order.timestamp) },
        { label: t.orderType, value: t[order.orderType.toLowerCase() as keyof typeof t] + (order.tableNumber ? ` (${t.table} ${order.tableNumber})` : '')},
        { label: t.customer, value: order.customer.name || 'Guest' },
        { label: t.mobileNumber, value: order.customer.mobile },
    ];
    if (order.orderType === 'Delivery' && order.customer.address) {
        details.push({ label: t.address, value: order.customer.address });
    }
    details.forEach(detail => {
        if (detail.label === t.address) {
            ctx.font = `14px ${FONT_FAMILY_SANS}`;
            const addressLines = getWrappedTextLines(ctx, detail.value, contentWidth / 2);
            totalHeight += (addressLines.length -1) * H_DETAIL;
        }
        totalHeight += H_DETAIL;
    });
    totalHeight += 10;

    totalHeight += 45;
    order.items.forEach(item => {
        ctx.font = `15px ${FONT_FAMILY_SANS}`;
        const itemText = `${item.quantity} x ${item.product.name[language]}`;
        const itemLines = getWrappedTextLines(ctx, itemText, contentWidth - 120);
        totalHeight += itemLines.length * H_ITEM_NAME;
        
        if (item.appliedDiscountPercent) {
            totalHeight += H_ITEM_DISCOUNT;
        }
        if (item.options) {
            totalHeight += Object.keys(item.options).length * H_ITEM_OPTION;
        }
        totalHeight += 25;
    });
    totalHeight += 15;

    const totalSavings = calculateTotalSavings(order.items);
    if(totalSavings > 0) totalHeight += H_TOTAL_LINE * 2;
    totalHeight += H_TOTAL_LINE + 35;

    totalHeight += 80;
    totalHeight += 60;

    canvas.width = width;
    canvas.height = totalHeight;
    
    ctx.fillStyle = COLORS.PAPER;
    ctx.fillRect(0, 0, width, totalHeight);

    const x = (val: number) => isRtl ? width - val : val;
    
    const drawDashedLine = (y: number) => {
        ctx.strokeStyle = COLORS.BORDER;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.setLineDash([]);
    };

    const drawWrappedText = (text: string, xPos: number, yPos: number, maxWidth: number, lineHeight: number, align: CanvasTextAlign = 'start'): number => {
        ctx.textAlign = align;
        const lines = getWrappedTextLines(ctx, text, maxWidth);
        lines.forEach((line, index) => {
            ctx.fillText(line, x(xPos), yPos + (index * lineHeight));
        });
        return yPos + (lines.length - 1) * lineHeight;
    };
    
    let y = 40;

    const logo = await loadImage(restaurantInfo.logo);
    ctx.drawImage(logo, (width / 2) - 32, y, 64, 64);
    y += 80;
    ctx.font = `bold 24px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = 'center';
    ctx.fillText(restaurantInfo.name[language], width / 2, y);
    y += 35;
    ctx.font = `16px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.fillText(t.receiptTitle, width / 2, y);
    y += 30;
    drawDashedLine(y);
    y += 25;

    ctx.font = `14px ${FONT_FAMILY_SANS}`;
    details.forEach(detail => {
        ctx.fillStyle = COLORS.TEXT_LIGHT;
        ctx.textAlign = 'start';
        ctx.fillText(detail.label, x(padding), y);
        
        ctx.fillStyle = COLORS.TEXT_DARK;
        if (detail.label === t.address) {
            y = drawWrappedText(detail.value, width - padding, y, contentWidth / 2, H_DETAIL, 'end');
        } else {
            ctx.textAlign = 'end';
            ctx.fillText(detail.value, x(width - padding), y);
        }
        y += H_DETAIL;
    });
    y += 10;
    
    drawDashedLine(y);
    y += 25;
    ctx.font = `bold 14px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = 'start';
    ctx.fillText(t.item, x(padding), y);
    ctx.textAlign = 'end';
    ctx.fillText(t.price, x(width - padding), y);
    y += 20;

    order.items.forEach(item => {
        const itemStartY = y;
        ctx.font = `15px ${FONT_FAMILY_SANS}`;
        ctx.fillStyle = COLORS.TEXT_DARK;
        y = drawWrappedText(`${item.quantity} x ${item.product.name[language]}`, padding, y, contentWidth - 120, H_ITEM_NAME, 'start');
        y += H_ITEM_NAME;

        const finalItemTotal = calculateItemTotal(item);
        const originalItemTotal = calculateOriginalItemTotal(item);

        ctx.textAlign = 'end';
        if (item.appliedDiscountPercent) {
            ctx.fillStyle = COLORS.TEXT_DARK;
            ctx.fillText(finalItemTotal.toFixed(2), x(width - padding), itemStartY + H_ITEM_NAME / 2);
            
            ctx.font = `13px ${FONT_FAMILY_SANS}`;
            ctx.fillStyle = COLORS.TEXT_LIGHT;
            ctx.fillText(originalItemTotal.toFixed(2), x(width - padding), itemStartY + H_ITEM_NAME / 2 + H_ITEM_DISCOUNT);
            
            const textWidth = ctx.measureText(originalItemTotal.toFixed(2)).width;
            ctx.beginPath();
            const lineY = itemStartY + H_ITEM_NAME / 2 + H_ITEM_DISCOUNT - 5;
            const lineXStart = isRtl ? padding : width - padding - textWidth;
            const lineXEnd = isRtl ? padding + textWidth : width - padding;
            ctx.moveTo(lineXStart, lineY);
            ctx.lineTo(lineXEnd, lineY);
            ctx.strokeStyle = COLORS.TEXT_LIGHT;
            ctx.lineWidth = 1;
            ctx.stroke();
            y += H_ITEM_DISCOUNT;
        } else {
            ctx.fillText(finalItemTotal.toFixed(2), x(width - padding), itemStartY + H_ITEM_NAME / 2);
        }

        if (item.options) {
            ctx.font = `13px ${FONT_FAMILY_SANS}`;
            ctx.fillStyle = COLORS.TEXT_LIGHT;
            Object.values(item.options).forEach(valueKey => {
                const valueName = item.product.options?.flatMap(opt => opt.values).find(v => v.name.en === valueKey)?.name[language];
                if (valueName) {
                    y = drawWrappedText(`+ ${valueName}`, padding + 15, y, contentWidth - 135, H_ITEM_OPTION, 'start');
                    y += H_ITEM_OPTION;
                }
            });
        }
        y += 5;
        drawDashedLine(y);
        y += 20;
    });
    
    const finalTotal = order.total;
    const totalSavingsVal = calculateTotalSavings(order.items);
    const originalTotal = finalTotal + totalSavingsVal;
    
    if (totalSavingsVal > 0) {
        ctx.font = `16px ${FONT_FAMILY_SANS}`;
        ctx.fillStyle = COLORS.TEXT_LIGHT;
        ctx.textAlign = 'start';
        ctx.fillText(t.subtotal, x(padding), y);
        ctx.textAlign = 'end';
        ctx.fillText(`${originalTotal.toFixed(2)} ${t.currency}`, x(width - padding), y);
        y += H_TOTAL_LINE;

        ctx.fillStyle = COLORS.RED;
        ctx.textAlign = 'start';
        ctx.fillText(t.discount, x(padding), y);
        ctx.textAlign = 'end';
        ctx.fillText(`-${totalSavingsVal.toFixed(2)} ${t.currency}`, x(width - padding), y);
        y += H_TOTAL_LINE;
    }

    ctx.font = `bold 18px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = 'start';
    ctx.fillText(t.total, x(padding), y);
    ctx.textAlign = 'end';
    ctx.fillText(`${finalTotal.toFixed(2)} ${t.currency}`, x(width - padding), y);
    y += H_TOTAL_LINE + 10;
    drawDashedLine(y);
    y += 25;
    
    let paymentStatusText = t.paymentStatusUnpaid, paymentStatusColor = COLORS.ORANGE;
    if (order.paymentMethod) {
        if(order.paymentMethod === 'cod') { paymentStatusText = t.paymentStatusCod; paymentStatusColor = COLORS.BLUE; }
        else if (order.paymentMethod === 'online') { paymentStatusText = t.paymentStatusPaidOnline; paymentStatusColor = COLORS.GREEN; }
    }
    
    ctx.font = `bold 14px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = 'start';
    ctx.fillText(t.paymentStatus, x(padding), y);
    ctx.fillStyle = paymentStatusColor;
    const chipWidth = ctx.measureText(paymentStatusText).width + 24;
    const chipX = isRtl ? padding : width - padding - chipWidth;
    ctx.beginPath();
    const chipRadius = 12;
    ctx.moveTo(chipX + chipRadius, y - 16);
    ctx.lineTo(chipX + chipWidth - chipRadius, y - 16);
    ctx.quadraticCurveTo(chipX + chipWidth, y - 16, chipX + chipWidth, y - 16 + chipRadius);
    ctx.lineTo(chipX + chipWidth, y - 16 + 24 - chipRadius);
    ctx.quadraticCurveTo(chipX + chipWidth, y - 16 + 24, chipX + chipWidth - chipRadius, y - 16 + 24);
    ctx.lineTo(chipX + chipRadius, y - 16 + 24);
    ctx.quadraticCurveTo(chipX, y - 16 + 24, chipX, y - 16 + 24 - chipRadius);
    ctx.lineTo(chipX, y - 16 + chipRadius);
    ctx.quadraticCurveTo(chipX, y - 16, chipX + chipRadius, y - 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(paymentStatusText, chipX + chipWidth / 2, y);
    y += 28;
    
    ctx.font = `14px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = 'start';
    ctx.fillText(t.paymentMethod, x(padding), y);
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = 'end';
    ctx.fillText(order.paymentDetail || (order.paymentMethod === 'cod' ? t.cash : 'N/A'), x(width - padding), y);
    y += 40;

    ctx.font = `16px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = 'center';
    ctx.fillText(language === 'ar' ? 'شكراً لطلبك!' : 'Thank you for your order!', width / 2, y);

    return canvas.toDataURL('image/png');
};

const generateGenericInvoiceImage = async (
  invoice: PurchaseInvoice | SalesInvoice,
  type: 'purchase' | 'sales',
  restaurantInfo: RestaurantInfo,
  t: typeof translations['en'],
  language: Language,
  products?: Product[]
): Promise<string> => {
    await document.fonts.ready;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // --- SETUP ---
    const isRtl = language === 'ar';
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    const FONT_SANS = isRtl ? 'Cairo, sans-serif' : 'sans-serif';
    const FONT_MONO = 'monospace';
    
    const width = 500;
    const padding = 25;
    const contentWidth = width - (padding * 2);
    
    const COLORS = { 
        PAPER: '#FFFFFF', 
        TEXT_DARK: '#111827', 
        TEXT_MEDIUM: '#4B5563', 
        TEXT_LIGHT: '#9CA3AF', 
        BORDER: '#E5E7EB', 
        RED: '#EF4444',
        PRIMARY: '#F59E0B'
    };

    // --- HELPERS ---
    const getWrappedTextLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        if (words.length === 0) return [];
        const lines: string[] = [];
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            if (!word) continue;
            const testLine = currentLine + " " + word;
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && i > 0) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    // --- HEIGHT CALCULATION ---
    let y = 0;

    y += 160; // Header

    const details = [];
    if (type === 'sales') {
        const si = invoice as SalesInvoice;
        details.push({ label: t.invoiceNumber, value: si.invoice_number });
        details.push({ label: t.date, value: formatDateTime(si.invoice_date) });
        details.push({ label: t.customer, value: si.customer_name });
        details.push({ label: t.mobileNumber, value: si.customer_mobile });
        if (si.created_by_name) {
            details.push({ label: t.createdBy, value: si.created_by_name });
        }
    } else {
        const pi = invoice as PurchaseInvoice;
        details.push({ label: t.invoiceId, value: String(pi.id) });
        details.push({ label: t.date, value: formatDateTime(pi.invoice_date) });
        details.push({ label: t.supplier, value: pi.supplier_name });
    }
    y += details.length * 24;
    y += 25;

    y += 60; // Header height + spacing

    (invoice.items as SalesInvoiceItem[]).forEach((item: SalesInvoiceItem) => {
        const productName = item.product_name?.[language] || `Product ID: ${item.product_id}`;
        ctx.font = `14px ${FONT_SANS}`;
        const lines = getWrappedTextLines(ctx, productName, 200);
        let itemHeight = lines.length * 18;
        
        if (type === 'sales' && (item.discount_percent || 0) > 0) {
            itemHeight += 16;
        }
        y += Math.max(itemHeight, 18); // Min height of one line
        y += 25;
    });
    
    y += 20;
    let totalSavings = 0;
    if (type === 'sales') {
        const salesInvoice = invoice as SalesInvoice;
        const originalTotal = salesInvoice.items.reduce((sum, item) => {
            const originalPrice = item.original_price ?? item.price;
            return sum + (originalPrice * item.quantity);
        }, 0);
        totalSavings = originalTotal - salesInvoice.total_amount;
    }
    if (totalSavings > 0.01) {
        y += 28 * 2;
    }
    y += 36;
    y += 20;

    y += 40;

    // --- DRAWING ---
    canvas.width = width;
    canvas.height = y;
    const finalHeight = y;
    y = 0;

    ctx.fillStyle = COLORS.PAPER;
    ctx.fillRect(0, 0, width, finalHeight);

    y = 40;
    const logo = await loadImage(restaurantInfo.logo);
    ctx.drawImage(logo, (width / 2) - 30, y, 60, 60);
    y += 70;
    ctx.font = `bold 22px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = 'center';
    ctx.fillText(restaurantInfo.name[language], width / 2, y);
    y += 20;
    ctx.font = `16px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    const invoiceTitle = type === 'sales' ? t.salesInvoice : t.purchaseInvoice;
    ctx.fillText(invoiceTitle, width / 2, y);
    y += 30;
    
    ctx.font = `14px ${FONT_SANS}`;
    details.forEach(detail => {
        ctx.fillStyle = COLORS.TEXT_MEDIUM;
        ctx.textAlign = isRtl ? 'right' : 'left';
        ctx.fillText(detail.label, isRtl ? width - padding : padding, y);
        
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.textAlign = isRtl ? 'left' : 'right';
        ctx.fillText(detail.value, isRtl ? padding : width - padding, y);
        y += 24;
    });
    y += 10;
    
    // --- ITEM TABLE HEADER ---
    const headerY = y;
    const headerHeight = 50; // Increased height for two lines
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.fillRect(padding, headerY, contentWidth, headerHeight);

    ctx.font = `bold 13px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.PAPER;

    // Helper to draw header text (potentially multi-line)
    const drawHeaderText = (text: string, x: number, align: CanvasTextAlign) => {
        ctx.textAlign = align;
        const words = text.split(' ');
        if (words.length > 1) {
            const line1 = words[0];
            const line2 = words.slice(1).join(' ');
            ctx.fillText(line1, x, headerY + 20); // y position for line 1
            ctx.fillText(line2, x, headerY + 38); // y position for line 2
        } else {
            // Draw single-line text centered vertically
            ctx.fillText(text, x, headerY + 30);
        }
    };

    // Column widths
    const subtotalColWidth = 85;
    const priceColWidth = 85;
    const qtyColWidth = 50;
    const itemColWidth = contentWidth - subtotalColWidth - priceColWidth - qtyColWidth;
    const colPadding = 10;

    // Draw headers
    const priceHeader = type === 'sales' ? t.salePrice : t.purchasePrice;
    if (isRtl) {
        drawHeaderText(t.item, width - padding - colPadding, 'right');
        drawHeaderText(t.quantity, width - padding - itemColWidth - (qtyColWidth / 2), 'center');
        drawHeaderText(priceHeader, width - padding - itemColWidth - qtyColWidth - (priceColWidth / 2), 'center');
        drawHeaderText(t.subtotal, padding + colPadding, 'left');
    } else {
        drawHeaderText(t.item, padding + colPadding, 'left');
        drawHeaderText(t.quantity, padding + itemColWidth + (qtyColWidth / 2), 'center');
        drawHeaderText(priceHeader, padding + itemColWidth + qtyColWidth + (priceColWidth / 2), 'center');
        drawHeaderText(t.subtotal, width - padding - colPadding, 'right');
    }

    y = headerY + headerHeight; // Move y to the bottom of the header rect
    y += 20; // Increased space between header and first item

    // --- ITEM ROWS ---
    (invoice.items as SalesInvoiceItem[]).forEach((item: SalesInvoiceItem) => {
        const itemStartY = y;

        const price = item.price ?? 0;
        const subtotal = item.subtotal;

        // Numbers
        ctx.font = `14px ${FONT_MONO}`;
        ctx.fillStyle = COLORS.TEXT_MEDIUM;
        
        if (isRtl) {
            const qtyX = width - padding - itemColWidth - (qtyColWidth / 2);
            const priceX = qtyX - (qtyColWidth / 2) - (priceColWidth / 2);

            ctx.textAlign = 'center';
            ctx.fillText(String(item.quantity), qtyX, y);
            ctx.fillText(Number(price).toFixed(2), priceX, y);
            
            ctx.textAlign = 'left';
            ctx.font = `bold 14px ${FONT_MONO}`;
            ctx.fillStyle = COLORS.TEXT_DARK;
            ctx.fillText(Number(subtotal).toFixed(2), padding + colPadding, y);
        } else {
            const qtyX = padding + itemColWidth + (qtyColWidth / 2);
            const priceX = qtyX + (qtyColWidth / 2) + (priceColWidth / 2);

            ctx.textAlign = 'center';
            ctx.fillText(String(item.quantity), qtyX, y);
            ctx.fillText(Number(price).toFixed(2), priceX, y);

            ctx.font = `bold 14px ${FONT_MONO}`;
            ctx.fillStyle = COLORS.TEXT_DARK;
            ctx.textAlign = 'right';
            ctx.fillText(Number(subtotal).toFixed(2), width - padding - colPadding, y);
        }

        // Product Name (can wrap)
        const productName = item.product_name?.[language] || `Product ID: ${item.product_id}`;
        ctx.font = `14px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.textAlign = isRtl ? 'right' : 'left';
        const lines = getWrappedTextLines(ctx, productName, itemColWidth - (colPadding * 2));
        let lineY = y;
        lines.forEach(line => {
            ctx.fillText(line, isRtl ? width - padding - colPadding : padding + colPadding, lineY);
            lineY += 18;
        });
        const itemNameHeight = (lines.length * 18);
        
        let itemHeight = itemNameHeight;

        if (type === 'sales' && (item.discount_percent || 0) > 0) {
            const currentY = itemStartY + Math.max(itemNameHeight - 18, 0) + 16;
            itemHeight = Math.max(itemHeight, currentY - itemStartY + 16);
            ctx.font = `12px ${FONT_SANS}`;
            ctx.fillStyle = COLORS.RED;
            ctx.textAlign = isRtl ? 'right' : 'left';
            ctx.fillText(`(${item.discount_percent?.toFixed(0)}% ${t.discount})`, isRtl ? width - padding - colPadding : padding + colPadding, currentY);
        }
        
        y = itemStartY + Math.max(itemHeight, 18);

        y += 10;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.strokeStyle = COLORS.BORDER;
        ctx.lineWidth = 1;
        ctx.stroke();
        y += 10;
    });

    y += 10;
    
    if (totalSavings > 0.01) {
        const originalTotal = invoice.total_amount + totalSavings;
        ctx.font = `15px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.TEXT_MEDIUM;
        ctx.textAlign = isRtl ? 'right' : 'left';
        ctx.fillText(t.subtotal, isRtl ? width - padding : padding, y);
        ctx.textAlign = isRtl ? 'left' : 'right';
        ctx.fillText(`${originalTotal.toFixed(2)} ${t.currency}`, isRtl ? padding : width - padding, y);
        y += 28;

        ctx.font = `15px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.RED;
        ctx.textAlign = isRtl ? 'right' : 'left';
        ctx.fillText(t.discount, isRtl ? width - padding : padding, y);
        ctx.textAlign = isRtl ? 'left' : 'right';
        ctx.fillText(`-${totalSavings.toFixed(2)} ${t.currency}`, isRtl ? padding : width - padding, y);
        y += 28;
    }
    
    ctx.font = `bold 18px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(t.total, isRtl ? width - padding : padding, y);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.font = `bold 22px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.PRIMARY;
    ctx.fillText(`${invoice.total_amount.toFixed(2)} ${t.currency}`, isRtl ? padding : width - padding, y);
    y += 40;

    ctx.font = `14px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    ctx.textAlign = 'center';
    ctx.fillText(language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!', width / 2, y);

    return canvas.toDataURL('image/png');
};


export const generatePurchaseInvoiceImage = (invoice: PurchaseInvoice, restaurantInfo: RestaurantInfo, t: typeof translations['en'], language: Language) => 
    generateGenericInvoiceImage(invoice, 'purchase', restaurantInfo, t, language);

export const generateSalesInvoiceImage = (invoice: SalesInvoice, restaurantInfo: RestaurantInfo, t: typeof translations['en'], language: Language, products: Product[], promotions: Promotion[]) =>
    generateGenericInvoiceImage(invoice, 'sales', restaurantInfo, t, language, products);


export const getStartAndEndDates = (dateRange: string, customStart?: string, customEnd?: string): { startDate: Date, endDate: Date } => {
    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    switch (dateRange) {
        case 'today':
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            return { startDate: todayStart, endDate: todayEnd };
        case 'yesterday':
            const yesterdayStart = new Date();
            yesterdayStart.setDate(now.getDate() - 1);
            yesterdayStart.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(yesterdayStart);
            yesterdayEnd.setHours(23, 59, 59, 999);
            return { startDate: yesterdayStart, endDate: yesterdayEnd };
        case 'last7days':
            const last7Start = new Date();
            last7Start.setDate(now.getDate() - 6);
            last7Start.setHours(0, 0, 0, 0);
            return { startDate: last7Start, endDate: todayEnd };
        case 'thisMonth':
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: thisMonthStart, endDate: todayEnd };
        case 'last30days':
             const last30Start = new Date();
            last30Start.setDate(now.getDate() - 29);
            last30Start.setHours(0, 0, 0, 0);
            return { startDate: last30Start, endDate: todayEnd };
        case 'custom':
            const customStartDateObj = customStart ? new Date(customStart) : new Date(0);
            if (customStart) customStartDateObj.setHours(0, 0, 0, 0);
            const customEndDateObj = customEnd ? new Date(customEnd) : new Date();
            if (customEnd) customEndDateObj.setHours(23, 59, 59, 999);
            return { startDate: customStartDateObj, endDate: customEndDateObj };
        default:
             const defaultStart = new Date();
            defaultStart.setHours(0,0,0,0);
            return { startDate: defaultStart, endDate: todayEnd };
    }
}

export const getDescendantCategoryIds = (categoryId: number, categories: Category[]): number[] => {
    const ids: number[] = [];

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