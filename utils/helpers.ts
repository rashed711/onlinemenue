import type { CartItem, Language, Order, RestaurantInfo } from '../types';

export const calculateTotal = (items: CartItem[]): number => {
    return items.reduce((total, item) => {
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
        return total + itemPrice * item.quantity;
    }, 0);
}

export const formatNumber = (num: number): string => {
    return num.toString();
};

export const formatDateTime = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);

    const pad = (num: number) => num.toString().padStart(2, '0');
    
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const paddedHours = pad(hours);

    return `${day}/${month}/${year} - ${paddedHours}:${minutes} ${ampm}`;
};

export const formatDate = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const pad = (num: number) => num.toString().padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Debounce function
export const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
};


export const generateReceiptImage = (order: Order, restaurantInfo: RestaurantInfo, t: any, language: Language, creatorName?: string): Promise<string> => {
      return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');
        
        const dpi = 2;
        const fontName = language === 'ar' ? 'Cairo' : 'sans-serif';
        const monoFontName = 'monospace';

        // Pre-load fonts
        try {
            await document.fonts.load(`bold ${12 * dpi}px ${fontName}`);
            await document.fonts.load(`normal ${12 * dpi}px ${fontName}`);
            await document.fonts.load(`normal ${12 * dpi}px ${monoFontName}`);
        } catch (e) {
            console.warn("Could not pre-load fonts for canvas receipt.", e);
        }
       
        const isRtl = language === 'ar';
        if (isRtl) {
            ctx.direction = 'rtl';
        }

        const padding = 25 * dpi;
        const canvasWidth = 400 * dpi;

        const fontSizesDPI = {
            xs: 13 * dpi, sm: 14 * dpi, base: 16 * dpi, lg: 18 * dpi, xl: 24 * dpi
        }

        const setFont = (size: keyof typeof fontSizesDPI, weight: 'normal' | 'bold' = 'normal', family: string = fontName) => {
            ctx.font = `${weight} ${fontSizesDPI[size]}px ${family}`;
        }
        
        const getWrappedLines = (text: string, maxWidth: number): string[] => {
            const words = text.split(' ');
            if (words.length === 0) return [];
            let lines: string[] = [];
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                if (ctx.measureText(currentLine + ' ' + word).width < maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        }

        const drawDashedLine = (yPos: number) => {
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1 * dpi;
            ctx.setLineDash([2 * dpi, 3 * dpi]);
            ctx.beginPath();
            ctx.moveTo(padding, yPos);
            ctx.lineTo(canvasWidth - padding, yPos);
            ctx.stroke();
            ctx.setLineDash([]); // Reset for other lines
        }

        // --- SIZING PASS ---
        let y = padding;
        const logoSize = 50 * dpi;
        y += logoSize + (15 * dpi);
        setFont('lg', 'bold');
        y += fontSizesDPI.lg + (15 * dpi);

        const orderTypeKey = order.orderType === 'Dine-in' ? 'dineIn' : order.orderType === 'Takeaway' ? 'takeaway' : 'delivery';
        const details = [
            { label: t.orderId, value: order.id },
            { label: t.date, value: formatDateTime(order.timestamp) },
            { label: t.orderType, value: t[orderTypeKey] + (order.tableNumber ? ` (${t.table} ${order.tableNumber})` : '') },
            { label: t.customer, value: order.customer.name },
            { label: t.mobileNumber, value: order.customer.mobile },
            { label: t.address, value: order.customer.address },
            { label: t.creator, value: creatorName },
        ].filter(d => d.value);
        
        setFont('sm');
        details.forEach(detail => {
            const lines = getWrappedLines(`${detail.label}: ${detail.value}`, canvasWidth - padding * 2);
            y += lines.length * (fontSizesDPI.sm * 1.6);
        });
        y += 15 * dpi;
        y += 15 * dpi; // for separator

        setFont('sm', 'bold');
        y += fontSizesDPI.sm * 1.5; // for header
        
        order.items.forEach(item => {
            setFont('base');
            const itemText = `${item.quantity} x ${item.product.name[language]}`;
            y += fontSizesDPI.base * 1.5;

            if (item.options && Object.keys(item.options).length > 0) {
                 setFont('xs');
                 Object.entries(item.options).forEach(([optEn, valEn]) => {
                     const option = item.product.options?.find(o => o.name.en === optEn);
                     const value = option?.values.find(v => v.name.en === valEn);
                     if(option && value) y += fontSizesDPI.xs * 1.6;
                 });
            }
            y += 5 * dpi;
        });

        y += 15 * dpi; // for separator
        setFont('lg', 'bold');
        y += fontSizesDPI.lg * 1.7; // for total
        y += 15 * dpi;
        y += 15 * dpi; // for separator
        setFont('base', 'bold');
        y += fontSizesDPI.base * 1.7; // payment status
        y += 15 * dpi;
        setFont('sm');
        y += fontSizesDPI.sm; // for footer
        y += padding;

        canvas.width = canvasWidth;
        canvas.height = y;

        // --- DRAWING PASS ---
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const mainX = isRtl ? canvasWidth - padding : padding;
        const secondaryX = isRtl ? padding : canvasWidth - padding;
        const centerX = canvasWidth / 2;
        const mainAlign = isRtl ? 'right' : 'left';
        const secondaryAlign = isRtl ? 'left' : 'right';
        
        y = padding;
        const logo = new Image();
        logo.crossOrigin = "Anonymous";
        logo.src = restaurantInfo.logo;

        const drawContent = () => {
            if (logo.complete && logo.naturalHeight !== 0) {
              ctx.drawImage(logo, centerX - logoSize / 2, y, logoSize, logoSize);
            }
            y += logoSize + (15 * dpi);
            
            setFont('lg', 'bold');
            ctx.fillStyle = '#1E293B';
            ctx.textAlign = 'center';
            ctx.fillText(restaurantInfo.name[language], centerX, y);
            y += fontSizesDPI.lg + (15 * dpi);
            
            // --- Details ---
            setFont('sm');
            ctx.fillStyle = '#475569';
            details.forEach(detail => {
                const lines = getWrappedLines(`${detail.label}: ${detail.value}`, canvasWidth - padding * 2);
                lines.forEach(line => {
                    ctx.textAlign = mainAlign;
                    ctx.fillText(line, mainX, y);
                    y += fontSizesDPI.sm * 1.6;
                });
            });

            y += 15 * dpi;
            drawDashedLine(y);
            y += 15 * dpi;

            // --- Items Header ---
            setFont('sm', 'bold');
            ctx.fillStyle = '#334155';
            ctx.textAlign = mainAlign;
            ctx.fillText(t.item, mainX, y);
            ctx.textAlign = secondaryAlign;
            ctx.fillText(t.price, secondaryX, y);
            y += fontSizesDPI.sm * 1.5;

            // --- Items List ---
            order.items.forEach(item => {
                const itemTotal = calculateTotal([item]);
                const nameText = `${item.quantity} x ${item.product.name[language]}`;
                
                setFont('base');
                ctx.fillStyle = '#1E293B';
                
                // Draw Price (mono)
                setFont('base', 'normal', monoFontName);
                ctx.textAlign = secondaryAlign;
                ctx.fillText(itemTotal.toFixed(2), secondaryX, y);
                
                // Draw Name
                setFont('base');
                ctx.textAlign = mainAlign;
                ctx.fillText(nameText, mainX, y);
                y += fontSizesDPI.base * 1.5;

                if (item.options && item.product.options && Object.keys(item.options).length > 0) {
                    setFont('xs');
                    ctx.fillStyle = '#64748B';
                    Object.entries(item.options).forEach(([optEn, valEn]) => {
                       const option = item.product.options?.find(o => o.name.en === optEn);
                       const value = option?.values.find(v => v.name.en === valEn);
                       if(option && value) {
                           const optionText = `+ ${value.name[language]}`;
                           ctx.textAlign = mainAlign;
                           ctx.fillText(optionText, mainX + (isRtl ? 0 : 15 * dpi), y);
                           y += fontSizesDPI.xs * 1.6;
                       }
                    });
                }
                y += 5 * dpi;
            });
            y += 5 * dpi;

            drawDashedLine(y);
            y += 15 * dpi;

            // --- Grand Total ---
            setFont('lg', 'bold');
            ctx.fillStyle = '#1E293B';
            ctx.textAlign = mainAlign;
            ctx.fillText(`${t.total}:`, mainX, y);
            ctx.textAlign = secondaryAlign;
            setFont('lg', 'bold', monoFontName);
            ctx.fillText(`${order.total.toFixed(2)} ${t.currency}`, secondaryX, y);
            y += fontSizesDPI.lg * 1.7;

            drawDashedLine(y);
            y += 15 * dpi;

            // --- Payment Status ---
            let paymentStatusText = '';
            let paymentStatusColor = '#475569'; // slate
            if (order.orderType === 'Dine-in' || order.orderType === 'Takeaway') {
                paymentStatusText = t.paymentStatusUnpaid;
                paymentStatusColor = '#D97706'; // amber-600
            } else { // Delivery
                if (order.paymentMethod === 'cod') {
                    paymentStatusText = t.paymentStatusCod;
                    paymentStatusColor = '#059669'; // green-600
                } else { // Online
                    paymentStatusText = t.paymentStatusPaidOnline;
                    paymentStatusColor = '#059669'; // green-600
                }
            }
            setFont('base', 'bold');
            ctx.fillStyle = '#334155';
            ctx.textAlign = mainAlign;
            ctx.fillText(`${t.paymentStatus}:`, mainX, y);
            
            ctx.fillStyle = paymentStatusColor;
            ctx.textAlign = secondaryAlign;
            ctx.fillText(paymentStatusText, secondaryX, y);
            y += fontSizesDPI.base * 1.7;

            // --- Footer ---
            y += 5 * dpi;
            setFont('sm');
            ctx.fillStyle = '#64748B';
            ctx.textAlign = 'center';
            ctx.fillText(language === 'ar' ? 'شكراً لطلبك!' : 'Thank you for your order!', centerX, y);

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
}