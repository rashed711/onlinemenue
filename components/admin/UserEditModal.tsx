import React, { useState, useEffect } from 'react';
import type { User, Language, UserRole } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';

interface UserEditModalProps {
    user: User | null;
    onClose: () => void;
    onSave: (userData: User | Omit<User, 'id'>) => void;
    language: Language;
}

const emptyUser: Omit<User, 'id'> = {
    name: '',
    mobile: '',
    password: '',
    role: 'employee',
};

const userRoles: UserRole[] = ['superAdmin', 'admin', 'employee', 'waiter', 'restaurantStaff', 'delivery', 'driver', 'customer'];

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onSave, language }) => {
    const t = useTranslations(language);
    const [formData, setFormData] = useState<Omit<User, 'id'>>(emptyUser);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            const { id, ...editableData } = user;
            setFormData({ ...editableData, password: '' }); // Clear password for editing
        } else {
            setFormData(emptyUser);
        }
        setError('');
    }, [user]);

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <h2 className="text-xl font-bold">{user ? t.editUser : t.addNewUser}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required>
                            {userRoles.map(role => (
                                <option key={role} value={role}>{t[role as keyof typeof t] || role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">{t.cancel}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">{t.save}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
