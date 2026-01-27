"use client";

import React, { useState } from "react";
import { CourtSettings } from "./court-settings";
import { OperationalSettings } from "./operational-settings";
import { Settings as SettingsIcon, LayoutGrid } from "lucide-react";

export const SettingsView = () => {
    const [tab, setTab] = useState<'courts' | 'operational'>('operational');

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 border-b-2 border-gray-200 pb-1">
                <button
                    onClick={() => setTab('operational')}
                    className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all ${tab === 'operational'
                            ? 'border-black text-black'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <SettingsIcon size={16} />
                    Operasional
                </button>
                <button
                    onClick={() => setTab('courts')}
                    className={`px-4 py-2 font-black uppercase text-sm flex items-center gap-2 border-b-2 transition-all ${tab === 'courts'
                            ? 'border-black text-black'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <LayoutGrid size={16} />
                    Lapangan & Harga
                </button>
            </div>

            <div className="mt-2">
                {tab === 'operational' && <OperationalSettings />}
                {tab === 'courts' && <CourtSettings />}
            </div>
        </div>
    );
};
