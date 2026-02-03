'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { sendPasswordResetEmail } from '@/lib/password-reset';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await sendPasswordResetEmail(email);

            if (result.success) {
                setIsSubmitted(true);
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

                {!isSubmitted ? (
                    <>
                        {error && (
                            <div className="bg-red-100 border-2 border-red-500 text-red-600 font-bold p-3 mb-6 text-sm flex items-center gap-2 shadow-sm">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div className="bg-blue-50 border-2 border-blue-300 p-3 mb-6 text-sm">
                            <p className="text-gray-600">
                                Masukkan email akun Anda. Jika terdaftar, kami akan mengirimkan link untuk reset password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-black uppercase text-sm flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Email
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

                            <div className="mt-4 flex flex-col gap-4">
                                <NeoButton
                                    type="submit"
                                    className="w-full justify-center py-4 bg-black text-white hover:bg-brand-orange hover:text-black"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Mengirim...' : 'KIRIM LINK RESET'}
                                </NeoButton>

                                <Link
                                    href="/login"
                                    className="text-xs font-bold uppercase text-gray-500 hover:text-black underline flex items-center justify-center gap-1"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Kembali ke Login
                                </Link>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-100 border-2 border-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-xl font-black uppercase text-green-600 mb-2">
                            Email Terkirim!
                        </h2>
                        <p className="text-gray-600 mb-4 text-sm">
                            Jika email <strong>{email}</strong> terdaftar di sistem kami, Anda akan menerima link untuk reset password.
                        </p>
                        <p className="text-xs text-gray-500 mb-6">
                            Cek folder spam jika tidak menemukan email dalam beberapa menit.
                        </p>
                        <Link href="/login">
                            <NeoButton className="inline-flex justify-center bg-black text-white hover:bg-brand-orange hover:text-black">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali ke Login
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
