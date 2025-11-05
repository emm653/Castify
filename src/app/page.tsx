import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
// We need the Neynar Node SDK to publish the cast directly
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// --- Initialize Neynar Client ---
// Ensure NEYNAR_API_KEY is set in Vercel environment variables
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;

if (!NEYNAR_API_KEY || !SIGNER_UUID) {
    console.error("NEYNAR_API_KEY or SIGNER_UUID is missing in environment variables.");
    // We will let the route fail gracefully if the keys are missing
}

const neynarClient = NEYNAR_API_KEY
    ? new NeynarAPIClient(new Configuration({ apiKey: NEYNAR_API_KEY }))
    : null;

export async function POST(request: NextRequest) {
    let videoUrl = "";

    // 1. Basic Auth and Input Check
    if (!neynarClient) {
        return NextResponse.json({ error: "Server configuration error: Neynar client not initialized." }, { status: 500 });
    }

    try {
        ({ videoUrl } = await request.json());

        if (!videoUrl) {
            return NextResponse.json({ error: "Missing video URL." }, { status: 400 });
        }

        // 2. Fetch Metadata using Web Scraping
        const response = await axios.get(videoUrl, {
            timeout: 15000, 
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; Farcaster/2.0; +https://www.farcaster.xyz)", 
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            },
        });

        const html = response.data;
        const $ = cheerio.load(html);

        const videoTitle =
            $('meta[property="og:title"]').attr("content") || "Watch this awesome video!";
        
        // Use the original video URL as the primary embed
        const embeds = [{ url: videoUrl }];

        // 3. Construct Cast Text and Payload
        const castText = `🎬 ${videoTitle}\n\n[Watch Now](${videoUrl})\n\n#Castify`;

        // 4. Submit the Cast Directly to the Farcaster Hub via Neynar
        // This bypasses the client-side signing process that was failing.
        const castResponse = await neynarClient.publishCast({
            signerUuid: SIGNER_UUID!, // Assumed to be set via Vercel ENV
            text: castText,
            embeds: embeds,
            channelId: "Castify", // Optional: If you want to post to a specific channel
        });

        // 5. Success Response (Telling the client the cast is published)
        return NextResponse.json({
            success: true,
            message: "Cast published successfully!",
            castHash: castResponse.cast.hash,
        }, { status: 200 });

    } catch (error: any) {
        let message = "Cast submission failed.";
        let status = 500;

        // Enhanced error handling for a direct cast post
        if (axios.isAxiosError(error) && error.response) {
            message = `API Error: ${error.response.data.message || error.response.statusText}`;
            status = error.response.status;
        } else if (error instanceof SyntaxError) {
            message = "Invalid input data.";
            status = 400;
        } else if (error.message.includes("Neynar")) {
             // Handle explicit Neynar/Signer errors
            message = `Signer Error: Check NEYNAR_SIGNER_UUID permissions.`;
            status = 500;
        }

        console.error("Server-Side Cast Error:", error);
        return NextResponse.json({ error: message }, { status });
    }
}
