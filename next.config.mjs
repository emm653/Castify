// inside next.config.mjs - FINAL MERGED VERSION

export default {
    // --- Existing Configuration ---
    reactStrictMode: true,
    eslint: {
      ignoreDuringBuilds: true
    },
    
    // --- ADDED REDIRECTS FUNCTION HERE ---
    async redirects() {
      return [
        {
          source: '/.well-known/farcaster.json',
          // 🚨 YOUR SPECIFIC HOSTED MANIFEST URL 🚨
          destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a283e-aab9-b351-f373-5be86d67909e',
          permanent: false, // Use 307 redirect
        },
      ];
    },
    // --- End of Configuration Object ---
};

// Note: No export default statement needed at the bottom, 
// as the object is already exported at the top.
