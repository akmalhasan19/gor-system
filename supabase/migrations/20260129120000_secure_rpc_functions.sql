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
    expected_cash_in_drawer DECIMAL(10,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure search path
AS $$
DECLARE
    v_start_cash DECIMAL(10,2);
    v_cash_transactions DECIMAL(10,2);
    v_transfer_transactions DECIMAL(10,2);
    v_booking_revenue DECIMAL(10,2);
    v_product_revenue DECIMAL(10,2);
BEGIN
    -- SECURITY CHECK: Ensure user is a member of the venue
    -- get_my_venue_ids() is defined in 20260129006000_fix_rls_nuclear.sql
    -- It uses SECURITY DEFINER to query user_venues safely.
    IF p_venue_id NOT IN (SELECT get_my_venue_ids()) THEN
        RAISE EXCEPTION 'Access Denied: You are not a member of this venue.';
    END IF;

    -- Calculate Cash Total
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

    -- Calculate Booking Revenue
    SELECT COALESCE(SUM(ti.subtotal), 0)
    INTO v_booking_revenue
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.venue_id = p_venue_id
    AND t.created_at >= p_start_time
    AND t.created_at <= p_end_time
    AND ti.type = 'BOOKING';

    -- Calculate Product Revenue
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
        0.00 as expected_cash_in_drawer;
END;
$$;

-- 2. Lock down cleanup function (Maintenance only)
REVOKE EXECUTE ON FUNCTION cleanup_expired_verifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_expired_verifications() TO service_role;
