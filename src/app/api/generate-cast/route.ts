import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// Define the expected fields returned on success (for the client component)
interface CastResult {
    castHash: string;
    castText: string;
    castEmbeds: { url: string }[];
}

// This defensive check resolves the Vercel/TypeScript error
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;

if (!NEYNAR_API_KEY) {
    // If the API Key is missing during runtime, this error will be thrown
    console.error("CRITICAL ERROR: NEYNAR_API_KEY is not set.");
}

// Initialize client outside of the function. Use '!' to assert non-null only if safe
// NOTE: We wrap the configuration to satisfy TypeScript's requirement for a non-undefined API Key string.
const client = new NeynarAPIClient(
    new Configuration({ apiKey: NEYNAR_API_KEY || "dummy_api_key_for_type_safety" })
);
// -------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
    let videoUrl = "";

    // 1. Critical Environment Check (Runtime Failover)
    if (!NEYNAR_API_KEY || !NEYNAR_SIGNER_UUID) {
        return NextResponse.json({
            error: "Signer Error: Missing NEYNAR_API_KEY or NEYNAR_SIGNER_UUID environment variables on the server. Please check Vercel configuration."
        }, { status: 500 });
    }

    try {
        // 2. Parse the incoming JSON body
        ({ videoUrl } = await request.json());

        if (!videoUrl) {
            return NextResponse.json({ error: "Missing video URL." }, { status: 400 });
        }

        // 3. Fetch site HTML and Scrape metadata
        const response = await axios.get(videoUrl, {
            timeout: 15000, 
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; Farcaster/2.0; +https://www.farcaster.xyz)",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            },
        });

        const $ = cheerio.load(response.data);

        // Scrape metadata
        const videoTitle =
            $('meta[property="og:title"]').attr("content") || "Watch this awesome video!";

        let videoImage = $('meta[property="og:image"]').attr("content");
        
        // Final fallback/link adjustment
        if (videoImage && videoImage.startsWith("/")) {
            const baseUrl = new URL(videoUrl).origin;
            videoImage = baseUrl + videoImage;
        }

        // 4. Construct the Payload for Publishing
        
        // This is the message we want to post
        const castText = `🎬 ${videoTitle}\n\n[Watch Link](${videoUrl})\n\n#Castify`;
        
        // Embeds must contain the original URL for the rich video card to render
        const castEmbeds: { url: string }[] = [{ url: videoUrl }];
        
        if (videoImage) {
            // Optionally include the image as a secondary embed
            // castEmbeds.push({ url: videoImage }); 
        }

        // 5. Publish Cast Directly to Farcaster Hub (Server-Side Publishing)
        const publishResponse = await client.publishCast({
            signerUuid: NEYNAR_SIGNER_UUID,
            text: castText,
            embeds: castEmbeds,
            // Optionally, specify a channel: channel_id: 'build' 
        });

        const castHash = publishResponse.cast?.hash || 'Unknown';
        
        // 6. Return the data the client needs for success confirmation
        const result: CastResult = {
            castHash: castHash,
            castText: castText,
            castEmbeds: castEmbeds
        };

        return NextResponse.json({
            success: true,
            ...result // Spread the results into the response body
        }, { status: 200 });

    } catch (error: any) {
        let message = "Failed to process video URL on the server.";
        let status = 500;

        // Log the actual error for Vercel/developer debugging
        console.error(`[Neynar Publish Error] URL: ${videoUrl}`, error);

        if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
            message = "Server timed out connecting to the video URL.";
            status = 504;
        } else if (error.response && error.response.data && error.response.data.message) {
            // Error from Neynar API itself (e.g., Signer rejected)
            message = `Publish Error: ${error.response.data.message}`;
            status = error.response.status || 500;
        } else if (error instanceof SyntaxError) {
            message = "Invalid data sent to the API.";
            status = 400;
        }

        // Return a clean error message to the client
        return NextResponse.json({ error: message }, { status });
    }
}
