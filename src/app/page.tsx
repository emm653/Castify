import type { Metadata } from 'next';
import CastifyClient from '../components/CastifyClient'; 

// --- 1. DEFINE THE FC:MINIAPP PAYLOAD OBJECT ---
const fcMiniappPayload = {
    version: '1',
    // Guaranteed working placeholder image 
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

// --- 2. METADATA EXPORT (Simplest Form to avoid conflict) ---
export const metadata: Metadata = {
    title: 'Castify - Video to Cast Converter',
    description: 'Instantly turn any video link into a shareable Farcaster cast.',
    
    // Explicitly define the Farcaster tags
    other: {
        'fc:miniapp': JSON.stringify(fcMiniappPayload),
        'fc:frame': 'vNext', 
    }
};
// -----------------------------------------------------------------

// The Page file should ONLY export a React component and the metadata.
export default function CastifyAppPage() {
    return (
        // This is the component that holds all your UI and logic.
        <CastifyClient /> 
    );
}
