import type { Product, Category, Tag, Promotion, RestaurantInfo, User } from '../types';

export const restaurantInfo: RestaurantInfo = {
    name: { en: "Tabuk Restaurants", ar: "مطعم تبوك" },
    logo: "https://picsum.photos/100",
    whatsappNumber: "201028855779", // Replace with actual WhatsApp number
};

export const initialCategories: Category[] = [
  { id: 1, name: { en: 'Main Dishes', ar: 'الأطباق الرئيسية' } },
  { id: 2, name: { en: 'Drinks', ar: 'المشروبات' } },
  { id: 3, name: { en: 'Desserts', ar: 'الحلويات' } },
  { id: 4, name: { en: 'Appetizers', ar: 'المقبلات' } },
];

export const initialTags: Tag[] = [
  { id: 'vegetarian', name: { en: 'Vegetarian', ar: 'نباتي' } },
  { id: 'gluten-free', name: { en: 'Gluten-Free', ar: 'خالي من الغلوتين' } },
  { id: 'healthy', name: { en: 'Healthy', ar: 'صحي' } },
  { id: 'spicy', name: { en: 'Spicy', ar: 'حار' } },
];

export const users: User[] = [
    { id: 1, name: 'Admin', mobile: 'admin', password: 'password', role: 'superAdmin' },
    { id: 2, name: 'Ali Ahmed', mobile: '0501234567', password: 'password123', role: 'customer' },
    { id: 3, name: 'Fatima Zahra', mobile: '0557654321', password: 'password123', role: 'customer' },
];

