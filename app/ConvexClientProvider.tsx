"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

function MissingConvexConfig({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-tm-green-900 px-6 text-center text-tm-cream">
      <h1 className="font-[family-name:var(--font-game)] text-3xl font-extrabold">
        Convex not configured
      </h1>
      <p className="max-w-md text-tm-cream/80">
        Run <code className="rounded bg-black/30 px-1">npx convex dev</code> in
        this repo, then ensure{" "}
        <code className="rounded bg-black/30 px-1">.env.local</code> contains{" "}
        <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_CONVEX_URL</code>.
      </p>
      <p className="text-sm text-tm-cream/50">See docs/deploy.md</p>
      {children}
    </div>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  const client = useMemo(() => {
    if (!url) return null;
    return new ConvexReactClient(url);
  }, [url]);

  if (!client) {
    return <MissingConvexConfig>{null}</MissingConvexConfig>;
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
