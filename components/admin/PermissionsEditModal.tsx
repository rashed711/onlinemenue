import React, { useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import type { Permission, Language, UserRole, RestaurantInfo } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';
import { PERMISSION_GROUPS } from '../../data/permissions';

interface PermissionsEditModalProps {
  role: UserRole;
  currentPermissions: Permission[];
  onClose: () => void;
  onSave: (role: UserRole, permissions: Permission[]) => void;
  language: Language;
  restaurantInfo: RestaurantInfo;
}

export const PermissionsEditModal: React.FC<PermissionsEditModalProps> = ({ role, currentPermissions, onClose, onSave, language, restaurantInfo }) => {
  const t = useTranslations(language);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(currentPermissions);
  
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  const allPermissionGroups = useMemo(() => {
    const dynamicStatusGroup = {
      name: t.orderStatusManagement,
      permissions: restaurantInfo.orderStatusColumns.map(status => ({
          id: `view_status_${status.id}`,
          name: `${language === 'ar' ? 'عرض' : 'View'} "${status.name[language]}"`
      }))
    };

    const staticGroups = Object.entries(PERMISSION_GROUPS).map(([key, group]) => ({
        name: t[group.nameKey],
        permissions: group.permissions.map(p => ({
            id: p.id,
            name: t[p.nameKey]
        }))
    }));
    
    return [...staticGroups, dynamicStatusGroup];
  }, [restaurantInfo.orderStatusColumns, language, t]);

  const handleCheckboxChange = (permissionId: Permission, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };
  
  const handleGroupToggle = (groupPermissions: {id: string, name: string}[], isChecked: boolean) => {
      const groupPermissionIds = groupPermissions.map(p => p.id);
      if (isChecked) {
          setSelectedPermissions(prev => [...new Set([...prev, ...groupPermissionIds])]);
      } else {
          setSelectedPermissions(prev => prev.filter(p => !groupPermissionIds.includes(p)));
      }
  }

  const handleSave = () => {
    onSave(role, selectedPermissions);
    onClose();
  };

  const isSuperAdminRole = role === 'superAdmin';

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-bold">{t.editPermissions}: <span className="text-primary-600">{t[role as keyof typeof t]}</span></h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <CloseIcon className="w-6 h-6"/>
          </button>
        </div>
        <div className="p-5 space-y-6 overflow-y-auto">
          {isSuperAdminRole && (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm">
              Super Admin permissions cannot be changed.
            </div>
          )}
          
          <div className="space-y-6">
            {allPermissionGroups.map((group, index) => {
                const allGroupPermissions = group.permissions.map(p => p.id);
                const isAllSelected = allGroupPermissions.every(p => selectedPermissions.includes(p));
                return (
                    <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-t-lg border-b border-slate-200 dark:border-slate-700">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                                    checked={isAllSelected}
                                    onChange={(e) => handleGroupToggle(group.permissions, e.target.checked)}
                                    disabled={isSuperAdminRole}
                                />
                                <span className="font-bold text-slate-700 dark:text-slate-200">{group.name}</span>
                            </label>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                            {group.permissions.map(permission => (
                                <label key={permission.id} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isSuperAdminRole ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                                        checked={selectedPermissions.includes(permission.id)}
                                        onChange={e => handleCheckboxChange(permission.id, e.target.checked)}
                                        disabled={isSuperAdminRole}
                                    />
                                    <span className="font-medium text-sm">{permission.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
          </div>

        </div>
        <div className="p-4 flex justify-end gap-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">{t.cancel}</button>
          <button
            onClick={handleSave}
            disabled={isSuperAdminRole}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
};