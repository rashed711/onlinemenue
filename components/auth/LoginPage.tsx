import React, { useState } from 'react';
import type { Language, User } from '../../types';
import { useTranslations } from '../../i18n/translations';

interface LoginPageProps {
    language: Language;
    users: User[];
    login: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ language, users, login }) => {
    const t = useTranslations(language);
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.mobile === mobile && u.password === password);
        
        if (user) {
            login(user);
            setError('');
            if(user.role === 'admin') {
                window.location.hash = '#/admin';
            } else {
                window.location.hash = '#/profile';
            }
        } else {
            setError(t.invalidCredentials);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400">{t.login}</h1>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="mobile" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            {t.username}
                        </label>
                        <input
                            type="text"
                            id="mobile"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="w-full p-3 text-gray-900 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
                            className="w-full p-3 text-gray-900 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <button
                        type="submit"
                        className="w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300"
                    >
                        {t.login}
                    </button>
                </form>
                <div className="text-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t.dontHaveAccount} </span>
                    <a href="#/register" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                        {t.register}
                    </a>
                </div>
                 <div className="text-center">
                    <a href="#/" className="text-sm text-primary-600 hover:underline dark:text-primary-500">
                        &larr; Back to Menu
                    </a>
                </div>
            </div>
        </div>
    );
};
