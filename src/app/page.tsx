import type { Metadata } from 'next';
import CastifyClient from '../components/CastifyClient'; 

// --- METADATA (CRITICAL FIX: Removing redundant/conflicting Open Graph tags) ---
export const metadata: Metadata = {
    title: 'Castify - Video to Cast Converter',
    description: 'Instantly turn any video link into a shareable Farcaster cast.',
    
    // 1. REMOVED: The entire 'openGraph' block is removed to avoid conflict.
    
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
