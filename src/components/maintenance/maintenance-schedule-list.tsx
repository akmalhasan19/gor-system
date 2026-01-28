"use client";

import React, { useState, useEffect } from "react";
import { useVenue } from "@/lib/venue-context";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
    getMaintenanceSchedules,
    deleteMaintenanceSchedule,
    completeScheduleTask,
    MaintenanceSchedule,
} from "@/lib/api/maintenance";
import {
    CalendarClock,
    Edit2,
    Trash2,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Plus,
} from "lucide-react";
import { MaintenanceScheduleForm } from "./maintenance-schedule-form";

export function MaintenanceScheduleList() {
    const { currentVenueId } = useVenue();
    const { courts } = useAppStore();
    const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | undefined>(undefined);
    const [showForm, setShowForm] = useState(false);

    const fetchSchedules = async () => {
        if (!currentVenueId) return;
        setIsLoading(true);
        try {
            const data = await getMaintenanceSchedules(currentVenueId);
            setSchedules(data);
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
            toast.error("Gagal memuat jadwal rutin");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [currentVenueId]);

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus jadwal rutin ini?")) return;
        try {
            await deleteMaintenanceSchedule(id);
            toast.success("Jadwal dihapus");
            fetchSchedules();
        } catch (error) {
            toast.error("Gagal menghapus jadwal");
        }
    };

    const handleComplete = async (schedule: MaintenanceSchedule) => {
        if (!confirm(`Konfirmasi pelaksanaan tugas: ${schedule.title}?`)) return;

        const loadingToast = toast.loading("Memproses...");
        try {
            const today = new Date().toISOString().split('T')[0];
            await completeScheduleTask(schedule, today);
            toast.dismiss(loadingToast);
            toast.success("Maintenance tercatat & jadwal diperbarui!");
            fetchSchedules();
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Gagal update jadwal");
        }
    };

    const getCourtName = (courtId: string) => {
        return courts.find((c) => c.id === courtId)?.name || "Unknown Court";
    };

    const isOverdue = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr < today;
    };

    const isDueSoon = (dateStr: string) => {
        const today = new Date();
        const due = new Date(dateStr);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-400 p-2 rounded-full border-2 border-black">
                        <CalendarClock size={20} className="text-black" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase">Jadwal Rutin</h3>
                        <p className="text-xs text-gray-500 font-bold">
                            Otomatisasi pengingat perawatan berkala
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingSchedule(undefined);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-1.5 bg-yellow-400 text-black px-3 py-1.5 border-2 border-black font-bold text-xs uppercase shadow-neo-sm hover:bg-yellow-500 transition-colors active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                >
                    <Plus size={14} />
                    Buat Jadwal
                </button>
            </div>

            <div className="bg-white border-2 border-black shadow-neo">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Memuat jadwal...</p>
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="font-bold">Belum ada jadwal rutin</p>
                        <p className="text-xs mt-1">Buat jadwal untuk perawatan berkala (cth: Poles lantai tiap bulan)</p>
                    </div>
                ) : (
                    <div className="divide-y-2 divide-black">
                        {schedules.map((schedule) => {
                            const overdue = isOverdue(schedule.nextDueDate);
                            const dueSoon = isDueSoon(schedule.nextDueDate);

                            return (
                                <div key={schedule.id} className={`p-4 flex items-center gap-4 ${overdue ? 'bg-red-50' : ''}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-black text-sm uppercase">{schedule.title}</span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 border border-gray-400 rounded text-gray-600">
                                                {getCourtName(schedule.courtId)}
                                            </span>
                                            {overdue && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 border border-red-300 rounded animate-pulse">
                                                    <AlertTriangle size={10} /> TERLAMBAT
                                                </span>
                                            )}
                                            {dueSoon && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded">
                                                    <Clock size={10} /> SEGERA
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-600 font-medium">
                                            <span>Frekuensi: {schedule.frequencyDays} hari</span>
                                            <span>Jatuh Tempo: <strong>{new Date(schedule.nextDueDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong></span>
                                        </div>
                                        {schedule.lastPerformedAt && (
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Terakhir dilakukan: {new Date(schedule.lastPerformedAt).toLocaleDateString('id-ID')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleComplete(schedule)}
                                            className="group flex flex-col items-center justify-center p-2 rounded hover:bg-green-50 transition-colors text-green-600"
                                            title="Kerjakan & Update Jadwal"
                                        >
                                            <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-[9px] font-bold uppercase mt-0.5">Kerjakan</span>
                                        </button>
                                        <div className="w-px h-8 bg-gray-300 mx-1"></div>
                                        <button
                                            onClick={() => {
                                                setEditingSchedule(schedule);
                                                setShowForm(true);
                                            }}
                                            className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(schedule.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showForm && (
                <MaintenanceScheduleForm
                    onClose={() => {
                        setShowForm(false);
                        setEditingSchedule(undefined);
                    }}
                    onSaved={fetchSchedules}
                    initialData={editingSchedule}
                />
            )}
        </div>
    );
}

function Clock({ size, className }: { size: number; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
