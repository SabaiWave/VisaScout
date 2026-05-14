import { Resend } from 'resend';

let resend: Resend;

export function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

export const FROM_ADDRESS = `VisaScout <hello@${process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ?? 'visascout.io'}>`;
