'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { Smartphone, Shield, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { getCsrfHeaders } from '@/lib/hooks/use-csrf';

interface PhoneVerificationStepProps {
    email: string;
    onVerificationComplete: () => void;
    onBack: () => void;
}

interface VerificationState {
    step: 'phone-input' | 'qr-setup' | 'verify-code';
    phoneNumber: string;
    qrCode: string | null;
    totpSecret: string | null;
    totpUri: string | null;
    verificationId: string | null;
    isLoading: boolean;
    error: string | null;
}

export function PhoneVerificationStep({
    email,
    onVerificationComplete,
    onBack,
}: PhoneVerificationStepProps) {
    const [state, setState] = useState<VerificationState>({
        step: 'phone-input',
        phoneNumber: '',
        qrCode: null,
        totpSecret: null,
        totpUri: null,
        verificationId: null,
        isLoading: false,
        error: null,
    });

    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [copied, setCopied] = useState(false);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await fetch('/api/phone-verification/initiate', {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    phoneNumber: state.phoneNumber,
                    accountName: email,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to initiate verification');
            }

            setState(prev => ({
                ...prev,
                step: 'qr-setup',
                qrCode: data.qrCode,
                totpSecret: data.secret,
                totpUri: data.totpUri,
                verificationId: data.verificationId,
                isLoading: false,
            }));
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Failed to initiate verification',
            }));
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otpCode];
        newOtp[index] = value;
        setOtpCode(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otpCode];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtpCode(newOtp);
        // Focus the last filled input or the next empty one
        const focusIndex = Math.min(pastedData.length, 5);
        otpInputRefs.current[focusIndex]?.focus();
    };

    const handleVerifyCode = async () => {
        const code = otpCode.join('');
        if (code.length !== 6) {
            setState(prev => ({ ...prev, error: 'Please enter a 6-digit code' }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await fetch('/api/phone-verification/verify', {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    code,
                    accountName: email,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Verification failed');
            }

            onVerificationComplete();
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Verification failed',
            }));
            setOtpCode(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        }
    };

    const copySecret = async () => {
        if (state.totpSecret) {
            await navigator.clipboard.writeText(state.totpSecret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const proceedToVerify = () => {
        setState(prev => ({ ...prev, step: 'verify-code' }));
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    };

    // Auto-submit when all 6 digits entered
    useEffect(() => {
        if (otpCode.every(digit => digit !== '') && state.step === 'verify-code') {
            handleVerifyCode();
        }
    }, [otpCode]);

    return (
        <div className="w-full">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`w-3 h-3 rounded-full ${state.step === 'phone-input' ? 'bg-brand-orange' : 'bg-green-500'}`} />
                <div className={`w-8 h-0.5 ${state.step !== 'phone-input' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full ${state.step === 'qr-setup' ? 'bg-brand-orange' : state.step === 'verify-code' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className={`w-8 h-0.5 ${state.step === 'verify-code' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full ${state.step === 'verify-code' ? 'bg-brand-orange' : 'bg-gray-300'}`} />
            </div>

            {state.error && (
                <div className="bg-red-100 border-2 border-red-500 text-red-600 font-bold p-3 mb-4 text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {state.error}
                </div>
            )}

            {/* Step 1: Phone Number Input */}
            {state.step === 'phone-input' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-brand-lime border-2 border-black mx-auto mb-3 flex items-center justify-center">
                            <Smartphone className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black uppercase">Verifikasi Nomor HP</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Masukkan nomor HP untuk keamanan akun
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <div className="w-20">
                            <NeoInput
                                value="+62"
                                disabled
                                className="text-center bg-gray-100"
                            />
                        </div>
                        <div className="flex-1">
                            <NeoInput
                                type="tel"
                                value={state.phoneNumber}
                                onChange={(e) => setState(prev => ({
                                    ...prev,
                                    phoneNumber: e.target.value.replace(/\D/g, '')
                                }))}
                                placeholder="812345678"
                                className="w-full"
                                required
                            />
                        </div>
                    </div>

                    <p className="text-xs text-gray-500">
                        Contoh: 81234567890 (tanpa awalan 0)
                    </p>

                    <div className="flex gap-2 pt-2">
                        <NeoButton
                            type="button"
                            variant="secondary"
                            onClick={onBack}
                            className="flex-1"
                        >
                            Kembali
                        </NeoButton>
                        <NeoButton
                            type="submit"
                            className="flex-1 bg-black text-white"
                            disabled={state.isLoading || state.phoneNumber.length < 9}
                        >
                            {state.isLoading ? 'Loading...' : 'Lanjut'}
                        </NeoButton>
                    </div>
                </form>
            )}

            {/* Step 2: QR Code Setup */}
            {state.step === 'qr-setup' && (
                <div className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-brand-lime border-2 border-black mx-auto mb-3 flex items-center justify-center">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black uppercase">Setup Authenticator</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Scan QR code dengan Google Authenticator
                        </p>
                    </div>

                    {/* QR Code */}
                    {state.qrCode && (
                        <div className="bg-white border-2 border-black p-4 mx-auto w-fit">
                            <Image
                                src={state.qrCode}
                                alt="TOTP QR Code"
                                width={200}
                                height={200}
                                className="mx-auto"
                            />
                        </div>
                    )}

                    {/* Manual entry alternative */}
                    <div className="bg-gray-50 border-2 border-black p-3">
                        <p className="text-xs font-bold uppercase mb-2">Atau masukkan kode manual:</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-white border border-gray-300 p-2 font-mono break-all">
                                {state.totpSecret}
                            </code>
                            <button
                                onClick={copySecret}
                                className="p-2 border-2 border-black bg-white hover:bg-gray-100"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-300 p-3 text-sm">
                        <p className="font-bold mb-1">📱 Belum punya aplikasi?</p>
                        <p className="text-xs text-gray-600">
                            Download Google Authenticator atau Authy dari App Store / Play Store
                        </p>
                    </div>

                    <NeoButton
                        onClick={proceedToVerify}
                        className="w-full bg-black text-white"
                    >
                        Sudah Scan? Lanjut Verifikasi
                    </NeoButton>
                </div>
            )}

            {/* Step 3: Verify Code */}
            {state.step === 'verify-code' && (
                <div className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-brand-lime border-2 border-black mx-auto mb-3 flex items-center justify-center">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black uppercase">Masukkan Kode</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Masukkan 6 digit kode dari aplikasi authenticator
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                        {otpCode.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { otpInputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                className="w-12 h-14 text-center text-2xl font-black border-2 border-black focus:outline-none focus:border-brand-orange transition-colors"
                                disabled={state.isLoading}
                            />
                        ))}
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Kode akan berubah setiap 30 detik
                    </p>

                    <div className="flex gap-2 pt-2">
                        <NeoButton
                            type="button"
                            variant="secondary"
                            onClick={() => setState(prev => ({ ...prev, step: 'qr-setup' }))}
                            className="flex-1"
                            disabled={state.isLoading}
                        >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Lihat QR
                        </NeoButton>
                        <NeoButton
                            onClick={handleVerifyCode}
                            className="flex-1 bg-black text-white"
                            disabled={state.isLoading || otpCode.some(d => d === '')}
                        >
                            {state.isLoading ? 'Verifying...' : 'Verifikasi'}
                        </NeoButton>
                    </div>
                </div>
            )}
        </div>
    );
}
