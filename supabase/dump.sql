


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_verifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM phone_verifications 
    WHERE is_verified = false 
    AND expires_at < NOW();
    
    DELETE FROM phone_verification_rate_limits
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_verifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_user_venue_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT venue_id FROM user_venues WHERE user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_auth_user_venue_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_venue_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT venue_id FROM user_venues WHERE user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_venue_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shift_totals"("p_venue_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("total_cash" numeric, "total_transfer" numeric, "total_bookings_revenue" numeric, "total_products_revenue" numeric, "expected_cash_in_drawer" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_shift_totals"("p_venue_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_venue_owner"("target_venue_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_venues 
    WHERE user_id = auth.uid() 
      AND venue_id = target_venue_id 
      AND role = 'owner'
  );
END;
$$;


ALTER FUNCTION "public"."is_venue_owner"("target_venue_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_exit_surveys_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_exit_surveys_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_maintenance_tasks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_maintenance_tasks_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reminder_logs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reminder_logs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_venues_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_venues_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_winback_logs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_winback_logs_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "court_id" "uuid",
    "customer_name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "start_time" "text" NOT NULL,
    "duration" integer DEFAULT 1 NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "paid_amount" numeric(10,2) DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "booking_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'paid'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON TABLE "public"."bookings" IS 'Stores court booking information for the GOR system';



CREATE TABLE IF NOT EXISTS "public"."court_maintenance_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "court_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "frequency_days" integer NOT NULL,
    "last_performed_at" "date",
    "next_due_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true,
    "cost_estimate" numeric,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "court_maintenance_schedules_frequency_days_check" CHECK (("frequency_days" > 0))
);


ALTER TABLE "public"."court_maintenance_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "court_number" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "hourly_rate" numeric(10,2) DEFAULT 50000,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."courts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "is_member" boolean DEFAULT false,
    "quota" integer DEFAULT 0,
    "membership_expiry" timestamp with time zone,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "photo_url" "text",
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exit_surveys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "reasons" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "other_reason" "text",
    "feedback" "text",
    "membership_expiry" "date",
    "survey_sent_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exit_surveys" OWNER TO "postgres";


COMMENT ON TABLE "public"."exit_surveys" IS 'Stores exit survey responses from members who did not renew';



CREATE TABLE IF NOT EXISTS "public"."maintenance_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "court_id" "uuid" NOT NULL,
    "task_date" "date" NOT NULL,
    "start_hour" integer NOT NULL,
    "duration_hours" integer DEFAULT 1 NOT NULL,
    "maintenance_type" "text" DEFAULT 'other'::"text" NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "technician_name" "text",
    "cost" numeric(12,2) DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "maintenance_tasks_duration_hours_check" CHECK ((("duration_hours" >= 1) AND ("duration_hours" <= 12))),
    CONSTRAINT "maintenance_tasks_start_hour_check" CHECK ((("start_hour" >= 0) AND ("start_hour" <= 23))),
    CONSTRAINT "maintenance_tasks_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."maintenance_tasks" OWNER TO "postgres";


COMMENT ON TABLE "public"."maintenance_tasks" IS 'Stores individual maintenance events for courts';



