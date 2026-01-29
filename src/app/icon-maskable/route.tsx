import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * 512x512 maskable icon for Android adaptive icons
 * Route: /icon-maskable
 * 
 * Maskable icons have a safe zone (center 80%) that won't be cropped.
 * Full-bleed background recommended.
 */
export function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 200,
                    background: '#D9F99D', // Brand lime - full bleed
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'black',
                    fontStyle: 'italic',
                    fontWeight: 900,
                }}
            >
                S.
            </div>
        ),
        {
            width: 512,
            height: 512,
        }
    );
}