export const products: Product[] = [
  {
    id: 1,
    code: 'M01',
    name: { en: 'Grilled Salmon', ar: 'سلمون مشوي' },
    description: { en: 'Fresh salmon grilled to perfection, served with asparagus.', ar: 'سلمون طازج مشوي بإتقان، يقدم مع الهليون.' },
    price: 95.50,
    image: 'https://picsum.photos/seed/salmon/400/300',
    categoryId: 1,
    rating: 4.8,
    isPopular: true,
    isNew: false,
    isVisible: true,
    tags: ['healthy'],
  },
  {
    id: 2,
    code: 'M02',
    name: { en: 'Classic Beef Burger', ar: 'برجر لحم كلاسيك' },
    description: { en: 'Juicy beef patty with lettuce, tomato, and our special sauce.', ar: 'شريحة لحم طرية مع الخس والطماطم وصلصتنا الخاصة.' },
    price: 55.00,
    image: 'https://picsum.photos/seed/burger/400/300',
    categoryId: 1,
    rating: 4.5,
    isPopular: true,
    isNew: false,
    isVisible: true,
    tags: [],
    options: [
        { name: { en: 'Add-ons', ar: 'إضافات' }, values: [{ name: { en: 'Extra Cheese', ar: 'جبنة إضافية' }, priceModifier: 5 }, { name: { en: 'Bacon', ar: 'بيكون' }, priceModifier: 8 }] }
    ]
  },
  {
    id: 3,
    code: 'D01',
    name: { en: 'Lemonade', ar: 'عصير ليمون' },
    description: { en: 'Freshly squeezed lemonade.', ar: 'عصير ليمون طازج.' },
    price: 15.00,
    image: 'https://picsum.photos/seed/lemonade/400/300',
    categoryId: 2,
    rating: 4.7,
    isPopular: false,
    isNew: true,
    isVisible: true,
    tags: ['healthy', 'vegetarian'],
  },
  {
    id: 4,
    code: 'S01',
    name: { en: 'Chocolate Lava Cake', ar: 'كيكة الشوكولاتة الذائبة' },
    description: { en: 'Warm chocolate cake with a gooey center, served with vanilla ice cream.', ar: 'كيكة شوكولاتة دافئة بقلب سائل، تقدم مع آيس كريم الفانيلا.' },
    price: 40.00,
    image: 'https://picsum.photos/seed/cake/400/300',
    categoryId: 3,
    rating: 4.9,
    isPopular: true,
    isNew: false,
    isVisible: true,
    tags: ['vegetarian'],
  },
  {
    id: 5,
    code: 'M03',
    name: { en: 'Vegetable Pasta', ar: 'باستا بالخضروات' },
    description: { en: 'Penne pasta with a mix of fresh seasonal vegetables in a light tomato sauce.', ar: 'باستا بيني مع مزيج من الخضروات الموسمية الطازجة في صلصة طماطم خفيفة.' },
    price: 65.00,
    image: 'https://picsum.photos/seed/pasta/400/300',
    categoryId: 1,
    rating: 4.4,
    isPopular: false,
    isNew: true,
    isVisible: true,
    tags: ['vegetarian', 'healthy'],
     options: [
        { name: { en: 'Sauce', ar: 'صلصة' }, values: [{ name: { en: 'Tomato', ar: 'طماطم' }, priceModifier: 0 }, { name: { en: 'Alfredo', ar: 'ألفريدو' }, priceModifier: 10 }] }
    ]
  },
  {
    id: 6,
    code: 'A01',
    name: { en: 'Spicy Chicken Wings', ar: 'أجنحة دجاج حارة' },
    description: { en: 'Crispy fried chicken wings tossed in our signature spicy sauce.', ar: 'أجنحة دجاج مقلية ومقرمشة مغطاة بصلصتنا الحارة المميزة.' },
    price: 45.00,
    image: 'https://picsum.photos/seed/wings/400/300',
    categoryId: 4,
    rating: 4.6,
    isPopular: false,
    isNew: false,
    isVisible: true,
    tags: ['spicy'],
  },
  {
    id: 7,
    code: 'M04',
    name: { en: 'Gluten-Free Pizza', ar: 'بيتزا خالية من الغلوتين' },
    description: { en: 'A delicious pizza with your choice of toppings on a gluten-free crust.', ar: 'بيتزا لذيذة مع اختيارك من الإضافات على عجينة خالية من الغلوتين.' },
    price: 75.00,
    image: 'https://picsum.photos/seed/pizza/400/300',
    categoryId: 1,
    rating: 4.3,
    isPopular: false,
    isNew: false,
    isVisible: true,
    tags: ['gluten-free'],
  },
  {
    id: 8,
    code: 'D02',
    name: { en: 'Iced Coffee', ar: 'قهوة مثلجة' },
    description: { en: 'Rich and smooth iced coffee, perfect for a warm day.', ar: 'قهوة مثلجة غنية وسلسة، مثالية ليوم حار.' },
    price: 22.00,
    image: 'https://picsum.photos/seed/coffee/400/300',
    categoryId: 2,
    rating: 4.8,
    isPopular: true,
    isNew: false,
    isVisible: true,
    tags: ['vegetarian'],
     options: [
        { name: { en: 'Size', ar: 'الحجم' }, values: [{ name: { en: 'Medium', ar: 'وسط' }, priceModifier: 0 }, { name: { en: 'Large', ar: 'كبير' }, priceModifier: 5 }] }
    ]
  },
];

export const promotions: Promotion[] = [
    {
        id: 1,
        title: { en: "Today's Special", ar: "عرض اليوم الخاص" },
        description: { en: "Get 20% off on our Classic Beef Burger!", ar: "احصل على خصم 20% على برجر اللحم الكلاسيكي!" },
        productId: 2,
        discountPercent: 20,
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        isActive: true,
    },
    {
        id: 2,
        title: { en: "Happy Hour!", ar: "ساعة السعادة!" },
        description: { en: "50% off on all drinks for the next 3 hours.", ar: "خصم 50% على جميع المشروبات للساعات الثلاث القادمة." },
        productId: 3, // Example for one drink
        discountPercent: 50,
        endDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
        isActive: true,
    }
];