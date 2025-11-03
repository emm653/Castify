// src/app/page.tsx

import type { Metadata } from 'next';
import CastifyClient from '../components/CastifyClient'; 

// --- METADATA (Uses the live Vercel URL for absolute paths) ---
export const metadata: Metadata = {
    title: 'Castify - Video to Cast Converter',
    description: 'Instantly turn any video link into a shareable Farcaster cast.',
    openGraph: {
        title: 'Castify - Launch App',
        description: 'Instantly share videos on Farcaster.',
        images: [
            {
                // CRITICAL: This URL MUST be absolute and point to the Vercel domain
                url: `https://castify-six.vercel.app/images/icon-1024x1024.png`, 
                width: 1024,
                height: 1024,
                alt: 'Castify Mini App Preview',
            },
        ],
    },
};
// -----------------------------------------------------------------

export default function CastifyAppPage() {
    return (
        <CastifyClient />
    );
}
