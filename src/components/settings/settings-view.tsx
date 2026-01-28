"use client";

import React, { useState } from "react";
import { CourtSettings } from "./court-settings";
import { OperationalSettings } from "./operational-settings";
import { Settings as SettingsIcon, LayoutGrid, Clock } from "lucide-react";

import { ReminderSettingsForm } from "./reminder-settings-form";

export const SettingsView = () => {
    const [tab, setTab] = useState<'courts' | 'operational' | 'reminders'>('operational');

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
            </div>

            <div className="mt-2 text-sm">
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
            </div>
        </div>
    );
};
