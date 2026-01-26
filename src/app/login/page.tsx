'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isRegister) {
                await signUp(email, password);
                alert('Registrasi berhasil! Silakan login.');
                setIsRegister(false);
            } else {
                await signIn(email, password);
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Gagal login/registrasi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-lime flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border-4 border-black shadow-neo-lg p-8 relative overflow-hidden">
                {/* Decorative background pattern */}
                <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>

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
                        Smash<span className="text-brand-orange">.</span> Partner
                    </h1>
                    <p className="text-sm font-bold text-gray-500 uppercase mt-1">
                        Sistem Manajemen GOR
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border-2 border-red-500 text-red-600 font-bold p-3 mb-6 text-sm flex items-center gap-2 shadow-sm">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="font-black uppercase text-sm">Email</label>
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
                        <label className="font-black uppercase text-sm">Password</label>
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
                            {isLoading ? 'Loading...' : (isRegister ? 'DAFTAR ADMIN BARU' : 'MASUK SYSTEM')}
                        </NeoButton>

                        <button
                            type="button"
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-xs font-bold uppercase text-gray-500 hover:text-black underline"
                        >
                            {isRegister ? 'Sudah punya akun? Login disini' : 'Belum punya akun? Daftar disini'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center border-t-2 border-gray-100 pt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase">
                        &copy; 2026 Smash Partner System
                    </p>
                </div>
            </div>
        </div>
    );
}
