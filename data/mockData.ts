import type { Product, Category, Tag, Promotion, RestaurantInfo, User } from '../types';

export const restaurantInfo: RestaurantInfo = {
    name: { en: "Tabuk Restaurants", ar: "مطعم تبوك" },
    logo: "https://picsum.photos/100",
    whatsappNumber: "201028855779", // Replace with actual WhatsApp number
    defaultPage: 'menu',
    socialLinks: [
        { id: 1, name: 'Instagram', url: 'https://instagram.com', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.012 3.584-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85C2.27 3.854 3.792 2.31 7.045 2.163 8.31 2.105 8.69 2.093 12 2.093m0-2.093c-3.264 0-3.673.015-4.95.074-4.22.193-6.092 2.062-6.285 6.285-.059 1.277-.073 1.686-.073 4.95s.014 3.673.073 4.95c.193 4.222 2.062 6.092 6.285 6.285 1.277.059 1.686.073 4.95.073s3.673-.014 4.95-.073c4.222-.193 6.092-2.062 6.285-6.285.059-1.277.073-1.686.073-4.95s-.014-3.673-.073-4.95C22.147 2.225 20.278.356 16.05.163 14.777.104 14.368.09 12 .09zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z', isVisible: true },
        { id: 2, name: 'Facebook', url: 'https://facebook.com', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4v-3a1 1 0 011-1h3z', isVisible: true },
        { id: 3, name: 'Phone', url: 'tel:+201028855779', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', isVisible: false },
    ],
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
