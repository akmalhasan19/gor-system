import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Smash GOR Management',
        short_name: 'Smash Partner',
        description: 'Operating System for Sports Hall Management',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#D9F99D',
        icons: [
            {
                src: '/icon', // Next.js will resolve this to the generated icon from icon.tsx
                sizes: 'any',
                type: 'image/png',
            },
            {
                src: '/apple-icon', // Next.js resolves apple-icon.tsx
                sizes: '180x180',
                type: 'image/png',
            }
        ],
    };
}
