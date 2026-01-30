import axios from 'axios';

const XENDIT_API_URL = 'https://api.xendit.co';
const SECRET_KEY = process.env.XENDIT_SECRET_KEY;

if (!SECRET_KEY) {
    console.warn('XENDIT_SECRET_KEY is not set');
}

const xenditClient = axios.create({
    baseURL: XENDIT_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    auth: {
        username: SECRET_KEY || '',
        password: '',
    },
});

export const XenditService = {
    createVA: async (data: {
        external_id: string;
        bank_code: string;
        name: string;
        expected_amt: number;
        is_closed?: boolean;
        is_single_use?: boolean;
        expiration_date?: Date;
    }) => {
        const payload = {
            external_id: data.external_id,
            bank_code: data.bank_code,
            name: data.name,
            expected_amt: data.expected_amt,
            expected_amount: data.expected_amt, // Add duplicate key for API compatibility
            is_closed: data.is_closed ?? true,
            is_single_use: data.is_single_use ?? true,
            expiration_date: data.expiration_date?.toISOString(),
        };
        console.log('Xendit VA Payload:', JSON.stringify(payload, null, 2));

        const response = await xenditClient.post('/callback_virtual_accounts', payload);
        return response.data;
    },

    createQRCode: async (data: {
        external_id: string;
        type: 'DYNAMIC' | 'STATIC';
        callback_url: string;
        amount: number;
    }) => {
        const response = await xenditClient.post('/qr_codes', {
            external_id: data.external_id,
            type: data.type,
            callback_url: data.callback_url,
            amount: data.amount,
        });
        return response.data;
    },

    // Example for E-Wallet if needed later
    createEWalletCharge: async (data: any) => {
        const response = await xenditClient.post('/ewallets/charges', data);
        return response.data;
    }
};
