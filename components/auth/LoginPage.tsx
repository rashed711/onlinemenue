import React, { useState } from 'react';
import type { Language } from '../../types';
import { useTranslations } from '../../i18n/translations';

interface LoginPageProps {
    language: Language;
    login: (mobile: string, password: string) => Promise<string | null>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ language, login }) => {
    const t = useTranslations(language);
    const [mobile, setMobile] = useState('admin');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const errorMessage = await login(mobile, password);
            if (errorMessage) {
                setError(errorMessage);
            }
            // Successful login will trigger a redirect via useEffect in App.tsx
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
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
                        disabled={isLoading}
                        className="w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition shadow-md hover:shadow-lg transform hover:scale-105 disabled:bg-primary-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Logging in...' : t.login}
                    </button>
                </form>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t.dontHaveAccount} <a href="#/register" onClick={(e) => handleNav(e, '/register')} className="font-medium text-primary-600 hover:underline dark:text-primary-500">{t.register}</a></span>
                    <a href="#/forgot-password" onClick={(e) => handleNav(e, '/forgot-password')} className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                        {t.forgotPassword}
                    </a>
                </div>
                 <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                    <a href="#/" onClick={(e) => handleNav(e, '/')} className="text-sm text-primary-600 hover:underline dark:text-primary-500">
                        {t.backToMenu}
                    </a>
                </div>
            </div>
        </div>
    );
};
