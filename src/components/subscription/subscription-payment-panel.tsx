'use client';

import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import {
    SubscriptionPaymentChannel,
    SubscriptionPaymentMethod,
    SubscriptionPaymentStatus,
} from '@/lib/constants/plans';
import { toast } from 'sonner';
import { CheckCircle, Copy, Loader2 } from 'lucide-react';

export interface SubscriptionPaymentData {
    subscriptionPaymentId: string;
    venueId: string;
    targetPlan: string;
    amount: number;
    status: SubscriptionPaymentStatus;
    external_id: string;
    xendit_id: string | null;
    payment_method: SubscriptionPaymentMethod;
    payment_channel: SubscriptionPaymentChannel | null;
    xendit_qr_string: string | null;
    xendit_virtual_account_number: string | null;
    xendit_expiry_date: string | null;
}

interface SubscriptionPaymentPanelProps {
    paymentData: SubscriptionPaymentData | null;
    isCreating: boolean;
    onCreatePayment: (method: SubscriptionPaymentMethod, channel?: SubscriptionPaymentChannel) => Promise<void>;
    onPaid?: () => void | Promise<void>;
    title?: string;
    subtitle?: string;
}

type LocalStatus = 'IDLE' | SubscriptionPaymentStatus;

const BANKS: SubscriptionPaymentChannel[] = ['BCA', 'BRI', 'MANDIRI', 'BNI', 'PERMATA', 'BSI'];

export function SubscriptionPaymentPanel({
    paymentData,
    isCreating,
    onCreatePayment,
    onPaid,
    title = 'Pembayaran Langganan',
    subtitle = 'Pilih metode pembayaran untuk mengaktifkan paket berbayar.',
}: SubscriptionPaymentPanelProps) {
    const [method, setMethod] = useState<SubscriptionPaymentMethod>('QRIS');
    const [channel, setChannel] = useState<SubscriptionPaymentChannel>('BCA');
    const [realtimeStatus, setRealtimeStatus] = useState<SubscriptionPaymentStatus | null>(null);
    const onPaidRef = useRef(onPaid);

    useEffect(() => {
        onPaidRef.current = onPaid;
    }, [onPaid]);

    useEffect(() => {
        if (!paymentData?.subscriptionPaymentId) return;

        const realtimeChannel = supabase
            .channel(`subscription-payment-${paymentData.subscriptionPaymentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'subscription_payments',
                    filter: `id=eq.${paymentData.subscriptionPaymentId}`,
                },
                async (payload) => {
                    const nextStatus = payload.new?.status as SubscriptionPaymentStatus | undefined;
                    if (!nextStatus) return;

                    setRealtimeStatus(nextStatus);

                    if (nextStatus === 'PAID') {
                        toast.success('Pembayaran berhasil. Paket Anda sudah aktif.');
                        await onPaidRef.current?.();
                    }

                    if (nextStatus === 'FAILED' || nextStatus === 'EXPIRED') {
                        toast.error(`Pembayaran ${nextStatus.toLowerCase()}. Silakan buat tagihan baru.`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(realtimeChannel);
        };
    }, [paymentData?.subscriptionPaymentId]);

    const copyToClipboard = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success('Disalin ke clipboard');
        } catch {
            toast.error('Gagal menyalin');
        }
    };

    const handleCreate = async () => {
        await onCreatePayment(method, method === 'VA' ? channel : undefined);
    };

    const status: LocalStatus = paymentData ? (realtimeStatus || paymentData.status) : 'IDLE';
    const displayMethod = paymentData?.payment_method || method;
    const hasInvoice = paymentData !== null;
    const isPaid = status === 'PAID';
    const isPending = status === 'PENDING';

    return (
        <div className="border-2 border-black bg-white p-5 shadow-neo space-y-5">
            <div>
                <h3 className="text-lg font-black uppercase">{title}</h3>
                <p className="text-sm text-gray-600">{subtitle}</p>
            </div>

            {isPaid ? (
                <div className="border-2 border-green-500 bg-green-50 p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-black text-green-700 uppercase">Pembayaran Berhasil</p>
                        <p className="text-sm text-green-700">Silakan lanjutkan ke dashboard.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        <p className="text-xs font-black uppercase text-gray-500">Metode Pembayaran</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMethod('QRIS')}
                                className={`border-2 border-black p-3 text-sm font-black uppercase transition-colors ${method === 'QRIS' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                            >
                                QRIS
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('VA')}
                                className={`border-2 border-black p-3 text-sm font-black uppercase transition-colors ${method === 'VA' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                            >
                                Virtual Account
                            </button>
                        </div>
                    </div>

                    {method === 'VA' && (
                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase text-gray-500">Pilih Bank VA</p>
                            <div className="grid grid-cols-3 gap-2">
                                {BANKS.map((bank) => (
                                    <button
                                        key={bank}
                                        type="button"
                                        onClick={() => setChannel(bank)}
                                        className={`border-2 border-black px-2 py-2 text-xs font-black uppercase transition-colors ${channel === bank ? 'bg-brand-orange text-black' : 'bg-white hover:bg-gray-100'}`}
                                    >
                                        {bank}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="w-full border-2 border-black bg-black text-white py-3 text-sm font-black uppercase hover:bg-brand-orange hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {hasInvoice ? 'Buat Invoice Baru' : 'Buat Tagihan'}
                    </button>

                    {paymentData && (
                        <div className="space-y-4 border-2 border-dashed border-gray-300 p-4 bg-gray-50">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-black uppercase">Status:</span>
                                <span className={`px-2 py-1 border border-black font-black uppercase ${isPending ? 'bg-yellow-100 text-yellow-800' : status === 'FAILED' ? 'bg-red-100 text-red-700' : status === 'EXPIRED' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {status}
                                </span>
                            </div>

                            <div>
                                <p className="text-xs font-black uppercase text-gray-500">Total Tagihan</p>
                                <p className="text-2xl font-black">Rp {Math.round(paymentData.amount).toLocaleString('id-ID')}</p>
                            </div>

                            {paymentData.xendit_expiry_date && (
                                <p className="text-xs text-gray-600">
                                    Berlaku hingga: {new Date(paymentData.xendit_expiry_date).toLocaleString('id-ID')}
                                </p>
                            )}

                            {displayMethod === 'QRIS' && paymentData.xendit_qr_string && (
                                <div className="bg-white border-2 border-black p-4 inline-flex flex-col items-center gap-2">
                                    <QRCodeSVG value={paymentData.xendit_qr_string} size={200} />
                                    <p className="text-xs font-black uppercase">Scan QRIS</p>
                                </div>
                            )}

                            {displayMethod === 'VA' && paymentData.xendit_virtual_account_number && (
                                <div className="bg-white border-2 border-black p-4 space-y-2">
                                    <p className="text-xs font-black uppercase text-gray-500">Nomor Virtual Account</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black break-all">{paymentData.xendit_virtual_account_number}</p>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(paymentData.xendit_virtual_account_number!)}
                                            className="p-1 border border-black bg-white hover:bg-gray-100"
                                            aria-label="Copy VA number"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

