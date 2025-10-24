'use client';

import dynamic from 'next/dynamic';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { MiniAppProvider } from '@neynar/react';
import { ANALYTICS_ENABLED, RETURN_URL } from '~/lib/constants';

const WagmiProvider = dynamic(
  () => import('~/components/providers/WagmiProvider'),
  {
    ssr: false,
  }
);

export function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
     <SessionProvider>
      <WagmiProvider>
        <MiniAppProvider
          analyticsEnabled={ANALYTICS_ENABLED}
          backButtonEnabled={true}
          returnUrl={RETURN_URL}
        >
            <AuthKitProvider config={{}}>
              {children}
            </AuthKitProvider>
        </MiniAppProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
