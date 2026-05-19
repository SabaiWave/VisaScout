import { Resend } from 'resend';

let resend: Resend;

export function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

// Lazy — evaluated at call time so Next.js build doesn't fail on missing env var
export function getFromAddress(): string {
  const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ?? 'visascout.io';
  return `VisaScout <hello@${domain}>`;
}
