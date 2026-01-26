import { create } from 'zustand';
import { Booking, Product, CartItem, Transaction, INITIAL_BOOKINGS, INITIAL_PRODUCTS } from './constants';

interface AppState {
    bookings: Booking[];
    products: Product[];
    cart: CartItem[];
    transactions: Transaction[];

    // Actions
    addBooking: (booking: Booking) => void;
    updateBookingStatus: (id: string, status: Booking['status']) => void;
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    processTransaction: (transaction: Transaction) => void;
}

export const useAppStore = create<AppState>((set) => ({
    bookings: INITIAL_BOOKINGS,
    products: INITIAL_PRODUCTS,
    cart: [],
    transactions: [],

    addBooking: (booking) => set((state) => ({
        bookings: [...state.bookings, booking]
    })),

    updateBookingStatus: (id, status) => set((state) => ({
        bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status } : b
        )
    })),

    addToCart: (item) => set((state) => {
        const existingItem = state.cart.find((i) => i.id === item.id);
        if (existingItem) {
            return {
                cart: state.cart.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                )
            };
        }
        return { cart: [...state.cart, item] };
    }),

    removeFromCart: (itemId) => set((state) => ({
        cart: state.cart.filter((i) => i.id !== itemId)
    })),

    clearCart: () => set({ cart: [] }),

    processTransaction: (transaction) => set((state) => {
        // Decrement stock if item is a product
        const newProducts = state.products.map((p) => {
            const cartItem = transaction.items.find((i) => i.referenceId === p.id && i.type === 'PRODUCT');
            if (cartItem) {
                return { ...p, stock: p.stock - cartItem.quantity };
            }
            return p;
        });

        // Update booking status if item is a booking
        const newBookings = state.bookings.map((b) => {
            const cartItem = transaction.items.find((i) => i.referenceId === b.id && i.type === 'BOOKING');
            if (cartItem) {
                // Determine status based on transaction status
                const newStatus = transaction.status === 'PAID' ? 'LUNAS' :
                    transaction.status === 'PARTIAL' ? 'DP' :
                        'BELUM_BAYAR';
                return { ...b, status: newStatus as any };
            }
            return b;
        });

        return {
            transactions: [transaction, ...state.transactions],
            products: newProducts,
            bookings: newBookings,
            cart: [] // Clear cart after successful transaction
        };
    }),
}));
