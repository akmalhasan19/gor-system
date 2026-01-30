'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { PhoneVerificationStep } from '@/components/auth/phone-verification-step';
import Image from 'next/image';
import { User, Lock, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { getCsrfHeaders } from '@/lib/hooks/use-csrf';

type RegistrationStep = 'credentials' | 'phone-verification' | 'complete';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('credentials');
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const router = useRouter();

    // Reset registration step when switching modes
    useEffect(() => {
        if (!isRegister) {
            setRegistrationStep('credentials');
            setConfirmPassword('');
        }
    }, [isRegister]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signIn(email, password);

            // Check if phone is verified
            const statusResponse = await fetch('/api/phone-verification/status');
            const statusData = await statusResponse.json();

            if (statusData.success && !statusData.isVerified) {
                // Phone not verified, redirect to verification
                setIsRegister(true);
                setRegistrationStep('phone-verification');
                setIsLoading(false);
                return;
            }

            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Gagal login.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate password confirmation
        if (password !== confirmPassword) {
            setError('Password tidak cocok!');
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError('Password minimal 8 karakter.');
            return;
        }

        setIsLoading(true);

        try {
            // Use admin signup route to bypass email confirmation
            const response = await fetch('/api/auth/admin-signup', {
                method: 'POST',
                headers: getCsrfHeaders({
                    'Content-Type': 'application/json',
                    // Use secret from environment variable, fallback to dev secret for local development
                    'x-admin-secret-key': process.env.NEXT_PUBLIC_ADMIN_SIGNUP_SECRET || 'smash-dev-admin-2026'
                }),
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Gagal membuat akun');
            }

            // User created successfully with confirmed email
            // Wait a moment for Supabase to fully create the user
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Now sign them in
            try {
                await signIn(email, password);
            } catch (loginError: any) {
                console.error('Login error after signup:', loginError);
                throw new Error('Akun berhasil dibuat, tapi gagal login otomatis. Silakan coba login manual.');
            }

            // Proceed to phone verification step
            setRegistrationStep('phone-verification');
        } catch (err: any) {
            setError(err.message || 'Gagal registrasi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneVerificationComplete = async () => {
        // Check if user has completed onboarding
        try {
            const response = await fetch('/api/onboarding/status');
            const { hasCompletedOnboarding } = await response.json();

            if (!hasCompletedOnboarding) {
                // Redirect to onboarding if not completed
                router.push('/onboarding');
            } else {
                // Show completion screen then redirect to dashboard
                setRegistrationStep('complete');
                setRegistrationComplete(true);
                setTimeout(() => {
                    router.push('/');
                    router.refresh();
                }, 3000);
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            // Default to dashboard if check fails
            router.push('/');
            router.refresh();
        }
    };

    const handleBackToCredentials = () => {
        setRegistrationStep('credentials');
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setRegistrationStep('credentials');
        setRegistrationComplete(false);
    };

    return (
        <div className="min-h-screen bg-brand-lime flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border-4 border-black shadow-neo-lg p-8 relative overflow-hidden">
                {/* Decorative background pattern */}
                <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-black flex items-center justify-center mb-4 shadow-neo">
                        <Image
                            src="/smash-logo.svg"
                            alt="Logo"
                            width={40}
                            height={40}
                            className="brightness-0 invert"
                        />
                    </div>
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                        Smash<span className="text-brand-orange">.</span>Partner
                    </h1>
                    <p className="text-sm font-bold text-gray-500 uppercase mt-1">
                        Sistem Manajemen GOR
                    </p>
                </div>

                {/* Registration Progress (only show during registration) */}
                {isRegister && registrationStep !== 'complete' && (
                    <div className="mb-6">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase text-gray-500">
                            <div className={`flex items-center gap-1 ${registrationStep === 'credentials' ? 'text-black' : 'text-green-600'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${registrationStep === 'credentials' ? 'border-black bg-brand-lime' : 'border-green-600 bg-green-100'}`}>
                                    {registrationStep === 'credentials' ? '1' : <CheckCircle className="w-4 h-4" />}
                                </div>
                                <span className="hidden sm:inline">Akun</span>
                            </div>
                            <div className={`w-8 h-0.5 ${registrationStep !== 'credentials' ? 'bg-green-600' : 'bg-gray-300'}`} />
                            <div className={`flex items-center gap-1 ${registrationStep === 'phone-verification' ? 'text-black' : 'text-gray-400'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${registrationStep === 'phone-verification' ? 'border-black bg-brand-lime' : 'border-gray-300'}`}>
                                    2
                                </div>
                                <span className="hidden sm:inline">Verifikasi</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border-2 border-red-500 text-red-600 font-bold p-3 mb-6 text-sm flex items-center gap-2 shadow-sm">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Login Form */}
                {!isRegister && (
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-black uppercase text-sm flex items-center gap-2">
                                <User className="w-4 h-4" /> Email
                            </label>
                            <NeoInput
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                className="w-full bg-gray-50"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-black uppercase text-sm flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Password
                            </label>
                            <NeoInput
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-50"
                                required
                            />
                        </div>

                        <div className="mt-4 flex flex-col gap-4">
                            <NeoButton
                                type="submit"
                                className="w-full justify-center py-4 bg-black text-white hover:bg-brand-orange hover:text-black"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' : 'MASUK SYSTEM'}
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </NeoButton>

                            <button
                                type="button"
                                onClick={() => router.push('/forgot-password')}
                                className="text-xs font-bold uppercase text-gray-500 hover:text-black underline"
                            >
                                Lupa Password?
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(true);
                                    resetForm();
                                }}
                                className="text-xs font-bold uppercase text-gray-500 hover:text-black underline"
                            >
                                Belum punya akun? Daftar disini
                            </button>
                        </div>
                    </form>
                )}

                {/* Registration Step 1: Credentials */}
                {isRegister && registrationStep === 'credentials' && (
                    <form onSubmit={handleRegisterCredentials} className="flex flex-col gap-4">
                        <div className="text-center mb-2">
                            <h2 className="text-lg font-black uppercase">Buat Akun Admin Baru</h2>
                            <p className="text-xs text-gray-500">Langkah 1: Buat kredensial akun</p>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-black uppercase text-sm flex items-center gap-2">
                                <User className="w-4 h-4" /> Email
                            </label>
                            <NeoInput
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                className="w-full bg-gray-50"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-black uppercase text-sm flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Password
                            </label>
                            <NeoInput
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimal 8 karakter"
                                className="w-full bg-gray-50"
                                minLength={8}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-black uppercase text-sm flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Konfirmasi Password
                            </label>
                            <NeoInput
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi password"
                                className="w-full bg-gray-50"
                                required
                            />
                        </div>

                        <div className="bg-brand-orange border-[3px] border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-4 transform rotate-1 hover:rotate-0 transition-transform">
                            <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                                <Shield className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase mb-1">Verifikasi Wajib</h3>
                                <p className="text-xs font-medium leading-relaxed">
                                    Setelah ini, Anda perlu memverifikasi nomor HP menggunakan aplikasi authenticator demi keamanan akun.
                                </p>
                            </div>
                        </div>

                        <div className="mt-2 flex flex-col gap-4">
                            <NeoButton
                                type="submit"
                                className="w-full justify-center py-4 bg-black text-white hover:bg-brand-orange hover:text-black"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' : 'LANJUT VERIFIKASI'}
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </NeoButton>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(false);
                                    resetForm();
                                }}
                                className="text-xs font-bold uppercase text-gray-500 hover:text-black underline"
                            >
                                Sudah punya akun? Login disini
                            </button>
                        </div>
                    </form>
                )}

                {/* Registration Step 2: Phone Verification */}
                {isRegister && registrationStep === 'phone-verification' && (
                    <PhoneVerificationStep
                        email={email}
                        onVerificationComplete={handlePhoneVerificationComplete}
                        onBack={handleBackToCredentials}
                    />
                )}

                {/* Registration Complete */}
                {isRegister && registrationStep === 'complete' && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-100 border-2 border-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black uppercase text-green-600 mb-2">
                            Registrasi Berhasil!
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Akun Anda telah terverifikasi. Anda akan dialihkan ke dashboard...
                        </p>
                        <div className="animate-pulse text-sm text-gray-500">
                            Mengalihkan...
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center border-t-2 border-gray-100 pt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase">
                        &copy; 2026 Smash Partner System
                    </p>
                </div>
            </div>
        </div>
    );
}
