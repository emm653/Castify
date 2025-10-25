// Inside src/app/api/generate-cast/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
// This function handles POST requests to your API endpoint
export async function POST(request: NextRequest) {
    let videoUrl = ''; // Define the variable here for scoping

    try {
        // --- MODIFICATION HERE: Use request.text() first, then parse. ---
        // However, the JSON.parse error is happening client-side when the response isn't JSON.
        // We will stick to handling the input and network failure gracefully.
        
        ({ videoUrl } = await request.json()); // Assuming JSON payload is clean (your client sends it)

        if (!videoUrl) {
            return NextResponse.json({ error: "Missing video URL." }, { status: 400 });
        }

        // 2. Fetch the HTML content with a common User-Agent to bypass simple blocks
      
        const response = await axios.get(videoUrl, { 
          timeout: 10000, 
          headers: {
              // This makes the request look like it's coming from a desktop browser, not a generic Vercel script
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          }
      });
        
        const html = response.data;
        const $ = cheerio.load(html);

        const videoTitle = $('meta[property="og:title"]').attr('content') || "Check out this great cast!";
        const videoImage = $('meta[property="og:image"]').attr('content');
        if (videoImage && videoImage.startsWith('/')) {
    // Prepend the Vercel domain if the image link is relative
            const baseUrl = new URL(videoUrl).origin;
            videoImage = baseUrl + videoImage;
        }
        if (!videoImage) {
            // If the image is blocked or missing, we return a fallback error to the user.
            return NextResponse.json({ error: "Image data blocked or not found. Try a simpler site." }, { status: 422 });
        }

        // 5. Construct the Cast Data payload (SUCCESS)
        const castPayload = {
            text: `Watch: ${videoTitle} #Castify`, 
            embeds: [
                { url: videoUrl } 
            ]
        };

        return NextResponse.json({ success: true, payload: castPayload });

    } catch (error: any) {
        // --- MODIFIED CATCH BLOCK ---
        let errorMessage = "Scraping failed: The external site blocked access.";
        let statusCode = 500;

        // Check if the error is an HTTP error (403, 404, etc.)
        if (axios.isAxiosError(error) && error.response) {
             statusCode = error.response.status;
             if (statusCode === 403) {
                 errorMessage = "Access Denied (403): Target website actively blocked scraping.";
             } else if (statusCode === 404) {
                 errorMessage = "Link Not Found (404): The URL is broken or does not exist.";
             } else {
                 errorMessage = `HTTP Error ${statusCode}: Failed to retrieve site data.`;
             }
        } else if (error instanceof SyntaxError) {
             // This specifically addresses the JSON.parse error if it occurred when reading the request.body
             // It often means the client-side JSON was malformed, or the server wasn't running.
             errorMessage = "Malformed request: Please check the URL format and try again.";
             statusCode = 400;
        }

        console.error("Error processing URL:", error);
        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}
