"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CourtSettings } from "./court-settings";
import { OperationalSettings } from "./operational-settings";
import { MaintenanceSettings } from "./maintenance-settings";
import { DepositSettings } from "./deposit-settings";
import { BillingSettings } from "./billing-settings";
import { Settings as SettingsIcon, LayoutGrid, Clock, Wrench, DollarSign, CreditCard } from "lucide-react";

import { ReminderSettingsForm } from "./reminder-settings-form";
import { TeamManagement } from "./team-management";
import { useUserRole } from "@/hooks/use-role";
import { Users, Image as ImageIcon } from "lucide-react"; // Import Image Icon
import { VenueProfileSettings } from "./venue-profile-settings";

type SettingsTab = 'profile' | 'courts' | 'operational' | 'reminders' | 'maintenance' | 'finance' | 'team' | 'billing';

function isSettingsTab(value: string | null): value is SettingsTab {
    return value === 'profile' ||
        value === 'courts' ||
        value === 'operational' ||
        value === 'reminders' ||
        value === 'maintenance' ||
        value === 'finance' ||
        value === 'team' ||
        value === 'billing';
}

export const SettingsView = () => {
    const searchParams = useSearchParams();
    const initialTabParam = searchParams.get('tab');
    const [tab, setTab] = useState<SettingsTab>(() => isSettingsTab(initialTabParam) ? initialTabParam : 'operational');
    const { hasPermission } = useUserRole();

    const canViewFinance = hasPermission('VIEW_FINANCE');

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 border-b-2 border-gray-200 pb-1 overflow-x-auto">
                <button
                    onClick={() => setTab('operational')}
                    className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${tab === 'operational'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <SettingsIcon size={16} />
                    Operasional
                </button>
                <button
                    onClick={() => setTab('profile')}
                    className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${tab === 'profile'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <ImageIcon size={16} />
                    Profil Venue
                </button>
                <button
                    onClick={() => setTab('courts')}
                    className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${tab === 'courts'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <LayoutGrid size={16} />
                    Lapangan & Harga
                </button>
                <button
                    onClick={() => setTab('reminders')}
                    className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${tab === 'reminders'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Clock size={16} />
                    Reminder
                </button>
                <button
                    onClick={() => setTab('maintenance')}
                    className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${tab === 'maintenance'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Wrench size={16} />
                    Maintenance
                </button>

                {canViewFinance && (
                    <button
                        onClick={() => setTab('finance')}
                        className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${tab === 'finance'
                            ? 'border-black text-black'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <DollarSign size={16} />
                        Keuangan
                    </button>
                )}

                <button
                    onClick={() => setTab('team')}
                    className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${tab === 'team'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Users size={16} />
                    Tim & Akses
                </button>

                {canViewFinance && (
                    <button
                        onClick={() => setTab('billing')}
                        className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${tab === 'billing'
                            ? 'border-black text-black'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <CreditCard size={16} />
                        Langganan
                    </button>
                )}
            </div>

            <div className="mt-2 text-sm">
                {tab === 'profile' && <VenueProfileSettings />}
                {tab === 'operational' && <OperationalSettings />}
                {tab === 'courts' && <CourtSettings />}
                {tab === 'reminders' && (
                    <div className="max-w-3xl">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Pengaturan Reminder</h2>
                            <p className="text-gray-500 font-bold">Konfigurasi jadwal dan template pesan otomatis (WhatsApp).</p>
                        </div>
                        <ReminderSettingsForm />
                    </div>
                )}
                {tab === 'maintenance' && <MaintenanceSettings />}
                {tab === 'finance' && canViewFinance && <DepositSettings />}
                {tab === 'team' && <TeamManagement />}
                {tab === 'billing' && canViewFinance && <BillingSettings />}
            </div>
        </div>
    );
};

