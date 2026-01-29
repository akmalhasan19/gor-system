import { MetadataRoute } from 'next';

/**
 * PWA Web App Manifest
 * 
 * This manifest provides metadata for the Progressive Web App.
 * It enables install prompts, defines icons, and configures the app's appearance.
 * 
 * @see https://web.dev/add-manifest/
 * @see https://developer.chrome.com/docs/devtools/progressive-web-apps/
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        // Core identity
        id: '/smash-partner-pwa', // Unique identifier for the PWA
        name: 'Smash GOR Management',
        short_name: 'Smash Partner', // Max 12 chars for home screen
        description: 'Operating System untuk Manajemen Gedung Olahraga (GOR). Kelola jadwal lapangan, booking, pembayaran, dan member dengan mudah.',

        // Launch configuration
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any', // Allow both portrait and landscape

        // Theming
        background_color: '#ffffff',
        theme_color: '#D9F99D', // Brand lime color

        // Categorization
        categories: ['business', 'productivity', 'sports'],

        // Icons - Multiple sizes for different platforms
        icons: [
            // Standard icon (any purpose)
            {
                src: '/icon',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            // 192x192 for PWA install
            {
                src: '/icon-192',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            // Maskable icon for Android adaptive icons
            {
                src: '/icon-maskable',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
            // Apple touch icon
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any',
            },
        ],

        // Screenshots for richer install UI (Chrome 91+, Edge 91+)
        // NOTE: These are placeholders. Replace with actual screenshots when available.
        screenshots: [
            {
                src: '/screenshots/dashboard-mobile.png',
                sizes: '1080x1920',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'Dashboard - Lihat ringkasan GOR Anda',
            },
            {
                src: '/screenshots/scheduler-mobile.png',
                sizes: '1080x1920',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'Jadwal - Kelola booking lapangan',
            },
            {
                src: '/screenshots/pos-mobile.png',
                sizes: '1080x1920',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'POS - Catat transaksi dengan cepat',
            },
            {
                src: '/screenshots/dashboard-desktop.png',
                sizes: '1920x1080',
                type: 'image/png',
                form_factor: 'wide',
                label: 'Dashboard Desktop - Tampilan lengkap',
            },
        ],

        // Related applications (optional - uncomment if you have native apps)
        // related_applications: [],
        // prefer_related_applications: false,
    };
}

