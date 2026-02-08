const { format, subDays, addDays } = require('date-fns');

// Mock data
const today = new Date();
const currentMonthStr = format(today, 'yyyy-MM');
const lastMonthStr = format(subDays(today, 30), 'yyyy-MM'); // Assuming we are not at start of month for simplicity of test, or just force dates.

const transactions = [
    { id: '1', date: format(today, 'yyyy-MM-dd') + 'T10:00:00Z', status: 'PAID', totalAmount: 100000 }, // Today (MTD)
    { id: '2', date: format(subDays(today, 1), 'yyyy-MM-dd') + 'T14:00:00Z', status: 'PAID', totalAmount: 50000 }, // Yesterday (MTD)
    { id: '3', date: format(subDays(today, 40), 'yyyy-MM-dd') + 'T09:00:00Z', status: 'PAID', totalAmount: 200000 }, // 40 days ago (Not MTD)
];

function calculateMTDRevenue(txs) {
    return txs
        .filter(t => {
            const tDate = new Date(t.date);
            return t.status === 'PAID' && format(tDate, 'yyyy-MM') === currentMonthStr;
        })
        .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
}

const currentDayOfMonth = today.getDate();

console.log('Testing MTD Revenue Calculation...');
console.log(`Current Month: ${currentMonthStr}`);
console.log(`Current Day: ${currentDayOfMonth}`);

const revenue = calculateMTDRevenue(transactions);
const expectedRevenue = 150000; // 100k + 50k

console.log(`Revenue Expected: ${expectedRevenue}, Got: ${revenue}`);

if (revenue === expectedRevenue) {
    console.log('SUCCESS: MTD Revenue logic is correct.');
} else {
    console.log('FAILED: MTD Revenue logic is incorrect.');
    process.exit(1);
}
