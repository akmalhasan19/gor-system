'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { updatePassword, checkPhoneVerified, validatePassword, signOutAllSessions } from '@/lib/password-reset';
import { validateTOTPToken } from '@/lib/totp-utils';
import { supabase } from '@/lib/supabase';
import { Lock, Shield, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';

type ResetStep = 'loading' | 'totp' | 'password' | 'success' | 'error';

function ResetPasswordContent() {
    const [step, setStep] = useState<ResetStep>('loading');
    const [totpCode, setTotpCode] = useState('');
    const [totpSecret, setTotpSecret] = useState<string | null>(null);
    const [totpAttempts, setTotpAttempts] = useState(0);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [userEmail, setUserEmail] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check session and phone verification on mount
    useEffect(() => {
        const initializeReset = async () => {
            try {
                // Supabase automatically handles the token from URL
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setError('Link reset tidak valid atau sudah kadaluarsa');
                    setStep('error');
                    return;
                }

                setUserEmail(session.user.email || '');

                // Check if user has phone verified
                const phoneCheck = await checkPhoneVerified();

                if (phoneCheck.isVerified && phoneCheck.totpSecret) {
                    setTotpSecret(phoneCheck.totpSecret);
                    setStep('totp');
                } else {
                    // No phone verification, go straight to password
                    setStep('password');
                }
            } catch (err) {
                console.error('Init error:', err);
                setError('Terjadi kesalahan. Silakan coba lagi.');
                setStep('error');
            }
        };

        initializeReset();
    }, []);

    const handleTotpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!totpSecret) {
            setStep('password');
            return;
        }

        // Validate TOTP
        const result = validateTOTPToken(totpSecret, totpCode, userEmail);

        if (result.valid) {
            setStep('password');
        } else {
            const newAttempts = totpAttempts + 1;
            setTotpAttempts(newAttempts);

            if (newAttempts >= 3) {
                setError('Terlalu banyak percobaan. Silakan request reset ulang.');
                setStep('error');
            } else {
                setError(`Kode salah. ${3 - newAttempts} percobaan tersisa.`);
            }
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setPasswordErrors([]);

        // Validate password confirmation
        if (newPassword !== confirmPassword) {
            setError('Password tidak cocok!');
            return;
        }

        // Validate password strength
        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            setPasswordErrors(validation.errors);
            return;
        }

        setIsLoading(true);

        try {
            const result = await updatePassword(newPassword);

            if (result.success) {
                // Sign out all sessions for security
                await signOutAllSessions();
                setStep('success');
            } else {
                setError(result.error || 'Gagal mengubah password');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
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
                        Reset Password
                    </p>
                </div>

                {/* Loading State */}
                {step === 'loading' && (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 border-4 border-black border-t-brand-orange rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Memvalidasi link...</p>
                    </div>
                )}

                {/* Error State */}
                {step === 'error' && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-red-100 border-2 border-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-xl font-black uppercase text-red-600 mb-2">
                            Gagal
                        </h2>
                        <p className="text-gray-600 mb-6 text-sm">{error}</p>
                        <Link href="/forgot-password">
                            <NeoButton className="inline-flex justify-center bg-black text-white hover:bg-brand-orange hover:text-black">
                                Request Reset Ulang
                            </NeoButton>
                        </Link>
                    </div>
                )}

                {/* TOTP Verification Step */}
                {step === 'totp' && (
                    <>
                        {error && (
                            <div className="bg-red-100 border-2 border-red-500 text-red-600 font-bold p-3 mb-6 text-sm flex items-center gap-2 shadow-sm">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div className="bg-blue-50 border-2 border-blue-300 p-3 mb-6 text-sm">
                            <p className="font-bold flex items-center gap-1">
                                <Shield className="w-4 h-4" /> Verifikasi Keamanan
                            </p>
                            <p className="text-gray-600 mt-1">
                                Masukkan kode 6 digit dari aplikasi authenticator Anda untuk memverifikasi identitas.
                            </p>
                        </div>

                        <form onSubmit={handleTotpVerify} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-black uppercase text-sm flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> Kode Authenticator
                                </label>
                                <NeoInput
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="w-full bg-gray-50 text-center text-2xl tracking-widest"
                                    required
                                />
                            </div>

                            <div className="mt-4">
                                <NeoButton
                                    type="submit"
                                    className="w-full justify-center py-4 bg-black text-white hover:bg-brand-orange hover:text-black"
                                    disabled={totpCode.length !== 6}
                                >
                                    VERIFIKASI
                                </NeoButton>
                            </div>
                        </form>
                    </>
                )}

                {/* Password Step */}
                {step === 'password' && (
                    <>
                        {error && (
                            <div className="bg-red-100 border-2 border-red-500 text-red-600 font-bold p-3 mb-6 text-sm flex items-center gap-2 shadow-sm">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {passwordErrors.length > 0 && (
                            <div className="bg-yellow-50 border-2 border-yellow-400 p-3 mb-6 text-sm">
                                <p className="font-bold text-yellow-700">Password harus memenuhi:</p>
                                <ul className="list-disc list-inside text-yellow-600 mt-1">
                                    {passwordErrors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-black uppercase text-sm flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Password Baru
                                </label>
                                <NeoInput
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
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

                            <div className="bg-gray-50 border-2 border-gray-200 p-3 text-xs">
                                <p className="font-bold">Syarat Password:</p>
                                <ul className="list-disc list-inside text-gray-600 mt-1">
                                    <li>Minimal 8 karakter</li>
                                    <li>Mengandung huruf besar dan kecil</li>
                                    <li>Mengandung angka</li>
                                </ul>
                            </div>

                            <div className="mt-2">
                                <NeoButton
                                    type="submit"
                                    className="w-full justify-center py-4 bg-black text-white hover:bg-brand-orange hover:text-black"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Menyimpan...' : 'SIMPAN PASSWORD BARU'}
                                </NeoButton>
                            </div>
                        </form>
                    </>
                )}

                {/* Success State */}
                {step === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-100 border-2 border-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-xl font-black uppercase text-green-600 mb-2">
                            Password Berhasil Diubah!
                        </h2>
                        <p className="text-gray-600 mb-6 text-sm">
                            Untuk keamanan, semua sesi telah dilogout. Silakan login kembali dengan password baru.
                        </p>
                        <Link href="/login">
                            <NeoButton className="inline-flex justify-center bg-black text-white hover:bg-brand-orange hover:text-black">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Login Sekarang
                            </NeoButton>
                        </Link>
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-brand-lime flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-black border-t-brand-orange rounded-full animate-spin"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
