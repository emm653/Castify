import type { Metadata } from 'next';
import CastifyClient from '../components/CastifyClient'; 

// --- METADATA (Final simplified attempt to force Farcaster embed) ---
export const metadata: Metadata = {
    title: 'Castify - Video to Cast Converter',
    description: 'Instantly turn any video link into a shareable Farcaster cast.',
    
    // 1. STANDARD SEO
    // These generic tags are necessary for search engine display
    // but don't define the Farcaster Mini App action.
    
    // 2. CRITICAL FIX: Farcaster-specific Meta Tags
    // We are simplifying the JSON payload used in the 'other' property.
    other: {
        // Use a simpler, non-stringified payload structure for compatibility
        'fc:frame': 'vNext', 
        'fc:miniapp:version': '1',
        'fc:miniapp:image': 'https://castify-six.vercel.app/image.png',
        'fc:miniapp:button:1': 'Launch Castify',
        'fc:miniapp:button:1:action:type': 'launch_miniapp',
        'fc:miniapp:button:1:action:url': 'https://castify-six.vercel.app',
    }
};
// -----------------------------------------------------------------

export default function CastifyAppPage() {
    return (
        <CastifyClient />
    );
}
