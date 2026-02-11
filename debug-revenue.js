const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://haknornfainyyfrnzyxp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhha25vcm5mYWlueXlmcm56eXhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMzNjQyMSwiZXhwIjoyMDg0OTEyNDIxfQ.Bm0fzStHcj8REn6PLm6kopT1LKlRU7woS8xF8gCZAas';
const venueId = '4d3551d2-c416-420e-b781-e0827e2eecf3';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRevenue() {
    console.log('Fetching transactions for venue:', venueId);

    // Fetch last 50 transactions
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching transactions:', error);
        return;
    }

    console.log(`Fetched ${transactions.length} transactions.`);

    // Current date logic from Dashboard
    // Dashboard uses: new Date().toLocaleDateString('en-CA')
    // Note: Node.js timezone might differ from browser. 
    // I will print dates in multiple formats.

    const now = new Date();
    const activeDateEnCA = now.toLocaleDateString('en-CA');
    const activeDateLocal = now.toString();
    const activeDateUTC = now.toISOString();

    console.log('--- Current Environment Date ---');
    console.log('ISO String:', activeDateUTC);
    console.log('Local String:', activeDateLocal);
    console.log('en-CA String:', activeDateEnCA);
    console.log('-------------------------------');

    let totalRevenue = 0;
    const todayTransactions = [];

    transactions.forEach(t => {
        const tDateObj = new Date(t.created_at);
        const tDateEnCA = tDateObj.toLocaleDateString('en-CA');

        const isToday = tDateEnCA === activeDateEnCA;

        console.log(`[${t.id}] Date: ${t.created_at} | Local: ${tDateObj.toString()} | en-CA: ${tDateEnCA} | Paid: ${t.paid_amount} | Match: ${isToday}`);

        if (isToday) {
            todayTransactions.push(t);
            totalRevenue += Number(t.paid_amount || 0);
        }
    });

    console.log('--- Result ---');
    console.log('Total Revenue (calculated with Node locale):', totalRevenue);
    console.log('Today Transactions Count:', todayTransactions.length);

    // Check if there's any transaction with amount 58000
    const suspicious = transactions.find(t => Number(t.paid_amount) === 58000 || Number(t.total_amount) === 58000);
    if (suspicious) {
        console.log('!!! Found a transaction with 58000:', suspicious);
    } else {
        // Check for sum of recent transactions
        let sum = 0;
        for (let i = 0; i < transactions.length; i++) {
            sum += Number(transactions[i].paid_amount);
            if (sum === 58000) {
                console.log(`!!! Found a sequence of transactions summing to 58000 (first ${i + 1} transactions)`);
                break;
            }
        }
    }
}

debugRevenue();
