import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk'; 
import React from 'react'; 

export default function CastifyClient() {
    // --- STATE ---
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [castHash, setCastHash] = useState<string | null>(null);
    // State to store the text and URL received from the server for the Copy feature
    const [copiedContent, setCopiedContent] = useState({ text: '', url: '' });


    // CRITICAL: SDK Ready Fix 
    useEffect(() => {
        const initializeSdk = async () => {
            try {
                await sdk.actions.ready();
                console.log("Farcaster SDK is ready.");
            } catch (e) {
                console.error("Farcaster SDK initialization failed:", e);
            }
        };
        initializeSdk();
        // This useEffect does not need cleanup as the SDK only needs to be ready once.
    }, []); 
    
    // Helper function to copy text to clipboard
    const copyTextToClipboard = (text: string) => {
        try {
            // Use execCommand for broader compatibility in iframe environments
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Show a quick success alert instead of changing the main box
            alert('Cast text and URL copied to clipboard! Paste it into a new cast to edit and add tags.');
        } catch (err) {
            // Fallback for environments that restrict copy
            alert('Could not copy automatically. Please manually copy the text from the success box.');
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl) {
            setError('Please enter a video URL.');
            return;
        }

        setLoading(true);
        setError('');
        setCastHash(null); // Reset previous success

        try {
            // NOTE: Using NEXT_PUBLIC_BASE_URL as per your Vercel configuration
            const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-cast`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl }),
            });

            const data = await response.json();

            if (!response.ok || data.error || !data.success) {
                // Throw the specific error message received from the server
                throw new Error(data.error || 'Unknown server publishing error.');
            }
            
            // SUCCESS: Server has published the cast directly.
            setCastHash(data.castHash); 
            
            // Store the content for the Copy feature
            setCopiedContent({ 
                text: data.castText, 
                // data.castEmbeds[0]?.url contains the original video URL
                url: data.castEmbeds[0]?.url || videoUrl 
            });

            const castLink = `https://warpcast.com/~/casts/${data.castHash}`;
            
            // Open the published cast in a new tab for desktop users
            if (window.innerWidth > 768) { 
                 window.open(castLink, '_blank'); 
            }

        } catch (err: any) {
            console.error("Client Submission Error:", err.message);
            setError(`Error publishing cast: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper to construct the full link for the success button
    const getCastLink = () => {
        return `https://warpcast.com/~/casts/${castHash}`;
    };

    // The logic to prepare the full, editable message to copy: TEXT + URL + #TAG
    // This is the message that goes onto the user's clipboard.
    const fullEditableMessage = `${copiedContent.text}\n${copiedContent.url}\n\n#Castify`;


    // The UI rendered to the user
    return (
        <div className="p-8 max-w-lg mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-extrabold mb-2 text-indigo-700">🎬 Castify</h1>
            <p className="mb-6 text-gray-600">
                Turn any video link into a shareable Farcaster cast.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg">

                {/* URL Input Field */}
                <div>
                    <label htmlFor="video-url" className="block text-sm font-medium text-gray-700">
                        Video Link
                    </label>
                    <input
                        type="url"
                        id="video-url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Paste YouTube, Vimeo, etc. link"
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

            {/* Status Messages */}
            {error && <p className="mt-4 text-sm text-red-600 font-medium">⚠️ {error}</p>}
            
            {/* SUCCESS BOX: Displays the link and the new copy button */}
            {castHash && (
                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg shadow-inner">
                    <p className="text-green-800 font-semibold mb-3">✅ Cast Successfully Published!</p>
                    
                    {/* BUTTON 1: View Published Cast (for mobile/manual desktop) */}
                    <a 
                        href={getCastLink()} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block w-full text-center py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-150 shadow-md"
                    >
                        View & Share Your New Cast
                    </a>
                    
                    <div className="mt-4 border-t border-green-300 pt-3">
                        <p className="text-sm text-green-700 font-medium mb-2">Want to add tags or context?</p>
                        
                        {/* BUTTON 2: Copy Text for Editing */}
                        <button
                            onClick={() => copyTextToClipboard(fullEditableMessage)}
                            className="w-full text-center py-2 bg-yellow-500 text-gray-800 font-semibold rounded-lg hover:bg-yellow-600 transition duration-150 shadow-md"
                        >
                            Copy Text for Editing
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
