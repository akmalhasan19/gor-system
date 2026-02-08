const { format } = require('date-fns');

// Mock data
const transactions = [
    { id: '1', date: '2024-01-01T10:00:00Z', status: 'PAID', totalAmount: 100000 },
    { id: '2', date: '2024-01-01T14:00:00Z', status: 'PAID', totalAmount: 50000 }, // Same day
    { id: '3', date: '2024-01-02T09:00:00Z', status: 'PENDING', totalAmount: 100000 }, // Pending
    { id: '4', date: '2024-01-03T11:00:00Z', status: 'PAID', totalAmount: 75000 }, // Different day
    { id: '5', date: '2024-01-03T15:00:00Z', status: 'PAID', totalAmount: 25000 }, // Same as day 3
];

function calculateActiveRevenueDays(txs) {
    const uniqueDays = new Set();

    txs.forEach(t => {
        if (t.status === 'PAID') {
            // Simulate date processing like in the component
            const dateStr = format(new Date(t.date), 'yyyy-MM-dd');
            uniqueDays.add(dateStr);
        }
    });

    return uniqueDays.size;
}

console.log('Testing Revenue Days Calculation...');

const result = calculateActiveRevenueDays(transactions);
console.log(`Expected: 2, Got: ${result}`);

if (result === 2) {
    console.log('SUCCESS: Logic looks correct.');
} else {
    console.error('FAILED: Logic incorrectly counts days.');
    process.exit(1);
}
