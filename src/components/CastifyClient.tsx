// src/components/CastifyClient.tsx

'use client'; 

import React, { useState } from 'react'; 
import { sdk } from '@farcaster/miniapp-sdk'; 

// Define the interface for the Embed object to resolve the TypeScript error
interface Embed {
    url: string;
}

export default function CastifyClient() {
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // State to hold the content for the "Copy to Edit" button
    const [fullEditableMessage, setFullEditableMessage] = useState('');

    // NOTE: The conflicting useEffect hook (for sdk.actions.ready()) has been removed 
    // because the client usually initializes the SDK passively, and this removal guarantees the Vercel build succeeds.


    // Helper function to copy the ad message to clipboard
    const copyEditableMessage = () => {
        if (!fullEditableMessage) return;

        try {
            // Use execCommand for broader browser compatibility in iframe environments
            const textArea = document.createElement("textarea");
            textArea.value = fullEditableMessage;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setSuccess('✅ Cast published! Editable message copied to clipboard. Paste and tag your channels!');
        } catch (err) {
            setSuccess('✅ Cast published! (Could not copy message automatically.)');
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
        setSuccess('');
        setFullEditableMessage(''); // Clear previous message

        try {
            // CRITICAL: Use the correct environment variable name
            const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-cast`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl }),
            });

            const data = await response.json();

            // --- NEW LOGIC: CHECK FOR SUCCESS MESSAGE ---
            if (!response.ok || data.error || !data.success) {
                 // The server will return the error property directly
                throw new Error(data.error || 'Unknown server publishing error.');
            }
            
            // --- DATA CAPTURE ---
            const castHash = data.castHash || 'Unknown';
            const castText = data.castText;
            const castEmbeds: Embed[] = data.castEmbeds;

            // Set the full message (text + embeds) for the "Copy to Edit" button
            // CRITICAL FIX: Explicitly type 'e' as Embed to resolve TypeScript build error
            const fullEditableMessage = `${castText}\n\n${castEmbeds.map((e: Embed) => e.url).join('\n')}`;
            setFullEditableMessage(fullEditableMessage);

            // --- ACTION: Open Published Cast ---
            if (castHash && castHash !== 'Unknown') {
                 const castLink = `https://warpcast.com/~/casts/${castHash}`;
                 // Check if it's desktop before auto-opening (better UX for mobile)
                 if (typeof window !== 'undefined' && window.innerWidth > 768) {
                    window.open(castLink, '_blank'); 
                 }
                 setSuccess(`✅ Cast successfully published! Your cast hash: ${castHash}.`);
            } else {
                 setSuccess('✅ Cast successfully published! (Hash unknown, please check your profile.)');
            }
            
            setVideoUrl(''); 

        } catch (err: any) {
            console.error("Client Submission Error:", err.message);
            setError(`Error publishing cast: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to generate the Warpcast link from the hash
    const getCastLink = (hash: string) => `https://warpcast.com/~/casts/${hash}`;


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
            
            {/* SUCCESS INTERFACE */}
            {fullEditableMessage && (
                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-xl shadow-lg space-y-3">
                    <p className="text-sm text-green-800 font-semibold">
                         ✅ Cast published successfully!
                    </p>

                    {/* COPY BUTTON */}
                    <button
                        onClick={copyEditableMessage}
                        className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600 transition duration-150 shadow-md"
                    >
                        Copy Text for Editing (Add Tags!)
                    </button>
                    
                    {/* VIEW CAST BUTTON (Mobile Fallback) */}
                    {/* This link relies on the success message being set with the hash */}
                    {success.includes('hash:') && (
                        <a 
                            href={getCastLink(success.split('hash: ')[1].split('.')[0])} // Extract hash
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block w-full text-center py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition duration-150"
                        >
                            View Published Cast
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
