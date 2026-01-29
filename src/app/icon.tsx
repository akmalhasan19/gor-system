import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
    width: 512,
    height: 512,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 300,
                    background: 'black',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D9F99D', // Brand Lime
                    fontStyle: 'italic',
                    fontWeight: 900,
                    borderRadius: '15%', // Rounded corners like an app icon
                }}
            >
                S.
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
