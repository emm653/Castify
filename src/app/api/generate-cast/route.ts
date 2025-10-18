import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// This function handles POST requests to your API endpoint
export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    // 2. Fetch the HTML content with a Farcaster-friendly User-Agent
    const response = await axios.get(videoUrl, { 
        timeout: 5000,
        headers: {
            // IMPORTANT: Sometimes setting a common User-Agent bypasses simple scraper blocks
            'User-Agent': 'Mozilla/5.0 (compatible; Farcaster/1.0; +https://www.farcaster.xyz)', 
            'Accept': 'text/html',
        }
    }); 
    const html = response.data;
    
    const $ = cheerio.load(html);

    const videoTitle = $('meta[property="og:title"]').attr('content') || "Check out this great cast!";
    const videoImage = $('meta[property="og:image"]').attr('content');
        if (!videoImage) {
            // A cast must have an image to generate a rich preview
            return NextResponse.json({ error: "Could not find a valid image for this URL." }, { status: 422 });
        }

        // 5. Construct the Cast Data payload
        const castPayload = {
            // Pre-filled text for the user's cast
            text: `Watch: ${videoTitle} #Castify`, 
            // The URL that Farcaster will render as an interactive embed
            embeds: [
                { url: videoUrl } 
            ]
        };

        // 6. Return the constructed payload to the client-side app
        return NextResponse.json({ success: true, payload: castPayload });

    } catch (error) {
        console.error("Error processing URL:", error);
        return NextResponse.json({ error: "Failed to process the URL, check connection or URL format." }, { status: 500 });
    }
}