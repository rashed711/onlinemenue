import { useCallback } from 'react';
import type { User, Permission, UserRole } from '../types';

export const usePermissions = (
  currentUser: User | null,
  rolePermissions: Record<UserRole, Permission[]>
) => {
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!currentUser) return false;
      
      // Super admin always has all permissions
      if (currentUser.role === 'superAdmin') {
        return true;
      }
      
      const userPermissions = rolePermissions[currentUser.role];
      return userPermissions?.includes(permission) ?? false;
    },
    [currentUser, rolePermissions]
  );

  return { hasPermission };
};
