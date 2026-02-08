import { create } from 'zustand';
import { Booking, Product, CartItem, Transaction, Customer } from './constants';
import * as bookingsApi from './api/bookings';
import * as productsApi from './api/products';
import * as customersApi from './api/customers';
import * as transactionsApi from './api/transactions';
import * as courtsApi from './api/courts';
import type { Court } from './api/courts';

// Type for Supabase realtime payloads
// Using `any` for record values as Supabase realtime data is dynamically typed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface RealtimePayload<T = Record<string, any>> {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T;
    old: T;
}

interface AppState {
    bookings: Booking[];
    products: Product[];
    cart: CartItem[];
    transactions: Transaction[];
    customers: Customer[];
    courts: Court[];
    isLoading: boolean;
    error: string | null;
    currentVenueId: string;
    selectedDate: string; // YYYY-MM-DD

    setSelectedDate: (date: string) => void;

    // Sync actions (fetch from DB)
    syncBookings: (venueId: string, date?: string) => Promise<void>;
    syncProducts: (venueId: string) => Promise<void>;
    syncCustomers: (venueId: string) => Promise<void>;
    syncTransactions: (venueId: string) => Promise<void>;
    syncCourts: (venueId: string) => Promise<void>;

    // Realtime actions (Optimistic Updates)
    handleRealtimeBooking: (payload: RealtimePayload) => void;
    handleRealtimeProduct: (payload: RealtimePayload) => void;
    handleRealtimeCustomer: (payload: RealtimePayload) => void;
    handleRealtimeTransaction: (payload: RealtimePayload) => void;
    handleRealtimeCourt: (payload: RealtimePayload) => void;


    // Booking actions
    addBooking: (venueId: string, booking: Omit<Booking, 'id'>) => Promise<void>;
    updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
    deleteBooking: (id: string) => Promise<void>;
    updateBooking: (venueId: string, id: string, updates: Partial<Booking>) => Promise<void>;
    setBookings: (bookings: Booking[]) => void;
    checkIn: (id: string) => Promise<void>;

    // Cart actions
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;

