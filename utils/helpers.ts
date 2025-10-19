import type { CartItem, Order, RestaurantInfo, Language, Product } from '../types';
import { translations } from '../i18n/translations';

export const formatNumber = (num: number): string => {
  try {
    // Using a basic formatter, can be expanded with locale options if needed
    return new Intl.NumberFormat().format(num);
  } catch (e) {
    // Fallback for environments that might not support it
    return String(num);
  }
};

export const calculateItemUnitPrice = (item: CartItem): number => {
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

export const calculateItemTotal = (item: CartItem): number => {
    return calculateItemUnitPrice(item) * item.quantity;
};


export const calculateTotal = (cartItems: CartItem[]): number => {
  return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
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
            // Immediately resolve with a placeholder if src is empty
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
            // Resolve with a placeholder 1x1 pixel image to prevent total failure
            const placeholder = new Image();
            placeholder.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            placeholder.onload = () => resolve(placeholder);
        };
        img.src = src;
    });
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

    // --- Configuration ---
    const isRtl = language === 'ar';
    const FONT_FAMILY_SANS = isRtl ? 'Cairo, sans-serif' : 'Inter, sans-serif';
    const width = 500;
    const padding = 25;
    const contentWidth = width - (padding * 2);

    const COLORS = {
        BG: '#F8F9FA',
        PAPER: '#FFFFFF',
        TEXT_DARK: '#1E293B',
        TEXT_LIGHT: '#64748B',
        PRIMARY: '#F59E0B',
        GREEN: '#10B981',
        BLUE: '#3B82F6',
        ORANGE: '#F97316',
        BORDER: '#E2E8F0',
    };

    // --- Helper Functions ---
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

    // --- Dynamic Height Calculation ---
    let y = 0;
    
    // Header
    y += 130;

    // Order Details
    const details = [
        { label: t.orderId, value: order.id },
        { label: t.date, value: formatDateTime(order.timestamp) },
        { label: t.orderType, value: t[order.orderType.toLowerCase() as keyof typeof t] + (order.tableNumber ? ` (${t.table} ${order.tableNumber})` : '')},
        { label: t.customer, value: order.customer.name },
        { label: t.mobileNumber, value: order.customer.mobile },
    ];
    if (order.orderType === 'Delivery' && order.customer.address) {
        details.push({ label: t.address, value: order.customer.address });
    }
    y += (details.length * 22) + 20;

    // Items
    y += 60; // Section header
    order.items.forEach(item => {
        y += 25; // Item name line
        if (item.options) {
            y += Object.keys(item.options).length * 18; // Options lines
        }
        y += 15; // Separator
    });

    // Totals
    y += 80;

    // Payment
    y += 80;

    // Footer
    y += 50;
    
    canvas.width = width;
    canvas.height = y;
    const finalHeight = y;
    y = 0; // Reset y for drawing pass

    // --- Drawing Pass ---
    ctx.fillStyle = COLORS.PAPER;
    ctx.fillRect(0, 0, width, finalHeight);

    // Header
    y = 40;
    try {
        const logo = await loadImage(restaurantInfo.logo);
        ctx.drawImage(logo, (width / 2) - 32, y, 64, 64);
    } catch(e) { /* Error logged in loadImage */ }
    y += 80;
    ctx.font = `bold 24px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = 'center';
    ctx.fillText(restaurantInfo.name[language], width / 2, y);
    y += 35;
    
    ctx.font = `16px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = 'center';
    ctx.fillText(t.receiptTitle, width / 2, y);
    y += 30;
    
    drawDashedLine(y);
    y += 25;

    // Order Details
    ctx.font = `14px ${FONT_FAMILY_SANS}`;
    details.forEach(detail => {
        ctx.fillStyle = COLORS.TEXT_LIGHT;
        ctx.textAlign = textAlign('start');
        ctx.fillText(detail.label, x(padding), y);
        
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.textAlign = textAlign('end');
        ctx.fillText(detail.value, x(width - padding), y);
        y += 22;
    });
    y += 10;
    
    drawDashedLine(y);
    y += 25;
    
    // Items Header
    ctx.font = `bold 14px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = textAlign('start');
    ctx.fillText(t.item, x(padding), y);
    ctx.textAlign = textAlign('end');
    ctx.fillText(t.price, x(width - padding), y);
    y += 20;

    // Items List
    order.items.forEach(item => {
        ctx.font = `15px ${FONT_FAMILY_SANS}`;
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.textAlign = textAlign('start');
        const quantityText = `${item.quantity} x `;
        ctx.fillText(quantityText + item.product.name[language], x(padding), y, contentWidth - 80);
        
        ctx.textAlign = textAlign('end');
        ctx.fillText(calculateItemTotal(item).toFixed(2), x(width - padding), y);
        y += 22;

        if (item.options) {
            ctx.font = `13px ${FONT_FAMILY_SANS}`;
            ctx.fillStyle = COLORS.TEXT_LIGHT;
            ctx.textAlign = textAlign('start');
            Object.values(item.options).forEach(valueKey => {
                const valueName = item.product.options?.flatMap(opt => opt.values).find(v => v.name.en === valueKey)?.name[language];
                if (valueName) {
                    ctx.fillText(`  + ${valueName}`, x(padding + 10), y, contentWidth - 90);
                    y += 18;
                }
            });
        }
        y+= 5;
        drawDashedLine(y);
        y+= 20;
    });

    // Totals
    const totals = [
        { label: t.subtotal, value: order.total.toFixed(2) }, // Assuming total includes subtotal logic
        { label: t.total, value: order.total.toFixed(2), isBold: true },
    ];
    totals.forEach(totalItem => {
        ctx.font = `${totalItem.isBold ? 'bold ' : ''}16px ${FONT_FAMILY_SANS}`;
        ctx.fillStyle = totalItem.isBold ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT;
        ctx.textAlign = textAlign('start');
        ctx.fillText(totalItem.label, x(padding + 250), y);
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.textAlign = textAlign('end');
        ctx.fillText(`${totalItem.value} ${t.currency}`, x(width - padding), y);
        y += 25;
    });
    y += 10;
    drawDashedLine(y);
    y+= 25;
    
    // Payment Details
    let paymentStatusText = t.paymentStatusUnpaid;
    let paymentStatusColor = COLORS.ORANGE;

    if (order.paymentMethod) {
        if(order.paymentMethod === 'cod') {
            paymentStatusText = t.paymentStatusCod;
            paymentStatusColor = COLORS.BLUE;
        } else if (order.paymentMethod === 'online') {
            paymentStatusText = t.paymentStatusPaidOnline;
            paymentStatusColor = COLORS.GREEN;
        }
    }
    
    ctx.font = `bold 14px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = textAlign('start');
    ctx.fillText(t.paymentStatus, x(padding), y);
    
    ctx.fillStyle = paymentStatusColor;
    const statusTextWidth = ctx.measureText(paymentStatusText).width;
    const chipPadding = 12;
    const chipWidth = statusTextWidth + chipPadding * 2;
    const chipX = isRtl ? padding : width - padding - chipWidth;
    ctx.roundRect(chipX, y - 16, chipWidth, 24, 12);
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


    // Footer
    ctx.font = `16px ${FONT_FAMILY_SANS}`;
    ctx.fillStyle = COLORS.TEXT_LIGHT;
    ctx.textAlign = 'center';
    ctx.fillText('!شكراً لطلبك', width / 2, y);

    return canvas.toDataURL('image/png');
};

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
            last7Start.setDate(now.getDate() - 6); // Including today
            last7Start.setHours(0, 0, 0, 0);
            return { startDate: last7Start, endDate: todayEnd };
        case 'thisMonth':
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: thisMonthStart, endDate: todayEnd };
        case 'last30days':
             const last30Start = new Date();
            last30Start.setDate(now.getDate() - 29); // Including today
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