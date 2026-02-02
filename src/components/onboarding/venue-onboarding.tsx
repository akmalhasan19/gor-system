'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { Building2, MapPin, Phone, Grid3x3, Clock, Check, ArrowRight, ArrowLeft, Sparkles, LogOut, Crown, Zap, AlertTriangle, Rocket, Trophy, Gem, Image as ImageIcon } from 'lucide-react';
import { useVenue } from '@/lib/venue-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getCsrfHeaders, fetchWithCsrf } from '@/lib/hooks/use-csrf';
import { PLAN_FEATURES, SubscriptionPlan } from '@/lib/constants/plans';

interface OnboardingData {
    venueName: string;
    address: string;
    phone: string;
    courtsCount: number;
    operatingHoursStart: number;
    operatingHoursEnd: number;
    hourlyRatePerCourt: number;

    subscriptionPlan: SubscriptionPlan;
    photoFile: File | null;
}

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export function VenueOnboarding() {
    const router = useRouter();
    const { refreshVenue } = useVenue();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [skipSubscription, setSkipSubscription] = useState(true);

    const [data, setData] = useState<OnboardingData>({
        venueName: '',
        address: '',
        phone: '',
        courtsCount: 3,
        operatingHoursStart: 8,
        operatingHoursEnd: 23,
        hourlyRatePerCourt: 50000,
        subscriptionPlan: 'STARTER',
        photoFile: null,
    });

    const maxCourts = PLAN_FEATURES[data.subscriptionPlan].maxCourts;

    const updateData = (updates: Partial<OnboardingData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/login');
            router.refresh();
        } catch (error) {
            toast.error('Gagal logout');
        }
    };

    const handleNext = () => {
        setError('');

        // Validate current step
        if (currentStep === 1 && !data.venueName.trim()) {
            setError('Nama venue wajib diisi');
            return;
        }

        if (currentStep === 4 && data.operatingHoursStart >= data.operatingHoursEnd) {
            setError('Jam tutup harus lebih besar dari jam buka');
            return;
        }

        if (currentStep < 5) {
            setCurrentStep((currentStep + 1) as OnboardingStep);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as OnboardingStep);
        }
    };

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        setSkipSubscription(false);
        updateData({ subscriptionPlan: plan });
        // Adjust courts if exceeds new plan limit
        const newMax = PLAN_FEATURES[plan].maxCourts;
        if (data.courtsCount > newMax) {
            updateData({ courtsCount: newMax });
        }
    };

    const handleSkipSubscription = () => {
        setSkipSubscription(true);
        updateData({ subscriptionPlan: 'STARTER', courtsCount: Math.min(data.courtsCount, 3) });
        handleNext();
    };

    const handleCourtsChange = (value: number) => {
        if (value <= maxCourts) {
            updateData({ courtsCount: value });
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/onboarding/submit', {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Gagal menyimpan data');
            }

            // Upload photo if exists
            if (data.photoFile && result.venueId) {
                try {
                    const formData = new FormData();
                    formData.append('file', data.photoFile);
                    formData.append('venueId', result.venueId);

                    await fetchWithCsrf('/api/venues/photo', {
                        method: 'POST',
                        body: formData
                    });
                } catch (uploadError) {
                    console.error("Photo upload failed but venue created", uploadError);
                    toast.error("Venue dibuat tapi foto gagal diupload");
                }
            }

            await refreshVenue();
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
        STARTER: <Rocket className="w-8 h-8 text-black" />,
        PRO: <Trophy className="w-8 h-8 text-black" />,
        BUSINESS: <Gem className="w-8 h-8 text-black" />,
    };

    const planStyles: Record<SubscriptionPlan, string> = {
        STARTER: 'bg-white hover:bg-gray-50',
        PRO: 'bg-brand-orange hover:bg-orange-400',
        BUSINESS: 'bg-brand-lime hover:bg-lime-400', // Using Brand Lime as it's a primary brand color
    };

    return (
        <div className="min-h-screen bg-brand-lime flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white border-4 border-black shadow-neo-lg relative overflow-hidden">
                {/* Header */}
                <div className="bg-black text-white p-6 flex justify-between items-start">
                    <div className="flex-1 pr-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Sparkles className="w-6 h-6 text-brand-lime" />
                            <h1 className="text-2xl font-black uppercase italic">Setup GOR Anda</h1>
                        </div>
                        <p className="text-sm text-gray-300 mb-6">
                            Mari kita atur venue badminton Anda dalam beberapa langkah mudah.
                        </p>

                        {/* Neo-Brutalist Staff Notice */}
                        <div className='bg-brand-lime text-black p-4 border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] transform -rotate-1 transition-transform hover:rotate-0'>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">👋</span>
                                <div>
                                    <p className='font-black uppercase italic text-sm mb-1 bg-black text-white inline-block px-1'>
                                        Anda Staff / Karyawan?
                                    </p>
                                    <p className="text-xs font-bold leading-relaxed">
                                        <span className="underline decoration-2 decoration-black">Jangan isi form ini.</span> Minta Owner untuk undang email Anda via <br />
                                        <span className="font-black bg-white px-1 border border-black mt-1 inline-block">Pengaturan &gt; Tim</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-white flex flex-col items-center text-xs font-bold gap-1 transition-colors border-2 border-transparent hover:border-white p-2 rounded-none"
                        title="Logout / Ganti Akun"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-100 p-4 border-b-4 border-black">
                    <div className="flex items-center justify-center max-w-md mx-auto">
                        {[1, 2, 3, 4, 5].map((step, idx) => (
                            <div key={step} className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black ${currentStep >= step
                                        ? 'bg-brand-orange border-black text-black'
                                        : 'bg-white border-gray-300 text-gray-400'
                                        }`}
                                >
                                    {currentStep > step ? <Check className="w-5 h-5" /> : step}
                                </div>
                                {idx < 4 && (
                                    <div
                                        className={`w-4 h-1 mx-0.5 sm:w-8 sm:mx-1 ${currentStep > step ? 'bg-brand-orange' : 'bg-gray-300'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {error && (
                        <div className="bg-red-100 border-2 border-red-500 text-red-600 font-bold p-3 mb-6 text-sm flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Step 1: Venue Information */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-black uppercase mb-1">Informasi Venue</h2>

                                <p className="text-sm text-gray-600">Ceritakan sedikit tentang GOR Anda</p>
                            </div>

                            <div className="space-y-4">
                                { /* Photo Upload */}
                                <div>
                                    <label className="font-black uppercase text-sm flex items-center gap-2 mb-2">
                                        <ImageIcon className="w-4 h-4" /> Foto Venue
                                    </label>
                                    <div className="relative w-full aspect-video bg-gray-100 border-2 border-black border-dashed rounded-lg overflow-hidden flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => document.getElementById('venue-photo-input')?.click()}
                                    >
                                        {data.photoFile ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={URL.createObjectURL(data.photoFile)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <ImageIcon size={32} />
                                                <span className="text-xs font-bold">Klik untuk upload foto cover</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="venue-photo-input"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 5 * 1024 * 1024) {
                                                    setError("Ukuran foto maksimal 5MB");
                                                    return;
                                                }
                                                updateData({ photoFile: file });
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="font-black uppercase text-sm flex items-center gap-2 mb-2">
                                        <Building2 className="w-4 h-4" /> Nama Venue <span className="text-red-500">*</span>
                                    </label>
                                    <NeoInput
                                        type="text"
                                        value={data.venueName}
                                        onChange={(e) => updateData({ venueName: e.target.value })}
                                        placeholder="GOR Badminton Maju Jaya"
                                        className="w-full"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="font-black uppercase text-sm flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4" /> Alamat
                                    </label>
                                    <textarea
                                        value={data.address}
                                        onChange={(e) => updateData({ address: e.target.value })}
                                        placeholder="Jl. Olahraga No. 123, Jakarta"
                                        className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="font-black uppercase text-sm flex items-center gap-2 mb-2">
                                        <Phone className="w-4 h-4" /> Nomor Telepon
                                    </label>
                                    <NeoInput
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => updateData({ phone: e.target.value })}
                                        placeholder="08123456789"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Subscription Plan Selection */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-black uppercase mb-1">Pilih Paket Langganan</h2>
                                <p className="text-sm text-gray-600">Pilih paket yang sesuai dengan kebutuhan GOR Anda, atau lewati untuk menggunakan paket Starter.</p>
                            </div>

                            <div className="grid gap-6">
                                {(['STARTER', 'PRO', 'BUSINESS'] as SubscriptionPlan[]).map((planKey) => {
                                    const planConfig = PLAN_FEATURES[planKey];
                                    const isSelected = data.subscriptionPlan === planKey && !skipSubscription;
                                    const baseStyle = planStyles[planKey];

                                    return (
                                        <button
                                            key={planKey}
                                            type="button"
                                            onClick={() => handleSelectPlan(planKey)}
                                            className={`relative border-[3px] border-black rounded-xl p-6 text-left transition-all group
                                                ${isSelected
                                                    ? 'translate-x-[-4px] translate-y-[-4px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black ring-offset-4'
                                                    : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                                                }
                                                ${baseStyle}
                                            `}
                                        >
                                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                                {/* Icon & Mobile Checkbox Row */}
                                                <div className="w-full sm:w-auto flex justify-between items-start">
                                                    <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                                                        {planIcons[planKey]}
                                                    </div>

                                                    {/* Mobile Checkbox */}
                                                    <div className={`sm:hidden w-8 h-8 border-2 border-black flex items-center justify-center transition-colors ${isSelected ? 'bg-black text-white' : 'bg-white'}`}>
                                                        {isSelected && <Check className="w-6 h-6" />}
                                                    </div>
                                                </div>

                                                <div className="flex-1 w-full">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                                        <h4 className="font-black text-2xl uppercase italic tracking-tight">{planConfig.displayName}</h4>
                                                        <span className="font-black text-xl">
                                                            Rp {planConfig.priceMonthly.toLocaleString('id-ID')}
                                                            <span className="text-sm font-bold text-black/60 ml-1">/bln</span>
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-black/80 mb-3 leading-relaxed border-b-2 border-black/10 pb-3">
                                                        {planConfig.description}
                                                    </p>

                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                                            <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                                            Maks. {planConfig.maxCourts === 999 ? 'Unlimited' : planConfig.maxCourts} Lapangan
                                                        </div>
                                                        {planConfig.features.map((feature, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-xs font-bold uppercase">
                                                                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                                                {feature}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Desktop Checkbox */}
                                                <div className={`hidden sm:flex w-8 h-8 border-2 border-black items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'bg-black text-white' : 'bg-white'}`}>
                                                    {isSelected && <Check className="w-6 h-6" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={handleSkipSubscription}
                                    className="text-sm text-gray-500 hover:text-gray-700 font-bold underline"
                                >
                                    Nanti saja, gunakan paket Starter gratis
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Courts Configuration */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-black uppercase mb-1">Konfigurasi Lapangan</h2>
                                <p className="text-sm text-gray-600">Berapa banyak lapangan yang Anda miliki?</p>
                            </div>

                            {/* Plan Info Banner */}
                            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 flex items-center gap-3">
                                {planIcons[data.subscriptionPlan]}
                                <div className="flex-1">
                                    <p className="font-bold text-sm">Paket: {PLAN_FEATURES[data.subscriptionPlan].displayName}</p>
                                    <p className="text-xs text-gray-500">Maksimum {maxCourts === 999 ? 'Unlimited' : maxCourts} lapangan</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="text-xs text-brand-orange font-bold hover:underline"
                                >
                                    Ubah Paket
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="font-black uppercase text-sm flex items-center gap-2 mb-3">
                                        <Grid3x3 className="w-4 h-4" /> Jumlah Lapangan: {data.courtsCount}
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max={maxCourts > 12 ? 12 : maxCourts}
                                        value={data.courtsCount}
                                        onChange={(e) => handleCourtsChange(parseInt(e.target.value))}
                                        className="w-full h-3 bg-gray-200 border-2 border-black appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #FFA500 0%, #FFA500 ${((data.courtsCount - 1) / ((maxCourts > 12 ? 12 : maxCourts) - 1)) * 100}%, #e5e7eb ${((data.courtsCount - 1) / ((maxCourts > 12 ? 12 : maxCourts) - 1)) * 100}%, #e5e7eb 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-xs font-bold text-gray-500 mt-1">
                                        <span>1</span>
                                        <span>{maxCourts > 12 ? '12+' : maxCourts}</span>
                                    </div>

                                    {data.subscriptionPlan === 'STARTER' && data.courtsCount >= 3 && (
                                        <div className="mt-3 bg-amber-50 border-2 border-amber-400 rounded-lg p-3 flex items-start gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-amber-800">Butuh lebih dari 3 lapangan?</p>
                                                <p className="text-xs text-amber-700">Upgrade ke paket PRO atau BUSINESS untuk lapangan lebih banyak.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentStep(2)}
                                                    className="mt-2 text-xs bg-amber-500 text-white font-bold px-3 py-1 rounded hover:bg-amber-600 transition-colors"
                                                >
                                                    Lihat Paket Lain
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Preview - Badminton Court Layout */}
                                <div className="bg-gray-50 border-2 border-black p-4">
                                    <p className="font-black uppercase text-xs mb-3">Preview Lapangan:</p>
                                    <div className="bg-white border-4 border-black p-4">
                                        <div className={`grid gap-3 ${data.courtsCount <= 4 ? 'grid-cols-2' :
                                            data.courtsCount <= 6 ? 'grid-cols-3' :
                                                data.courtsCount <= 9 ? 'grid-cols-3' :
                                                    'grid-cols-4'
                                            }`}>
                                            {Array.from({ length: data.courtsCount }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className="relative bg-gradient-to-b from-green-400 to-green-500 border-2 border-black shadow-neo-sm overflow-hidden"
                                                    style={{ aspectRatio: '13/24' }}
                                                >
                                                    <div className="absolute inset-0 p-1">
                                                        <div className="absolute inset-1 border-2 border-white/80"></div>
                                                        <div className="absolute left-1 right-1 top-[30%] h-0.5 bg-white/80"></div>
                                                        <div className="absolute left-1 right-1 bottom-[30%] h-0.5 bg-white/80"></div>
                                                        <div className="absolute left-1/2 top-1 bottom-1 w-0.5 bg-white/60 -translate-x-1/2"></div>
                                                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
                                                            <div className="h-1 bg-black/80 border-t border-b border-white/40"></div>
                                                            <div className="absolute left-0 top-1/2 w-1 h-3 bg-gray-800 -translate-y-1/2 -translate-x-1"></div>
                                                            <div className="absolute right-0 top-1/2 w-1 h-3 bg-gray-800 -translate-y-1/2 translate-x-1"></div>
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-0.5 text-[10px] font-black border border-white">
                                                        {i + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-black uppercase text-sm mb-2 block">
                                        Harga per Jam (Rp)
                                    </label>
                                    <NeoInput
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={data.hourlyRatePerCourt}
                                        onChange={(e) => updateData({ hourlyRatePerCourt: parseInt(e.target.value) || 0 })}
                                        placeholder="50000"
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Format: {data.hourlyRatePerCourt.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Operating Hours */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-black uppercase mb-1">Jam Operasional</h2>
                                <p className="text-sm text-gray-600">Kapan GOR Anda buka?</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-black uppercase text-sm mb-2 block">
                                            Jam Buka
                                        </label>
                                        <select
                                            value={data.operatingHoursStart}
                                            onChange={(e) => updateData({ operatingHoursStart: parseInt(e.target.value) })}
                                            className="w-full border-2 border-black p-3 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
                                        >
                                            {Array.from({ length: 18 }, (_, i) => i + 6).map(hour => (
                                                <option key={hour} value={hour}>
                                                    {hour.toString().padStart(2, '0')}:00
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="font-black uppercase text-sm mb-2 block">
                                            Jam Tutup
                                        </label>
                                        <select
                                            value={data.operatingHoursEnd}
                                            onChange={(e) => updateData({ operatingHoursEnd: parseInt(e.target.value) })}
                                            className="w-full border-2 border-black p-3 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
                                        >
                                            {Array.from({ length: 18 }, (_, i) => i + 6).map(hour => (
                                                <option key={hour} value={hour}>
                                                    {hour.toString().padStart(2, '0')}:00
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Timeline Preview */}
                                <div className="bg-gray-50 border-2 border-black p-4">
                                    <p className="font-black uppercase text-xs mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Timeline Operasional:
                                    </p>
                                    <div className="relative h-12 bg-white border-2 border-black">
                                        <div
                                            className="absolute h-full bg-brand-orange opacity-75"
                                            style={{
                                                left: `${((data.operatingHoursStart - 6) / 18) * 100}%`,
                                                width: `${((data.operatingHoursEnd - data.operatingHoursStart) / 18) * 100}%`,
                                            }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center font-black text-sm">
                                            {data.operatingHoursStart.toString().padStart(2, '0')}:00 - {data.operatingHoursEnd.toString().padStart(2, '0')}:00
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-gray-500 mt-1">
                                        <span>06:00</span>
                                        <span>24:00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-black uppercase mb-1">Konfirmasi Data</h2>
                                <p className="text-sm text-gray-600">Pastikan semua informasi sudah benar</p>
                            </div>

                            <div className="space-y-4 bg-gray-50 border-2 border-black p-6">
                                <div className="border-b-2 border-gray-300 pb-3">
                                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Nama Venue</p>
                                    <p className="font-black text-lg">{data.venueName}</p>
                                </div>

                                {data.address && (
                                    <div className="border-b-2 border-gray-300 pb-3">
                                        <p className="text-xs font-black uppercase text-gray-500 mb-1">Alamat</p>
                                        <p className="font-mono text-sm">{data.address}</p>
                                    </div>
                                )}

                                {data.phone && (
                                    <div className="border-b-2 border-gray-300 pb-3">
                                        <p className="text-xs font-black uppercase text-gray-500 mb-1">Telepon</p>
                                        <p className="font-mono text-sm">{data.phone}</p>
                                    </div>
                                )}

                                <div className="border-b-2 border-gray-300 pb-3">
                                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Paket Langganan</p>
                                    <div className="flex items-center gap-2">
                                        {planIcons[data.subscriptionPlan]}
                                        <p className="font-black text-lg">{PLAN_FEATURES[data.subscriptionPlan].displayName}</p>
                                    </div>
                                </div>

                                <div className="border-b-2 border-gray-300 pb-3">
                                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Jumlah Lapangan</p>
                                    <p className="font-black text-lg">{data.courtsCount} Lapangan</p>
                                </div>

                                <div className="border-b-2 border-gray-300 pb-3">
                                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Jam Operasional</p>
                                    <p className="font-black text-lg">
                                        {data.operatingHoursStart.toString().padStart(2, '0')}:00 - {data.operatingHoursEnd.toString().padStart(2, '0')}:00
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Harga per Jam</p>
                                    <p className="font-black text-lg">
                                        Rp {data.hourlyRatePerCourt.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-100 border-t-4 border-black p-4 sm:p-6 flex items-center justify-center gap-4">
                    {currentStep > 1 && (
                        <NeoButton
                            onClick={handleBack}
                            className="bg-white hover:bg-gray-200"
                            disabled={isSubmitting}
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Kembali
                        </NeoButton>
                    )}

                    {currentStep < 5 ? (
                        currentStep === 2 ? (
                            <NeoButton
                                onClick={handleNext}
                                className="bg-black text-white hover:bg-brand-orange hover:text-black"
                                disabled={skipSubscription && data.subscriptionPlan !== 'STARTER'}
                            >
                                Lanjut
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </NeoButton>
                        ) : (
                            <NeoButton
                                onClick={handleNext}
                                className="bg-black text-white hover:bg-brand-orange hover:text-black"
                            >
                                Lanjut
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </NeoButton>
                        )
                    ) : (
                        <NeoButton
                            onClick={handleSubmit}
                            className="bg-brand-orange text-black hover:bg-black hover:text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Selesai & Mulai'}
                            <Check className="w-5 h-5 ml-2" />
                        </NeoButton>
                    )}
                </div>
            </div>
        </div>
    );
}
