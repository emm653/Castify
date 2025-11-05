import type { Metadata } from 'next';
import CastifyClient from '../components/CastifyClient'; 

// --- METADATA (Updated to include Farcaster-specific embed tags) ---
export const metadata: Metadata = {
    title: 'Castify - Video to Cast Converter',
    description: 'Instantly turn any video link into a shareable Farcaster cast.',
    
    // 1. Standard Open Graph Tags (for platforms like Twitter/X, and Farcaster fallback)
    openGraph: {
        title: 'Castify - Launch App',
        description: 'Instantly share videos on Farcaster.',
        images: [
            {
                url: `https://castify-six.vercel.app/image.png`, 
                width: 1200, // Recommended size for hero image
                height: 630, // Recommended size for hero image
                alt: 'Castify Mini App Preview',
            },
        ],
    },
    
    // 2. CRITICAL FIX: Farcaster-specific Meta Tags
    // This tells Farcaster exactly how to render the app when shared.
    other: {
        // fc:miniapp and fc:frame are the keys Farcaster looks for
        // The content needs to be stringified JSON describing the embed action.
        'fc:miniapp': JSON.stringify({
            version: '1',
            imageUrl: 'https://castify-six.vercel.app/image.png',
            button: {
                title: 'Launch Castify',
                action: {
                    type: 'launch_miniapp',
                    url: 'https://castify-six.vercel.app',
                    name: 'Castify'
                }
            }
        }),
        'fc:frame': 'vNext', // Compatibility tag
    }
};
// -----------------------------------------------------------------

export default function CastifyAppPage() {
    return (
        <CastifyClient />
    );
}
