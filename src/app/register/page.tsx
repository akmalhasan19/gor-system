'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { PhoneVerificationStep } from '@/components/auth/phone-verification-step';
import Image from 'next/image';
import { User, Lock, ArrowRight, Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { ensureCsrfToken, getCsrfHeaders } from '@/lib/hooks/use-csrf';

type RegistrationStep = 'credentials' | 'phone-verification' | 'complete';

interface InviteData {
    email: string;
    partner_name: string | null;
    expires_at: string;
}

function RegisterContent() {
    const [inviteData, setInviteData] = useState<InviteData | null>(null);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('credentials');

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setInviteError('Link undangan tidak valid. Silakan hubungi admin untuk mendapatkan link undangan.');
            setIsValidating(false);
            return;
        }

        validateToken(token);
    }, [token]);

    const validateToken = async (token: string) => {
        try {
            const response = await fetch(`/api/partner-invites/validate?token=${token}`);
            const data = await response.json();

            if (!data.valid) {
                setInviteError(data.error || 'Link undangan tidak valid atau sudah kadaluarsa');
            } else {
                setInviteData({
                    email: data.email,
                    partner_name: data.partner_name,
                    expires_at: data.expires_at
                });
            }
        } catch {
            setInviteError('Terjadi kesalahan saat validasi link undangan');
        } finally {
            setIsValidating(false);
        }
    };

    const handleRegisterCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!inviteData) return;

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
                }),
                body: JSON.stringify({
                    email: inviteData.email,
                    password,
                    inviteToken: token // Use invite token for authentication instead of exposed secret
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Gagal membuat akun');
            }

            // Wait a moment for Supabase to fully create the user
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Sign them in
            try {
                await signIn(inviteData.email, password);
            } catch (loginError: unknown) {
                console.error('Login error after signup:', loginError);
                throw new Error('Akun berhasil dibuat, tapi gagal login otomatis. Silakan coba login manual.');
            }

            // Mark the invite as used
            if (token) {
                await ensureCsrfToken();
                await fetch('/api/partner-invites/mark-used', {
                    method: 'POST',
                    headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ token }),
                });
            }

            // Proceed to phone verification step
            setRegistrationStep('phone-verification');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Gagal registrasi.';
            setError(message);
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

    // Loading state
    if (isValidating) {
        return (
            <div className="min-h-screen bg-brand-lime flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border-4 border-black shadow-neo-lg p-8 text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
                    <p className="font-bold uppercase">Memvalidasi undangan...</p>
                </div>
            </div>
        );
    }

    // Invalid/expired token
    if (inviteError) {
        return (
            <div className="min-h-screen bg-brand-lime flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border-4 border-black shadow-neo-lg p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-red-100 border-3 border-red-500 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-600" />
                        </div>

                        <h1 className="text-2xl font-black uppercase mb-4">
                            Undangan Tidak Valid
                        </h1>

                        <p className="text-gray-600 mb-6">
                            {inviteError}
                        </p>

                        <NeoButton
                            onClick={() => router.push('/login')}
                            className="bg-black text-white hover:bg-brand-orange hover:text-black"
                        >
                            Kembali ke Login
                        </NeoButton>
                    </div>

                    <div className="mt-8 text-center border-t-2 border-gray-100 pt-4">
                        <p className="text-xs font-bold text-gray-400 uppercase">
                            &copy; 2026 Smash Partner System
                        </p>
                    </div>
                </div>
            </div>
        );
    }

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
                        Registrasi Partner Baru
                    </p>
                </div>

                {/* Welcome Partner Message */}
                {inviteData?.partner_name && registrationStep === 'credentials' && (
                    <div className="bg-[#DCFCE7] border-[3px] border-black p-5 mb-8 relative shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                        <div className="absolute -top-3 -right-3 bg-brand-orange border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-3">
                            <span className="text-xl">🎉</span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <h3 className="font-black text-xs uppercase tracking-widest text-green-800 mb-1">
                                Selamat Datang Partner
                            </h3>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black uppercase text-black bg-white border-2 border-black px-3 py-1 inline-block transform -rotate-1">
                                    {inviteData.partner_name}
                                </h2>
                            </div>
                            <p className="text-sm font-bold text-gray-700 mt-3 border-t-2 border-black/10 pt-2">
                                Silakan lengkapi registrasi akun Anda untuk memulai.
                            </p>
                        </div>
                    </div>
                )}

                {/* Registration Progress */}
                {registrationStep !== 'complete' && (
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

                {/* Registration Step 1: Credentials */}
                {registrationStep === 'credentials' && inviteData && (
                    <form onSubmit={handleRegisterCredentials} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-black uppercase text-sm flex items-center gap-2">
                                <User className="w-4 h-4" /> Email
                            </label>
                            <NeoInput
                                type="email"
                                value={inviteData.email}
                                disabled
                                className="w-full bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">Email sudah ditentukan dari undangan</p>
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
                                onClick={() => router.push('/login')}
                                className="text-xs font-bold uppercase text-gray-500 hover:text-black underline"
                            >
                                Sudah punya akun? Login disini
                            </button>
                        </div>
                    </form>
                )}

                {/* Registration Step 2: Phone Verification */}
                {registrationStep === 'phone-verification' && inviteData && (
                    <PhoneVerificationStep
                        email={inviteData.email}
                        onVerificationComplete={handlePhoneVerificationComplete}
                        onBack={handleBackToCredentials}
                    />
                )}

                {/* Registration Complete */}
                {registrationStep === 'complete' && (
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

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-brand-lime flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border-4 border-black shadow-neo-lg p-8 text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
                    <p className="font-bold uppercase">Memuat...</p>
                </div>
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}
