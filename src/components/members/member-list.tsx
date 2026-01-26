"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Customer } from "@/lib/constants";
import { NeoBadge } from "@/components/ui/neo-badge";
import { MemberModal } from "@/components/members/member-modal";

export const MemberList = () => {
    const { customers } = useAppStore();
    const [filterMemberOnly, setFilterMemberOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);

    const filteredCustomers = customers.filter((customer) => {
        const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.includes(searchQuery);
        const matchesMember = filterMemberOnly ? customer.isMember : true;
        return matchesSearch && matchesMember;
    });

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCustomer(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="p-2 space-y-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <h2 className="text-lg font-black uppercase">Database Pelanggan</h2>
                <button
                    onClick={handleAdd}
                    className="bg-black text-white px-3 py-1 text-xs font-bold uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all shadow-neo"
                >
                    + Tambah Pelanggan
                </button>
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

            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {filteredCustomers.map((customer) => (
                    <div
                        key={customer.id}
                        onClick={() => handleEdit(customer)}
                        className="bg-white border-2 border-black p-3 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_black] transition-all cursor-pointer relative group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h3 className="font-black text-sm uppercase leading-none">{customer.name}</h3>
                                <p className="text-[10px] font-bold text-gray-500 mt-0.5">{customer.phone}</p>
                            </div>
                            {customer.isMember && (
                                <NeoBadge status="MEMBER" className="scale-75 origin-top-right bg-purple-200 text-black border-purple-900" />
                            )}
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
                ))}
            </div>

            <MemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={selectedCustomer}
            />
        </div>
    );
};
