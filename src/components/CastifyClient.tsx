// src/components/CastifyClient.tsx

'use client'; 

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk'; 
import React from 'react'; 

export default function CastifyClient() {
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl) {
            setError('Please enter a video URL.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Use the correct environment variable name
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

            // SUCCESS: Server has published the cast directly. 
            // We notify the user and optionally show the cast hash.
            const castHash = data.castHash || 'Unknown';
            const castMessage = `Cast successfully published! Click here to view and share it!`;

            // Display success status to the user
            setSuccess(castMessage);
            setVideoUrl(''); 
            
            // --- ACTION: OPEN NEW TAB TO THE CAST ---
            if (castHash && castHash !== 'Unknown') {
                 // Constructs the URL to view the cast on the Warpcast web client
                 const castLink = `https://warpcast.com/~/casts/${castHash}`;
                 // This opens the published cast in a new tab for easy sharing
                 window.open(castLink, '_blank'); 
            }

        } catch (err: any) {
            console.error("Client Submission Error:", err.message);
            // Display the specific error message returned from the server
            setError(`Error publishing cast: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

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
            {success && <p className="mt-4 text-sm text-green-600 font-medium">✅ {success}</p>}
        </div>
    );
}
