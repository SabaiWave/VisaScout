'use client';

import Link from 'next/link';
import { DownloadPdfButton } from '@/app/components/ui/DownloadPdfButton';
import { ShareButton } from '@/app/components/ui/ShareButton';
import { Button } from '@/app/components/ui/Button';

interface BriefActionsProps {
  url: string;
  briefId: string;
  depth: string;
  forceError?: boolean;
}

export default function BriefActions({ url, briefId, depth, forceError }: BriefActionsProps) {
  return (
    <div className="flex items-start gap-3 mt-6">
      <DownloadPdfButton briefId={briefId} depth={depth} className="px-8 py-3" forceError={forceError} />
      <ShareButton url={url} briefId={briefId} className="px-8 py-3" />
      <Button variant="ghost" asChild className="px-8 py-3">
        <Link href="/app">New Brief</Link>
      </Button>
    </div>
  );
}
