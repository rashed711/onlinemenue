export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface Category {
  id: number;
  name: LocalizedString;
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

export interface RestaurantInfo {
    name: LocalizedString;
    logo: string;
    whatsappNumber: string;
}

// New Types for Users and Orders
export type UserRole = 'superAdmin' | 'admin' | 'employee' | 'waiter' | 'restaurantStaff' | 'delivery' | 'driver' | 'customer';

export interface User {
  id: number;
  name: string;
  mobile: string;
  password; // In a real app, this should be a hash
  role: UserRole;
}

export type OrderStatus = 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Out for Delivery' | 'Completed' | 'Cancelled' | 'Refused';
export type OrderType = 'Dine-in' | 'Delivery';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: string;
  orderType: OrderType;
  customer: {
    userId?: number; // for registered users
    name?: string; // for registered users
    mobile: string; // mandatory for all
  };
  notes?: string;
  refusalReason?: string;
  customerFeedback?: {
    rating: number;
    comment: string;
  };
}

// Permissions Type
export type Permission = 
  | 'view_orders'
  | 'manage_orders'
  | 'edit_orders'
  | 'manage_menu'
  | 'manage_promotions'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_classifications'
  | 'view_reports';