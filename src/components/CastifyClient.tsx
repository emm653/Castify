// src/components/CastifyClient.tsx

'use client'; // REQUIRED for hooks and browser APIs

import { useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk'; // The Farcaster SDK
import React from 'react'; // Necessary for React.FormEvent type

export default function CastifyClient() {
    // --- STATE AND HOOKS ---
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Function to handle the form submission
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
            // --- FINAL API CALL LOGIC ---
            // CRITICAL FIX: Changed from NEXT_PUBLIC_URL to NEXT_PUBLIC_BASE_URL 
            // to match your Vercel environment variable name.
            const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-cast`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                // Displays the custom error message returned by the server 
                throw new Error(data.error || 'Unknown error occurred.');
            }

            // 2. SUCCESS: Use the Farcaster SDK to open the Cast Composer
            await sdk.actions.composeCast({
                text: data.payload.text,
                embeds: data.payload.embeds,
            });

            setSuccess('Cast composer opened successfully! Check your Farcaster client.');
            setVideoUrl(''); // Clear the input field

        } catch (err: any) {
            // Catch network errors and errors returned by the API
            console.error("Client Error:", err.message);
            setError(`Error: ${err.message}`);
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
                    {loading ? 'Processing...' : 'Generate & Cast Now'}
                </button>
            </form>

            {/* Status Messages */}
            {error && <p className="mt-4 text-sm text-red-600 font-medium">⚠️ {error}</p>}
            {success && <p className="mt-4 text-sm text-green-600 font-medium">✅ {success}</p>}
        </div>
    );
}
