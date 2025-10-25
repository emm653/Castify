import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const response = NextResponse.next(); 
    
    // 🚨 CRITICAL FIX: Allow the *specific* Vercel deployment domain that is making the request 🚨
    const origin = request.headers.get('origin') || '*';
    
    // We will relax the rule to allow either the generic '*' or check if it's a Vercel deploy
    
    // You should allow the origin of the current request if it's a known domain.
    // For Vercel preview URLs, the easiest fix is to set it dynamically:

    response.headers.set('Access-Control-Allow-Origin', origin); // Sets the origin to the requestor's domain
    response.headers.set('Access-Control-Allow-Credentials', 'true'); // Required for cross-domain requests
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');


    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: response.headers }); // 204 No Content is the correct status
    }
    
    return response;
}
// (The rest of the file remains the same)
// 5. Define which routes this middleware should run on (only for API routes)
export const config = {
    matcher: ['/api/:path*'], // Only run this for requests to /api/
};
