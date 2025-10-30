

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  let videoUrl = "";

  try {
    ({ videoUrl } = await request.json());

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing video URL." }, { status: 400 });
    }

    // Fetch site HTML
    const response = await axios.get(videoUrl, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Scrape metadata
    const videoTitle =
      $('meta[property="og:title"]').attr("content") || "Watch this video!";
    let videoImage = $('meta[property="og:image"]').attr("content");

    if (videoImage && videoImage.startsWith("/")) {
      const baseUrl = new URL(videoUrl).origin;
      videoImage = baseUrl + videoImage;
    }

    if (!videoImage) {
      return NextResponse.json(
        { error: "Image blocked or not found. Try a different link." },
        { status: 422 }
      );
    }

    // ✅ Build cast text
    const castText = `🎬 ${videoTitle}\n\n${videoUrl}\n\n#Castify`;

    // ✅ Build Warpcast composer link (THIS MAKES CAST WORK)
    const composerUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
      castText
    )}&embeds[]=${encodeURIComponent(videoUrl)}&signer_uuid=${
      process.env.NEYNAR_SIGNER_UUID
    }`;

    return NextResponse.json({
      success: true,
      composerUrl,
      preview: {
        text: castText,
        image: videoImage,
      },
    });
  } catch (error: any) {
    let message = "Unexpected error";
    let status = 500;

    if (axios.isAxiosError(error) && error.response) {
      status = error.response.status;
      if (status === 403) message = "Access denied (403)";
      else if (status === 404) message = "URL not found (404)";
      else message = `HTTP error ${status}`;
    } else if (error instanceof SyntaxError) {
      message = "Invalid JSON sent";
      status = 400;
    }

    console.error("Scraper error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
