"use client";

import React, { useState, useEffect } from "react";
import { useVenue } from "@/lib/venue-context";
import {
    getReminderLogs,
    getReminderStats,
    getExpiringMembers,
    sendManualReminder,
    ReminderLog,
    ReminderStats
} from "@/lib/api/reminders";
import { toast } from "sonner";
import {
    Bell,
    Send,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    MessageSquare,
    Users,
    Calendar,
    Loader2
} from "lucide-react";

export const ReminderHistory = () => {
    const { currentVenueId, currentVenue } = useVenue();
    const [logs, setLogs] = useState<ReminderLog[]>([]);
    const [stats, setStats] = useState<ReminderStats>({ total: 0, sent: 0, failed: 0, pending: 0 });
    const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingTo, setSendingTo] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'history' | 'upcoming'>('history');

    useEffect(() => {
        if (currentVenueId) {
            loadData();
        }
    }, [currentVenueId]);

    const loadData = async () => {
        if (!currentVenueId) return;
        setLoading(true);

        try {
            const [logsResult, statsResult, expiringResult] = await Promise.all([
                getReminderLogs(currentVenueId, 50),
                getReminderStats(currentVenueId),
                getExpiringMembers(currentVenueId, 30)
            ]);

            if (logsResult.data) setLogs(logsResult.data);
            setStats(statsResult);
            if (expiringResult.data) setExpiringMembers(expiringResult.data);
        } catch (error) {
            console.error('Failed to load reminder data:', error);
            toast.error('Gagal memuat data reminder');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = async (member: any) => {
        if (!currentVenueId || !currentVenue) return;

        setSendingTo(member.id);
        try {
            const result = await sendManualReminder(
                currentVenueId,
                member.id,
                member.name,
                member.phone,
                currentVenue.name || 'Venue',
                member.membership_expiry,
                member.quota || 0
            );

            if (result.success) {
                toast.success(`Reminder terkirim ke ${member.name}!`);
                loadData(); // Refresh data
            } else {
                toast.error(`Gagal mengirim: ${result.error}`);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengirim reminder');
        } finally {
            setSendingTo(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SENT':
            case 'DELIVERED':
            case 'READ':
                return <CheckCircle size={14} className="text-green-600" />;
            case 'FAILED':
                return <XCircle size={14} className="text-red-600" />;
            case 'PENDING':
                return <Clock size={14} className="text-yellow-600" />;
            default:
                return <AlertTriangle size={14} className="text-gray-400" />;
        }
    };

    const getReminderTypeLabel = (type: string) => {
        switch (type) {
            case '30_DAYS': return 'H-30';
            case '7_DAYS': return 'H-7';
            case 'EXPIRED': return 'Expired';
            case 'MANUAL': return 'Manual';
            default: return type;
        }
    };

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell size={24} />
                    <h2 className="text-xl font-black uppercase italic">Reminder Member</h2>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 border border-black font-bold"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-3 border-2 border-black shadow-neo">
                    <div className="text-[10px] font-bold uppercase text-gray-500">Total Terkirim</div>
                    <div className="text-2xl font-black text-green-600">{stats.sent}</div>
                </div>
                <div className="bg-white p-3 border-2 border-black shadow-neo">
                    <div className="text-[10px] font-bold uppercase text-gray-500">Gagal</div>
                    <div className="text-2xl font-black text-red-600">{stats.failed}</div>
                </div>
                <div className="bg-white p-3 border-2 border-black shadow-neo">
                    <div className="text-[10px] font-bold uppercase text-gray-500">Pending</div>
                    <div className="text-2xl font-black text-yellow-600">{stats.pending}</div>
                </div>
                <div className="bg-white p-3 border-2 border-black shadow-neo">
                    <div className="text-[10px] font-bold uppercase text-gray-500">Akan Expired (30 Hari)</div>
                    <div className="text-2xl font-black text-brand-orange">{expiringMembers.length}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-black">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-bold uppercase ${activeTab === 'history' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                    <MessageSquare size={14} className="inline mr-1" />
                    Riwayat
                </button>
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 text-sm font-bold uppercase ${activeTab === 'upcoming' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                    <Users size={14} className="inline mr-1" />
                    Akan Expired ({expiringMembers.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'history' ? (
                <div className="bg-white border-2 border-black shadow-neo">
                    <div className="bg-gray-100 p-2 border-b-2 border-black">
                        <span className="font-black uppercase text-xs">Riwayat Pengiriman Reminder</span>
                    </div>
                    <div className="max-h-[400px] overflow-auto">
                        {logs.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 italic">
                                Belum ada reminder yang dikirim
                            </div>
                        ) : (
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr className="border-b border-black">
                                        <th className="text-left p-2 font-black">Waktu</th>
                                        <th className="text-left p-2 font-black">Member</th>
                                        <th className="text-left p-2 font-black">Tipe</th>
                                        <th className="text-left p-2 font-black">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-2">
                                                {new Date(log.created_at).toLocaleString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="p-2 font-bold">
                                                {log.customer?.name || log.phone_number}
                                            </td>
                                            <td className="p-2">
                                                <span className="bg-gray-200 px-2 py-0.5 text-[10px] font-bold">
                                                    {getReminderTypeLabel(log.reminder_type)}
                                                </span>
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-1">
                                                    {getStatusIcon(log.status)}
                                                    <span className="text-[10px]">{log.status}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white border-2 border-black shadow-neo">
                    <div className="bg-gray-100 p-2 border-b-2 border-black">
                        <span className="font-black uppercase text-xs">Member yang Akan Expired (30 Hari)</span>
                    </div>
                    <div className="max-h-[400px] overflow-auto">
                        {expiringMembers.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 italic">
                                Tidak ada member yang akan expired dalam 30 hari
                            </div>
                        ) : (
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr className="border-b border-black">
                                        <th className="text-left p-2 font-black">Member</th>
                                        <th className="text-left p-2 font-black">Expired</th>
                                        <th className="text-left p-2 font-black">Sisa Hari</th>
                                        <th className="text-left p-2 font-black">Quota</th>
                                        <th className="text-center p-2 font-black">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiringMembers.map((member) => {
                                        const daysLeft = getDaysUntilExpiry(member.membership_expiry);
                                        return (
                                            <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-2">
                                                    <div className="font-bold">{member.name}</div>
                                                    <div className="text-[10px] text-gray-500">{member.phone}</div>
                                                </td>
                                                <td className="p-2">
                                                    {new Date(member.membership_expiry).toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold border ${daysLeft <= 7 ? 'bg-red-100 border-red-600 text-red-800' :
                                                        daysLeft <= 14 ? 'bg-yellow-100 border-yellow-600 text-yellow-800' :
                                                            'bg-green-100 border-green-600 text-green-800'
                                                        }`}>
                                                        {daysLeft} hari
                                                    </span>
                                                </td>
                                                <td className="p-2 font-bold">
                                                    {member.quota || 0}x
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => handleSendReminder(member)}
                                                        disabled={sendingTo === member.id}
                                                        className="flex items-center gap-1 bg-brand-orange text-black px-2 py-1 text-[10px] font-bold border border-black hover:bg-orange-400 disabled:opacity-50"
                                                    >
                                                        {sendingTo === member.id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Send size={12} />
                                                        )}
                                                        Kirim
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
