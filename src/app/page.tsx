"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Plus,
  CalendarDays,
  LayoutDashboard,
  ShoppingCart,
  Menu,
  Receipt,
} from "lucide-react";
import { NeoButton } from "@/components/ui/neo-button";
import { Scheduler } from "@/components/scheduler";
import { BookingModal } from "@/components/booking-modal";
import { COURTS, Booking } from "@/lib/constants";
import { useAppStore } from "@/lib/store";
import { ProductList } from "@/components/pos/product-list";
import { CartSidebar } from "@/components/pos/cart-sidebar";
import { DailyReport } from "@/components/reports/daily-report";
import { Receipt as ReceiptComponent } from "@/components/pos/receipt";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "scheduler" | "pos" | "reports">("scheduler");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { bookings, addBooking, transactions } = useAppStore();

  const handleSaveBooking = (newBooking: Omit<Booking, "id">) => {
    const booking: Booking = {
      ...newBooking,
      id: Math.random().toString(36).substr(2, 9),
    };
    addBooking(booking);
  };

  // Latest Transaction for printing
  const latestTransaction = transactions.length > 0 ? transactions[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Print Component (Hidden) */}
      <ReceiptComponent transaction={latestTransaction} />

      {/* Top Navbar */}
      <nav className="bg-brand-lime border-b-2 border-black p-2 sticky top-0 z-30 shadow-md">
        <div className="w-full flex justify-between items-center px-2 relative">
          {/* Logo Section */}
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
              <Image
                src="/smash-logo.svg"
                alt="Smash Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain brightness-0"
              />
            </div>
            <span className="text-xl font-black tracking-tight italic">Smash<span className="text-pastel-lilac">.</span></span>
          </div>

          {/* Menu Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`bg-white p-1.5 border-2 border-black shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all ${isMenuOpen ? 'bg-black text-white' : ''}`}
            >
              <Menu className="w-6 h-6" strokeWidth={2.5} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-black shadow-neo-lg z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                <div className="flex flex-col p-1">
                  {[
                    { id: 'scheduler', icon: CalendarDays, label: 'Jadwal' },
                    { id: 'pos', icon: ShoppingCart, label: 'Kantin/POS' },
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { id: 'reports', icon: Receipt, label: 'Laporan' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 font-bold text-sm uppercase hover:bg-brand-lime hover:text-black transition-colors text-left border-b border-gray-100 last:border-0 ${activeTab === tab.id ? "bg-black text-white hover:bg-gray-800 hover:text-white" : "text-gray-700"
                        }`}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">

        {activeTab === "scheduler" && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-4 flex justify-between items-center">
              <h1 className="text-2xl font-black uppercase italic">Jadwal Lapangan</h1>
              <NeoButton onClick={() => setIsModalOpen(true)}>
                <Plus size={20} strokeWidth={3} className="mr-2" /> Input Booking
              </NeoButton>
            </div>
            <Scheduler bookings={bookings} courts={COURTS} />
          </div>
        )}

        {activeTab === "pos" && (
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
            <div className={`flex-1 overflow-y-auto bg-gray-50 border-r-0 md:border-r-2 border-gray-200 transition-all duration-300 ${isCartOpen ? 'md:blur-[1px] md:pointer-events-none md:select-none' : ''}`}>
              <div className="p-4">
                <h1 className="text-2xl font-black uppercase italic mb-4">Kantin & Shop</h1>
                <ProductList />
              </div>
            </div>

            {/* Floating Open Button (visible when closed) */}
            {!isCartOpen && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="absolute bottom-6 right-6 z-30 bg-black text-white p-4 shadow-neo hover:scale-110 transition-transform border-2 border-white"
              >
                <ShoppingCart size={24} />
                {/* Badge */}
                <div className="absolute -top-2 -right-2 bg-brand-orange text-black text-xs font-black px-2 py-0.5 border-2 border-black">
                  {useAppStore.getState().cart.length}
                </div>
              </button>
            )}

            {/* Click-outside overlay for Desktop */}
            {isCartOpen && (
              <div
                className="hidden md:block absolute inset-0 z-30 bg-transparent cursor-pointer"
                onClick={() => setIsCartOpen(false)}
              />
            )}

            {/* Sidebar: Overlay mode */}
            <div className={`absolute z-40 bg-white border-black transition-transform duration-300 ease-in-out shadow-2xl
                ${isCartOpen
                ? "translate-y-0 translate-x-0"
                : "translate-y-full md:translate-y-0 md:translate-x-full"
              }
                bottom-0 left-0 w-full h-[40vh] border-t-2
                md:top-0 md:left-auto md:right-0 md:w-[300px] md:h-full md:border-t-0 md:border-l-2
            `}>
              <CartSidebar onClose={() => setIsCartOpen(false)} />
            </div>
          </div>
        )}


        {activeTab === "dashboard" && (
          <div className="flex-1 p-4 overflow-y-auto">
            <h1 className="text-2xl font-black uppercase italic mb-4">Dashboard</h1>
            <DashboardView />
          </div>
        )}

        {activeTab === "reports" && (
          <div className="flex-1 p-4 overflow-y-auto">
            <h1 className="text-2xl font-black uppercase italic mb-4">Laporan Harian</h1>
            <DailyReport />
          </div>
        )}

      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBooking}
      />
    </div>
  );
}
