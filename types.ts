export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface Role {
  key: string;
  name: LocalizedString;
  isSystem: boolean;
}

export interface Category {
  id: number;
  name: LocalizedString;
  parent_id?: number | null;
  children?: Category[];
}

export interface Tag {
  id: string;
  name: LocalizedString;
}

export interface ProductOptionValue {
  name: LocalizedString;
  priceModifier: number;
}

export interface ProductOption {
  name: LocalizedString;
  values: ProductOptionValue[];
}

export interface Product {
  id: number;
  code: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  image: string;
  categoryId: number;
  rating: number;
  isPopular: boolean;
  isNew: boolean;
  isVisible: boolean;
  tags: string[];
  options?: ProductOption[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  options?: { [key: string]: string };
}

export interface Promotion {
  id: number;
  title: LocalizedString;
  description: LocalizedString;
  productId: number;
  discountPercent: number;
  endDate: string;
  isActive: boolean;
}

export interface SocialLink {
  id: number;
  name: string;
  url: string;
  icon: string; // Image URL or data URL
  isVisible: boolean;
}

export interface OrderStatusColumn {
  id: string; // e.g., 'pending', 'in-progress'
  name: LocalizedString;
  color: string; // e.g., 'yellow', 'blue'
}

export interface OnlinePaymentMethod {
  id: number;
  name: LocalizedString;
  type: 'number' | 'link';
  details: string;
  icon: string; // Image URL or data URL
  isVisible: boolean;
  instructions?: LocalizedString;
}

export interface RestaurantInfo {
    name: LocalizedString;
    logo: string;
    heroImage: string;
    heroTitle: LocalizedString;
    description: LocalizedString;
    whatsappNumber: string;
    tableCount: number;
    socialLinks: SocialLink[];
    defaultPage: 'menu' | 'social';
    orderStatusColumns: OrderStatusColumn[];
    onlinePaymentMethods: OnlinePaymentMethod[];
    codNotes?: LocalizedString;
    onlinePaymentNotes?: LocalizedString;
    activationEndDate?: string | null; // Null means active indefinitely
    deactivationMessage?: LocalizedString;
}

// New Types for Users and Orders
export type UserRole = string;

export interface User {
  id: number;
  name: string;
  mobile: string;
  password: string; // In a real app, this should be a hash
  role: UserRole;
  profilePicture?: string;
}

export type OrderStatus = string;
export type OrderType = 'Dine-in' | 'Delivery' | 'Takeaway';
export type PaymentMethod = 'cod' | 'online';

export interface CheckoutDetails {
    name: string;
    mobile: string;
    address: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: string;
  orderType: OrderType;
  tableNumber?: string;
  customer: {
    userId?: number; // for registered users
    name?: string; // for registered users
    mobile: string; // mandatory for all
    address?: string;
  };
  createdBy?: number; // ID of the user (waiter, admin) who created the order
  notes?: string;
  refusalReason?: string;
  customerFeedback?: {
    rating: number;
    comment: string;
  };
  paymentMethod?: PaymentMethod;
  paymentDetail?: string; // The specific payment method used, e.g., "Cash", "Vodafone Cash"
  paymentReceiptUrl?: string; // URL or Data URL of the uploaded receipt
}

// Permissions Type
export type Permission = string;