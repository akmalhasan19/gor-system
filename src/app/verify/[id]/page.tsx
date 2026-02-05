"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, X, AlertTriangle, Loader2, Calendar, Clock, Zap, MapPin } from "lucide-react";
import { GridBackground } from "@/components/ui/grid-background";
import { Space_Grotesk, Syne } from 'next/font/google';
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Booking } from "@/lib/constants";

// Load fonts
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });

export default function BookingVerifyPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-neutral-50"><Loader2 className="animate-spin" size={48} /></div>}>
            <div className={`${spaceGrotesk.variable} ${syne.variable}`} style={{ fontFamily: 'var(--font-space)' }}>
                <VerifyBookingContent />
            </div>
        </Suspense>
    );
}

function VerifyBookingContent() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    const supabase = createClient();

    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'unpaid' | 'checked_in'>('loading');
    const [booking, setBooking] = useState<Booking | null>(null);
    const [venueName, setVenueName] = useState("");
    const [courtName, setCourtName] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!bookingId) {
            setStatus('invalid');
            setErrorMsg("Booking ID tidak ditemukan.");
            return;
        }

        const fetchBooking = async () => {
            setStatus('loading');
            try {
                // Fetch booking with venue and court details
                const { data: bookingData, error } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        venues (name),
                        courts (name)
                    `)
                    .eq('id', bookingId)
                    .single();

                if (error || !bookingData) {
                    setStatus('invalid');
                    setErrorMsg("Data booking tidak ditemukan di sistem.");
                    console.error("Booking fetch error:", error);
                    return;
                }

                const b = bookingData as any;
                setBooking(b);
                setVenueName(b.venues?.name || "Unknown Venue");
                setCourtName(b.courts?.name || "Unknown Court");

                // Check Booking Date
                const today = new Date().toISOString().split('T')[0];
                const bookingDate = b.booking_date || b.bookingDate; // Handle both casing just in case

                if (bookingDate !== today) {
                    setStatus('expired');
                    setErrorMsg(`Tiket ini untuk tanggal ${bookingDate}, hari ini ${today}.`);
                    return;
                }

                // Check Status
                if (b.status === 'completed' || b.status === 'confirmed') { // confirmed often means manually checked in some systems, but here 'completed' is check-in
                    // Re-reading requirements: "nanti berubah hijau ketika user... sudah datang... dan user... bisa langsung lanjut main"
                    // So we treat 'completed' as checked-in.
                    if (b.status === 'completed') {
                        setStatus('checked_in');
                        return;
                    }
                }

                if (b.status === 'LUNAS' || b.status === 'paid') {
                    // Valid to check in
                    setStatus('valid');
                    // Auto check-in or wait for user confirmation?
                    // Requirement: "ketika operator... meng-scan QR Code... maka akan langsung diarahkan... dan muncul UI apakah benar ada transaksi tersebut atau tidak."
                    // It implies validation UI first. Let's show VALID state and a button to "CHECK IN".
                    // OR if users want "scan to validate" implies the act of scanning validates it.
                    // Let's autosave to 'completed' if it's LUNAS to streamline flow, 
                    // BUT prompt first is safer to avoid accidental scans. 
                    // "muncul UI apakah benar ada transaksi tersebut" -> Shows details. 
                    // Let's do automatic validation check, but manual check-in confirmation for the operator.
                } else if (b.status === 'DP' || b.status === 'BELUM_BAYAR' || b.status === 'pending') {
                    setStatus('unpaid');
                } else if (b.status === 'cancelled') {
                    setStatus('invalid');
                    setErrorMsg("Booking ini sudah dibatalkan.");
                } else {
                    // Fallback
                    setStatus('valid'); // Assume valid if it exists and matches date, but maybe warn if status weird
                }

            } catch (err) {
                setStatus('invalid');
                setErrorMsg("Terjadi kesalahan sistem saat memuat data.");
            }
        };

        fetchBooking();
    }, [bookingId, supabase]);

    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
        });
    }, [supabase]);

    const handleCheckIn = async () => {
        if (!booking || isUpdating) return;

        if (!session) {
            toast.error("Hanya staff yang bisa melakukan Check-In.");
            return;
        }

        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', booking.id);

            if (error) throw error;

            setStatus('checked_in');
            toast.success("Check-in berhasil!");
        } catch (err) {
            console.error("Check-in error:", err);
            toast.error("Gagal melakukan check-in.");
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-50 font-sans">
            <GridBackground />

            {/* Decorative Floating Shapes */}
            <div className="absolute top-10 left-10 w-24 h-24 bg-blue-400 rounded-full border-2 border-black mix-blend-multiply animate-bounce hidden md:block opacity-60 duration-[3000ms]"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-brand-lime rounded-full border-2 border-black mix-blend-multiply animate-pulse hidden md:block opacity-60 duration-[4000ms]"></div>

            <div className="relative z-10 w-full max-w-md perspective-1000">

                {/* Loading State */}
                {status === 'loading' && (
                    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] rounded-3xl p-12 text-center animate-pulse">
                        <Loader2 className="w-16 h-16 mx-auto mb-6 text-black animate-spin" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: 'var(--font-syne)' }}>Checking Ticket...</h2>
                    </div>
                )}

                {/* Valid / Unpaid / Checked In / Expired States */}
                {(status === 'valid' || status === 'checked_in' || status === 'unpaid' || status === 'expired') && booking && (
                    <div className="transform transition-all duration-500 hover:-translate-y-1">

                        {/* Header Badge */}
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 w-max">
                            {status === 'valid' && (
                                <div className="bg-blue-400 px-6 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full flex items-center gap-2">
                                    <Check className="w-5 h-5 stroke-[3] text-white" />
                                    <span className="font-black uppercase tracking-widest text-sm text-white">Valid Ticket</span>
                                </div>
                            )}
                            {status === 'checked_in' && (
                                <div className="bg-brand-lime px-6 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full flex items-center gap-2">
                                    <Check className="w-5 h-5 stroke-[3]" />
                                    <span className="font-black uppercase tracking-widest text-sm">Checked In</span>
                                </div>
                            )}
                            {status === 'unpaid' && (
                                <div className="bg-yellow-400 px-6 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 stroke-[3]" />
                                    <span className="font-black uppercase tracking-widest text-sm">Payment Needed</span>
                                </div>
                            )}
                            {status === 'expired' && (
                                <div className="bg-red-500 px-6 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full flex items-center gap-2">
                                    <X className="w-5 h-5 stroke-[3] text-white" />
                                    <span className="font-black uppercase tracking-widest text-sm text-white">Expired</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000000] rounded-[2.5rem] overflow-hidden flex flex-col">

                            {/* Ticket Visual Header */}
                            <div className={`p-8 pb-12 relative overflow-hidden text-center ${status === 'checked_in' ? 'bg-brand-lime text-black' :
                                status === 'valid' ? 'bg-blue-500 text-white' :
                                    status === 'unpaid' ? 'bg-yellow-400 text-black' :
                                        'bg-red-500 text-white'
                                }`}>
                                <div className="relative z-10">
                                    <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2" style={{ fontFamily: 'var(--font-syne)' }}>
                                        {venueName}
                                    </h1>
                                    <div className="inline-flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full backdrop-blur-sm border border-black/5">
                                        <MapPin size={14} />
                                        <span className="text-xs font-bold uppercase">{courtName}</span>
                                    </div>
                                </div>

                                {/* Jagged Divider */}
                                <div className="absolute -bottom-1 left-0 w-full h-6 bg-white" style={{ clipPath: 'polygon(0 100%, 5% 0, 10% 100%, 15% 0, 20% 100%, 25% 0, 30% 100%, 35% 0, 40% 100%, 45% 0, 50% 100%, 55% 0, 60% 100%, 65% 0, 70% 100%, 75% 0, 80% 100%, 85% 0, 90% 100%, 95% 0, 100% 100%)' }}></div>
                            </div>

                            {/* Ticket Details */}
                            <div className="p-8 pt-6 bg-white">
                                <div className="text-center mb-8">
                                    <p className="font-mono text-xs uppercase text-gray-500 mb-1">Booked By</p>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900 break-words" style={{ fontFamily: 'var(--font-syne)' }}>
                                        {booking.customerName}
                                    </h2>
                                    <p className="text-sm font-bold text-gray-400">{booking.phone}</p>
                                </div>

                                {/* Info Grid */}
                                <div className="bg-[#f0f0f0] border-2 border-black rounded-xl p-4 flex flex-col gap-4 shadow-[2px_2px_0px_0px_#000000] mb-6 relative">
                                    {/* Punch holes */}
                                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-r-2 border-black rounded-full"></div>
                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l-2 border-black rounded-full"></div>

                                    <div className="flex justify-between items-center border-b border-gray-300 pb-2 border-dashed">
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1">
                                                <Calendar size={10} /> Date
                                            </span>
                                            <span className="font-bold text-sm uppercase">{formatDate(booking.bookingDate)}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1 justify-end">
                                                Time <Clock size={10} />
                                            </span>
                                            <span className="font-bold text-sm uppercase">
                                                {booking.startTime} ({booking.duration}h)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] font-bold uppercase text-gray-500">Total</span>
                                            <span className="font-bold text-sm">Rp {booking.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] font-bold uppercase text-gray-500">Status</span>
                                            <span className={`font-black text-sm uppercase ${booking.status === 'LUNAS' || booking.status === 'paid' ? 'text-blue-600' :
                                                booking.status === 'completed' ? 'text-green-600' :
                                                    'text-red-500'
                                                }`}>
                                                {booking.status === 'completed' ? 'CHECKED IN' : booking.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {status === 'valid' && (
                                    <button
                                        onClick={handleCheckIn}
                                        disabled={isUpdating}
                                        className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-[4px_4px_0px_0px_#DDD] flex items-center justify-center gap-2"
                                    >
                                        {isUpdating ? <Loader2 className="animate-spin" /> : <Check />}
                                        Confirm Check-In
                                    </button>
                                )}

                                {status === 'checked_in' && (
                                    <div className="text-center p-4 bg-brand-lime/20 border-2 border-brand-lime border-dashed rounded-xl">
                                        <p className="font-bold text-brand-lime-darker uppercase text-sm">Player is ready to play!</p>
                                    </div>
                                )}

                                {status === 'unpaid' && (
                                    <div className="text-center p-4 bg-yellow-100 border-2 border-yellow-400 border-dashed rounded-xl">
                                        <p className="font-bold text-yellow-800 uppercase text-sm">Please complete payment first.</p>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                )}

                {/* Invalid State */}
                {status === 'invalid' && (
                    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000000] rounded-[2.5rem] overflow-hidden text-center p-8">
                        <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <X className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black uppercase mb-2">Invalid Ticket</h2>
                        <p className="text-gray-500 mb-6">{errorMsg}</p>
                        <button onClick={() => router.push('/')} className="font-bold underline">Back to Home</button>
                    </div>
                )}

            </div>
        </div>
    );
}
