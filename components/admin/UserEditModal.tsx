import React, { useState, useEffect, useMemo } from 'react';
import type { User, UserRole, Role } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { Modal } from '../Modal';

interface UserEditModalProps {
    user: User | null;
    onClose: () => void;
    onSave: (userData: User | Omit<User, 'id'>) => void;
}

const emptyUser: Omit<User, 'id'> = {
    name: '',
    mobile: '',
    password: '',
    role: 'employee',
};

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onSave }) => {
    const { language } = useUI();
    const { currentUser } = useAuth();
    const { roles } = useAdmin();
    const t = useTranslations(language);
    
    const [formData, setFormData] = useState<Omit<User, 'id'>>(emptyUser);
    const [error, setError] = useState('');

    const availableRoles = useMemo(() => {
        const currentUserRole = roles.find(r => r.key === currentUser?.role);
        if (currentUserRole?.name.en.toLowerCase() === 'superadmin') {
            return roles;
        }
        return roles.filter(r => r.name.en.toLowerCase() !== 'superadmin');
    }, [currentUser, roles]);

    useEffect(() => {
        if (user) {
            const { id, ...editableData } = user;
            setFormData({ ...editableData, password: '' }); // Clear password for editing
        } else {
            const employeeRole = availableRoles.find(r => r.name.en.toLowerCase() === 'employee');
            const defaultRoleKey = employeeRole ? employeeRole.key : availableRoles[0]?.key || '';
            setFormData({...emptyUser, role: defaultRoleKey });
        }
        setError('');
    }, [user, availableRoles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!user && !formData.password) {
            setError(t.passwordRequired);
            return;
        }

        if (user) {
            const dataToSave: User = { ...user, ...formData };
            if (!formData.password) {
                // If password field is empty during edit, keep the old password
                dataToSave.password = user.password;
            }
            onSave(dataToSave);
        } else {
            onSave(formData);
        }
    };

    const isEditingSuperAdmin = useMemo(() => {
        if (!user) return false;
        const roleDetails = roles.find(r => r.key === user.role);
        return roleDetails?.name.en === 'superAdmin';
    }, [user, roles]);

    return (
        <Modal title={user ? t.editUser : t.addNewUser} onClose={onClose} size="sm">
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium mb-1">{t.name}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">{t.mobileNumber}</label>
                    <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t.password}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={user ? t.passwordOptional : ''} required={!user} />
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">{t.role}</label>
                    <select 
                        name="role" 
                        value={formData.role} 
                        onChange={handleChange} 
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                        required
                        disabled={isEditingSuperAdmin}
                    >
                        {availableRoles.map(role => (
                            <option key={role.key} value={role.key}>{role.name[language]}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};
