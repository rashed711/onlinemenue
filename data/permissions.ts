import type { Permission, UserRole } from '../types';
import { translations } from '../i18n/translations';

// Define a type for translation keys to ensure type safety
type TranslationKey = keyof typeof translations['en'];

export const ALL_PERMISSIONS: { id: Permission; nameKey: TranslationKey }[] = [
  { id: 'view_orders', nameKey: 'permission_view_orders' },
  { id: 'manage_orders', nameKey: 'permission_manage_orders' },
  { id: 'manage_menu', nameKey: 'permission_manage_menu' },
  { id: 'manage_promotions', nameKey: 'permission_manage_promotions' },
  { id: 'manage_users', nameKey: 'permission_manage_users' },
  { id: 'manage_roles', nameKey: 'permission_manage_roles' },
];

export const initialRolePermissions: Record<UserRole, Permission[]> = {
  superAdmin: ALL_PERMISSIONS.map(p => p.id),
  admin: [
    'view_orders',
    'manage_orders',
    'manage_menu',
    'manage_promotions',
    'manage_users',
  ],
  employee: ['view_orders', 'manage_orders'],
  waiter: ['view_orders', 'manage_orders'],
  restaurantStaff: ['view_orders', 'manage_orders'],
  delivery: ['view_orders'],
  driver: ['view_orders'],
  customer: [],
};
