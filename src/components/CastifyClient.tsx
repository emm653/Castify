import React, { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk'; 

// --- Helper component to isolate useEffect and SDK initialization ---
// This structural separation helps Next.js compile correctly by ensuring 
// the initialization hook is isolated inside a clearly defined Client Component boundary.
function AppInitializer() {
    useEffect(() => {
        const initializeSdk = async () => {
            try {
                // CRITICAL FIX: Tell the Farcaster client the app is ready
                await sdk.actions.ready();
                console.log("Farcaster SDK is ready.");
            } catch (e) {
                console.error("Farcaster SDK initialization failed:", e);
            }
        };

        initializeSdk();

        // Optional: Clean up if the app is closed
        return () => {
            sdk.actions.close(); 
        };
    }, []);
    return null; // This component renders nothing, it just handles setup.
}


export default function CastifyClient() {
    // --- STATE ---
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState<{ castHash: string, castText: string, castEmbeds: { url: string }[] } | null>(null);

    // Function to handle the form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl) {
            setError('Please enter a video URL.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessData(null); // Clear previous results

        try {
            // Use the correct environment variable name (as per your Vercel setup)
            const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-cast`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl }),
            });

            const data = await response.json();

            // --- Server-Side Publishing Response Handler ---
            if (!response.ok || data.error) {
                 // The server will return the error property directly
                throw new Error(data.error || 'Unknown server publishing error.');
            }

            // SUCCESS: Server has published the cast directly. 
            setSuccessData({
                castHash: data.castHash || 'Unknown',
                castText: data.castText,
                castEmbeds: data.castEmbeds
            });
            
            // --- ACTION: OPEN NEW TAB TO THE CAST (Desktop Users) ---
            const castLink = `https://warpcast.com/~/casts/${data.castHash}`;
            if (data.castHash && typeof window !== 'undefined' && window.innerWidth > 768) {
                 window.open(castLink, '_blank'); 
            }
            
            setVideoUrl(''); // Clear the input field

        } catch (err: any) {
            console.error("Client Submission Error:", err.message);
            setError(`Error publishing cast: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Helper function to copy the full message/URL to clipboard
    const copyEditableText = () => {
        if (!successData) return;
        
        // Use the combined message: cast text + embeds
        const fullEditableMessage = `${successData.castText}\n\n`;

        try {
            // Use execCommand for broader browser compatibility in iframe environments
            const textArea = document.createElement("textarea");
            textArea.value = fullEditableMessage;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Update the state for visual feedback
            setError(''); 
            alert('✅ Editable cast message copied to clipboard! Paste it in the Warpcast composer to add tags.');

        } catch (err) {
            setError('Could not copy text automatically. Please copy manually.');
        }
    };

    // --- The UI rendered to the user ---
    return (
        <div className="p-8 max-w-lg mx-auto bg-gray-50 min-h-screen">
            <AppInitializer /> {/* Initializes the SDK */}
            <h1 className="text-3xl font-extrabold mb-2 text-indigo-700">🎬 Castify</h1>
            <p className="mb-6 text-gray-600">
                Turn any link into a guaranteed shareable cast.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg">

                {/* URL Input Field */}
                <div>
                    <label htmlFor="video-url" className="block text-sm font-medium text-gray-700">
                        Link to Video or Content
                    </label>
                    <input
                        type="url"
                        id="video-url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Paste YouTube, Vimeo, Blog, or NFT link"
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={loading}
                        required
                    />
                </div>

                {/* Action Button */}
                <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition duration-150 shadow-md"
                    disabled={loading}
                >
                    {loading ? 'Publishing Cast...' : 'Generate & Publish Now'}
                </button>
            </form>

            {/* Status Messages / Success Block */}
            {error && <p className="mt-4 text-sm text-red-600 font-medium">⚠️ {error}</p>}
            
            {successData && (
                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg shadow-inner">
                    <p className="font-bold text-green-700 mb-2">✅ Cast Published Successfully!</p>
                    
                    {/* The Copy Button for Flexible Sharing */}
                    <button
                        onClick={copyEditableText}
                        className="w-full text-center py-2 mb-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition duration-150 shadow-md"
                    >
                        Copy Text for Editing & Tags
                    </button>

                    {/* View Cast Button (Mobile Fallback / Desktop Confirmation) */}
                    {successData.castHash && successData.castHash !== 'Unknown' && (
                        <>
                            <a 
                                href={`https://warpcast.com/~/casts/${successData.castHash}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block w-full text-center py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-150 shadow-md"
                            >
                                View Published Cast
                            </a>
                            <p className="mt-2 text-xs text-gray-600 text-center">
                                Tap the button above to view and share your cast on mobile.
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
