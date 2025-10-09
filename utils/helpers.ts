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


export const generateReceiptImage = (order: Order, restaurantInfo: RestaurantInfo, t: any, language: Language): Promise<string> => {
      return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');
        
        const dpi = 2; // Increase resolution for better quality
        const fontName = language === 'ar' ? 'Cairo' : 'sans-serif';

        // Pre-load fonts
        const fontStyles = ['normal', 'bold'];
        const fontSizes = [12, 14, 16, 20, 24];
        const fontPromises: Promise<any>[] = [];
        fontStyles.forEach(style => {
            fontSizes.forEach(size => {
                fontPromises.push(document.fonts.load(`${style} ${size * dpi}px ${fontName}`));
            });
        });
        await Promise.all(fontPromises);
       
        const isRtl = language === 'ar';
        if (isRtl) ctx.direction = 'rtl';

        const padding = 20 * dpi;
        const canvasWidth = 400 * dpi;

        const fontSizesDPI = {
            xs: 12 * dpi, sm: 14 * dpi, base: 16 * dpi, lg: 20 * dpi, xl: 24 * dpi
        }

        const setFont = (size: keyof typeof fontSizesDPI, weight: 'normal' | 'bold' = 'normal') => {
            ctx.font = `${weight} ${fontSizesDPI[size]}px ${fontName}`;
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

        let y = padding;
        const logoSize = 60 * dpi;
        y += logoSize + (20 * dpi);
        setFont('xl', 'bold');
        y += fontSizesDPI.xl + (15 * dpi);

        const details = [
            { label: t.orderId, value: order.id },
            { label: t.date, value: formatDateTime(order.timestamp) },
            { label: t.orderType, value: t[order.orderType === 'Dine-in' ? 'dineIn' : 'delivery'] + (order.tableNumber ? ` (${t.table} ${order.tableNumber})` : '') },
            { label: t.name, value: order.customer.name },
            { label: t.mobileNumber, value: order.customer.mobile },
            { label: t.address, value: order.customer.address }
        ].filter(d => d.value);
        
        setFont('sm');
        details.forEach(detail => {
            const lines = getWrappedLines(`${detail.label}: ${detail.value}`, canvasWidth - padding * 2);
            y += lines.length * (fontSizesDPI.sm * 1.5);
        });
        y += 20 * dpi;

        y += 20 * dpi; // for separator

        setFont('base', 'bold');
        y += fontSizesDPI.base * 1.5; // for header
        
        order.items.forEach(item => {
            setFont('base');
            const itemText = `${item.quantity} x ${item.product.name[language]}`;
            const lines = getWrappedLines(itemText, canvasWidth - padding * 2 - (80*dpi));
            y += lines.length * (fontSizesDPI.base * 1.5);

            if (item.options && Object.keys(item.options).length > 0) {
                 setFont('xs');
                 Object.entries(item.options).forEach(([optEn, valEn]) => {
                     const option = item.product.options?.find(o => o.name.en === optEn);
                     const value = option?.values.find(v => v.name.en === valEn);
                     if(option && value) y += fontSizesDPI.xs * 1.6;
                 });
            }
            y += 10 * dpi;
        });

        y += 20 * dpi; // for separator
        setFont('xl', 'bold');
        y += fontSizesDPI.xl * 1.5; // for total
        y += 30 * dpi;
        setFont('sm');
        y += fontSizesDPI.sm; // for footer
        y += padding;

        canvas.width = canvasWidth;
        canvas.height = y;

        // --- Drawing Pass ---
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const mainX = isRtl ? canvas.width - padding : padding;
        const secondaryX = isRtl ? padding : canvas.width - padding;
        const centerX = canvas.width / 2;

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
            y += logoSize + (20 * dpi);
            
            setFont('xl', 'bold');
            ctx.fillStyle = '#111827';
            ctx.textAlign = 'center';
            ctx.fillText(restaurantInfo.name[language], centerX, y);
            y += fontSizesDPI.xl + (10 * dpi);
            
            // --- Details ---
            setFont('sm');
            ctx.fillStyle = '#4B5563';
            details.forEach(detail => {
                const lines = getWrappedLines(`${detail.label}: ${detail.value}`, canvasWidth - padding * 2);
                lines.forEach(line => {
                    ctx.textAlign = mainAlign;
                    ctx.fillText(line, mainX, y);
                    y += fontSizesDPI.sm * 1.5;
                });
            });

            // --- Separator ---
            y += 10 * dpi;
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = 1 * dpi;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            y += 20 * dpi;

            // --- Items Header ---
            setFont('base', 'bold');
            ctx.fillStyle = '#374151';
            ctx.textAlign = mainAlign;
            ctx.fillText(t.item, mainX, y);
            ctx.textAlign = secondaryAlign;
            ctx.fillText(t.price, secondaryX, y);
            y += fontSizesDPI.base * 1.5;

            // --- Items List ---
            order.items.forEach(item => {
                const itemTotal = calculateTotal([item]);
                const itemText = `${item.quantity} x ${item.product.name[language]}`;
                const lines = getWrappedLines(itemText, canvasWidth - padding * 2 - (80*dpi));
                
                setFont('base');
                ctx.fillStyle = '#111827';
                ctx.textAlign = secondaryAlign;
                ctx.fillText(itemTotal.toFixed(2), secondaryX, y);
                
                ctx.textAlign = mainAlign;
                lines.forEach((line) => {
                    ctx.fillText(line, mainX, y);
                    y += fontSizesDPI.base * 1.5;
                });

                if (item.options && item.product.options && Object.keys(item.options).length > 0) {
                    setFont('xs');
                    ctx.fillStyle = '#6B7280';
                    Object.entries(item.options).forEach(([optEn, valEn]) => {
                       const option = item.product.options?.find(o => o.name.en === optEn);
                       const value = option?.values.find(v => v.name.en === valEn);
                       if(option && value) {
                           const optionText = `- ${value.name[language]}`;
                           ctx.fillText(optionText, mainX + (isRtl ? -15 * dpi : 15 * dpi), y);
                           y += fontSizesDPI.xs * 1.6;
                       }
                    });
                }
                y += 5 * dpi;
            });
            y += 10 * dpi;

            // --- Total Separator ---
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            y += 20 * dpi;

            // --- Grand Total ---
            setFont('xl', 'bold');
            ctx.fillStyle = '#111827';
            ctx.textAlign = mainAlign;
            ctx.fillText(`${t.total}:`, mainX, y);
            ctx.textAlign = secondaryAlign;
            ctx.fillText(`${order.total.toFixed(2)} ${t.currency}`, secondaryX, y);
            y += fontSizesDPI.xl * 1.5;
            
            // --- Footer ---
            y += 20 * dpi;
            setFont('sm');
            ctx.fillStyle = '#6B7280';
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