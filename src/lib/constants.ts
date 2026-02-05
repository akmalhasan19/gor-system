export interface Court {
    id: string;
    venueId?: string;
    name: string;
    courtNumber?: number;
    isActive?: boolean;
    hourlyRate?: number;
    memberHourlyRate?: number;
    notes?: string;
}

export interface DepositPolicy {
    isEnabled: boolean;
    minDepositAmount: number;
    cancellationPolicy: 'strict' | 'flexible';
    refundRules: {
        hMinus1: number; // % refund
        hDay: number; // % refund
    };
}

export interface Booking {
    id: string;
    customerName: string;
    phone: string;
    startTime: string; // "HH:MM:SS"
    duration: number;
    courtId: string;
    status: 'LUNAS' | 'DP' | 'BELUM_BAYAR' | 'BELUM' | 'pending' | 'cancelled' | 'completed' | 'confirmed' | 'paid';
    price: number;
    paidAmount: number;
    bookingDate: string; // "YYYY-MM-DD"
    createdAt?: string; // ISO timestamp
    checkInTime?: string; // ISO timestamp
    isNoShow?: boolean;
    inCartSince?: string; // ISO timestamp - when added to cart (pauses timer)
}

// Operational hours 08:00 - 23:00
export const OPERATIONAL_HOURS = Array.from({ length: 16 }, (_, i) => i + 8);

export const COURTS: Court[] = [
    { id: "1", name: "LAPANGAN 1" },
    { id: "2", name: "LAPANGAN 2" },
    { id: "3", name: "LAPANGAN 3" },
];

export const INITIAL_BOOKINGS: Booking[] = [
    {
        id: '1',
        customerName: 'PAK BUDI',
        phone: '08123456789',
        startTime: "10:00:00",
        duration: 1,
        courtId: '1',
        status: 'LUNAS',
        price: 50000,
        paidAmount: 50000,
        bookingDate: "2026-01-26"
    },
    {
        id: '2',
        customerName: 'BU SITI',
        phone: '08129876543',
        startTime: "14:00:00",
        duration: 2,
        courtId: '2',
        status: 'BELUM_BAYAR',
        price: 100000,
        paidAmount: 0,
        bookingDate: "2026-01-26"
    },
];

export interface Product {
    id: string;
    name: string;
    price: number;
    category: 'DRINK' | 'FOOD' | 'EQUIPMENT' | 'RENTAL';
    stock: number;
    image_url?: string;
}

export const INITIAL_PRODUCTS: Product[] = [
    { id: '1', name: 'AQUA 600ML', price: 5000, category: 'DRINK', stock: 48 },
    { id: '2', name: 'MIZONE', price: 7000, category: 'DRINK', stock: 24 },
    { id: '3', name: 'SEWA RAKET', price: 15000, category: 'RENTAL', stock: 10 },
    { id: '4', name: 'SHUTTLECOCK (1 PCS)', price: 12000, category: 'EQUIPMENT', stock: 100 },
    { id: '5', name: 'SHUTTLECOCK (SLOP)', price: 110000, category: 'EQUIPMENT', stock: 10 },
];

export interface Customer {
    id: string;
    name: string;
    phone: string;
    isMember: boolean;
    membershipExpiry?: string; // ISO Date String
    quota?: number; // Jatah main left
    photo_url?: string; // URL to Supabase Storage
    isDeleted?: boolean;
    deletedAt?: string;
}

export const INITIAL_CUSTOMERS: Customer[] = [
    {
        id: '1',
        name: 'PAK BUDI',
        phone: '08123456789',
        isMember: true,
        membershipExpiry: '2026-12-31',
        quota: 4
    },
    {
        id: '2',
        name: 'BU SITI',
        phone: '08129876543',
        isMember: false
    }
];

export interface CartItem {
    id: string;
    type: 'PRODUCT' | 'BOOKING' | 'TIP';
    name: string;
    price: number;
    quantity: number;
    referenceId?: string; // bookingId or productId
}

export interface Transaction {
    id: string;
    date: string; // ISO String
    items: CartItem[];
    totalAmount: number;
    paidAmount: number;
    changeAmount: number;
    paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER';
    status: 'PAID' | 'PENDING' | 'PARTIAL' | 'UNPAID';
    cashierName: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
}
