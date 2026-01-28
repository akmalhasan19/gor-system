"use client";

import React, { useState, useEffect } from "react";
import { useVenue } from "@/lib/venue-context";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
    getMaintenanceHistory,
    cancelMaintenanceTask,
    updateMaintenanceTask,
    MAINTENANCE_TYPES,
    MaintenanceTask,
} from "@/lib/api/maintenance";
import { MaintenanceModal } from "@/components/maintenance/maintenance-modal";
import {
    Wrench,
    RefreshCw,
    Plus,
    Trash2,
    CheckCircle,
    Clock,
    XCircle,
} from "lucide-react";

export function MaintenanceSettings() {
    const { currentVenueId } = useVenue();
    const { courts } = useAppStore();

    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchTasks = async () => {
        if (!currentVenueId) return;

        setIsLoading(true);
        try {
            const data = await getMaintenanceHistory(currentVenueId, 100);
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch maintenance history:", error);
            toast.error("Gagal memuat riwayat maintenance");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [currentVenueId]);

    const getCourtName = (courtId: string) => {
        return courts.find((c) => c.id === courtId)?.name || "Lapangan";
    };

    const getTypeName = (typeId: string) => {
        return MAINTENANCE_TYPES.find((t) => t.id === typeId)?.label || typeId;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "scheduled":
                return (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase px-2 py-0.5 border border-blue-300">
                        <Clock size={10} /> Terjadwal
                    </span>
                );
            case "in_progress":
                return (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase px-2 py-0.5 border border-yellow-300">
                        <Wrench size={10} /> Berlangsung
                    </span>
                );
            case "completed":
                return (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold uppercase px-2 py-0.5 border border-green-300">
                        <CheckCircle size={10} /> Selesai
                    </span>
                );
            case "cancelled":
                return (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase px-2 py-0.5 border border-gray-300">
                        <XCircle size={10} /> Dibatalkan
                    </span>
                );
            default:
                return null;
        }
    };

    const handleCancel = async (taskId: string) => {
        if (!confirm("Yakin ingin membatalkan jadwal maintenance ini?")) return;

        try {
            await cancelMaintenanceTask(taskId);
            toast.success("Jadwal maintenance dibatalkan");
            fetchTasks();
        } catch (error: any) {
            console.error("Failed to cancel task:", error);
            toast.error("Gagal membatalkan: " + (error.message || "Terjadi kesalahan"));
        }
    };

    const handleComplete = async (taskId: string) => {
        try {
            await updateMaintenanceTask(taskId, { status: "completed" });
            toast.success("Maintenance ditandai selesai");
            fetchTasks();
        } catch (error: any) {
            console.error("Failed to complete task:", error);
            toast.error("Gagal update: " + (error.message || "Terjadi kesalahan"));
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-800 p-2 rounded-full border-2 border-black">
                        <Wrench size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase">Maintenance Lapangan</h3>
                        <p className="text-xs text-gray-500 font-bold">
                            Jadwalkan perawatan rutin untuk mencegah kerusakan
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchTasks}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-black disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 bg-gray-800 text-white px-3 py-1.5 border-2 border-black font-bold text-xs uppercase shadow-neo-sm hover:bg-black transition-colors active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                    >
                        <Plus size={14} />
                        Tambah Jadwal
                    </button>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-white border-2 border-black shadow-neo">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <span className="text-sm font-bold text-gray-500">Memuat...</span>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="p-8 text-center">
                        <Wrench className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="font-bold text-gray-500">Belum ada jadwal maintenance</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-3 text-sm font-bold text-blue-600 hover:underline"
                        >
                            + Tambah jadwal pertama
                        </button>
                    </div>
                ) : (
                    <div className="divide-y-2 divide-black">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={`p-3 flex items-center gap-3 ${task.status === "cancelled" ? "opacity-50" : ""
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-sm">
                                            {getCourtName(task.courtId)}
                                        </span>
                                        <span className="text-xs font-bold text-gray-500">
                                            {new Date(task.taskDate).toLocaleDateString("id-ID", {
                                                weekday: "short",
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                        <span className="text-xs font-bold text-gray-500">
                                            {task.startHour.toString().padStart(2, "0")}:00 -{" "}
                                            {(task.startHour + task.durationHours)
                                                .toString()
                                                .padStart(2, "0")}
                                            :00
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-gray-600">
                                            {getTypeName(task.maintenanceType)}
                                        </span>
                                        {task.technicianName && (
                                            <span className="text-xs text-gray-400">
                                                • {task.technicianName}
                                            </span>
                                        )}
                                    </div>
                                    {task.notes && (
                                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                                            {task.notes}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(task.status)}
                                    {task.status === "scheduled" && (
                                        <>
                                            <button
                                                onClick={() => handleComplete(task.id)}
                                                className="p-1.5 bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 transition-colors"
                                                title="Tandai Selesai"
                                            >
                                                <CheckCircle size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleCancel(task.id)}
                                                className="p-1.5 bg-red-100 text-red-600 border border-red-300 hover:bg-red-200 transition-colors"
                                                title="Batalkan"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <MaintenanceModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSaved={fetchTasks}
            />
        </div>
    );
}