CREATE OR REPLACE VIEW "public"."member_booking_stats" AS
 SELECT "c"."id" AS "customer_id",
    "c"."venue_id",
    "c"."name",
    "c"."phone",
    "c"."is_member",
    "c"."quota",
    "c"."membership_expiry",
    "max"("b"."booking_date") AS "last_booking_date",
    "count"("b"."id") AS "total_bookings",
    "count"(
        CASE
            WHEN ("b"."booking_date" >= (CURRENT_DATE - '30 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "bookings_last_30_days",
    "count"(
        CASE
            WHEN (("b"."booking_date" >= (CURRENT_DATE - '60 days'::interval)) AND ("b"."booking_date" < (CURRENT_DATE - '30 days'::interval))) THEN 1
            ELSE NULL::integer
        END) AS "bookings_prev_30_days",
    "count"(
        CASE
            WHEN ("b"."booking_date" >= (CURRENT_DATE - '90 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "bookings_last_90_days"
   FROM ("public"."customers" "c"
     LEFT JOIN "public"."bookings" "b" ON ((("b"."phone" = "c"."phone") AND ("b"."venue_id" = "c"."venue_id"))))
  WHERE (("c"."is_member" = true) AND ("c"."is_deleted" = false))
  GROUP BY "c"."id", "c"."venue_id", "c"."name", "c"."phone", "c"."is_member", "c"."quota", "c"."membership_expiry";


ALTER VIEW "public"."member_booking_stats" OWNER TO "postgres";


COMMENT ON VIEW "public"."member_booking_stats" IS 'Aggregated view of member booking activity for churn analysis';



CREATE TABLE IF NOT EXISTS "public"."phone_verification_rate_limits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "ip_address" "text",
    "request_count" integer DEFAULT 1,
    "window_start" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."phone_verification_rate_limits" OWNER TO "postgres";


COMMENT ON TABLE "public"."phone_verification_rate_limits" IS 'Rate limiting for phone verification requests';



CREATE TABLE IF NOT EXISTS "public"."phone_verifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "phone_number" "text" NOT NULL,
    "country_code" "text" DEFAULT '+62'::"text" NOT NULL,
    "totp_secret" "text",
    "verification_code" "text",
    "verification_type" "text" DEFAULT 'totp'::"text" NOT NULL,
    "attempts" integer DEFAULT 0,
    "max_attempts" integer DEFAULT 5,
    "is_verified" boolean DEFAULT false,
    "expires_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "phone_verifications_verification_type_check" CHECK (("verification_type" = ANY (ARRAY['totp'::"text", 'sms'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."phone_verifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."phone_verifications" IS 'Stores phone verification attempts and TOTP secrets for user registration';



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "category" "text",
    "stock" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text",
    CONSTRAINT "products_category_check" CHECK (("category" = ANY (ARRAY['DRINK'::"text", 'FOOD'::"text", 'EQUIPMENT'::"text", 'RENTAL'::"text"])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qr_checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "text" NOT NULL,
    "member_name" "text" NOT NULL,
    "check_in_date" "date" NOT NULL,
    "venue_id" "uuid",
    "scanned_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."qr_checkins" OWNER TO "postgres";


COMMENT ON TABLE "public"."qr_checkins" IS 'Tracks member QR code scan events for real-time check-in confirmation';



CREATE TABLE IF NOT EXISTS "public"."reminder_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "reminder_type" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "message_content" "text" NOT NULL,
    "phone_number" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "external_message_id" "text",
    "error_message" "text",
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reminder_logs_channel_check" CHECK (("channel" = ANY (ARRAY['WHATSAPP'::"text", 'SMS'::"text", 'EMAIL'::"text"]))),
    CONSTRAINT "reminder_logs_reminder_type_check" CHECK (("reminder_type" = ANY (ARRAY['30_DAYS'::"text", '7_DAYS'::"text", 'EXPIRED'::"text", 'MANUAL'::"text"]))),
    CONSTRAINT "reminder_logs_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'SENT'::"text", 'DELIVERED'::"text", 'FAILED'::"text", 'READ'::"text"])))
);


ALTER TABLE "public"."reminder_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shifts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "opener_id" "uuid",
    "closer_id" "uuid",
    "start_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone,
    "start_cash" numeric(10,2) DEFAULT 0 NOT NULL,
    "end_cash" numeric(10,2),
    "expected_cash" numeric(10,2),
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "shifts_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."shifts" OWNER TO "postgres";


COMMENT ON TABLE "public"."shifts" IS 'Tracks cashier shifts, open/close times, and cash reconciliation';



CREATE TABLE IF NOT EXISTS "public"."transaction_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "reference_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transaction_items_type_check" CHECK (("type" = ANY (ARRAY['PRODUCT'::"text", 'BOOKING'::"text", 'TIP'::"text"])))
);


ALTER TABLE "public"."transaction_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "paid_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "change_amount" numeric(10,2) DEFAULT 0,
    "payment_method" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "cashier_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transactions_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['CASH'::"text", 'QRIS'::"text", 'TRANSFER'::"text"]))),
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['PAID'::"text", 'PENDING'::"text", 'PARTIAL'::"text", 'UNPAID'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_venues" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'owner'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_venues_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'staff'::"text", 'cashier'::"text"])))
);


ALTER TABLE "public"."user_venues" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_venues"."role" IS 'Role of the user in the venue: owner, manager, staff, or cashier';



CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "phone" "text",
    "email" "text",
    "operating_hours_start" integer DEFAULT 8,
    "operating_hours_end" integer DEFAULT 23,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reminder_configuration" "jsonb" DEFAULT '{"warnings": [{"enabled": true, "days_before": 30}, {"enabled": true, "days_before": 7}], "expired_message_enabled": true}'::"jsonb",
    "winback_configuration" "jsonb" DEFAULT '{"enabled": false, "validity_days": 7, "message_template": "Halo {name}! 👋\n\nKami kangen sama kamu di {venue}! 🏸\n\nGunakan kode promo *{promo_code}* untuk dapat diskon *{discount}%* booking lapangan.\n\nBerlaku sampai {valid_until}.\n\nYuk main lagi! 💪", "auto_send_enabled": false, "promo_code_prefix": "COMEBACK", "default_discount_percent": 15, "promo_code_suffix_length": 6}'::"jsonb",
    "wa_device_id" "text",
    "wa_status" "text" DEFAULT 'disconnected'::"text",
    "deposit_policy" "jsonb" DEFAULT '{"isEnabled": false, "refundRules": {"hDay": 0, "hMinus1": 100}, "minDepositAmount": 50000, "cancellationPolicy": "strict"}'::"jsonb"
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


COMMENT ON COLUMN "public"."venues"."reminder_configuration" IS 'Configuration for automated member renewal reminders';



COMMENT ON COLUMN "public"."venues"."winback_configuration" IS 'JSON configuration for win-back promo feature including code format and templates';



COMMENT ON COLUMN "public"."venues"."wa_device_id" IS 'Fonnte Device ID (e.g. venue-slug)';



COMMENT ON COLUMN "public"."venues"."wa_status" IS 'Status of Fonnte connection';



COMMENT ON COLUMN "public"."venues"."deposit_policy" IS 'Configuration for booking deposit requirement and cancellation policy';



CREATE TABLE IF NOT EXISTS "public"."winback_promo_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "risk_level" "text" NOT NULL,
    "promo_code" "text" NOT NULL,
    "discount_percent" integer DEFAULT 10 NOT NULL,
    "valid_until" "date",
    "message_content" "text" NOT NULL,
    "phone_number" "text" NOT NULL,
    "status" "text" DEFAULT 'SENT'::"text" NOT NULL,
    "external_message_id" "text",
    "error_message" "text",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "redeemed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "winback_promo_logs_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "winback_promo_logs_status_check" CHECK (("status" = ANY (ARRAY['SENT'::"text", 'FAILED'::"text", 'REDEEMED'::"text", 'EXPIRED'::"text"])))
);


ALTER TABLE "public"."winback_promo_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."winback_promo_logs" IS 'Stores win-back promo messages sent to at-risk members';



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."court_maintenance_schedules"
    ADD CONSTRAINT "court_maintenance_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courts"
    ADD CONSTRAINT "courts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exit_surveys"
    ADD CONSTRAINT "exit_surveys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_tasks"
    ADD CONSTRAINT "maintenance_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phone_verification_rate_limits"
    ADD CONSTRAINT "phone_verification_rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phone_verifications"
    ADD CONSTRAINT "phone_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qr_checkins"
    ADD CONSTRAINT "qr_checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminder_logs"
    ADD CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_items"
    ADD CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qr_checkins"
    ADD CONSTRAINT "unique_member_date" UNIQUE ("member_id", "check_in_date");



ALTER TABLE ONLY "public"."courts"
    ADD CONSTRAINT "unique_venue_court_number" UNIQUE ("venue_id", "court_number");



ALTER TABLE ONLY "public"."user_venues"
    ADD CONSTRAINT "user_venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_venues"
    ADD CONSTRAINT "user_venues_user_id_venue_id_key" UNIQUE ("user_id", "venue_id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."winback_promo_logs"
    ADD CONSTRAINT "winback_promo_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_bookings_court_id" ON "public"."bookings" USING "btree" ("court_id");



CREATE INDEX "idx_bookings_date" ON "public"."bookings" USING "btree" ("booking_date");



CREATE INDEX "idx_bookings_phone" ON "public"."bookings" USING "btree" ("phone");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_bookings_venue_id" ON "public"."bookings" USING "btree" ("venue_id");



CREATE INDEX "idx_courts_active" ON "public"."courts" USING "btree" ("is_active");



CREATE INDEX "idx_courts_venue_id" ON "public"."courts" USING "btree" ("venue_id");



CREATE INDEX "idx_customers_phone" ON "public"."customers" USING "btree" ("phone");



CREATE INDEX "idx_customers_venue_id" ON "public"."customers" USING "btree" ("venue_id");



CREATE INDEX "idx_exit_surveys_completed_at" ON "public"."exit_surveys" USING "btree" ("completed_at");



CREATE INDEX "idx_exit_surveys_customer_id" ON "public"."exit_surveys" USING "btree" ("customer_id");



CREATE INDEX "idx_exit_surveys_venue_id" ON "public"."exit_surveys" USING "btree" ("venue_id");



CREATE INDEX "idx_maintenance_tasks_court_date" ON "public"."maintenance_tasks" USING "btree" ("court_id", "task_date");



CREATE INDEX "idx_maintenance_tasks_status" ON "public"."maintenance_tasks" USING "btree" ("status");



CREATE INDEX "idx_maintenance_tasks_venue_date" ON "public"."maintenance_tasks" USING "btree" ("venue_id", "task_date");



CREATE UNIQUE INDEX "idx_phone_verifications_pending" ON "public"."phone_verifications" USING "btree" ("user_id", "phone_number") WHERE ("is_verified" = false);



CREATE INDEX "idx_phone_verifications_phone" ON "public"."phone_verifications" USING "btree" ("phone_number");



CREATE INDEX "idx_phone_verifications_user_id" ON "public"."phone_verifications" USING "btree" ("user_id");



CREATE INDEX "idx_phone_verifications_verified" ON "public"."phone_verifications" USING "btree" ("is_verified");



CREATE INDEX "idx_products_venue_id" ON "public"."products" USING "btree" ("venue_id");



CREATE INDEX "idx_qr_checkins_member_date" ON "public"."qr_checkins" USING "btree" ("member_id", "check_in_date");



CREATE INDEX "idx_qr_checkins_venue" ON "public"."qr_checkins" USING "btree" ("venue_id");



CREATE INDEX "idx_rate_limits_ip" ON "public"."phone_verification_rate_limits" USING "btree" ("ip_address");



CREATE INDEX "idx_rate_limits_phone" ON "public"."phone_verification_rate_limits" USING "btree" ("phone_number");



CREATE INDEX "idx_rate_limits_window" ON "public"."phone_verification_rate_limits" USING "btree" ("window_start");



CREATE INDEX "idx_reminder_logs_created_at" ON "public"."reminder_logs" USING "btree" ("created_at");



CREATE INDEX "idx_reminder_logs_customer_id" ON "public"."reminder_logs" USING "btree" ("customer_id");



CREATE INDEX "idx_reminder_logs_status" ON "public"."reminder_logs" USING "btree" ("status");



CREATE INDEX "idx_reminder_logs_venue_id" ON "public"."reminder_logs" USING "btree" ("venue_id");



CREATE INDEX "idx_shifts_start_time" ON "public"."shifts" USING "btree" ("start_time");



CREATE INDEX "idx_shifts_status" ON "public"."shifts" USING "btree" ("status");



CREATE INDEX "idx_shifts_venue_id" ON "public"."shifts" USING "btree" ("venue_id");



CREATE INDEX "idx_transaction_items_transaction_id" ON "public"."transaction_items" USING "btree" ("transaction_id");



CREATE INDEX "idx_transactions_venue_id" ON "public"."transactions" USING "btree" ("venue_id");



CREATE INDEX "idx_user_venues_user" ON "public"."user_venues" USING "btree" ("user_id");



CREATE INDEX "idx_user_venues_venue" ON "public"."user_venues" USING "btree" ("venue_id");



CREATE INDEX "idx_winback_promo_logs_customer_id" ON "public"."winback_promo_logs" USING "btree" ("customer_id");



CREATE INDEX "idx_winback_promo_logs_promo_code" ON "public"."winback_promo_logs" USING "btree" ("promo_code");



CREATE INDEX "idx_winback_promo_logs_status" ON "public"."winback_promo_logs" USING "btree" ("status");



CREATE INDEX "idx_winback_promo_logs_venue_id" ON "public"."winback_promo_logs" USING "btree" ("venue_id");



CREATE OR REPLACE TRIGGER "trigger_maintenance_tasks_updated_at" BEFORE UPDATE ON "public"."maintenance_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_maintenance_tasks_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_exit_surveys_updated_at" BEFORE UPDATE ON "public"."exit_surveys" FOR EACH ROW EXECUTE FUNCTION "public"."update_exit_surveys_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_reminder_logs_updated_at" BEFORE UPDATE ON "public"."reminder_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_reminder_logs_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_winback_logs_updated_at" BEFORE UPDATE ON "public"."winback_promo_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_winback_logs_updated_at"();



CREATE OR REPLACE TRIGGER "user_venues_updated_at_trigger" BEFORE UPDATE ON "public"."user_venues" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_venues_updated_at"();



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."court_maintenance_schedules"
    ADD CONSTRAINT "court_maintenance_schedules_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."court_maintenance_schedules"
    ADD CONSTRAINT "court_maintenance_schedules_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courts"
    ADD CONSTRAINT "courts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exit_surveys"
    ADD CONSTRAINT "exit_surveys_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exit_surveys"
    ADD CONSTRAINT "exit_surveys_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_tasks"
    ADD CONSTRAINT "maintenance_tasks_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_tasks"
    ADD CONSTRAINT "maintenance_tasks_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phone_verifications"
    ADD CONSTRAINT "phone_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."qr_checkins"
    ADD CONSTRAINT "qr_checkins_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reminder_logs"
    ADD CONSTRAINT "reminder_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminder_logs"
    ADD CONSTRAINT "reminder_logs_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_closer_id_fkey" FOREIGN KEY ("closer_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_opener_id_fkey" FOREIGN KEY ("opener_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_items"
    ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_venues"
    ADD CONSTRAINT "user_venues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_venues"
    ADD CONSTRAINT "user_venues_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."winback_promo_logs"
    ADD CONSTRAINT "winback_promo_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."winback_promo_logs"
    ADD CONSTRAINT "winback_promo_logs_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated full access" ON "public"."qr_checkins" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow insert during registration" ON "public"."phone_verifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert" ON "public"."qr_checkins" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow public read" ON "public"."qr_checkins" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anyone can insert exit surveys" ON "public"."exit_surveys" FOR INSERT WITH CHECK (true);



CREATE POLICY "Delete Membership" ON "public"."user_venues" FOR DELETE USING ("public"."is_venue_owner"("venue_id"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."shifts" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."shifts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update access for authenticated users" ON "public"."shifts" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Insert Membership" ON "public"."user_venues" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR "public"."is_venue_owner"("venue_id")));



CREATE POLICY "Public Create Bookings" ON "public"."bookings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public View Active Venues" ON "public"."venues" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public View Bookings" ON "public"."bookings" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Service role manages rate limits" ON "public"."phone_verification_rate_limits" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Update Membership" ON "public"."user_venues" FOR UPDATE USING ("public"."is_venue_owner"("venue_id"));



CREATE POLICY "Users can delete maintenance tasks for their venues" ON "public"."maintenance_tasks" FOR DELETE USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their venue maintenance schedules" ON "public"."court_maintenance_schedules" FOR DELETE USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert maintenance tasks for their venues" ON "public"."maintenance_tasks" FOR INSERT WITH CHECK (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert reminder logs for their venues" ON "public"."reminder_logs" FOR INSERT WITH CHECK (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their venue maintenance schedules" ON "public"."court_maintenance_schedules" FOR INSERT WITH CHECK (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert winback logs for their venues" ON "public"."winback_promo_logs" FOR INSERT WITH CHECK (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update exit surveys for their venues" ON "public"."exit_surveys" FOR UPDATE USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update maintenance tasks for their venues" ON "public"."maintenance_tasks" FOR UPDATE USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own verifications" ON "public"."phone_verifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update reminder logs for their venues" ON "public"."reminder_logs" FOR UPDATE USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their venue maintenance schedules" ON "public"."court_maintenance_schedules" FOR UPDATE USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update winback logs for their venues" ON "public"."winback_promo_logs" FOR UPDATE USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view exit surveys for their venues" ON "public"."exit_surveys" FOR SELECT USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view maintenance tasks for their venues" ON "public"."maintenance_tasks" FOR SELECT USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own verifications" ON "public"."phone_verifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view reminder logs for their venues" ON "public"."reminder_logs" FOR SELECT USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their venue maintenance schedules" ON "public"."court_maintenance_schedules" FOR SELECT USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view winback logs for their venues" ON "public"."winback_promo_logs" FOR SELECT USING (("venue_id" IN ( SELECT "user_venues"."venue_id"
   FROM "public"."user_venues"
  WHERE ("user_venues"."user_id" = "auth"."uid"()))));



CREATE POLICY "Venue Members Access Bookings" ON "public"."bookings" USING (("venue_id" IN ( SELECT "public"."get_my_venue_ids"() AS "get_my_venue_ids")));



CREATE POLICY "Venue Members Access Courts" ON "public"."courts" USING ((("venue_id" IN ( SELECT "public"."get_my_venue_ids"() AS "get_my_venue_ids")) OR ("is_active" = true)));



CREATE POLICY "Venue Members Access Customers" ON "public"."customers" USING (("venue_id" IN ( SELECT "public"."get_my_venue_ids"() AS "get_my_venue_ids")));



CREATE POLICY "Venue Members Access Products" ON "public"."products" USING (("venue_id" IN ( SELECT "public"."get_my_venue_ids"() AS "get_my_venue_ids")));



CREATE POLICY "Venue Members Access Transaction Items" ON "public"."transaction_items" USING (("transaction_id" IN ( SELECT "transactions"."id"
   FROM "public"."transactions"
  WHERE ("transactions"."venue_id" IN ( SELECT "public"."get_my_venue_ids"() AS "get_my_venue_ids")))));



CREATE POLICY "Venue Members Access Transactions" ON "public"."transactions" USING (("venue_id" IN ( SELECT "public"."get_my_venue_ids"() AS "get_my_venue_ids")));



CREATE POLICY "Venue Members View Venue" ON "public"."venues" FOR SELECT USING (("id" IN ( SELECT "public"."get_my_venue_ids"() AS "get_my_venue_ids")));



CREATE POLICY "View Own Rows" ON "public"."user_venues" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "View Teammates" ON "public"."user_venues" FOR SELECT USING (("venue_id" IN ( SELECT "public"."get_my_venue_ids"() AS "get_my_venue_ids")));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."court_maintenance_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exit_surveys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maintenance_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_verification_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."qr_checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reminder_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shifts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_venues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."winback_promo_logs" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_expired_verifications"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_expired_verifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_verifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_verifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_user_venue_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_user_venue_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_user_venue_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_venue_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_venue_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_venue_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shift_totals"("p_venue_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_shift_totals"("p_venue_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shift_totals"("p_venue_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_venue_owner"("target_venue_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_venue_owner"("target_venue_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_venue_owner"("target_venue_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_exit_surveys_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_exit_surveys_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_exit_surveys_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_maintenance_tasks_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_maintenance_tasks_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_maintenance_tasks_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_reminder_logs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reminder_logs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reminder_logs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_venues_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_venues_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_venues_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_winback_logs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_winback_logs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_winback_logs_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."court_maintenance_schedules" TO "anon";
GRANT ALL ON TABLE "public"."court_maintenance_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."court_maintenance_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."courts" TO "anon";
GRANT ALL ON TABLE "public"."courts" TO "authenticated";
GRANT ALL ON TABLE "public"."courts" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."exit_surveys" TO "anon";
GRANT ALL ON TABLE "public"."exit_surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."exit_surveys" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_tasks" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."member_booking_stats" TO "anon";
GRANT ALL ON TABLE "public"."member_booking_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."member_booking_stats" TO "service_role";



GRANT ALL ON TABLE "public"."phone_verification_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."phone_verification_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_verification_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."phone_verifications" TO "anon";
GRANT ALL ON TABLE "public"."phone_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."qr_checkins" TO "anon";
GRANT ALL ON TABLE "public"."qr_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_checkins" TO "service_role";



GRANT ALL ON TABLE "public"."reminder_logs" TO "anon";
GRANT ALL ON TABLE "public"."reminder_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."reminder_logs" TO "service_role";



GRANT ALL ON TABLE "public"."shifts" TO "anon";
GRANT ALL ON TABLE "public"."shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."shifts" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_items" TO "anon";
GRANT ALL ON TABLE "public"."transaction_items" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_items" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_venues" TO "anon";
GRANT ALL ON TABLE "public"."user_venues" TO "authenticated";
GRANT ALL ON TABLE "public"."user_venues" TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



GRANT ALL ON TABLE "public"."winback_promo_logs" TO "anon";
GRANT ALL ON TABLE "public"."winback_promo_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."winback_promo_logs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







