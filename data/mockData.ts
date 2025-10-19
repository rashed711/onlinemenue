import type { Product, Category, Tag, Promotion, RestaurantInfo, User } from '../types';

export const restaurantInfo: RestaurantInfo = {
    name: { en: "Fresco", ar: "فريسكو" },
    logo: "",
    heroImage: "",
    heroTitle: { en: "Welcome", ar: "أهلاً بك" },
    description: { en: "Our menu is being updated. Please check back soon.", ar: "قائمتنا قيد التحديث. يرجى المراجعة قريبا." },
    whatsappNumber: "",
    tableCount: 0,
    defaultPage: 'menu',
    activationEndDate: null,
    deactivationMessage: {
        en: "The system is temporarily deactivated. Please contact support for more information.",
        ar: "تم إيقاف النظام مؤقتًا. يرجى التواصل مع الدعم الفني لمزيد من المعلومات."
    },
    socialLinks: [],
    orderStatusColumns: [
        { id: 'pending', name: { en: 'New Orders', ar: 'طلبات جديدة' }, color: 'yellow' },
        { id: 'in_progress', name: { en: 'In the Kitchen', ar: 'في المطبخ' }, color: 'orange' },
        { id: 'ready_for_pickup', name: { en: 'Ready for Pickup', ar: 'جاهز للتسليم' }, color: 'cyan' },
        { id: 'out_for_delivery', name: { en: 'Out for Delivery', ar: 'قيد التوصيل' }, color: 'blue' },
        { id: 'completed', name: { en: 'Completed', ar: 'مكتمل' }, color: 'green' },
        { id: 'cancelled', name: { en: 'Cancelled & Refused', ar: 'ملغي ومرفوض' }, color: 'slate' },
    ],
    onlinePaymentMethods: [],
    codNotes: { en: '', ar: '' },
    onlinePaymentNotes: { en: '', ar: '' },
};

export const initialCategories: Category[] = [];

export const initialTags: Tag[] = [];

export const products: Product[] = [];

export const promotions: Promotion[] = [];