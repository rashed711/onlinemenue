import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Permission, Language, UserRole, RestaurantInfo } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';
import { STATIC_PERMISSIONS } from '../../data/permissions';

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

  const allPermissions = useMemo(() => {
      const staticPerms = STATIC_PERMISSIONS.map(p => ({
          id: p.id,
          name: t[p.nameKey]
      }));
      const dynamicPerms = restaurantInfo.orderStatusColumns.map(status => ({
          id: `view_status_${status.id}`,
          name: `${language === 'ar' ? 'عرض' : 'View'} "${status.name[language]}"`
      }));
      return [...staticPerms, ...dynamicPerms];
  }, [restaurantInfo.orderStatusColumns, language, t]);

  const handleCheckboxChange = (permissionId: Permission, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };

  const handleSave = () => {
    onSave(role, selectedPermissions);
    onClose();
  };

  const isSuperAdminRole = role === 'superAdmin';

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-bold">{t.editPermissions}: <span className="text-primary-600">{t[role as keyof typeof t]}</span></h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <CloseIcon className="w-6 h-6"/>
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          {isSuperAdminRole && (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm">
              Super Admin permissions cannot be changed.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allPermissions.map(permission => (
              <label key={permission.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isSuperAdminRole ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50'}`}>
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
        <div className="p-4 flex justify-end gap-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">{t.cancel}</button>
          <button
            onClick={handleSave}
            disabled={isSuperAdminRole}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
};