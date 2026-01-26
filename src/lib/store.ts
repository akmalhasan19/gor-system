import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Booking, Product, CartItem, Transaction, Customer, INITIAL_BOOKINGS, INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from './constants';

interface AppState {
    bookings: Booking[];
    products: Product[];
    cart: CartItem[];
    transactions: Transaction[];
    customers: Customer[];

    // Actions
    addBooking: (booking: Booking) => void;
    updateBookingStatus: (id: string, status: Booking['status']) => void;
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    processTransaction: (transaction: Transaction) => void;
    updateProductStock: (id: string, amount: number) => void;
    addProduct: (product: Product) => void;
    removeProduct: (id: string) => void;
    addCustomer: (customer: Customer) => void;
    updateCustomer: (id: string, updates: Partial<Customer>) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            bookings: INITIAL_BOOKINGS,
            products: INITIAL_PRODUCTS,
            cart: [],
            transactions: [],
            customers: INITIAL_CUSTOMERS,

            addCustomer: (customer) => set((state) => ({
                customers: [...state.customers, customer]
            })),

            updateCustomer: (id, updates) => set((state) => ({
                customers: state.customers.map((c) =>
                    c.id === id ? { ...c, ...updates } : c
                )
            })),

            addBooking: (booking) => set((state) => ({
                bookings: [...state.bookings, { ...booking, paidAmount: 0 }]
            })),

            updateBookingStatus: (id, status) => set((state) => ({
                bookings: state.bookings.map((b) =>
                    b.id === id ? { ...b, status } : b
                )
            })),

            addToCart: (item) => set((state) => {
                console.log('ADDING TO CART:', item);
                const existingItem = state.cart.find((i) => i.id === item.id);

                // Prevent duplicate bookings
                if (item.type === 'BOOKING' && existingItem) {
                    console.log('DUPLICATE BOOKING DETECTED, SKIPPING');
                    return state; // Do nothing if booking is already in cart
                }

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
                        let newStatus = b.status;
                        let newPaidAmount = b.paidAmount || 0;

                        if (transaction.status === 'PAID') {
                            newStatus = 'LUNAS';
                            newPaidAmount = b.price;
                        } else if (transaction.status === 'PARTIAL') {
                            newStatus = 'DP';
                            newPaidAmount += transaction.paidAmount;

                            // Auto-detect if DP becomes full payment (unlikely via partial flow but good safety)
                            if (newPaidAmount >= b.price) {
                                newStatus = 'LUNAS';
                                newPaidAmount = b.price;
                            }
                        }

                        return { ...b, status: newStatus as any, paidAmount: newPaidAmount };
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

            updateProductStock: (id, amount) => set((state) => ({
                products: state.products.map((p) =>
                    p.id === id ? { ...p, stock: p.stock + amount } : p
                )
            })),

            addProduct: (product) => set((state) => ({
                products: [...state.products, product]
            })),

            removeProduct: (id) => set((state) => ({
                products: state.products.filter((p) => p.id !== id)
            })),
        }), {
        name: 'gor-system-storage',
        skipHydration: true,
    }));
