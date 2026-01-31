const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runVerification() {
    console.log('Starting verification...');

    // 1. Verify Schema
    console.log('\n[1/3] Verifying Schema...');
    const { error: schemaError } = await supabase
        .from('transactions')
        .select('customer_id, customer_name, customer_phone')
        .limit(1);

    if (schemaError) {
        if (schemaError.message.includes('does not exist')) {
            console.error('FAILED: Columns do not exist. Migration NOT applied.');
            process.exit(1);
        } else {
            console.error('FAILED: Error checking schema:', schemaError.message);
            process.exit(1);
        }
    }
    console.log('SUCCESS: Schema verification passed.');

    // 2. Create Test Data
    console.log('\n[2/3] Creating Test Data...');

    // Get a venue
    const { data: venues } = await supabase.from('venues').select('id').limit(1);
    if (!venues || venues.length === 0) {
        console.error('FAILED: No venue found to test with.');
        process.exit(1);
    }
    const venueId = venues[0].id;
    console.log('Using Venue ID:', venueId);

    // Create a Member
    const testMemberPhone = '081234567890';
    const { data: member, error: memberError } = await supabase
        .from('customers')
        .insert({
            venue_id: venueId,
            name: 'Test Member Analytics',
            phone: testMemberPhone,
            is_member: true
        })
        .select()
        .single();

    // Ignore error if already exists (constraint violation), just fetch it
    let memberId;
    if (memberError) {
        const { data: existingMember } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', testMemberPhone)
            .single();
        if (existingMember) memberId = existingMember.id;
        else {
            console.error('FAILED: Could not create or find test member:', memberError.message);
            process.exit(1);
        }
    } else {
        memberId = member.id;
    }
    console.log('Test Member ID:', memberId);

    // Create Transaction for Member
    const memberTxnAmount = 50000;
    const { error: txn1Error } = await supabase.from('transactions').insert({
        venue_id: venueId,
        total_amount: memberTxnAmount,
        paid_amount: memberTxnAmount,
        payment_method: 'CASH',
        status: 'PAID',
        customer_id: memberId,
        customer_name: 'Test Member Analytics',
        customer_phone: testMemberPhone
    });
    if (txn1Error) {
        console.error('FAILED: Creating member transaction:', txn1Error.message);
        process.exit(1);
    }

    // Create Transaction for Walk-in
    const walkInPhone = '089876543210';
    const walkInTxnAmount = 75000;
    const { error: txn2Error } = await supabase.from('transactions').insert({
        venue_id: venueId,
        total_amount: walkInTxnAmount,
        paid_amount: walkInTxnAmount,
        payment_method: 'CASH',
        status: 'PAID',
        customer_name: 'Test WalkIn Analytics',
        customer_phone: walkInPhone,
        customer_id: null
    });
    if (txn2Error) {
        console.error('FAILED: Creating walk-in transaction:', txn2Error.message);
        process.exit(1);
    }

    console.log('SUCCESS: Test transactions created.');

    // 3. Verify Analytics Query Logic
    console.log('\n[3/3] Verifying Analytics Query...');

    // Simulate getTopCustomers query
    const endDate = new Date().toISOString(); // Today
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Yesterday

    const { data: transactions, error: searchError } = await supabase
        .from('transactions')
        .select('customer_id, customer_name, customer_phone, total_amount')
        .eq('venue_id', venueId)
        .gte('created_at', startDate) // Assuming we just created them
        .or(`customer_phone.eq.${testMemberPhone},customer_phone.eq.${walkInPhone}`);

    if (searchError) {
        console.error('FAILED: Querying transactions:', searchError.message);
        process.exit(1);
    }

    // Aggregate
    const spendingMap = {};
    transactions.forEach(t => {
        const key = t.customer_phone;
        if (!spendingMap[key]) spendingMap[key] = 0;
        spendingMap[key] += Number(t.total_amount);
    });

    console.log('Aggregated Spending:', spendingMap);

    const isMemberCorrect = spendingMap[testMemberPhone] >= memberTxnAmount;
    const isWalkInCorrect = spendingMap[walkInPhone] >= walkInTxnAmount;

    if (isMemberCorrect && isWalkInCorrect) {
        console.log('SUCCESS: Analytics aggregation is correct.');
    } else {
        console.error('FAILED: Spending amounts do not match expected values.');
        process.exit(1);
    }

    console.log('\nverification SUCCESSFUL!');
}

runVerification();
