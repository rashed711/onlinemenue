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
  display_order: number;
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
  cost_price: number;
  stock_quantity: number;
  supplier_id?: number | null;
  image: string;
  categoryId: number;
  rating: number;
  isPopular: boolean;
  isNew: boolean;
  isVisible: boolean;
  tags: string[];
  options?: ProductOption[];
  display_order: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  options?: { [key: string]: string };
  appliedDiscountPercent?: number;
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
  playSound?: boolean;
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
  email?: string | null;
  password?: string; // Made optional
  role: UserRole;
  profilePicture?: string;
  firebase_uid?: string;
  google_id?: string;
}


export type OrderStatus = string;
// FIX: Expanded OrderType to include all possible values.
export type OrderType = 'Delivery' | 'Dine-in' | 'Takeaway';
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
  customer: {
    userId?: number; // for registered users
    name?: string; // for registered users
    mobile: string; // mandatory for all
    address?: string;
  };
  // FIX: Added optional tableNumber property to the Order interface.
  tableNumber?: string;
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

// Inventory Types
export interface Supplier {
    id: number;
    name: string;
    contact_person?: string | null;
    mobile?: string | null;
    email?: string | null;
    address?: string | null;
}

export interface PurchaseInvoiceItem {
    id?: number;
    product_id: number;
    product_name?: LocalizedString;
    quantity: number;
    purchase_price: number;
    subtotal: number;
}

export interface PurchaseInvoice {
    id: number;
    invoice_number: string | null;
    supplier_id: number;
    supplier_name: string;
    invoice_date: string;
    total_amount: number;
    notes?: string;
    items: PurchaseInvoiceItem[];
    created_by?: number;
}