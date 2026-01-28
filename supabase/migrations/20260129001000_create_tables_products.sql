-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category TEXT CHECK (category IN ('DRINK', 'FOOD', 'EQUIPMENT', 'RENTAL')),
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'QRIS', 'TRANSFER')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID', 'PENDING', 'PARTIAL', 'UNPAID')),
    cashier_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create transaction_items table
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('PRODUCT', 'BOOKING', 'TIP')),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    reference_id UUID, -- Can be product_id or booking_id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for transaction_items
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_products_venue_id ON products(venue_id);
CREATE INDEX IF NOT EXISTS idx_transactions_venue_id ON transactions(venue_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);

-- Add Basic Policies (Admins can do everything)
DO $$
BEGIN
    -- Products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins can do everything on products') THEN
        CREATE POLICY "Admins can do everything on products" ON products FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Admins can do everything on transactions') THEN
        CREATE POLICY "Admins can do everything on transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Transaction Items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_items' AND policyname = 'Admins can do everything on transaction_items') THEN
        CREATE POLICY "Admins can do everything on transaction_items" ON transaction_items FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
