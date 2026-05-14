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
      <Preview>Your visa intelligence tool is ready.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.wordmark}>VisaScout</Heading>

          <Heading style={styles.heading}>Welcome aboard.</Heading>

          <Text style={styles.text}>
            VisaScout gives you cited, confidence-scored visa intelligence for
            any nationality entering Southeast Asia — official sources ranked by
            tier, contradictions flagged automatically.
          </Text>

          <Text style={styles.text}>
            Your first Quick brief is free. No credit card required.
          </Text>

          <Section style={styles.btnSection}>
            <Button href={appUrl} style={styles.btn}>
              Generate your first brief →
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.disclaimer}>
            VisaScout aggregates publicly available information. Verify all visa
            requirements with official sources before travel. Not legal advice.
          </Text>

          <Text style={styles.footer}>
            © Sabai Wave LLC · {appUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f9fafb',
    fontFamily: "'IBM Plex Sans', Helvetica, Arial, sans-serif",
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    margin: '40px auto',
    padding: '40px',
    maxWidth: '560px',
  },
  wordmark: {
    color: '#1e3a5f',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 32px',
    fontFamily: "'DM Sans', Helvetica, Arial, sans-serif",
  },
  heading: {
    color: '#1e3a5f',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 16px',
    fontFamily: "'DM Sans', Helvetica, Arial, sans-serif",
  },
  text: {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.75',
    margin: '0 0 16px',
  },
  btnSection: {
    margin: '24px 0',
  },
  btn: {
    backgroundColor: '#1e3a5f',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    padding: '12px 24px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  divider: {
    borderColor: '#e5e7eb',
    margin: '32px 0 24px',
  },
  disclaimer: {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '0 0 12px',
  },
  footer: {
    color: '#9ca3af',
    fontSize: '12px',
    margin: '0',
  },
};
