"use client";

import React, { useState, useEffect } from "react";
import { useVenue } from "@/lib/venue-context";
import {
    getExitSurveyStats,
    getExitSurveyResponses,
    ExitSurveyStats as ExitSurveyStatsData,
    ExitSurveyResponse,
    EXIT_SURVEY_REASONS,
} from "@/lib/api/exit-survey";
import { toast } from "sonner";
import {
    ClipboardList,
    RefreshCw,
    TrendingDown,
    MessageSquare,
    PieChart as PieChartIcon,
    Users,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

// Neo-brutalist colors for pie chart
const CHART_COLORS = [
    "#F87171", // red
    "#FBBF24", // yellow
    "#34D399", // green
    "#60A5FA", // blue
    "#A78BFA", // purple
    "#F472B6", // pink
    "#FB923C", // orange
    "#2DD4BF", // teal
    "#818CF8", // indigo
    "#94A3B8", // gray
];

export function ExitSurveyStats() {
    const { currentVenueId } = useVenue();
    const [stats, setStats] = useState<ExitSurveyStatsData | null>(null);
    const [responses, setResponses] = useState<ExitSurveyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        if (!currentVenueId) return;

        setIsLoading(true);
        try {
            const [statsData, responsesData] = await Promise.all([
                getExitSurveyStats(currentVenueId),
                getExitSurveyResponses(currentVenueId, 20),
            ]);
            setStats(statsData);
            setResponses(responsesData.data || []);
        } catch (error) {
            console.error("Failed to fetch exit survey data:", error);
            toast.error("Gagal memuat data exit survey");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentVenueId]);

    // Map reason IDs to labels
    const getReasonLabel = (reasonId: string) => {
        const found = EXIT_SURVEY_REASONS.find((r) => r.id === reasonId);
        return found?.label || reasonId;
    };

    // Prepare chart data
    const chartData =
        stats?.reasonBreakdown.slice(0, 6).map((item) => ({
            name: getReasonLabel(item.reason),
            value: item.count,
            percentage: item.percentage,
        })) || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="bg-white border-2 border-black p-4 shadow-neo flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-bold uppercase text-sm">Memuat data...</span>
                </div>
            </div>
        );
    }

    if (!stats || stats.totalResponses === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-gray-200 border-[3px] border-black shadow-neo flex items-center justify-center mb-4 -rotate-3">
                    <ClipboardList className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black uppercase mb-2">Belum Ada Respons 📋</h3>
                <p className="text-gray-600 max-w-md font-medium">
                    Belum ada member yang mengisi exit survey. Data akan muncul setelah member yang tidak renew mengisi survey.
                </p>
                <button
                    onClick={fetchData}
                    className="mt-4 flex items-center gap-2 bg-white border-2 border-black px-4 py-2 font-bold text-sm uppercase shadow-neo-sm hover:bg-black hover:text-white transition-colors active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-500 border-[3px] border-black p-4 shadow-neo transform hover:-rotate-1 transition-transform">
                    <div className="text-3xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        {stats.totalResponses}
                    </div>
                    <div className="text-[10px] font-black text-white uppercase tracking-wide">
                        Total Respons
                    </div>
                </div>
                <div className="bg-orange-400 border-[3px] border-black p-4 shadow-neo transform hover:rotate-1 transition-transform">
                    <div className="text-3xl font-black text-black">
                        {stats.averageReasonsPerResponse}
                    </div>
                    <div className="text-[10px] font-black text-black uppercase tracking-wide">
                        Rata-rata Alasan
                    </div>
                </div>
                <div className="bg-blue-500 border-[3px] border-black p-4 shadow-neo transform hover:-rotate-1 transition-transform">
                    <div className="text-3xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        {stats.reasonBreakdown.length}
                    </div>
                    <div className="text-[10px] font-black text-white uppercase tracking-wide">
                        Jenis Alasan
                    </div>
                </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600 hover:text-black disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Chart and Top Reasons */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Pie Chart */}
                <div className="bg-white border-[3px] border-black shadow-neo p-4">
                    <h3 className="font-black uppercase text-sm mb-4 flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4" />
                        Distribusi Alasan
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="#000"
                                    strokeWidth={2}
                                >
                                    {chartData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [
                                        `${value} respons`
                                    ]}
                                    contentStyle={{
                                        border: "2px solid black",
                                        borderRadius: 0,
                                        fontWeight: "bold",
                                    }}
                                />
                                <Legend
                                    formatter={(value) => (
                                        <span className="text-xs font-bold">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Reasons List */}
                <div className="bg-white border-[3px] border-black shadow-neo p-4">
                    <h3 className="font-black uppercase text-sm mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Alasan Terbanyak
                    </h3>
                    <div className="space-y-2">
                        {stats.reasonBreakdown.slice(0, 5).map((item, index) => (
                            <div
                                key={item.reason}
                                className="flex items-center gap-3 p-2 bg-gray-50 border-2 border-black"
                            >
                                <div
                                    className="w-8 h-8 flex items-center justify-center font-black text-white text-sm border-2 border-black"
                                    style={{
                                        backgroundColor:
                                            CHART_COLORS[index % CHART_COLORS.length],
                                    }}
                                >
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold truncate">
                                        {getReasonLabel(item.reason)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {item.count} respons ({item.percentage}%)
                                    </div>
                                </div>
                                <div className="w-20 bg-gray-200 h-2 border border-black">
                                    <div
                                        className="h-full bg-black"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Responses */}
            <div className="bg-white border-[3px] border-black shadow-neo p-4">
                <h3 className="font-black uppercase text-sm mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Respons Terbaru
                </h3>
                {responses.length === 0 ? (
                    <p className="text-gray-500 text-sm font-medium text-center py-4">
                        Belum ada respons
                    </p>
                ) : (
                    <div className="space-y-3">
                        {responses.slice(0, 5).map((response) => (
                            <div
                                key={response.id}
                                className="p-3 bg-gray-50 border-2 border-black"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span className="font-bold text-sm">
                                            {response.customer?.name || "Member"}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                        {response.completed_at
                                            ? new Date(response.completed_at).toLocaleDateString(
                                                "id-ID",
                                                {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                }
                                            )
                                            : "-"}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {response.reasons.map((reason) => (
                                        <span
                                            key={reason}
                                            className="text-[10px] font-bold uppercase bg-gray-900 text-white px-2 py-0.5 border border-black"
                                        >
                                            {getReasonLabel(reason)}
                                        </span>
                                    ))}
                                </div>
                                {response.other_reason && (
                                    <p className="text-xs text-gray-600 italic">
                                        "{response.other_reason}"
                                    </p>
                                )}
                                {response.feedback && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        💬 {response.feedback}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
