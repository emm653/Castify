import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

// Define the expected structure for the Farcaster composeCast action
interface ComposeCastPayload {
    text: string;
    embeds: { url: string }[];
}

export async function POST(request: NextRequest) {
  let videoUrl = "";

  try {
    // 1. Parse the incoming JSON body
    ({ videoUrl } = await request.json());

    if (!videoUrl) {
      // Return error response without 'payload'
      return NextResponse.json({ error: "Missing video URL." }, { status: 400 });
    }

    // 2. Fetch site HTML (using the User-Agent to mimic a standard browser)
    const response = await axios.get(videoUrl, {
      // Increased timeout to help with slower external services
      timeout: 15000, 
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Farcaster/2.0; +https://www.farcaster.xyz)", 
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 3. Scrape metadata using Open Graph tags
    const videoTitle =
      $('meta[property="og:title"]').attr("content") || "Watch this video!";
      
    let videoImage = $('meta[property="og:image"]').attr("content");
    
    // Fallback/Link adjustment for relative image URLs
    if (videoImage && videoImage.startsWith("/")) {
      const baseUrl = new URL(videoUrl).origin;
      videoImage = baseUrl + videoImage;
    }

    // Handle case where og:image is missing or blocked (still proceed with text/embed)
    if (!videoImage) {
      // Use the stronger error response from the previous version if image is missing
      return NextResponse.json(
        { error: "Image blocked or not found. Try a different link." },
        { status: 422 }
      );
    }

    // 4. Construct the Payload for Farcaster SDK
    // RESTORED TEXT: Includes the direct URL and is formatted to maximize robustness.
    const castText = `🎬 ${videoTitle}\n\n${videoUrl}\n\n#Castify`;
    
    // Embed the original video URL for the Farcaster client to display the rich card.
    const embeds: { url: string }[] = [{ url: videoUrl }];

    // Optional: Include the thumbnail image URL as a secondary embed if found.
    if (videoImage) {
        embeds.push({ url: videoImage });
    }

    // --- CRITICAL FIX: STRUCTURE THE RESPONSE FOR THE CLIENT ---
    const payload: ComposeCastPayload = {
        text: castText,
        embeds: embeds
    };

    // 5. Return the response with the required 'payload' key
    return NextResponse.json({
      success: true,
      payload, // <--- This structure must be maintained for the client.
    }, { status: 200 });

  } catch (error: any) {
    // --- RESTORED ERROR HANDLING ---
    
    let message = "Unexpected error";
    let status = 500;

    if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
            message = "Server timed out connecting to the video URL.";
            status = 504; 
        } else if (error.response) {
            status = error.response.status;
            if (status === 403) message = "Access denied (403)";
            else if (status === 404) message = "URL not found (404)";
            else message = `HTTP error ${status}`;
        } else {
             message = `Network error connecting to external service.`;
        }
    } else if (error instanceof SyntaxError) {
      message = "Invalid JSON sent";
      status = 400;
    } else if (error.message) {
      message = error.message;
    }

    console.error("Scraper error:", error);
    
    // IMPORTANT: Return response WITHOUT 'payload' but WITH 'error'
    return NextResponse.json({ error: message }, { status });
  }
}
