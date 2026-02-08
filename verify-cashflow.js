const { format, subDays } = require('date-fns');

// Mock data
const today = new Date();
const currentMonthStr = format(today, 'yyyy-MM');

const transactions = [
    // 1. Full Payment Today
    { id: '1', date: format(today, 'yyyy-MM-dd') + 'T10:00:00Z', status: 'PAID', totalAmount: 100000, paidAmount: 100000 },
    // 2. DP Payment Today (Status not PAID yet, maybe 'PENDING' or 'DP' if that existed, but let's say status is 'PENDING' but paidAmount > 0)
    { id: '2', date: format(today, 'yyyy-MM-dd') + 'T12:00:00Z', status: 'PENDING', totalAmount: 200000, paidAmount: 50000 },
    // 3. Unpaid Transaction Today
    { id: '3', date: format(today, 'yyyy-MM-dd') + 'T14:00:00Z', status: 'UNPAID', totalAmount: 150000, paidAmount: 0 },
    // 4. Past Month Transaction (Should be ignored)
    { id: '4', date: format(subDays(today, 40), 'yyyy-MM-dd') + 'T09:00:00Z', status: 'PAID', totalAmount: 300000, paidAmount: 300000 },
];

function calculateCashFlowRevenue(txs) {
    return txs
        .filter(t => {
            const tDate = new Date(t.date);
            // Filter by current month
            return format(tDate, 'yyyy-MM') === currentMonthStr;
        })
        .reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
}

console.log('Testing Cash Flow Revenue Calculation...');

const revenue = calculateCashFlowRevenue(transactions);
// Expected: 100,000 (Full) + 50,000 (DP) = 150,000
// Ignored: 200,000 (Total of DP), 150,000 (Unpaid), 300,000 (Past)

const expectedRevenue = 150000;

console.log(`Revenue Expected: ${expectedRevenue}, Got: ${revenue}`);

if (revenue === expectedRevenue) {
    console.log('SUCCESS: Cash Flow Revenue logic is correct.');
} else {
    console.error('FAILED: Cash Flow Revenue logic is incorrect.');
    process.exit(1);
}
