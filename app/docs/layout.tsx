import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { source } from '@/lib/source';
import 'fumadocs-ui/style.css';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <RootProvider>
      <DocsLayout
        tree={source.pageTree}
        nav={{
          title: 'NeuReed Documentation',
          url: '/docs',
        }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
