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
