import Papa from 'papaparse';
import { Transaction, Booking, Customer } from '@/lib/constants';
import { Shift } from '@/lib/types/financial';

/**
 * Formats a transaction for CSV export by flattening nested structures
 */
function formatTransactionForCSV(transaction: Transaction) {
    // Flatten items array into a readable string
    const itemsString = transaction.items
        .map(item => `${item.quantity}x ${item.name}`)
        .join(', ');

    // Format date and time
    const date = new Date(transaction.date);
    const dateStr = date.toLocaleDateString('id-ID');
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return {
        'Transaction ID': transaction.id,
        'Date': dateStr,
        'Time': timeStr,
        'Cashier': transaction.cashierName,
        'Payment Method': transaction.paymentMethod,
        'Items': itemsString,
        'Total Amount': transaction.totalAmount,
        'Paid Amount': transaction.paidAmount,
        'Change': transaction.changeAmount,
        'Status': transaction.status,
    };
}

/**
 * Triggers a browser download for CSV content
 */
function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        // Create download link
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        URL.revokeObjectURL(url);
    }
}

/**
 * Exports transactions to CSV file
 * @param transactions - Array of transactions to export
 * @param filename - Optional custom filename (default: Transaksi_YYYY-MM-DD.csv)
 */
export function exportTransactionsToCSV(
    transactions: Transaction[],
    filename?: string
) {
    // Generate default filename if not provided
    if (!filename) {
        const today = new Date().toISOString().split('T')[0];
        filename = `Transaksi_${today}.csv`;
    }

    // Convert transactions to CSV format
    const formattedData = transactions.map(formatTransactionForCSV);

    // Generate CSV string using papaparse
    const csv = Papa.unparse(formattedData, {
        quotes: true, // Quote all fields to handle commas in item names
        quoteChar: '"',
        delimiter: ',',
        header: true,
        newline: '\r\n',
    });

    // Trigger download
    downloadCSV(csv, filename);
}

/**
 * Formats a shift for CSV export
 */
function formatShiftForCSV(shift: Shift) {
    const startDate = new Date(shift.start_time);
    const endDate = shift.end_time ? new Date(shift.end_time) : null;

    const startCash = shift.start_cash || 0;
    const endCash = shift.end_cash || 0;
    const expected = shift.expected_cash || 0;
    const discrepancy = endCash - expected;

    return {
        'Shift ID': shift.id.slice(0, 8),
        'Tanggal': startDate.toLocaleDateString('id-ID'),
        'Waktu Mulai': startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        'Waktu Selesai': endDate ? endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        'Kas Awal': startCash,
        'Kas Akhir': endCash,
        'Kas Diharapkan': expected,
        'Selisih': discrepancy,
        'Status Selisih': Math.abs(discrepancy) < 1 ? 'Seimbang' : (discrepancy > 0 ? 'Lebih' : 'Kurang'),
        'Catatan': shift.notes || '-',
        'Status': shift.status === 'closed' ? 'Tutup' : 'Buka',
    };
}

/**
 * Exports shift history to CSV file
 * @param shifts - Array of shifts to export
 * @param filename - Optional custom filename
 */
export function exportShiftHistoryToCSV(
    shifts: Shift[],
    filename?: string
) {
    if (!filename) {
        const today = new Date().toISOString().split('T')[0];
        filename = `Riwayat_Shift_${today}.csv`;
    }

    const formattedData = shifts.map(formatShiftForCSV);

    const csv = Papa.unparse(formattedData, {
        quotes: true,
        quoteChar: '"',
        delimiter: ',',
        header: true,
        newline: '\r\n',
    });

    downloadCSV(csv, filename);
}

/**
 * Formats a booking for CSV export
 */
function formatBookingForCSV(booking: Booking) {
    const statusLabels: Record<string, string> = {
        'LUNAS': 'Lunas',
        'DP': 'DP',
        'BELUM_BAYAR': 'Belum Bayar',
        'BELUM': 'Belum Bayar',
        'pending': 'Pending',
        'cancelled': 'Dibatalkan',
    };

    return {
        'Booking ID': booking.id.slice(0, 8),
        'Tanggal': booking.bookingDate,
        'Lapangan': `Lapangan ${booking.courtId}`,
        'Nama Pelanggan': booking.customerName,
        'No. Telepon': booking.phone,
        'Waktu Mulai': booking.startTime,
        'Durasi (Jam)': booking.duration,
        'Harga': booking.price,
        'Jumlah Dibayar': booking.paidAmount,
        'Sisa Bayar': booking.price - booking.paidAmount,
        'Status': statusLabels[booking.status] || booking.status,
        'Check-In': booking.checkInTime ? new Date(booking.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        'No Show': booking.isNoShow ? 'Ya' : 'Tidak',
    };
}

/**
 * Exports bookings to CSV file with optional status filter
 * @param bookings - Array of bookings to export
 * @param filename - Optional custom filename
 * @param statusFilter - Optional array of statuses to include
 */
export function exportBookingsToCSV(
    bookings: Booking[],
    filename?: string,
    statusFilter?: string[]
) {
    let filteredBookings = bookings;

    if (statusFilter && statusFilter.length > 0) {
        filteredBookings = bookings.filter(b => statusFilter.includes(b.status));
    }

    if (!filename) {
        const today = new Date().toISOString().split('T')[0];
        filename = `Riwayat_Booking_${today}.csv`;
    }

    const formattedData = filteredBookings.map(formatBookingForCSV);

    const csv = Papa.unparse(formattedData, {
        quotes: true,
        quoteChar: '"',
        delimiter: ',',
        header: true,
        newline: '\r\n',
    });

    downloadCSV(csv, filename);
}

/**
 * Formats a member/customer for CSV export
 */
function formatMemberForCSV(customer: Customer) {
    let daysUntilExpiry: number | string = '-';

    if (customer.isMember && customer.membershipExpiry) {
        const expiryDate = new Date(customer.membershipExpiry);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiryDate.setHours(0, 0, 0, 0);

        const diffTime = expiryDate.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
        'ID': customer.id.slice(0, 8),
        'Nama': customer.name,
        'No. Telepon': customer.phone,
        'Status Member': customer.isMember ? 'Member' : 'Non-Member',
        'Sisa Quota': customer.isMember ? (customer.quota ?? 0) : '-',
        'Tanggal Kadaluarsa': customer.membershipExpiry || '-',
        'Hari Menuju Kadaluarsa': daysUntilExpiry,
        'Status Kadaluarsa': customer.isMember && customer.membershipExpiry
            ? (typeof daysUntilExpiry === 'number' && daysUntilExpiry < 0 ? 'Expired' : (typeof daysUntilExpiry === 'number' && daysUntilExpiry <= 7 ? 'Segera Expired' : 'Aktif'))
            : '-',
    };
}

/**
 * Exports members/customers to CSV file
 * @param customers - Array of customers to export
 * @param filename - Optional custom filename
 * @param membersOnly - If true, only export members
 */
export function exportMembersToCSV(
    customers: Customer[],
    filename?: string,
    membersOnly: boolean = false
) {
    let filteredCustomers = customers;

    if (membersOnly) {
        filteredCustomers = customers.filter(c => c.isMember);
    }

    if (!filename) {
        const today = new Date().toISOString().split('T')[0];
        filename = `Daftar_Member_${today}.csv`;
    }

    const formattedData = filteredCustomers.map(formatMemberForCSV);

    const csv = Papa.unparse(formattedData, {
        quotes: true,
        quoteChar: '"',
        delimiter: ',',
        header: true,
        newline: '\r\n',
    });

    downloadCSV(csv, filename);
}