    // Transaction actions
    processTransaction: (venueId: string, items: CartItem[], paidAmount: number, paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER', customerInfo?: { name?: string; phone?: string; id?: string }) => Promise<Transaction>;
    setTransactions: (transactions: Transaction[]) => void;

    // Product actions
    updateProductStock: (id: string, amount: number) => Promise<void>;
    addProduct: (venueId: string, product: Omit<Product, 'id'>) => Promise<void>;
    removeProduct: (id: string) => Promise<void>;
    setProducts: (products: Product[]) => void;

    // Customer actions
    addCustomer: (venueId: string, customer: Omit<Customer, 'id'>) => Promise<void>;
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    setCustomers: (customers: Customer[]) => void;

    // Court actions
    addCourt: (venueId: string, court: Omit<Court, 'id' | 'venueId'>) => Promise<void>;
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
    currentVenueId: '',
    selectedDate: new Date().toLocaleDateString('en-CA'),

    setSelectedDate: (date: string) => set({ selectedDate: date }),

    // Sync methods
    syncBookings: async (venueId: string, date?: string) => {
        set({ isLoading: true, error: null });
        try {
            const bookings = await bookingsApi.getBookings(venueId, date);
            set({ bookings, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    syncProducts: async (venueId: string) => {
        set({ isLoading: true, error: null });
        try {
            const products = await productsApi.getProducts(venueId);
            set({ products, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    syncCustomers: async (venueId: string) => {
        set({ isLoading: true, error: null });
        try {
            const customers = await customersApi.getCustomers(venueId);
            set({ customers, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    syncTransactions: async (venueId: string) => {
        set({ isLoading: true, error: null });
        try {
            const transactions = await transactionsApi.getTransactions(venueId);
            set({ transactions, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    syncCourts: async (venueId: string) => {
        set({ isLoading: true, error: null, currentVenueId: venueId });
        try {
            if (!venueId) {
                console.warn('No venueId provided to syncCourts');
                set({ courts: [], isLoading: false });
                return;
            }
            const courts = await courtsApi.getCourts(venueId);
            set({ courts, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    // Realtime Handlers (Optimistic Updates)
    handleRealtimeBooking: (payload: RealtimePayload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const currentVenueId = get().currentVenueId;
        const selectedDate = get().selectedDate;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            // Check if matches current venue
            if (newRecord.venue_id !== currentVenueId) return;

            // Map to app model
            const booking: Booking = {
                id: newRecord.id,
                courtId: newRecord.court_id,
                startTime: newRecord.start_time,
                duration: Number(newRecord.duration) || 1,
                customerName: newRecord.customer_name,
                phone: newRecord.phone,
                price: Number(newRecord.price) || 0,
                paidAmount: Number(newRecord.paid_amount) || 0,
                status: newRecord.status,
                bookingDate: newRecord.booking_date,
                createdAt: newRecord.created_at,
                checkInTime: newRecord.check_in_time,
                isNoShow: newRecord.is_no_show,
            };

            // Check if matches selected date
            if (booking.bookingDate !== selectedDate) {
                // If it was an update and date changed FROM selectedDate -> Remove it
                if (eventType === 'UPDATE' && oldRecord && get().bookings.some(b => b.id === oldRecord.id)) {
                    set(state => ({
                        bookings: state.bookings.filter(b => b.id !== oldRecord.id)
                    }));
                }
                return;
            }

            set(state => {
                const exists = state.bookings.some(b => b.id === booking.id);
                if (exists) {
                    return {
                        bookings: state.bookings.map(b => b.id === booking.id ? booking : b)
                    };
                }
                return {
                    bookings: [...state.bookings, booking]
                };
            });
        } else if (eventType === 'DELETE') {
            set(state => ({
                bookings: state.bookings.filter(b => b.id !== oldRecord.id)
            }));
        }
    },

    handleRealtimeProduct: (payload: RealtimePayload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const currentVenueId = get().currentVenueId;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            if (newRecord.venue_id !== currentVenueId) return;

            const product: Product = {
                id: newRecord.id,
                name: newRecord.name,
                price: Number(newRecord.price),
                category: newRecord.category,
                stock: Number(newRecord.stock),
                image_url: newRecord.image_url
            };

            set(state => {
                const exists = state.products.some(p => p.id === product.id);
                if (exists) {
                    return {
                        products: state.products.map(p => p.id === product.id ? product : p)
                    };
                }
                return {
                    products: [...state.products, product]
                };
            });
        } else if (eventType === 'DELETE') {
            set(state => ({
                products: state.products.filter(p => p.id !== oldRecord.id)
            }));
        }
    },

    handleRealtimeCustomer: (payload: RealtimePayload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const currentVenueId = get().currentVenueId;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            if (newRecord.venue_id !== currentVenueId) return;

            const customer: Customer = {
                id: newRecord.id,
                name: newRecord.name,
                phone: newRecord.phone,
                isMember: newRecord.is_member,
                membershipExpiry: newRecord.membership_expiry,
                quota: newRecord.quota,
                photo_url: newRecord.photo_url,
                isDeleted: newRecord.is_deleted,
                deletedAt: newRecord.deleted_at
            };

            set(state => {
                const exists = state.customers.some(c => c.id === customer.id);
                if (exists) {
                    return {
                        customers: state.customers.map(c => c.id === customer.id ? customer : c)
                    };
                }
                return {
                    customers: [...state.customers, customer]
                };
            });
        } else if (eventType === 'DELETE') {
            set(state => ({
                customers: state.customers.filter(c => c.id !== oldRecord.id)
            }));
        }
    },

    handleRealtimeTransaction: (payload: RealtimePayload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const currentVenueId = get().currentVenueId;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            if (newRecord.venue_id !== currentVenueId) return;

            set(state => {
                const existingTransaction = state.transactions.find(t => t.id === newRecord.id);

                // Map snake_case to camelCase
                const updatedTransactionData = {
                    id: newRecord.id,
                    date: newRecord.created_at,
                    totalAmount: Number(newRecord.total_amount) || 0,
                    paidAmount: Number(newRecord.paid_amount) || 0,
                    paymentMethod: newRecord.payment_method,
                    status: newRecord.status,
                    cashierName: 'Admin', // Default or from DB if available column
                    customerId: newRecord.customer_id,
                    customerName: newRecord.customer_name,
                    customerPhone: newRecord.customer_phone,
                    // Preserve items if updating, or empty if new
                    items: existingTransaction?.items || [],
                    changeAmount: (Number(newRecord.paid_amount) || 0) >= (Number(newRecord.total_amount) || 0)
                        ? (Number(newRecord.paid_amount) || 0) - (Number(newRecord.total_amount) || 0)
                        : 0,
                };

                if (existingTransaction) {
                    return {
                        transactions: state.transactions.map(t =>
                            t.id === newRecord.id
                                ? { ...t, ...updatedTransactionData, items: t.items } // Ensure items are preserved absolutely
                                : t
                        )
                    };
                }

                // For INSERT, we might not have items, but we should add it anyway so it appears
                // Ideally we should fetch the items, but for now let's add it.
                // If the user needs to see items, they might need to refresh or we should trigger a fetch.
                // But for "Revenue" calculation, items are not strictly needed (it uses totalAmount).
                return {
                    transactions: [updatedTransactionData as Transaction, ...state.transactions]
                };
            });
        } else if (eventType === 'DELETE') {
            set(state => ({
                transactions: state.transactions.filter(t => t.id !== oldRecord.id)
            }));
        }
    },

    handleRealtimeCourt: (payload: RealtimePayload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const currentVenueId = get().currentVenueId;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            if (newRecord.venue_id !== currentVenueId) return;

            const court: Court = {
                id: newRecord.id,
                venueId: newRecord.venue_id,
                name: newRecord.name,
                courtNumber: newRecord.court_number,
                isActive: newRecord.is_active,
                hourlyRate: Number(newRecord.hourly_rate),
                memberHourlyRate: Number(newRecord.member_hourly_rate),
                photoUrl: newRecord.photo_url,
                courtType: newRecord.court_type,
                notes: newRecord.notes
            };

            set(state => {
                const exists = state.courts.some(c => c.id === court.id);
                if (exists) {
                    return {
                        courts: state.courts.map(c => c.id === court.id ? court : c)
                    };
                }
                return {
                    courts: [...state.courts, court]
                };
            });
        } else if (eventType === 'DELETE') {
            set(state => ({
                courts: state.courts.filter(c => c.id !== oldRecord.id)
            }));
        }
    },

    // Setters for realtime updates
    setBookings: (bookings) => set({ bookings }),
    setProducts: (products) => set({ products }),
    setCustomers: (customers) => set({ customers }),
    setTransactions: (transactions) => set({ transactions }),
    setCourts: (courts) => set({ courts }),

    // Booking actions
    addBooking: async (venueId: string, booking) => {
        set({ isLoading: true, error: null });
        try {
            const newBooking = await bookingsApi.createBooking(venueId, booking);

            // If booking has a payment (Sudah Bayar), create a transaction record automatically
            // This ensures it shows up in Dashboard and Reports
            if (newBooking.paidAmount > 0) {
                const isFullPayment = newBooking.paidAmount >= newBooking.price;
                const status = isFullPayment ? 'PAID' : 'PARTIAL';

                // Create a temporary CartItem for the transaction
                const bookingItem: CartItem = {
                    id: `booking-${newBooking.id}`,
                    type: 'BOOKING',
                    name: `Booking ${newBooking.customerName || 'Tamu'} - ${newBooking.courtId}`,
                    price: newBooking.price,
                    quantity: 1,
                    referenceId: newBooking.id
                };

                // Create the transaction (assume CASH for "Sudah Bayar" option)
                const newTransaction = await transactionsApi.createTransaction(
                    venueId,
                    [bookingItem],
                    newBooking.paidAmount,
                    'CASH',
                    status,
                    {
                        name: newBooking.customerName,
                        phone: newBooking.phone,
                        // We don't have customer ID here easily unless we query it, but name/phone is enough for now 
                        // or we could try to look it up if we wanted strict linking, but for "Booking" usually name/phone is from input.
                        // If it came from a "Member" booking, we might want to pass that ID. 
                        // But strictly speaking, Booking object doesn't have customerId field usually? 
                        // Wait, looking at Booking interface: customerName, phone. No customerId.
                        // However, createBooking implementation MIGHT have it if we upgraded it? 
                        // For now, let's just pass name and phone.
                    }
                );

                // Update store with new transaction
                set((state) => ({
                    bookings: [...state.bookings, newBooking],
                    transactions: [newTransaction, ...state.transactions], // Add to top
                    isLoading: false
                }));
            } else {
                set((state) => ({
                    bookings: [...state.bookings, newBooking],
                    isLoading: false
                }));
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateBookingStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            const venueId = get().currentVenueId;
            if (!venueId) throw new Error('No venue selected');
            await bookingsApi.updateBooking(venueId, id, { status });
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

    updateBooking: async (venueId: string, id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await bookingsApi.updateBooking(venueId, id, updates);
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

    checkIn: async (id: string) => {
        try {
            await bookingsApi.checkInBooking(id);
            set((state) => ({
                bookings: state.bookings.map((b) =>
                    b.id === id ? { ...b, checkInTime: new Date().toISOString() } : b
                )
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    // Cart actions (local + DB sync for bookings)
    addToCart: (item) => {
        const state = get();
        const existingItem = state.cart.find((i) => i.id === item.id);

        if (item.type === 'BOOKING' && existingItem) {
            return;
        }

        // For BOOKING type, update in_cart_since in database to pause timer
        if (item.type === 'BOOKING' && item.referenceId && state.currentVenueId) {
            bookingsApi.updateBooking(state.currentVenueId, item.referenceId, {
                inCartSince: new Date().toISOString()
            }).catch(console.error);
        }

        if (existingItem) {
            set({
                cart: state.cart.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                )
            });
        } else {
            set({ cart: [...state.cart, item] });
        }
    },

    removeFromCart: (itemId) => {
        const state = get();
        const item = state.cart.find((i) => i.id === itemId);

        // For BOOKING type, clear in_cart_since to resume timer
        if (item?.type === 'BOOKING' && item.referenceId && state.currentVenueId) {
            bookingsApi.updateBooking(state.currentVenueId, item.referenceId, {
                inCartSince: undefined
            }).catch(console.error);
        }

        set({ cart: state.cart.filter((i) => i.id !== itemId) });
    },

    clearCart: () => set({ cart: [] }),

    // Transaction actions
    processTransaction: async (venueId: string, items, paidAmount, paymentMethod, customerInfo) => {
        set({ isLoading: true, error: null });
        try {
            const newTransaction = await transactionsApi.createTransaction(
                venueId,
                items,
                paidAmount,
                paymentMethod,
                paidAmount >= items.reduce((sum, i) => sum + i.price * i.quantity, 0) ? 'PAID' : 'PARTIAL',
                customerInfo
            );

            set((state) => ({
                transactions: [newTransaction, ...state.transactions],
                cart: [],
                isLoading: false
            }));

            // Refresh bookings and products to reflect updated status/stock
            // Run in parallel (no await needed - fire and forget for background sync)
            Promise.all([
                get().syncBookings(venueId),
                get().syncProducts(venueId)
            ]).catch(console.error);

            // Return the transaction
            return newTransaction;
        } catch (error: any) {
            // Check if it's a network error
            const isNetworkError =
                !navigator.onLine ||
                error.message?.includes('fetch') ||
                error.message?.includes('Failed to fetch') ||
                error.message?.includes('NetworkError') ||
                error.message?.includes('network');

            if (isNetworkError) {
                // Import sync-queue dynamically to avoid circular dependencies
                const { addToQueue, isBackgroundSyncSupported } = await import('@/lib/sync-queue');

                if (isBackgroundSyncSupported()) {
                    // Queue for background sync
                    const queuedTransaction = {
                        id: crypto.randomUUID(),
                        venueId,
                        items,
                        paidAmount,
                        paymentMethod,
                        timestamp: Date.now(),
                        retryCount: 0,
                        customerInfo
                    };

                    await addToQueue(queuedTransaction);

                    // Register sync event
                    if ('serviceWorker' in navigator) {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.sync.register('sync-transactions');
                    }

                    // Clear cart and show success message
                    set({ cart: [], isLoading: false, error: null });

                    // Import toast dynamically
                    const { toast } = await import('sonner');
                    toast.info('📡 Transaksi disimpan. Akan otomatis tersinkronisasi saat online.', {
                        duration: 5000,
                    });

                    // Return a placeholder transaction for the queued item
                    const placeholderTransaction: Transaction = {
                        id: queuedTransaction.id,
                        date: new Date().toISOString(),
                        items,
                        totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
                        paidAmount,
                        changeAmount: 0,
                        paymentMethod,
                        status: 'PENDING',
                        cashierName: 'System',
                        customerId: customerInfo?.id,
                        customerName: customerInfo?.name,
                        customerPhone: customerInfo?.phone
                    };
                    return placeholderTransaction;
                } else {
                    // Background Sync not supported
                    set({ error: 'Transaksi gagal. Background Sync tidak didukung di browser ini. Silakan coba lagi saat online.', isLoading: false });
                    const { toast } = await import('sonner');
                    toast.error('Transaksi gagal. Silakan coba lagi saat online.');
                    throw new Error('Background Sync not supported');
                }
            }

            // For non-network errors, throw as usual
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

    addProduct: async (venueId: string, product) => {
        set({ isLoading: true, error: null });
        try {
            const newProduct = await productsApi.createProduct(venueId, product);
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
            await productsApi.archiveProduct(id); // Soft delete by default
            set((state) => ({
                products: state.products.filter((p) => p.id !== id),
                cart: state.cart.filter((c) => c.id !== id && c.referenceId !== id), // Also remove from cart
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Customer actions
    addCustomer: async (venueId: string, customer) => {
        set({ isLoading: true, error: null });
        try {
            const newCustomer = await customersApi.createCustomer(venueId, customer);
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

    deleteCustomer: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await customersApi.deleteCustomer(id);
            set((state) => ({
                customers: state.customers.filter((c) => c.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Court actions
    addCourt: async (venueId: string, court) => {
        set({ isLoading: true, error: null });
        try {
            const newCourt = await courtsApi.createCourt(venueId, court);
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
