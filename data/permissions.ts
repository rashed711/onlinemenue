import type { Permission, UserRole } from '../types';
import { translations } from '../i18n/translations';

// Define a type for translation keys to ensure type safety
type TranslationKey = keyof typeof translations['en'];

// Structure for grouping permissions in the UI
interface PermissionInfo {
  id: Permission;
  nameKey: TranslationKey;
}

interface PermissionGroup {
  nameKey: TranslationKey;
  permissions: PermissionInfo[];
}

// Static permissions grouped by feature for better UI organization
export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  orders: {
    nameKey: 'permission_group_orders',
    permissions: [
      { id: 'view_orders_page', nameKey: 'permission_view_orders_page' },
      { id: 'manage_order_status', nameKey: 'permission_manage_order_status' },
      { id: 'edit_order_content', nameKey: 'permission_edit_order_content' },
      { id: 'use_cashier_page', nameKey: 'permission_use_cashier_page' },
    ],
  },
  reports: {
    nameKey: 'permission_group_reports',
    permissions: [
      { id: 'view_reports_page', nameKey: 'permission_view_reports_page' },
    ],
  },
  menu: {
    nameKey: 'permission_group_menu',
    permissions: [
      { id: 'view_products_page', nameKey: 'permission_view_products_page' },
      { id: 'add_product', nameKey: 'permission_add_product' },
      { id: 'edit_product', nameKey: 'permission_edit_product' },
      { id: 'delete_product', nameKey: 'permission_delete_product' },
      { id: 'view_classifications_page', nameKey: 'permission_view_classifications_page' },
      { id: 'add_category', nameKey: 'permission_add_category' },
      { id: 'edit_category', nameKey: 'permission_edit_category' },
      { id: 'delete_category', nameKey: 'permission_delete_category' },
      { id: 'add_tag', nameKey: 'permission_add_tag' },
      { id: 'edit_tag', nameKey: 'permission_edit_tag' },
      { id: 'delete_tag', nameKey: 'permission_delete_tag' },
      { id: 'view_promotions_page', nameKey: 'permission_view_promotions_page' },
      { id: 'add_promotion', nameKey: 'permission_add_promotion' },
      { id: 'edit_promotion', nameKey: 'permission_edit_promotion' },
      { id: 'delete_promotion', nameKey: 'permission_delete_promotion' },
    ],
  },
  admin: {
    nameKey: 'permission_group_admin',
    permissions: [
      { id: 'view_users_page', nameKey: 'permission_view_users_page' },
      { id: 'add_user', nameKey: 'permission_add_user' },
      { id: 'edit_user', nameKey: 'permission_edit_user' },
      { id: 'delete_user', nameKey: 'permission_delete_user' },
      { id: 'manage_roles', nameKey: 'permission_manage_roles' },
    ],
  },
  settings: {
    nameKey: 'permission_group_settings',
    permissions: [
        { id: 'view_settings_page', nameKey: 'permission_view_settings_page' },
        { id: 'manage_settings_general', nameKey: 'permission_manage_settings_general' },
        { id: 'manage_settings_operations', nameKey: 'permission_manage_settings_operations' },
        { id: 'manage_settings_social', nameKey: 'permission_manage_settings_social' },
        { id: 'manage_settings_statuses', nameKey: 'permission_manage_settings_statuses' },
    ],
  }
};
