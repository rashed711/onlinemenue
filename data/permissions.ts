import React from 'react';
import type { Permission } from '../types';
import { translations } from '../i18n/translations';
import {
  ClipboardListIcon,
  CashRegisterIcon,
  ChartBarIcon,
  CollectionIcon,
  BookmarkAltIcon,
  TagIcon,
  UsersIcon,
  ShieldCheckIcon,
  CogIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  TruckIcon,
  UserIcon,
  BellIcon,
} from '../components/icons/Icons';

// Define a type for translation keys to ensure type safety
type TranslationKey = keyof typeof translations['en'];

// Structure for grouping permissions in the UI
interface PermissionInfo {
  id: Permission;
  nameKey: TranslationKey;
}

export interface PermissionGroup {
  nameKey: TranslationKey;
  icon: React.FC<any>; // Add icon property
  permissions: PermissionInfo[];
}

// Static permissions grouped by page/feature for a clearer UI
export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  orders: {
    nameKey: 'manageOrders',
    icon: ClipboardListIcon,
    permissions: [
      { id: 'view_orders_page', nameKey: 'permission_view_orders_page' },
      { id: 'manage_order_status', nameKey: 'permission_manage_order_status' },
      { id: 'edit_order_content', nameKey: 'permission_edit_order_content' },
      { id: 'delete_order', nameKey: 'permission_delete_order' },
      { id: 'view_dine_in_orders', nameKey: 'permission_view_dine_in_orders' },
      { id: 'view_takeaway_orders', nameKey: 'permission_view_takeaway_orders' },
      { id: 'view_delivery_orders', nameKey: 'permission_view_delivery_orders' },
    ],
  },
  cashier: {
    nameKey: 'cashier',
    icon: CashRegisterIcon,
    permissions: [
      { id: 'use_cashier_page', nameKey: 'permission_use_cashier_page' },
    ],
  },
  reports: {
    nameKey: 'reports',
    icon: ChartBarIcon,
    permissions: [
      { id: 'view_reports_page', nameKey: 'permission_view_reports_page' },
      { id: 'view_sales_report', nameKey: 'permission_view_sales_report' },
      { id: 'view_orders_report', nameKey: 'permission_view_orders_report' },
      { id: 'view_profit_report', nameKey: 'permission_view_profit_report' },
      { id: 'view_customers_report', nameKey: 'permission_view_customers_report' },
      { id: 'view_products_report', nameKey: 'permission_view_products_report' },
      { id: 'view_payments_report', nameKey: 'permission_view_payments_report' },
      { id: 'view_delivery_report', nameKey: 'permission_view_delivery_report' },
      { id: 'view_user_activity_report', nameKey: 'permission_view_user_activity_report' },
    ],
  },
  products: {
    nameKey: 'productList',
    icon: CollectionIcon,
    permissions: [
      { id: 'view_products_page', nameKey: 'permission_view_products_page' },
      { id: 'add_product', nameKey: 'permission_add_product' },
      { id: 'edit_product', nameKey: 'permission_edit_product' },
      { id: 'delete_product', nameKey: 'permission_delete_product' },
    ],
  },
  classifications: {
    nameKey: 'classifications',
    icon: BookmarkAltIcon,
    permissions: [
      { id: 'view_classifications_page', nameKey: 'permission_view_classifications_page' },
      { id: 'add_category', nameKey: 'permission_add_category' },
      { id: 'edit_category', nameKey: 'permission_edit_category' },
      { id: 'delete_category', nameKey: 'permission_delete_category' },
      { id: 'add_tag', nameKey: 'permission_add_tag' },
      { id: 'edit_tag', nameKey: 'permission_edit_tag' },
      { id: 'delete_tag', nameKey: 'permission_delete_tag' },
    ],
  },
  promotions: {
    nameKey: 'managePromotions',
    icon: TagIcon,
    permissions: [
       { id: 'view_promotions_page', nameKey: 'permission_view_promotions_page' },
       { id: 'add_promotion', nameKey: 'permission_add_promotion' },
       { id: 'edit_promotion', nameKey: 'permission_edit_promotion' },
       { id: 'delete_promotion', nameKey: 'permission_delete_promotion' },
    ],
  },
  communication: {
    nameKey: 'notifications',
    icon: BellIcon,
    permissions: [
      { id: 'view_notifications_page', nameKey: 'permission_view_notifications_page' },
      { id: 'send_broadcast_notifications', nameKey: 'permission_send_broadcast_notifications' },
    ],
  },
  users: {
    nameKey: 'manageUsers',
    icon: UsersIcon,
    permissions: [
      { id: 'view_users_page', nameKey: 'permission_view_users_page' },
      { id: 'add_user', nameKey: 'permission_add_user' },
      { id: 'edit_user', nameKey: 'permission_edit_user' },
      { id: 'delete_user', nameKey: 'permission_delete_user' },
    ],
  },
  roles: {
    nameKey: 'manageRoles',
    icon: ShieldCheckIcon,
    permissions: [
      { id: 'view_roles_page', nameKey: 'permission_view_roles_page' },
      { id: 'add_role', nameKey: 'permission_add_role' },
      { id: 'edit_role', nameKey: 'permission_edit_role' },
      { id: 'delete_role', nameKey: 'permission_delete_role' },
      { id: 'manage_permissions', nameKey: 'permission_manage_permissions' },
    ],
  },
  settings: {
    nameKey: 'settings',
    icon: CogIcon,
    permissions: [
        { id: 'view_settings_page', nameKey: 'permission_view_settings_page' },
        { id: 'manage_settings_general', nameKey: 'permission_manage_settings_general' },
        { id: 'manage_settings_operations', nameKey: 'permission_manage_settings_operations' },
        { id: 'manage_settings_social', nameKey: 'permission_manage_settings_social' },
        { id: 'manage_settings_statuses', nameKey: 'permission_manage_settings_statuses' },
        { id: 'manage_settings_activation', nameKey: 'permission_manage_settings_activation' },
    ],
  },
};