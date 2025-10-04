import type { Permission, UserRole } from '../types';
import { translations } from '../i18n/translations';

// Define a type for translation keys to ensure type safety
type TranslationKey = keyof typeof translations['en'];

export const ALL_PERMISSIONS: { id: Permission; nameKey: TranslationKey }[] = [
  { id: 'view_orders', nameKey: 'permission_view_orders' },
  { id: 'manage_orders', nameKey: 'permission_manage_orders' },
  { id: 'edit_orders', nameKey: 'permission_edit_orders' },
  { id: 'manage_menu', nameKey: 'permission_manage_menu' },
  { id: 'manage_classifications', nameKey: 'permission_manage_classifications' },
  { id: 'manage_promotions', nameKey: 'permission_manage_promotions' },
  { id: 'manage_users', nameKey: 'permission_manage_users' },
  { id: 'manage_roles', nameKey: 'permission_manage_roles' },
  { id: 'view_reports', nameKey: 'permission_view_reports' },
];

export const initialRolePermissions: Record<UserRole, Permission[]> = {
  superAdmin: ALL_PERMISSIONS.map(p => p.id),
  admin: [
    'view_orders',
    'manage_orders',
    'edit_orders',
    'manage_menu',
    'manage_classifications',
    'manage_promotions',
    'manage_users',
    'view_reports',
  ],
  employee: ['view_orders', 'manage_orders'],
  waiter: ['view_orders', 'manage_orders'],
  waiterSupervisor: ['view_orders', 'manage_orders'],
  restaurantStaff: ['view_orders', 'manage_orders'],
  delivery: ['view_orders'],
  driver: ['view_orders'],
  customer: [],
};