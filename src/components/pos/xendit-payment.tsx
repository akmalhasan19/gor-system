"use client";

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle, RefreshCcw, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getCsrfHeaders } from '@/lib/hooks/use-csrf';

interface XenditPaymentProps {
    amount: number;
    transactionId: string;
    onSuccess: () => void;
    customerName?: string;
    venueId?: string;
}

type PaymentMethod = 'QRIS' | 'VA';
type PaymentChannel = 'BCA' | 'BRI' | 'MANDIRI' | 'BNI' | 'PERMATA' | 'BSI';

export const XenditPayment: React.FC<XenditPaymentProps> = ({
    amount,
    transactionId,
    onSuccess,
    customerName
}) => {
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [channel, setChannel] = useState<PaymentChannel>('BCA');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'>('IDLE');

    // Reset when method changes
    useEffect(() => {
        setPaymentData(null);
        setStatus('IDLE');
    }, [method, channel]);

    // Use ref for callback to avoid re-subscribing when parent re-renders
    const onSuccessRef = React.useRef(onSuccess);
    useEffect(() => {
        onSuccessRef.current = onSuccess;
    }, [onSuccess]);

    // Setup Realtime Subscription when we have a payment ID
    useEffect(() => {
        if (!paymentData?.xendit_id) return;

        console.log("Subscribing to payment updates:", paymentData.xendit_id);

        const channel = supabase
            .channel(`payment-${paymentData.xendit_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'payments',
                    filter: `xendit_id=eq.${paymentData.xendit_id}`
                },
                (payload) => {
                    console.log('Payment update received:', payload);
                    const newStatus = payload.new.status;
                    setStatus(newStatus);
                    if (newStatus === 'PAID') {
                        toast.success('Pembayaran Berhasil!');
                        setTimeout(() => {
                            onSuccessRef.current();
                        }, 2000);
                    } else if (newStatus === 'FAILED' || newStatus === 'EXPIRED') {
                        toast.error(`Pembayaran ${newStatus}`);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Realtime Subscription Status for ${paymentData.xendit_id}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [paymentData?.xendit_id, supabase]);


    const handleGenerate = async () => {
        if (!method) return;
        setIsLoading(true);

        try {
            const res = await fetch('/api/payments/create', {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    transactionId,
                    amount,
                    paymentMethod: method,
                    paymentChannel: method === 'VA' ? channel : undefined,
                    customerName
                })
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to create payment');
            }

            setPaymentData(result.data);
            setStatus('PENDING');
            toast.info('Menunggu pembayaran...');

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Disalin ke clipboard');
    };

    if (status === 'PAID') {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in zoom-in">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h3 className="text-xl font-bold">Pembayaran Berhasil!</h3>
                <p className="text-gray-500">Transaksi telah lunas.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 p-4 rounded-lg">
            {!paymentData ? (
                <>
                    <h3 className="font-bold text-lg mb-4">Pilih Metode Pembayaran</h3>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            onClick={() => setMethod('QRIS')}
                            className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${method === 'QRIS'
                                ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                                : 'border-gray-200 bg-white hover:border-brand-orange'
                                }`}
                        >
                            <span className="font-black text-xl">QRIS</span>
                            <span className="text-xs text-gray-500">Scan QR Code</span>
                        </button>

                        <button
                            onClick={() => setMethod('VA')}
                            className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${method === 'VA'
                                ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                                : 'border-gray-200 bg-white hover:border-brand-orange'
                                }`}
                        >
                            <span className="font-black text-xl">Transfer</span>
                            <span className="text-xs text-gray-500">Virtual Account</span>
                        </button>
                    </div>

                    {method === 'VA' && (
                        <div className="mb-6">
                            <label className="text-xs font-bold uppercase mb-2 block">Pilih Bank</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['BCA', 'BRI', 'MANDIRI', 'BNI', 'PERMATA', 'BSI'] as PaymentChannel[]).map((bank) => (
                                    <button
                                        key={bank}
                                        onClick={() => setChannel(bank)}
                                        className={`py-2 px-1 border rounded font-bold text-sm ${channel === bank
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white border-gray-300 hover:border-black'
                                            }`}
                                    >
                                        {bank}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto">
                        <button
                            disabled={!method || isLoading}
                            onClick={handleGenerate}
                            className="w-full bg-black text-white py-3 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoading ? 'Memproses...' : 'Buat Tagihan'}
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center h-full animate-in slide-in-from-right">
                    <div className="w-full flex justify-between items-center mb-4">
                        <button
                            onClick={() => {
                                setPaymentData(null);
                                setStatus('IDLE');
                            }}
                            className="text-xs font-bold underline text-gray-500 hover:text-black"
                        >
                            &larr; Ganti Metode
                        </button>
                        <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full uppercase">
                            MENUNGGU PEMBAYARAN
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6">
                        {method === 'QRIS' && paymentData.xendit_qr_string && (
                            <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-black">
                                <QRCodeSVG value={paymentData.xendit_qr_string} size={200} />
                                <div className="mt-2 text-center font-bold text-sm">Scan QRIS</div>
                            </div>
                        )}

                        {method === 'VA' && paymentData.xendit_virtual_account_number && (
                            <div className="w-full bg-white p-6 rounded-xl shadow-lg border-2 border-black text-center">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Nomor Virtual Account ({channel})</div>
                                <div className="text-2xl font-black mb-4 tracking-wider flex items-center justify-center gap-2">
                                    {paymentData.xendit_virtual_account_number}
                                    <button onClick={() => copyToClipboard(paymentData.xendit_virtual_account_number)}>
                                        <Copy className="w-4 h-4 text-gray-400 hover:text-black" />
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500">Silakan transfer sesuai nominal tepat hingga 3 digit terakhir.</div>
                            </div>
                        )}

                        <div className="text-center">
                            <div className="text-xs font-bold text-gray-500 uppercase">Total Tagihan</div>
                            <div className="text-2xl font-black">Rp {amount.toLocaleString()}</div>
                        </div>

                        {/* Simulation Button for Dev/Test Mode */}
                        <div className="w-full pt-4 border-t border-dashed border-gray-300">
                            <button
                                onClick={async () => {
                                    try {
                                        toast.info('Simulating payment...');
                                        const res = await fetch('/api/xendit/simulate', {
                                            method: 'POST',
                                            headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                                            body: JSON.stringify({
                                                external_id: paymentData.external_id,
                                                amount: amount
                                            })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || 'Simulation failed');
                                        toast.success('Simulation trigger sent!');
                                    } catch (err: any) {
                                        console.error(err);
                                        toast.error(err.message);
                                    }
                                }}
                                className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold text-xs uppercase rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
                            >
                                [TEST MODE] Simulate Payment
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto w-full pt-4">
                        <div className="text-[10px] text-center text-gray-400 mb-2">
                            Halaman akan otomatis terupdate setelah pembayaran berhasil.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
