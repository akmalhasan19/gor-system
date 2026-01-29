'use client';

import React from 'react';
import { SettingsView } from "@/components/settings/settings-view";

export default function SettingsPage() {
    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <SettingsView />
        </div>
    );
}
