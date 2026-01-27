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
