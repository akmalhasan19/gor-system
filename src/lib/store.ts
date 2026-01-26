import { create } from 'zustand';
import { Booking, Product, CartItem, Transaction, Customer } from './constants';
import * as bookingsApi from './api/bookings';
import * as productsApi from './api/products';
import * as customersApi from './api/customers';
import * as transactionsApi from './api/transactions';
import * as courtsApi from './api/courts';
import type { Court } from './api/courts';

interface AppState {
    bookings: Booking[];
    products: Product[];
    cart: CartItem[];
    transactions: Transaction[];
    customers: Customer[];
    courts: Court[];
    isLoading: boolean;
    error: string | null;

    // Sync actions (fetch from DB)
    syncBookings: () => Promise<void>;
    syncProducts: () => Promise<void>;
    syncCustomers: () => Promise<void>;
    syncTransactions: () => Promise<void>;
    syncCourts: () => Promise<void>;

    // Booking actions
    addBooking: (booking: Omit<Booking, 'id'>) => Promise<void>;
    updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
    deleteBooking: (id: string) => Promise<void>;
    updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
    setBookings: (bookings: Booking[]) => void;

    // Cart actions
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;

    // Transaction actions
    processTransaction: (transaction: Transaction) => Promise<void>;
    setTransactions: (transactions: Transaction[]) => void;

    // Product actions
    updateProductStock: (id: string, amount: number) => Promise<void>;
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    removeProduct: (id: string) => Promise<void>;
    setProducts: (products: Product[]) => void;

    // Customer actions
    addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
    setCustomers: (customers: Customer[]) => void;

    // Court actions
    addCourt: (court: Omit<Court, 'id' | 'venueId'>) => Promise<void>;
    updateCourt: (id: string, updates: Partial<Court>) => Promise<void>;
    deleteCourt: (id: string) => Promise<void>;
    setCourts: (courts: Court[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    bookings: [],
    products: [],
    cart: [],
    transactions: [],
    customers: [],
    courts: [],
    isLoading: false,
    error: null,

    // Sync methods
    syncBookings: async () => {
        set({ isLoading: true, error: null });
        try {
            const bookings = await bookingsApi.getBookings();
            set({ bookings, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    syncProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const products = await productsApi.getProducts();
            set({ products, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    syncCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
            const customers = await customersApi.getCustomers();
            set({ customers, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    syncTransactions: async () => {
        set({ isLoading: true, error: null });
        try {
            const transactions = await transactionsApi.getTransactions();
            set({ transactions, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    syncCourts: async () => {
        set({ isLoading: true, error: null });
        try {
            const courts = await courtsApi.getCourts();
            set({ courts, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    // Setters for realtime updates
    setBookings: (bookings) => set({ bookings }),
    setProducts: (products) => set({ products }),
    setCustomers: (customers) => set({ customers }),
    setTransactions: (transactions) => set({ transactions }),
    setCourts: (courts) => set({ courts }),

    // Booking actions
    addBooking: async (booking) => {
        set({ isLoading: true, error: null });
        try {
            const newBooking = await bookingsApi.createBooking(booking);
            set((state) => ({
                bookings: [...state.bookings, newBooking],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateBookingStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            await bookingsApi.updateBooking(id, { status });
            set((state) => ({
                bookings: state.bookings.map((b) =>
                    b.id === id ? { ...b, status } : b
                ),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateBooking: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await bookingsApi.updateBooking(id, updates);
            set((state) => ({
                bookings: state.bookings.map((b) =>
                    b.id === id ? { ...b, ...updates } : b
                ),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteBooking: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await bookingsApi.deleteBooking(id);
            set((state) => ({
                bookings: state.bookings.filter((b) => b.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Cart actions (local only)
    addToCart: (item) => set((state) => {
        const existingItem = state.cart.find((i) => i.id === item.id);

        if (item.type === 'BOOKING' && existingItem) {
            return state;
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

    // Transaction actions
    processTransaction: async (transaction) => {
        set({ isLoading: true, error: null });
        try {
            const newTransaction = await transactionsApi.createTransaction(
                transaction.items,
                transaction.paidAmount,
                transaction.paymentMethod,
                transaction.status as any
            );

            set((state) => ({
                transactions: [newTransaction, ...state.transactions],
                cart: [],
                isLoading: false
            }));

            // Refresh bookings and products to reflect updated status/stock
            get().syncBookings();
            get().syncProducts();
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Product actions
    updateProductStock: async (id, amount) => {
        set({ isLoading: true, error: null });
        try {
            const product = get().products.find(p => p.id === id);
            if (!product) throw new Error('Product not found');

            const newStock = product.stock + amount;
            await productsApi.updateStock(id, newStock);

            set((state) => ({
                products: state.products.map((p) =>
                    p.id === id ? { ...p, stock: newStock } : p
                ),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    addProduct: async (product) => {
        set({ isLoading: true, error: null });
        try {
            const newProduct = await productsApi.createProduct(product);
            set((state) => ({
                products: [...state.products, newProduct],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    removeProduct: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await productsApi.deleteProduct(id);
            set((state) => ({
                products: state.products.filter((p) => p.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Customer actions
    addCustomer: async (customer) => {
        set({ isLoading: true, error: null });
        try {
            const newCustomer = await customersApi.createCustomer(customer);
            set((state) => ({
                customers: [...state.customers, newCustomer],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateCustomer: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await customersApi.updateCustomer(id, updates);
            set((state) => ({
                customers: state.customers.map((c) =>
                    c.id === id ? { ...c, ...updates } : c
                ),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Court actions
    addCourt: async (court) => {
        set({ isLoading: true, error: null });
        try {
            const newCourt = await courtsApi.createCourt(court);
            set((state) => ({
                courts: [...state.courts, newCourt],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateCourt: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await courtsApi.updateCourt(id, updates);
            set((state) => ({
                courts: state.courts.map((c) =>
                    c.id === id ? { ...c, ...updates } : c
                ),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteCourt: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await courtsApi.deleteCourt(id);
            set((state) => ({
                courts: state.courts.filter((c) => c.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },
}));
