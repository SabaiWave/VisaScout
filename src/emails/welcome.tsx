import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  appUrl: string;
}

const steps = [
  { number: '01', text: 'Enter your nationality + destination' },
  { number: '02', text: 'AI pulls official sources, recent changes, and community intel' },
  { number: '03', text: 'Get a brief with a recommended action and deadline' },
];

export default function WelcomeEmail({ appUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your first brief is on us — no credit card required.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Wordmark */}
          <Text style={styles.wordmark}>
            VISASCOUT
          </Text>

          {/* Hero */}
          <Text style={styles.heading}>You&apos;re in.</Text>

          <Text style={styles.text}>
            Visa intelligence for wherever you&apos;re going. Official rules,
            recent enforcement changes, and community intel in one brief.
          </Text>

          {/* How it works */}
          <Text style={styles.sectionLabel}>
            HOW IT WORKS
          </Text>

          {steps.map(({ number, text }) => (
            <Section key={number} style={styles.stepRow}>
              <Row>
                <Column style={styles.stepNumberCol}>
                  <Text style={styles.stepNumber}>{number}</Text>
                </Column>
                <Column>
                  <Text style={styles.stepText}>{text}</Text>
                </Column>
              </Row>
            </Section>
          ))}

          {/* CTA */}
          <Section style={styles.btnSection}>
            <Button href={appUrl} style={styles.btn}>
              GENERATE YOUR FIRST BRIEF
            </Button>
          </Section>

          {/* Footer */}
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
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  container: {
    backgroundColor: '#ffffff',
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
    fontSize: '36px',
    fontWeight: '900',
    lineHeight: '1.1',
    textTransform: 'uppercase' as const,
    margin: '0 0 12px',
    fontFamily: "'Barlow Condensed', Georgia, 'Times New Roman', serif",
  },
  text: {
    color: '#52525b',
    fontSize: '15px',
    lineHeight: '1.75',
    margin: '0 0 32px',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  sectionLabel: {
    color: '#18181b',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0.15em',
    margin: '0 0 16px',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  stepRow: {
    margin: '0 0 12px',
  },
  stepNumberCol: {
    width: '32px',
    verticalAlign: 'top',
  },
  stepNumber: {
    color: '#c8780a',
    fontSize: '18px',
    fontWeight: '700',
    margin: '0',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  stepText: {
    color: '#52525b',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  btnSection: {
    margin: '32px 0 0',
  },
  btn: {
    backgroundColor: '#c8780a',
    color: '#060c12',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    padding: '12px 24px',
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  footer: {
    color: '#52525b',
    fontSize: '14px',
    margin: '28px 0 0',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
};
