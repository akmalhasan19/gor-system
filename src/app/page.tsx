"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Plus,
  CalendarDays,
  LayoutDashboard,
  ShoppingCart,
  Menu,
  Users,
  Receipt,
  Share2,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { NeoButton } from "@/components/ui/neo-button";
import { Scheduler } from "@/components/scheduler";
import { BookingModal } from "@/components/booking-modal";
import { COURTS, Booking } from "@/lib/constants";
import { useAppStore } from "@/lib/store";
import { ProductList } from "@/components/pos/product-list";
import { CartSidebar } from "@/components/pos/cart-sidebar";
// import { DailyReport } from "@/components/reports/daily-report";
import { MemberList } from "@/components/members/member-list";
import { Receipt as ReceiptComponent } from "@/components/pos/receipt";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { ReportsView } from "@/components/dashboard/reports-view";
import { StockModal } from "@/components/pos/stock-modal";
import { PackagePlus } from "lucide-react";
import { useRealtimeSubscription } from "@/lib/hooks/use-realtime-subscription";

export default function Home() {
  // Enable realtime subscriptions
  useRealtimeSubscription();

  const [activeTab, setActiveTab] = useState<"dashboard" | "scheduler" | "pos" | "reports" | "members">("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { bookings, addBooking, transactions, cart } = useAppStore();

  const [bookingInitialData, setBookingInitialData] = useState<{ courtId: string; time: number } | null>(null);

  const handleSaveBooking = async (newBooking: Omit<Booking, "id">) => {
    try {
      await addBooking(newBooking);
      alert('Booking berhasil disimpan!');
    } catch (error) {
      console.error('Failed to save booking:', error);
      alert('Gagal menyimpan booking. Silakan coba lagi.');
    }
  };

  const handleCopyPublicLink = () => {
    const link = `${window.location.origin}/public/schedule`;
    navigator.clipboard.writeText(link);
    alert('Link Jadwal Publik berhasil disalin! Kirim link ini ke pelanggan Anda.');
  };

  const handleSlotClick = (courtId: string, hour: number) => {
    setBookingInitialData({ courtId, time: hour });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBookingInitialData(null);
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
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { id: 'scheduler', icon: CalendarDays, label: 'Jadwal' },
                    { id: 'pos', icon: ShoppingCart, label: 'Kantin/POS' },
                    { id: 'members', icon: Users, label: 'Member' },
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

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={async () => {
                      await signOut();
                      window.location.href = '/login';
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 font-bold text-sm uppercase text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut size={18} />
                    Keluar
                  </button>
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
              <h1 className="text-lg font-black uppercase italic">Jadwal Lapangan</h1>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyPublicLink}
                  className="flex items-center gap-2 bg-white text-black border-2 border-black px-3 py-2 text-xs font-bold uppercase hover:bg-gray-100 shadow-neo-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <Share2 size={16} strokeWidth={2.5} />
                  Public Link
                </button>
                <NeoButton onClick={() => setIsModalOpen(true)} className="px-3 py-2 text-xs">
                  <Plus size={16} strokeWidth={3} className="mr-2" /> Input Booking
                </NeoButton>
              </div>
            </div>
            <Scheduler
              bookings={bookings}
              courts={COURTS}
              onSlotClick={handleSlotClick}
            />
          </div>
        )}

        {activeTab === "pos" && (
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
            <div className={`flex-1 overflow-y-auto bg-gray-50 border-r-0 md:border-r-2 border-gray-200 transition-all duration-300 ${isCartOpen ? 'md:blur-[1px] md:pointer-events-none md:select-none' : ''}`}>
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-black uppercase italic">Kantin & Shop</h1>
                  <button
                    onClick={() => setIsStockModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold uppercase bg-white border-2 border-black px-2 py-1 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                  >
                    <PackagePlus size={14} />
                    Tambah Stok
                  </button>
                </div>
                <ProductList />
              </div>
            </div>

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


        {/* Global Floating Cart Button */}
        {(!isCartOpen || activeTab !== 'pos') && (
          <button
            onClick={() => {
              if (activeTab !== 'pos') {
                setActiveTab('pos');
              }
              setIsCartOpen(true);
            }}
            className="fixed bottom-6 right-6 z-50 bg-black text-white p-4 shadow-neo hover:scale-110 transition-transform border-2 border-white"
          >
            <ShoppingCart size={24} />
            {/* Badge */}
            {cart.length > 0 && (
              <div className="absolute -top-2 -right-2 bg-brand-orange text-black text-xs font-black px-2 py-0.5 border-2 border-black animate-bounce">
                {cart.length}
              </div>
            )}
          </button>
        )}


        {activeTab === "dashboard" && (
          <div className="flex-1 p-4 overflow-y-auto">
            <h1 className="text-2xl font-black uppercase italic mb-4">Dashboard</h1>
            <DashboardView />
          </div>
        )}

        {activeTab === "reports" && <ReportsView />}

        {activeTab === "members" && (
          <div className="flex-1 p-0 overflow-y-auto">
            <MemberList />
          </div>
        )}

      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveBooking}
        initialData={bookingInitialData}
      />

      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />
    </div>
  );
}
