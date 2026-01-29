"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Customer } from "@/lib/constants";
import { NeoBadge } from "@/components/ui/neo-badge";
import { MemberModal } from "@/components/members/member-modal";
import { QRDisplay } from "@/components/members/qr-display";
import { AtRiskMembers } from "@/components/members/at-risk-members";
import { ExitSurveyStats } from "@/components/members/exit-survey-stats";
import { exportMembersToCSV } from "@/lib/utils/csv-export";
import { toast } from "sonner";
import { Download, QrCode, Users, AlertTriangle, ClipboardList, UserX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type MemberTab = 'list' | 'at-risk' | 'exit-survey';

export const MemberList = () => {
    const { customers } = useAppStore();
    const [activeTab, setActiveTab] = useState<MemberTab>('list');
    const [filterMemberOnly, setFilterMemberOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
    const [qrMember, setQrMember] = useState<Customer | null>(null);

    const filteredCustomers = customers.filter((customer) => {
        const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.includes(searchQuery);
        const matchesMember = filterMemberOnly ? customer.isMember : true;
        return matchesSearch && matchesMember;
    });

    const isFilteredEmpty = filteredCustomers.length === 0;
    const isDatabaseEmpty = customers.length === 0;

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCustomer(undefined);
        setIsModalOpen(true);
    };

    const handleExportCSV = () => {
        if (filteredCustomers.length === 0) {
            toast.warning('Tidak ada data pelanggan untuk di-export.');
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const suffix = filterMemberOnly ? '_MemberOnly' : '_Semua';
            const filename = `Daftar_Pelanggan${suffix}_${today}.csv`;

            exportMembersToCSV(filteredCustomers, filename, false);
            toast.success(`Berhasil export ${filteredCustomers.length} pelanggan!`);
        } catch (error) {
            console.error('Export CSV error:', error);
            toast.error('Gagal export CSV. Silakan coba lagi.');
        }
    };

    const tabs = [
        { id: 'list' as MemberTab, label: 'Daftar Member', icon: Users },
        { id: 'at-risk' as MemberTab, label: 'Member Berisiko', icon: AlertTriangle },
        { id: 'exit-survey' as MemberTab, label: 'Exit Survey', icon: ClipboardList },
    ];

    return (
        <div className="p-2 space-y-2">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 p-1 border-2 border-black">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold uppercase transition-all ${activeTab === tab.id
                            ? 'bg-black text-white shadow-neo-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-transparent hover:border-gray-300'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'list' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <h2 className="text-lg font-black uppercase">Database Pelanggan</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-1.5 bg-gray-100 text-black px-3 py-1 text-xs font-bold uppercase hover:bg-gray-200 border-2 border-black transition-all active:scale-95"
                            >
                                <Download size={14} />
                                Export CSV
                            </button>
                            <button
                                onClick={handleAdd}
                                className="bg-black text-white px-3 py-1 text-xs font-bold uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all shadow-neo"
                            >
                                + Tambah Pelanggan
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center bg-white p-2 border-2 border-black shadow-sm">
                        <input
                            type="text"
                            placeholder="Cari Nama / No HP..."
                            className="flex-1 outline-none font-bold uppercase placeholder:text-gray-400 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={filterMemberOnly}
                                onChange={(e) => setFilterMemberOnly(e.target.checked)}
                                className="w-4 h-4 accent-black"
                            />
                            <span className="font-bold text-[10px] uppercase">Member Only</span>
                        </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                        {isFilteredEmpty ? (
                            <div className="col-span-full py-12">
                                <EmptyState
                                    icon={UserX}
                                    title={isDatabaseEmpty ? "Belum Ada Member" : "Member Tidak Ditemukan"}
                                    description={isDatabaseEmpty
                                        ? "Mulai dengan menambahkan pelanggan atau member baru ke dalam sistem."
                                        : "Tidak ada member yang cocok dengan pencarian atau filter Anda."}
                                    action={
                                        isDatabaseEmpty ? (
                                            <button
                                                onClick={handleAdd}
                                                className="bg-brand-lime text-black px-4 py-2 font-black uppercase text-sm border-2 border-black shadow-neo hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                            >
                                                + Tambah Sekarang
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setSearchQuery(''); setFilterMemberOnly(false); }}
                                                className="bg-gray-200 text-black px-4 py-2 font-bold uppercase text-xs border-2 border-transparent hover:border-black transition-all"
                                            >
                                                Reset Filter
                                            </button>
                                        )
                                    }
                                />
                            </div>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    onClick={() => handleEdit(customer)}
                                    className="bg-white border-2 border-black p-3 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_black] transition-all cursor-pointer relative group flex flex-col justify-between h-full min-h-[120px]"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="pr-8">
                                            <h3 className="font-black text-lg uppercase leading-none truncate">{customer.name}</h3>
                                            <p className="text-xs font-bold text-gray-500 mt-1">{customer.phone}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 absolute top-0 right-0 p-2">
                                            {customer.isMember && (
                                                <NeoBadge status="MEMBER" className="scale-75 origin-top-right bg-purple-200 text-black border-purple-900 shadow-sm" />
                                            )}
                                            {customer.isMember && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setQrMember(customer);
                                                    }}
                                                    className="p-1.5 bg-brand-lime hover:bg-brand-lime/80 border-2 border-black transition-all shadow-sm hover:shadow-md z-10"
                                                    title="Tampilkan QR Code"
                                                >
                                                    <QrCode size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {customer.isMember && (
                                        <div className="mt-2 pt-2 border-t-2 border-dashed border-gray-200 space-y-1">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="font-bold text-gray-500 uppercase">Jatah Main</span>
                                                <span className="font-black bg-black text-white px-1 py-0.5 rounded-sm">
                                                    {customer.quota}x
                                                </span>
                                            </div>
                                            {customer.membershipExpiry && (() => {
                                                const expiryDate = new Date(customer.membershipExpiry);
                                                // Set 'now' to start of today to match typical date inputs logic
                                                const now = new Date();
                                                now.setHours(0, 0, 0, 0);
                                                const isExpired = expiryDate < now;

                                                return (
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-gray-500 uppercase">Berlaku s/d</span>
                                                        <span className={`font-bold uppercase ${isExpired ? 'text-red-500 underline' : 'text-green-600'}`}>
                                                            {customer.membershipExpiry}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] font-bold bg-gray-100 px-1 border border-black">EDIT</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {activeTab === 'at-risk' && <AtRiskMembers />}

            {activeTab === 'exit-survey' && <ExitSurveyStats />}

            <MemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={selectedCustomer}
            />

            {qrMember && (
                <QRDisplay
                    isOpen={!!qrMember}
                    onClose={() => setQrMember(null)}
                    member={qrMember}
                />
            )}
        </div>
    );
};
