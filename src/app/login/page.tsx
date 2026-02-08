'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validation/auth-schema';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { PhoneVerificationStep } from '@/components/auth/phone-verification-step';
import Image from 'next/image';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';

function LoginContent() {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Phone verification state for users who logged in but haven't verified
    const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // Check if redirected for phone verification
    useEffect(() => {
        if (searchParams.get('verify_phone') === 'true') {
            setNeedsPhoneVerification(true);
        }
    }, [searchParams]);

    const onSubmit = async (data: LoginFormData) => {
        setError('');
        setIsLoading(true);

        try {
            await signIn(data.email, data.password);

            // Check if phone is verified
            const statusResponse = await fetch('/api/phone-verification/status');
            const statusData = await statusResponse.json();

            if (statusData.success && !statusData.isVerified) {
                // Phone not verified, show verification step
                setVerifiedEmail(data.email);
                setNeedsPhoneVerification(true);
                setIsLoading(false);
                return;
            }

            router.push('/');
            router.refresh();
        } catch (err: any) {
            // Use generic error message for security
            console.error('Login error:', err);
            setError('Email atau password tidak valid.');
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
                // Redirect to dashboard
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            // Default to dashboard if check fails
            router.push('/');
            router.refresh();
        }
    };

    const handleBackFromVerification = () => {
        setNeedsPhoneVerification(false);
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

                {error && (
                    <div className="bg-red-100 border-2 border-red-500 text-red-600 font-bold p-3 mb-6 text-sm flex items-center gap-2 shadow-sm">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Login Form */}
                {!needsPhoneVerification && (
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-black uppercase text-sm flex items-center gap-2">
                                <User className="w-4 h-4" /> Email
                            </label>
                            <NeoInput
                                type="email"
                                {...register('email')}
                                placeholder="admin@example.com"
                                className={`w-full bg-gray-50 ${errors.email ? 'border-red-500' : ''}`}
                            />
                            {errors.email && (
                                <span className="text-xs text-red-500 font-bold">{errors.email.message}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-black uppercase text-sm flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Password
                            </label>
                            <NeoInput
                                type="password"
                                {...register('password')}
                                placeholder="••••••••"
                                className={`w-full bg-gray-50 ${errors.password ? 'border-red-500' : ''}`}
                            />
                            {errors.password && (
                                <span className="text-xs text-red-500 font-bold">{errors.password.message}</span>
                            )}
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
                        </div>
                    </form>
                )}

                {/* Phone Verification Step (for users who logged in but need verification) */}
                {needsPhoneVerification && (
                    <PhoneVerificationStep
                        email={verifiedEmail}
                        onVerificationComplete={handlePhoneVerificationComplete}
                        onBack={handleBackFromVerification}
                    />
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

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-brand-lime flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border-4 border-black shadow-neo-lg p-8 text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
                    <p className="font-bold uppercase">Memuat...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
