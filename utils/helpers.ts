import type { CartItem } from '../types';

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
