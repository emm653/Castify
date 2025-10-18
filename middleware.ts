import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // 1. Get the current response (pass the request through Next.js first)
    const response = NextResponse.next(); 

    // 2. Set the necessary CORS headers
    // '*' allows requests from any origin (like Warpcast's domain)
    response.headers.set('Access-Control-Allow-Origin', '*'); 
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // 3. Handle the OPTIONS request (the preflight check)
    if (request.method === 'OPTIONS') {
        // We return an immediate 200 response for the OPTIONS request, telling the client it's OK to proceed.
        return new NextResponse(null, { status: 200, headers: response.headers });
    }

    // 4. Continue with the standard Next.js response for GET/POST
    return response;
}

// 5. Define which routes this middleware should run on (only for API routes)
export const config = {
    matcher: ['/api/:path*'], // Only run this for requests to /api/
};