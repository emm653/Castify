import type { Metadata } from 'next';
import CastifyClient from '../components/CastifyClient'; 

// --- 1. DEFINE THE FC:MINIAPP PAYLOAD OBJECT ---
const fcMiniappPayload = {
    version: '1',
    // CRITICAL FIX: Use a reliable, non-Vercel URL for the image to eliminate local asset failure
    imageUrl: 'https://placehold.co/1200x630/4C4D9F/ffffff?text=Castify+App',
    button: {
        title: 'Launch Castify',
        action: {
            type: 'launch_miniapp',
            url: 'https://castify-six.vercel.app',
            name: 'Castify'
        }
    }
};
// We use JSON.stringify() ONLY in the context of the metadata export.
// Next.js often expects this to be a fully qualified string when using the 'other' property.

// --- 2. METADATA EXPORT (Simplest Form) ---
export const metadata: Metadata = {
    title: 'Castify - Video to Cast Converter',
    description: 'Instantly turn any video link into a shareable Farcaster cast.',
    
    // CRITICAL FIX: Use the specific Farcaster property names with the JSON stringified value
    // We explicitly define the fc:miniapp and fc:frame meta tags here.
    other: {
        'fc:miniapp': JSON.stringify(fcMiniappPayload),
        'fc:frame': 'vNext', 
    }
};
// -----------------------------------------------------------------

export default function CastifyAppPage() {
    return (
        <CastifyClient />
    );
}
