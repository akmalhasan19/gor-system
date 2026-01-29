import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * 192x192 icon for PWA manifest
 * Route: /icon-192
 */
export function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 120,
                    background: 'black',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D9F99D',
                    fontStyle: 'italic',
                    fontWeight: 900,
                    borderRadius: '15%',
                }}
            >
                S.
            </div>
        ),
        {
            width: 192,
            height: 192,
        }
    );
}
