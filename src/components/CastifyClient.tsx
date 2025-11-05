// src/components/CastifyClient.tsx

'use client'; 

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk'; 
import React from 'react'; 

export default function CastifyClient() {
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [castHash, setCastHash] = useState<string | null>(null); // Store hash for link/button

    // CRITICAL: SDK Ready Fix (from earlier step)
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
    }, []); 
    
    // Helper function to copy the ad message to clipboard
    const copyAdMessage = () => {
        // Use the environment variable correctly. We'll rely on the global success/error state for feedback.
        const adMessage = `I just used Castify to post this video! It makes video embeds instant and clean. Try Castify now: ${process.env.NEXT_PUBLIC_BASE_URL} #Castify #FarcasterDev`;
        try {
            // Use execCommand for broader browser compatibility in iframe environments
            const textArea = document.createElement("textarea");
            textArea.value = adMessage;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        } catch (err) {
            console.error("Copy failed:", err);
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
        setCastHash(null); // Clear previous hash

        try {
            const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-cast`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl }),
            });

            const data = await response.json();

            if (!response.ok || data.error || !data.success) {
                throw new Error(data.error || 'Unknown server publishing error.');
            }

            // SUCCESS: Server has published the cast directly. 
            const newCastHash = data.castHash || null;
            
            setCastHash(newCastHash);
            setVideoUrl(''); 
            
            // Immediately copy ad message to clipboard
            copyAdMessage();
            
            // Optional: Auto-open for desktop for good UX, but mobile will rely on the button
            if (window.innerWidth > 768 && newCastHash) {
                 const castLink = `https://warpcast.com/~/casts/${newCastHash}`;
                 window.open(castLink, '_blank'); 
            }

        } catch (err: any) {
            console.error("Client Submission Error:", err.message);
            setError(`Error publishing cast: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Helper to generate the cast link for the button
    const getCastLink = () => {
        return `https://warpcast.com/~/casts/${castHash}`;
    }

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
            
            {/* NEW SUCCESS/LINK BUTTON LOGIC */}
            {castHash && (
                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg shadow-inner">
                    <p className="text-green-700 font-semibold mb-3">✅ Cast successfully published!</p>
                    <a 
                        href={getCastLink()} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block w-full text-center py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-150 shadow-md"
                    >
                        View & Share Your New Cast
                    </a>
                    <p className="text-green-700 text-sm mt-3">
                        Ad message copied! Paste it in the cast to promote Castify.
                    </p>
                </div>
            )}
        </div>
    );
}
