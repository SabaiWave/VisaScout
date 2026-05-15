import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  appUrl: string;
}

export default function WelcomeEmail({ appUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your first brief is on us — no credit card required.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.wordmark}>
            <span style={{ color: '#6366F1' }}>{'// '}</span>VisaScout
          </Text>

          <Heading style={styles.heading}>You&apos;re in.</Heading>

          <Text style={styles.text}>
            Your first brief is on us. Pick a nationality, pick a destination,
            and we&apos;ll handle the rest — official sources, recent enforcement
            changes, and community intel in one place.
          </Text>

          <Section style={styles.btnSection}>
            <Button href={appUrl} style={styles.btn}>
              GENERATE YOUR FIRST BRIEF →
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            © VisaScout · visascout.io
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#0A0A0A',
    fontFamily: "'IBM Plex Sans', Helvetica, Arial, sans-serif",
  },
  container: {
    backgroundColor: '#111118',
    borderRadius: '8px',
    border: '1px solid #2D2D3D',
    margin: '40px auto',
    padding: '40px',
    maxWidth: '560px',
  },
  wordmark: {
    color: '#F4F4F5',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    margin: '0 0 32px',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  heading: {
    color: '#F4F4F5',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 16px',
    fontFamily: "'IBM Plex Sans', Helvetica, Arial, sans-serif",
  },
  text: {
    color: '#A1A1AA',
    fontSize: '15px',
    lineHeight: '1.75',
    margin: '0 0 16px',
  },
  btnSection: {
    margin: '28px 0',
  },
  btn: {
    backgroundColor: '#6366F1',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    padding: '12px 24px',
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  divider: {
    borderColor: '#2D2D3D',
    margin: '32px 0 20px',
  },
  footer: {
    color: '#52525B',
    fontSize: '12px',
    margin: '0',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
};
