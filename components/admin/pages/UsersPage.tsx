import React from 'react';
import type { User, Role } from '../../../types';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from '../../icons/Icons';
import { useUI } from '../../../contexts/UIContext';

type UserTab = 'customers' | 'staff';

interface UsersPageProps {
    hasPermission: (permission: string) => boolean;
    setEditingUser: (user: User | 'new') => void;
    userTab: UserTab;
    setUserTab: (tab: UserTab) => void;
    userSearchTerm: string;
    setUserSearchTerm: (term: string) => void;
    usersToDisplay: User[];
    roles: Role[];
    deleteUser: (userId: number) => void;
}

export const UsersPage: React.FC<UsersPageProps> = (props) => {
    const { t, language } = useUI();
    const {
        hasPermission, setEditingUser, userTab, setUserTab,
        userSearchTerm, setUserSearchTerm, usersToDisplay, roles, deleteUser
    } = props;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.manageUsers}</h2>
                {hasPermission('add_user') && <button onClick={() => setEditingUser('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewUser}</button>}
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {['customers', 'staff'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setUserTab(tab as UserTab)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                userTab === tab
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                        >
                            {t[tab as 'customers' | 'staff']}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="relative my-4">
                <input type="text" placeholder={`${t.name}, ${t.mobileNumber}...`} value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} className="w-full p-2 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"/>
                <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.name}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.mobileNumber}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.role}</th>
                            {(hasPermission('edit_user') || hasPermission('delete_user')) && <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {usersToDisplay.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user.mobile}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{roles.find(r => r.key === user.role)?.name[language] || user.role}</td>
                                {(hasPermission('edit_user') || hasPermission('delete_user')) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('edit_user') && <button onClick={() => setEditingUser(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}{hasPermission('delete_user') && <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}</div></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
