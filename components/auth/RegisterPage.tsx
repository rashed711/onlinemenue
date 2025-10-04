import React, { useState } from 'react';
import type { Language, User } from '../../types';
import { useTranslations } from '../../i18n/translations';

interface RegisterPageProps {
    language: Language;
    register: (newUser: Omit<User, 'id' | 'role'>) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ language, register }) => {
    const t = useTranslations(language);
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !mobile || !password) {
            setError('Please fill all fields');
            return;
        }
        register({ name, mobile, password });
        window.location.hash = '#/profile';
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400">{t.createAccount}</h1>
                <form className="space-y-6" onSubmit={handleRegister}>
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            {t.name}
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 text-gray-900 bg-gray-50 dark:bg-gray-700 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="mobile" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            {t.mobileNumber}
                        </label>
                        <input
                            type="text"
                            id="mobile"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="w-full p-3 text-gray-900 bg-gray-50 dark:bg-gray-700 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            {t.password}
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 text-gray-900 bg-gray-50 dark:bg-gray-700 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <button
                        type="submit"
                        className="w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        {t.createAccount}
                    </button>
                </form>
                <div className="text-center text-sm">
                     <span className="text-gray-600 dark:text-gray-400">{t.alreadyHaveAccount} </span>
                    <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                        {t.login}
                    </a>
                </div>
                 <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4">
                    <a href="#/" onClick={(e) => handleNav(e, '/')} className="text-sm text-primary-600 hover:underline dark:text-primary-500">
                        {t.backToMenu}
                    </a>
                </div>
            </div>
        </div>
    );
};