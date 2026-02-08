const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Using the one from verify-implementation.js

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runVerification() {
    console.log('Starting Expense Feature Verification...');

    // 1. Get Venue and Open Shift (or create one)
    console.log('\n[1/4] finding active shift...');
    const { data: shifts, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('status', 'open')
        .limit(1);

    if (shiftError) {
        console.error('Error fetching shifts:', shiftError);
        return;
    }

    let shiftId;
    let venueId;

    if (shifts && shifts.length > 0) {
        shiftId = shifts[0].id;
        venueId = shifts[0].venue_id;
        console.log(`Found open shift: ${shiftId} for venue: ${venueId}`);
    } else {
        console.log('No open shift found. Skipping expense creation test regarding shift constraint, but will try to insert anyway to test table.');
        // Try getting a venue
        const { data: venues } = await supabase.from('venues').select('id').limit(1);
        if (venues && venues.length > 0) {
            venueId = venues[0].id;
            // We need a shift to insert expense (FK), so if no open shift, 
            // we might need to create a dummy closed shift or just skip if too complex for script.
            // Let's assume there is at least one shift in DB for testing.
            const { data: anyShift } = await supabase.from('shifts').select('id').limit(1);
            if (anyShift && anyShift.length > 0) {
                shiftId = anyShift[0].id;
            } else {
                console.log('No shifts at all. Cannot test expense creation.');
                return;
            }
        } else {
            console.log('No venues. Cannot test.');
            return;
        }
    }

    // 2. Create Expense
    console.log('\n[2/4] Creating Test Expense...');
    const testAmount = 15000;
    const testCategory = 'TEST_AUTO';
    const { data: expense, error: createError } = await supabase
        .from('shift_expenses')
        .insert({
            venue_id: venueId,
            shift_id: shiftId,
            amount: testAmount,
            category: testCategory,
            description: 'Automated Test Expense'
        })
        .select()
        .single();

    if (createError) {
        console.error('Failed to create expense:', createError);
        process.exit(1);
    }
    console.log('Expense created:', expense.id);

    // 3. Verify Retrieval by Shift
    console.log('\n[3/4] Verifying Retrieval by Shift...');
    const { data: shiftExpenses, error: listError } = await supabase
        .from('shift_expenses')
        .select('*')
        .eq('shift_id', shiftId);

    if (listError) {
        console.error('Failed to list expenses:', listError);
        process.exit(1);
    }

    const found = shiftExpenses.find(e => e.id === expense.id);
    if (found) {
        console.log('SUCCESS: Expense found in shift list.');
    } else {
        console.error('FAILED: Expense not found in shift list.');
        process.exit(1);
    }

    // 4. Verify Dashboard Query (Date based)
    console.log('\n[4/4] Verifying Dashboard Query...');
    const today = new Date().toISOString().split('T')[0];
    const startDate = `${today}T00:00:00`;
    const endDate = `${today}T23:59:59.999`;

    const { data: dailyExpenses, error: dailyError } = await supabase
        .from('shift_expenses')
        .select('*')
        .eq('venue_id', venueId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (dailyError) {
        console.error('Failed to fetch daily expenses:', dailyError);
        process.exit(1);
    }

    const foundDaily = dailyExpenses.find(e => e.id === expense.id);
    if (foundDaily) {
        console.log('SUCCESS: Expense found in daily query.');
    } else {
        console.error('FAILED: Expense not found in daily query.');
        process.exit(1);
    }

    // Clean up
    console.log('\nCleaning up test expense...');
    await supabase.from('shift_expenses').delete().eq('id', expense.id);

    console.log('\nVERIFICATION COMPLETE: ALL CHECKS PASSED');
}

runVerification();
