// src/app/page.tsx

// No "use client" directive here. This file is a Server Component.

import type { Metadata } from 'next';
// Import the component containing all the interactive logic
import CastifyClient from '../components/CastifyClient'; 

// --- METADATA (Can be exported legally here) ---
// This is used by Next.js to inject <meta> tags for sharing
export const metadata: Metadata = {
    title: 'Castify - Video to Cast Converter',
    description: 'Instantly turn any video link into a shareable Farcaster cast.',
    openGraph: {
        title: 'Castify - Launch App',
        description: 'Instantly share videos on Farcaster.',
        images: [
            {
                // Placeholder image URL - ensure it's absolute HTTPS
                url: 'https://raw.githubusercontent.com/farcaster-samples/mini-app-starter/main/public/images/icon-1024x1024.png',
                width: 1024,
                height: 1024,
                alt: 'Castify Mini App Preview',
            },
        ],
    },
};
// -----------------------------------------------------------------

// This is the default export for the page. It just renders the Client Component.
export default function CastifyAppPage() {
    return (
        <CastifyClient />
    );
}
