export default {
    reactStrictMode: true,
    // Ignore ESLint during production builds so "next build" won't fail on lint errors.
    // Use this as a temporary unblock while you fix the underlying lint issues.
    eslint: {
      ignoreDuringBuilds: true
    }
  };