import React, { useState } from 'react';
import type { User } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
    const { t } = useUI();
    const { registerWithEmailPassword } = useAuth();
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !email || !password || !mobile) {
            setError('Please fill all fields');
            return;
        }
        const errorMessage = await registerWithEmailPassword({ name, mobile, email, password });
        if (errorMessage) {
            setError(errorMessage);
        } else {
            window.location.hash = '#/login';
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400">{t.createAccount}</h1>
                <form className="space-y-6" onSubmit={handleRegister}>
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">
                            {t.name}
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="mobile" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">
                            {t.mobileNumber}
                        </label>
                        <input
                            type="tel"
                            id="mobile"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">
                            {t.email}
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">
                            {t.password}
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <button type="submit" className="w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition shadow-md">
                        {t.createAccount}
                    </button>
                </form>
                <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t.alreadyHaveAccount} </span>
                    <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">
                        {t.login}
                    </a>
                </div>
            </div>
        </div>
    );
};
