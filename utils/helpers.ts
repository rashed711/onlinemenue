import type { CartItem, Order, RestaurantInfo, Language, Product, Promotion, Category, PurchaseInvoice, SalesInvoice } from '../types';
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
    return new Promise((resolve, reject) => {
        if (!src) {
            const placeholder = new Image();
            placeholder.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            placeholder.onload = () => resolve(placeholder);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => {
            console.error(`Failed to load image: ${src}`, e);
            const placeholder = new Image();
            placeholder.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            placeholder.onload = () => resolve(placeholder);
        };
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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const isRtl = language === 'ar';
    const FONT_FAMILY_SANS = isRtl ? 'Cairo, sans-serif' : 'Inter, sans-serif';
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
        const itemLines = getWrappedTextLines(ctx, itemText, contentWidth - 80);
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
    const textAlign = (align: CanvasTextAlign): CanvasTextAlign => {
        if (!isRtl) return align;
        if (align === 'start') return 'end';
        if (align === 'end') return 'start';
        return 'center';
    };
    
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
        ctx.textAlign = textAlign(align);
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
        ctx.textAlign = textAlign('start');
        ctx.fillText(detail.label, x(padding), y);
        
        ctx.fillStyle = COLORS.TEXT_DARK;
        if (detail.label === t.address) {
            y = drawWrappedText(detail.value, width - padding, y, contentWidth / 2, H_DETAIL, 'end');
        } else {
            ctx.textAlign = textAlign('end');
            ctx.fillText(detail.value, x(width - padding), y);
        }
        y += H_DETAIL;
    });
    y += 10;
    
    drawDashedLine(y);
    y += 25;
    ctx.font = `bold 14px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = textAlign('start');
    ctx.fillText(t.item, x(padding), y);
    ctx.textAlign = textAlign('end');
    ctx.fillText(t.price, x(width - padding), y);
    y += 20;

    order.items.forEach(item => {
        const itemStartY = y;
        ctx.font = `15px ${FONT_FAMILY_SANS}`;
        ctx.fillStyle = COLORS.TEXT_DARK;
        y = drawWrappedText(`${item.quantity} x ${item.product.name[language]}`, padding, y, contentWidth - 100, H_ITEM_NAME);
        y += H_ITEM_NAME;

        const finalItemTotal = calculateItemTotal(item);
        const originalItemTotal = calculateOriginalItemTotal(item);

        ctx.textAlign = textAlign('end');
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
                    y = drawWrappedText(`+ ${valueName}`, padding + 15, y, contentWidth - 115, H_ITEM_OPTION);
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
        ctx.textAlign = textAlign('start');
        ctx.fillText(t.subtotal, x(padding + 250), y);
        ctx.textAlign = textAlign('end');
        ctx.fillText(`${originalTotal.toFixed(2)} ${t.currency}`, x(width - padding), y);
        y += H_TOTAL_LINE;

        ctx.fillStyle = COLORS.RED;
        ctx.textAlign = textAlign('start');
        ctx.fillText(t.discount, x(padding + 250), y);
        ctx.textAlign = textAlign('end');
        ctx.fillText(`-${totalSavingsVal.toFixed(2)} ${t.currency}`, x(width - padding), y);
        y += H_TOTAL_LINE;
    }

    ctx.font = `bold 18px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = textAlign('start');
    ctx.fillText(t.total, x(padding + 250), y);
    ctx.textAlign = textAlign('end');
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
    ctx.textAlign = textAlign('start');
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
    ctx.textAlign = textAlign('start');
    ctx.fillText(t.paymentMethod, x(padding), y);
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = textAlign('end');
    ctx.fillText(order.paymentDetail || (order.paymentMethod === 'cod' ? t.cash : 'N/A'), x(width - padding), y);
    y += 40;

    ctx.font = `16px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = 'center';
    ctx.fillText(t.language === 'ar' ? 'شكراً لطلبك!' : 'Thank you for your order!', width / 2, y);

    return canvas.toDataURL('image/png');
};

const generateGenericInvoiceImage = async (
  invoice: PurchaseInvoice | SalesInvoice,
  type: 'purchase' | 'sales',
  restaurantInfo: RestaurantInfo,
  t: typeof translations['en'],
  language: Language
): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const isRtl = language === 'ar';
    const FONT_FAMILY_SANS = isRtl ? 'Cairo, sans-serif' : 'Inter, sans-serif';
    const width = 500;
    const padding = 25;
    const contentWidth = width - (padding * 2);
    const COLORS = { PAPER: '#FFFFFF', TEXT_DARK: '#1E293B', TEXT_LIGHT: '#64748B', BORDER: '#E2E8F0' };
    
    const H_DETAIL = 22;
    const H_ITEM_NAME = 24;
    const H_TOTAL_LINE = 28;

    let totalHeight = 0;
    totalHeight += 215; // Header space

    const details = [
        { label: type === 'purchase' ? t.invoiceId : t.invoiceNumber, value: String(type === 'purchase' ? invoice.id : (invoice as SalesInvoice).invoice_number) },
        { label: t.date, value: formatDateTime(invoice.invoice_date) },
    ];
    if (type === 'purchase') {
        details.push({ label: t.supplier, value: (invoice as PurchaseInvoice).supplier_name });
    } else {
        details.push({ label: t.customer, value: (invoice as SalesInvoice).customer_name });
        details.push({ label: t.mobileNumber, value: (invoice as SalesInvoice).customer_mobile });
    }
    
    totalHeight += details.length * H_DETAIL;
    totalHeight += 10; // Padding after details

    totalHeight += 45; // Items header
    invoice.items.forEach(item => {
        ctx.font = `15px ${FONT_FAMILY_SANS}`;
        const itemText = `${item.quantity} x ${item.product_name?.[language] || 'Item'}`;
        const itemLines = getWrappedTextLines(ctx, itemText, contentWidth - 80);
        totalHeight += (itemLines.length * H_ITEM_NAME) + 10; // name + padding
    });
    totalHeight += 15;

    totalHeight += H_TOTAL_LINE + 35; // Total section
    totalHeight += 60; // Footer

    canvas.width = width;
    canvas.height = totalHeight;
    
    ctx.fillStyle = COLORS.PAPER;
    ctx.fillRect(0, 0, width, totalHeight);

    const x = (val: number) => isRtl ? width - val : val;
    const textAlign = (align: CanvasTextAlign): CanvasTextAlign => {
        if (!isRtl) return align;
        return align === 'start' ? 'end' : align === 'end' ? 'start' : 'center';
    };
    
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
    ctx.fillText(type === 'purchase' ? t.purchaseInvoice : t.salesInvoice, width / 2, y);
    y += 30;
    drawDashedLine(y);
    y += 25;

    ctx.font = `14px ${FONT_FAMILY_SANS}`;
    details.forEach(detail => {
        ctx.fillStyle = COLORS.TEXT_LIGHT;
        ctx.textAlign = textAlign('start');
        ctx.fillText(detail.label, x(padding), y);
        
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.textAlign = textAlign('end');
        ctx.fillText(detail.value, x(width - padding), y);
        y += H_DETAIL;
    });
    y += 10;
    
    drawDashedLine(y);
    y += 25;
    ctx.font = `bold 14px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = textAlign('start');
    ctx.fillText(t.item, x(padding), y);
    ctx.textAlign = textAlign('end');
    ctx.fillText(t.subtotal, x(width - padding), y);
    y += 20;

    invoice.items.forEach(item => {
        const itemStartY = y;
        ctx.font = `15px ${FONT_FAMILY_SANS}`;
        ctx.fillStyle = COLORS.TEXT_DARK;
        const itemName = `${item.quantity} x ${item.product_name?.[language] || 'Item'}`;
        const itemPrice = type === 'purchase' ? (item as any).purchase_price : item.sale_price;
        const itemLineHeight = 20;
        
        const lines = getWrappedTextLines(ctx, itemName, contentWidth - 120);
        lines.forEach((line, index) => {
             ctx.textAlign = textAlign('start');
             ctx.fillText(line, x(padding), y + (index * itemLineHeight));
        });

        ctx.textAlign = textAlign('end');
        ctx.fillText(item.subtotal.toFixed(2), x(width - padding), itemStartY + H_ITEM_NAME / 2);

        y += (lines.length * itemLineHeight) + 10;
    });
    
    drawDashedLine(y);
    y += 25;
    
    ctx.font = `bold 18px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = textAlign('start');
    ctx.fillText(t.total, x(padding + 250), y);
    ctx.textAlign = textAlign('end');
    ctx.fillText(`${invoice.total_amount.toFixed(2)} ${t.currency}`, x(width - padding), y);
    y += H_TOTAL_LINE + 10;

    return canvas.toDataURL('image/png');
};

export const generatePurchaseInvoiceImage = (invoice: PurchaseInvoice, restaurantInfo: RestaurantInfo, t: typeof translations['en'], language: Language) => 
    generateGenericInvoiceImage(invoice, 'purchase', restaurantInfo, t, language);

export const generateSalesInvoiceImage = (invoice: SalesInvoice, restaurantInfo: RestaurantInfo, t: typeof translations['en'], language: Language) =>
    generateGenericInvoiceImage(invoice, 'sales', restaurantInfo, t, language);


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