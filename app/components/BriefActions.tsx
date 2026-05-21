'use client';

import { DownloadPdfButton } from '@/app/components/ui/DownloadPdfButton';
import { ShareButton } from '@/app/components/ui/ShareButton';

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
    </div>
  );
}
