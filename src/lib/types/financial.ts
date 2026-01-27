export type ShiftStatus = 'open' | 'closed';

export interface Shift {
    id: string;
    venue_id: string;
    opener_id: string | null;
    closer_id: string | null;
    start_time: string;
    end_time: string | null;
    start_cash: number;
    end_cash: number | null;
    expected_cash: number | null;
    status: ShiftStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    opener?: {
        email: string;
        full_name?: string;
    };
    closer?: {
        email: string;
        full_name?: string;
    };
}

export interface CashTransaction {
    id: string;
    shift_id: string;
    amount: number;
    type: 'payment' | 'refund' | 'adjustment';
    description: string;
    created_at: string;
    created_by: string;
}
