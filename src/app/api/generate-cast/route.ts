import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// Initialize Neynar Client with environment variables
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;

// Check if keys are set (Crucial for Vercel deployment)
if (!NEYNAR_API_KEY || !NEYNAR_SIGNER_UUID) {
    console.error("NEYNAR_API_KEY or NEYNAR_SIGNER_UUID not set in Vercel environment.");
    // We cannot create a functional client without keys, but we initialize it anyway
    // The error handling in the POST function will catch the null case.
}

// Client initialization
const client = new NeynarAPIClient(new Configuration({ apiKey: NEYNAR_API_KEY }));

// Define the expected structure for the client composer
interface CastPayload {
    text: string;
    embeds: { url: string }[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    let videoUrl = "";

    try {
        const { videoUrl }: { videoUrl: string } = await request.json();

        if (!videoUrl) {
            return NextResponse.json({ error: "Missing video URL." }, { status: 400 });
        }

        // 1. SCRAPE METADATA (Title for the cast text)
        const response = await axios.get(videoUrl, {
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; Farcaster/2.0; +https://www.farcaster.xyz)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const videoTitle =
            $('meta[property="og:title"]').attr("content") || "Watch this awesome video!";
        
        // This is the cast message part the user wants to copy/edit.
        const castText = `🎬 ${videoTitle}\n\n`; 

        // 2. DEFINE EMBEDS (The Farcaster card)
        const castEmbeds: { url: string }[] = [
            { url: videoUrl }
        ];

        // 3. PUBLISH CAST DIRECTLY VIA NEYNAR API (Bypasses client signing failure)
        const publishResponse = await client.publishCast({
            signerUuid: NEYNAR_SIGNER_UUID!,
            text: castText,
            embeds: castEmbeds,
        });

        if (!publishResponse.success || !publishResponse.cast) {
            throw new Error(publishResponse.message || "Cast publishing failed on Neynar Hub.");
        }

        // 4. RETURN DATA TO CLIENT (Success + Text/Embeds for Copying)
        return NextResponse.json({
            success: true,
            castHash: publishResponse.cast.hash, // Used for opening the published cast
            castText: castText, // <-- Essential for the Copy button
            castEmbeds: castEmbeds, // <-- Essential for the Copy button
        }, { status: 200 });

    } catch (error: any) {
        let message = "Failed to process video URL on the server.";
        let status = 500;
        
        if (axios.isAxiosError(error) && error.response) {
            message = `Error from host: HTTP ${error.response.status}`;
            status = error.response.status;
        } else if (error.message.includes("Signer")) {
             message = "Signer Error: Check your NEYNAR_SIGNER_UUID permissions.";
        }

        console.error("Server Publishing Error:", error.message);
        return NextResponse.json({ error: message }, { status: status });
    }
}
