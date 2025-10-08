import type { Product, Category, Tag, Promotion, RestaurantInfo, User } from '../types';

export const restaurantInfo: RestaurantInfo = {
    name: { en: "Fresco Restaurants", ar: "فريسكو" },
    logo: "https://placehold.co/512x512/f59e0b/white?text=F",
    heroImage: "https://picsum.photos/seed/foods/1600/900",
    heroTitle: { en: "Experience Authentic Flavors", ar: "اكتشف نكهات أصيلة" },
    description: { en: "Fresh ingredients, exquisite taste. Explore a menu crafted with passion.", ar: "مكونات طازجة، طعم رائع. استكشف قائمة طعام صنعت بشغف." },
    whatsappNumber: "201060637363", // Replace with actual WhatsApp number
    tableCount: 5,
    defaultPage: 'menu',
    socialLinks: [
        { id: 1, name: 'Instagram', url: 'https://instagram.com', icon: 'https://img.icons8.com/color/48/instagram-new--v1.png', isVisible: true },
        { id: 2, name: 'Facebook', url: 'https://facebook.com', icon: 'https://img.icons8.com/color/48/facebook.png', isVisible: true },
        { id: 3, name: '01060637363', url: 'tel:+201060637363', icon: 'https://img.icons8.com/color/48/phone.png', isVisible: true },
        { id: 4, name: '01027987666', url: 'tel:+201027987666', icon: 'https://img.icons8.com/color/48/phone.png', isVisible: true },
        { id: 5, name: '0132722678', url: 'tel:+20132722678', icon: 'https://img.icons8.com/color/48/phone.png', isVisible: true },
        { id: 6, name: 'For Complaints', url: 'tel:+201024423777', icon: 'https://img.icons8.com/color/48/phone.png', isVisible: true },
    ],
    orderStatusColumns: [
        { id: 'pending', name: { en: 'New Orders', ar: 'طلبات جديدة' }, color: 'yellow' },
        { id: 'in_progress', name: { en: 'In the Kitchen', ar: 'في المطبخ' }, color: 'orange' },
        { id: 'ready_for_pickup', name: { en: 'Ready for Pickup', ar: 'جاهز للتسليم' }, color: 'cyan' },
        { id: 'out_for_delivery', name: { en: 'Out for Delivery', ar: 'قيد التوصيل' }, color: 'blue' },
        { id: 'completed', name: { en: 'Completed', ar: 'مكتمل' }, color: 'green' },
        { id: 'cancelled', name: { en: 'Cancelled & Refused', ar: 'ملغي ومرفوض' }, color: 'slate' },
    ]
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
    isNew: false,
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
    isNew: false,
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
    isNew: true,
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

export const promotions: Promotion[] = [];
