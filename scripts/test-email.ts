import { getResend, FROM_ADDRESS } from '../src/lib/email';
import WelcomeEmail from '../src/emails/welcome';
import { render } from '@react-email/components';

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error('Usage: npx tsx scripts/test-email.ts you@email.com');
    process.exit(1);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://visascout.io';
  const html = await render(WelcomeEmail({ appUrl }));

  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'VisaScout — test email',
    html,
  });

  if (error) {
    console.error('Send failed:', error);
    process.exit(1);
  }

  console.log('Sent. ID:', data?.id);
}

main();
