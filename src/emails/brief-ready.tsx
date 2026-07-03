import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BriefReadyEmailProps {
  destination: string;
  briefUrl: string;
}

export default function BriefReadyEmail({ destination, briefUrl }: BriefReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {destination} visa brief is ready.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          <Text style={styles.wordmark}>
            <span style={{ color: '#6366F1' }}>{'// '}</span>VISASCOUT
          </Text>

          <Text style={styles.heading}>Your brief is ready.</Text>

          <Text style={styles.text}>
            Your visa intelligence brief for <strong>{destination}</strong> has finished generating.
            Official rules, recent enforcement changes, and community intel — all in one place.
          </Text>

          <Section style={styles.btnSection}>
            <Button href={briefUrl} style={styles.btn}>
              VIEW YOUR BRIEF
            </Button>
          </Section>

          <Text style={styles.disclaimer}>
            This report aggregates publicly available information. Verify all visa requirements
            with official sources before travel. Not legal advice.
          </Text>

          <Text style={styles.footer}>
            © 2026 visascout.io
          </Text>

        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f4f4f5',
    fontFamily: "'Geist', Helvetica, Arial, sans-serif",
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e4e4e7',
    margin: '40px auto',
    padding: '40px',
    maxWidth: '560px',
  },
  wordmark: {
    color: '#18181b',
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '0.15em',
    margin: '0 0 32px',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  heading: {
    color: '#18181b',
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1.2',
    margin: '0 0 12px',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  text: {
    color: '#52525b',
    fontSize: '15px',
    lineHeight: '1.75',
    margin: '0 0 28px',
    fontFamily: "'Geist', Helvetica, Arial, sans-serif",
  },
  btnSection: {
    margin: '0 0 32px',
  },
  btn: {
    backgroundColor: '#6366F1',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    padding: '12px 24px',
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  disclaimer: {
    color: '#a1a1aa',
    fontSize: '11px',
    lineHeight: '1.6',
    margin: '0 0 20px',
    fontFamily: "'Geist', Helvetica, Arial, sans-serif",
    borderTop: '1px solid #e4e4e7',
    paddingTop: '16px',
  },
  footer: {
    color: '#52525b',
    fontSize: '12px',
    margin: '0',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
};
