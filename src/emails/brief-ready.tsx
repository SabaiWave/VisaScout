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

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');`;

interface BriefReadyEmailProps {
  destination: string;
  briefUrl: string;
}

export default function BriefReadyEmail({ destination, briefUrl }: BriefReadyEmailProps) {
  return (
    <Html>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: FONT_IMPORT }} />
      </Head>
      <Preview>Your {destination} visa brief is ready.</Preview>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Body style={styles.body} {...({ bgcolor: '#f0f0f0' } as any)}>
        <Container style={styles.wrap}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Section style={styles.card} {...({ bgcolor: '#0a1520' } as any)}>
            <Text style={styles.wordmark}>VISASCOUT</Text>

            <Text style={styles.heading}>Your brief is ready.</Text>

            <Text style={styles.text}>
              Your visa intelligence brief for{' '}
              <strong style={{ color: '#dceaf6' }}>{destination}</strong> has finished
              generating. Official rules, recent enforcement changes, and community intel. All in one place.
            </Text>

            <Section style={styles.btnSection}>
              <Button href={briefUrl} style={styles.btn}>
                VIEW YOUR BRIEF
              </Button>
            </Section>

            <Text style={styles.footer}>© 2026 visascout.io</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f0f0f0',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    margin: '0',
    padding: '0',
  },
  wrap: {
    maxWidth: '560px',
    margin: '40px auto',
    padding: '0 16px',
  },
  card: {
    backgroundColor: '#0a1520',
    borderTop: '3px solid #c8780a',
    border: '1px solid #1e3040',
    padding: '40px',
  },
  wordmark: {
    color: '#c8780a',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.18em',
    margin: '0 0 28px',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  heading: {
    color: '#dceaf6',
    fontSize: '42px',
    fontWeight: '900',
    lineHeight: '1.0',
    textTransform: 'uppercase' as const,
    margin: '0 0 20px',
    fontFamily: "'Barlow Condensed', 'Arial Narrow', Impact, Arial, sans-serif",
    letterSpacing: '-0.01em',
  },
  text: {
    color: '#8fb2c8',
    fontSize: '14px',
    lineHeight: '1.75',
    margin: '0 0 28px',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  btnSection: {
    margin: '0 0 32px',
  },
  btn: {
    backgroundColor: '#c8780a',
    color: '#060c12',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    padding: '12px 28px',
    textDecoration: 'none',
    display: 'inline-block',
    whiteSpace: 'nowrap' as const,
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  footer: {
    color: '#5f849e',
    fontSize: '11px',
    margin: '0',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    borderTop: '1px solid #1e3040',
    paddingTop: '16px',
  },
};
