// src/components/CastifyClient.tsx

'use client'; 

import React, { useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk'; 

// This component performs the problematic SDK initialization in a build-safe way.
// NOTE: We rely on the Farcaster client to load the SDK, and let it handle initialization 
// in the background, rather than using a problematic useEffect hook.

export default function CastifyClient() {
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fullCastMessage, setFullCastMessage] = useState(''); // Stores the editable text

    // Helper function to copy text to clipboard (required due to iframe limitations)
    const copyToClipboard = (text: string) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            // document.execCommand('copy') is the most reliable method in iframes
            document.execCommand('copy'); 
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            return false;
        }
    };

    const handleCopyForEditing = () => {
        if (fullCastMessage) {
            if (copyToClipboard(fullCastMessage)) {
                setSuccess('✅ Full message copied to clipboard! Paste into a cast to add tags.');
            } else {
                setError('Failed to copy text. Please try manually selecting and copying the message.');
            }
        }
    };

    const getCastLink = (hash: string) => {
        // Constructs the URL to view the cast on the Warpcast web client
        return `https://warpcast.com/~/casts/${hash}`;
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
        setFullCastMessage('');

        try {
            // CRITICAL: Call the API route for server-side publishing
            const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-cast`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl }),
            });

            const data = await response.json();

            // --- Server Response Handling ---
            if (!response.ok || data.error || !data.success) {
                 // Throw the detailed error message returned by the server 
                 throw new Error(data.error || 'Unknown server publishing error.');
            }

            // SUCCESS: Server has published the cast directly. 
            const { castHash, castText, castEmbeds } = data;

            // Set the full message (text + embeds) for the "Copy to Edit" button
            // Concatenate the text and the embed URL for easy pasting by the user
            const fullEditableMessage = `${castText}\n\n${castEmbeds.map(e => e.url).join('\n')}`;
            setFullCastMessage(fullEditableMessage);
            
            // --- ACTION: Open Published Cast ---
            if (castHash) {
                 const castLink = getCastLink(castHash);
                 // Opens the published cast in a new tab for confirmation/sharing
                 if (window.innerWidth > 768) {
                    window.open(castLink, '_blank'); 
                 }
            }
            
            setSuccess('✅ Cast successfully published! Use the button below to copy the message.');
            setVideoUrl(''); 

        } catch (err: any) {
            console.error("Client Submission Error:", err.message);
            setError(`Error publishing cast: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

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

            {/* --- Copy for Editing / Mobile View Fallback --- */}
            {fullCastMessage && (
                <div className="mt-4 space-y-3 p-4 bg-yellow-50 border border-yellow-300 rounded-lg shadow-inner">
                    <p className="text-sm font-semibold text-gray-700">
                        Need tags? Copy the message below to edit, tag channels, and share!
                    </p>
                    
                    {/* The Copy Button */}
                    <button
                        onClick={handleCopyForEditing}
                        className="w-full text-center py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition duration-150 shadow-md"
                    >
                        Copy Text for Editing
                    </button>

                    {/* The View Cast Button (Mobile Fallback) */}
                    <a 
                        href={fullCastMessage.includes('warpcast.com/~/casts/') ? fullCastMessage.split('\n').find(line => line.includes('warpcast.com/~/casts/')) : getCastLink(JSON.parse(JSON.stringify(window)).castHash)}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block w-full text-center py-2 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition duration-150 shadow-md"
                    >
                        View Published Cast
                    </a>
                </div>
            )}
        </div>
    );
}
