CREATE TABLE IF NOT EXISTS public.shift_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.shift_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for venue team" ON public.shift_expenses
    FOR SELECT
    USING (
        venue_id IN (
            SELECT venue_id FROM public.user_venues 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for venue team" ON public.shift_expenses
    FOR INSERT
    WITH CHECK (
        venue_id IN (
            SELECT venue_id FROM public.user_venues 
            WHERE user_id = auth.uid()
        )
    );

CREATE INDEX idx_shift_expenses_shift_id ON public.shift_expenses(shift_id);
CREATE INDEX idx_shift_expenses_venue_date ON public.shift_expenses(venue_id, created_at);