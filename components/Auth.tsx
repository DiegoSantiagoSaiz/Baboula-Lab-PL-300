// Implemented the new authentication component for user login and registration.
import React, { useState } from 'react';
import * as authService from '../services/authService';
import type { User } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import { useLanguage } from '../utils/LanguageContext';

interface AuthProps {
    onAuthSuccess: (user: User) => void;
    onContinueAsGuest: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onContinueAsGuest }) => {
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [alias, setAlias] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = isLogin
                ? await authService.login(email, password)
                : await authService.register(email, password, alias);
            onAuthSuccess(user);
        } catch (err: any) {
            let message = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (message.includes('auth/network-request-failed')) {
                message = 'Network error: Please check your internet connection or disable any ad-blockers/VPNs and try again. If you are in a restricted network, consider using "Continue as Guest".';
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setIsLoading(true);
        try {
            const user = await authService.signInWithGoogle();
            onAuthSuccess(user);
        } catch (err: any) {
            let message = err instanceof Error ? err.message : 'Google Sign-In failed.';
            if (message.includes('auth/network-request-failed')) {
                message = 'Network error: Firebase could not reach its servers. This is often caused by ad-blockers, strict firewall settings, or being in an iframe. Try disabling extensions or using Guest mode.';
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-8 bg-card rounded-lg shadow-lg animate-fade-in-up">
            <h2 className="text-3xl font-bold text-center mb-2 text-foreground">{isLogin ? t('welcome_back') : t('create_account')}</h2>
            <p className="text-center text-slate-400 mb-6">{isLogin ? t('login_subtitle') : t('signup_subtitle')}</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-sm">{t('email')}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-input border border-border rounded-md p-2 text-foreground"
                        placeholder="tu@ejemplo.com"
                    />
                </div>
                 {!isLogin && (
                    <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-sm">{t('alias')}</label>
                        <input
                            type="text"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            required
                            className="w-full bg-input border border-border rounded-md p-2 text-foreground"
                            placeholder={t('alias_placeholder')}
                        />
                    </div>
                )}
                <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-sm">{t('password')}</label>
                    <div className="relative">
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-input border border-border rounded-md p-2 pr-10 text-foreground"
                            placeholder="••••••••"
                        />
                         <button
                            type="button"
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                            aria-label={isPasswordVisible ? t('hide_password') : t('show_password')}
                        >
                            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </div>

                {error && <p className="text-danger text-sm text-center">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-bold py-3 px-4 rounded-lg text-lg disabled:bg-slate-500 disabled:cursor-wait"
                >
                    {isLoading ? t('processing') : (isLogin ? t('log_in_btn') : t('create_account_btn'))}
                </button>
            </form>
            
            <div className="text-center mt-4">
                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                        setEmail('');
                        setPassword('');
                        setAlias('');
                    }}
                    className="text-sm text-primary hover:underline"
                >
                    {isLogin ? t('need_account') : t('already_account')}
                </button>
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-slate-400">{t('or_continue_with')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
                <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="flex items-center justify-center gap-3 w-full bg-white text-slate-900 border border-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Google
                </button>
            </div>

            <button
                onClick={onContinueAsGuest}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors"
            >
                {t('continue_guest')}
            </button>
        </div>
    );
};