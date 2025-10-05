import type { Permission, UserRole, OrderStatusColumn } from '../types';
import { translations } from '../i18n/translations';

// Define a type for translation keys to ensure type safety
type TranslationKey = keyof typeof translations['en'];

// Static permissions that are always available
export const STATIC_PERMISSIONS: { id: Permission; nameKey: TranslationKey }[] = [
  { id: 'view_orders', nameKey: 'permission_view_orders' },
  { id: 'manage_orders', nameKey: 'permission_manage_orders' },
  { id: 'edit_orders', nameKey: 'permission_edit_orders' },
  { id: 'use_cashier_pos', nameKey: 'permission_use_cashier_pos' },
  { id: 'manage_menu', nameKey: 'permission_manage_menu' },
  { id: 'manage_classifications', nameKey: 'permission_manage_classifications' },
  { id: 'manage_promotions', nameKey: 'permission_manage_promotions' },
  { id: 'manage_users', nameKey: 'permission_manage_users' },
  { id: 'manage_roles', nameKey: 'permission_manage_roles' },
  { id: 'view_reports', nameKey: 'permission_view_reports' },
];

// Function to get all permissions, including dynamic ones for order statuses
export const getAllPermissions = (orderStatusColumns: OrderStatusColumn[] = []) => {
  const dynamicStatusPermissions = orderStatusColumns.map(status => ({
    id: `view_status_${status.id}`,
    // The name will be constructed in the component, e.g., "View" + status.name
  }));

  // We only return the static ones here for the base list. 
  // The component will generate the full list with localized names.
  return [...STATIC_PERMISSIONS];
};


export const initialRolePermissions: Record<UserRole, Permission[]> = {
  superAdmin: [
      ...STATIC_PERMISSIONS.map(p => p.id), 
      // Super admin will get dynamic permissions added automatically in the component
  ],
  admin: [
    'view_orders', 'manage_orders', 'edit_orders', 'use_cashier_pos',
    'manage_menu', 'manage_classifications', 'manage_promotions',
    'manage_users', 'view_reports',
    // Default status views
    'view_status_pending', 'view_status_in_progress', 'view_status_ready_for_pickup',
    'view_status_out_for_delivery', 'view_status_completed', 'view_status_cancelled',
  ],
  employee: [
    'view_orders', 'manage_orders', 'use_cashier_pos',
    'view_status_pending', 'view_status_in_progress', 'view_status_ready_for_pickup',
    'view_status_completed', 'view_status_cancelled',
  ],
  waiter: [
    'view_orders', 'manage_orders', 'use_cashier_pos',
    'view_status_pending', 'view_status_ready_for_pickup'
  ],
  waiterSupervisor: [
    'view_orders', 'manage_orders', 'use_cashier_pos',
    'view_status_pending', 'view_status_in_progress', 'view_status_ready_for_pickup', 'view_status_completed'
  ],
  restaurantStaff: [ // e.g., Kitchen staff
    'view_orders', 'manage_orders',
    'view_status_pending', 'view_status_in_progress', 'view_status_ready_for_pickup'
  ],
  delivery: ['view_orders'],
  driver: [
    'view_orders',
    'view_status_out_for_delivery', 'view_status_completed', 'view_status_cancelled'
  ],
  customer: [],
};
