- Function to calculate shift totals
-- Returns expected cash, total sales, etc. based on transactions within the shift window

CREATE OR REPLACE FUNCTION get_shift_totals(
    p_venue_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_cash DECIMAL(10,2),
    total_transfer DECIMAL(10,2),
    total_bookings_revenue DECIMAL(10,2),
    total_products_revenue DECIMAL(10,2),
    expected_cash_in_drawer DECIMAL(10,2) -- start_cash + cash_transactions
) AS $$
DECLARE
    v_start_cash DECIMAL(10,2);
    v_cash_transactions DECIMAL(10,2);
    v_transfer_transactions DECIMAL(10,2);
    v_booking_revenue DECIMAL(10,2);
    v_product_revenue DECIMAL(10,2);
BEGIN
    -- Get Start Cash for this shift (assuming p_start_time matches a shift start, or we just look up the shift covering this time)
    -- Actually, the caller should pass the correct Start Cash from the shift record if they want "Expected Cash in Drawer".
    -- But for this function, let's keep it focused on TRANSACTION totals.
    -- We can fetch the shift's start_cash inside here if we had the shift_id, but we have timestamps.
    -- Let's stick to returning transaction aggregates, and let the caller add start_cash.
    -- However, to make it easy for the UI, let's try to find the shift if we can, or just return 0 for start_cash if not found (but that's risky).
    -- BETTER APPROACH: The caller (UI/API) knows the ID and Start Cash. 
    -- So this function should focus on calculating the REVENUE/TRANSACTIONS within the period.
    
    -- Calculate Cash Total (Transactions with payment_method = 'cash')
    SELECT COALESCE(SUM(paid_amount), 0)
    INTO v_cash_transactions
    FROM transactions
    WHERE venue_id = p_venue_id
    AND created_at >= p_start_time
    AND created_at <= p_end_time
    AND payment_method = 'cash';

    -- Calculate Transfer Total
    SELECT COALESCE(SUM(paid_amount), 0)
    INTO v_transfer_transactions
    FROM transactions
    WHERE venue_id = p_venue_id
    AND created_at >= p_start_time
    AND created_at <= p_end_time
    AND payment_method = 'transfer';

    -- Calculate Booking Revenue (Items of type 'BOOKING' in transactions)
    -- Be careful: We want the sum of SUBTOTALS for items, OR the split of the paid amount?
    -- If a transaction is mixed (Booking + Product), we need to check items.
    -- But 'paid_amount' is on the transaction. 
    -- If a transaction is partial, how do we attribute it?
    -- Allow simplification: 
    -- We look at 'transaction_items' linked to transactions in this period.
    -- Sum of 'subtotal' for BOOKING items.
    -- NOTE: This assumes 'subtotal' reflects accurately what was paid? 
    -- No, 'subtotal' is price * quantity. 'paid_amount' is what was actually paid on the transaction.
    -- If paid_amount < total_amount, we have a problem attributing cash to specific items.
    -- FOR MVP: Assume paid_amount covers items proportionally or simply sum 'paid_amount' of transactions where distinct types exist?
    -- Better: Just filter transactions by type if possible? No, transactions can be mixed.
    -- Let's just sum transaction_items subtotals to see "Sales Volume", but "Cash Collected" is hard to split if mixed.
    -- LUCKILY: The prompt asks for "data consistency... bookings, players buying food...".
    -- Let's just return the Total Cash and Total Transfer regardless of item type for the "Cash Check".
    -- For "Revenue Breakdown", we can sum the item values.
    
    SELECT COALESCE(SUM(ti.subtotal), 0)
    INTO v_booking_revenue
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.venue_id = p_venue_id
    AND t.created_at >= p_start_time
    AND t.created_at <= p_end_time
    AND ti.type = 'BOOKING';

    SELECT COALESCE(SUM(ti.subtotal), 0)
    INTO v_product_revenue
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.venue_id = p_venue_id
    AND t.created_at >= p_start_time
    AND t.created_at <= p_end_time
    AND ti.type = 'PRODUCT';

    RETURN QUERY SELECT 
        v_cash_transactions as total_cash,
        v_transfer_transactions as total_transfer,
        v_booking_revenue as total_bookings_revenue,
        v_product_revenue as total_products_revenue,
        0.00 as expected_cash_in_drawer; -- Placeholder, caller adds start_cash
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
