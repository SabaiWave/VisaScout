import { DEPTH_LABEL, DEPTH_CTA } from '@/src/lib/depth';
import { DESTINATIONS, ENABLED_REGIONS, REGION_LABELS, coverageLabel, destinationCount } from '@/src/config/destinations';

export const clientConfig = {
  brandName: 'VisaScout',
  tagline: 'Visa intelligence, every claim sourced.',
  primaryColor: '#1e3a5f',
  accentColor: '#f59e0b',
  logoUrl: '/logo.svg',
  disclaimerText:
    'This report aggregates publicly available information. Verify all visa requirements with official sources before travel. Not legal advice.',
  supportEmail: 'hello@visascout.io',
  supportedDestinations: DESTINATIONS.map((d) => d.name),
  // Flat list for the marquee — excludes the "Schengen" meta-entry (individual countries shown instead)
  marqueeDestinations: DESTINATIONS.filter((d) => d.name !== 'Schengen').map((d) => d.name),

  landingPage: {
    hero: {
      eyebrow: 'Visa intelligence, every claim sourced.',
      h1: "Know your visa situation. Before it's a problem.",
      subhead:
        'You found six answers. Three contradict each other. Two are years old. VisaScout reconciles all of it. One brief. Every claim sourced.',
      cta: 'Start free',
      ctaHref: '/app?depth=quick',
      metrics: [
        { value: String(destinationCount), label: 'Countries' },
        { value: 'Official', label: 'Sources first' },
        { value: 'Cited', label: 'Every claim' },
        { value: 'Per report', label: 'No subscription' },
      ],
    },

    features: {
      title: 'What Goes Into a Brief',
      subtitle:
        'Official rules, recent enforcement, and real traveler experience. Where they disagree, we tell you.',
      cards: [
        {
          tag: 'Tier 1 Sources',
          title: 'Official Policy, Verified',
          body: 'Government immigration portals, embassy sites, and official advisories. Pulled fresh, tagged by source tier. No travel blogs from two years ago.',
        },
        {
          tag: 'Last 90 Days',
          title: 'Recent Enforcement Reality',
          body: 'Rules on paper versus what border officers are actually doing right now. Community reports from Reddit, Nomad List, and expat forums, checked against official sources.',
        },
        {
          tag: 'Per Claim',
          title: 'Confidence Scores + Citations',
          body: 'Every claim links to its source. High confidence means two or more official sources agree. Contested claims are flagged. Nothing buried.',
        },
      ],
    },

    howItWorks: {
      title: 'How It Works',
      subtitle: 'You describe your situation. We do the research. You get an answer.',
      steps: [
        {
          number: '01',
          title: 'Describe your situation',
          body: 'Your nationality, destination, how long you\'re staying, and anything specific: entry history, current visa status, prior overstays or extensions. Plain English, not a form.',
        },
        {
          number: '02',
          title: 'Every source that matters, checked',
          body: 'Official immigration portals, recent enforcement changes, and real traveler reports run in parallel. Where they contradict each other, we tell you.',
        },
        {
          number: '03',
          title: 'One brief you can act on',
          body: 'A clear recommendation, a deadline if there is one, and every claim linked to its source. Download as PDF or share the link.',
        },
      ],
    },

    destinations: {
      title: 'Countries Covered',
      subtitle: `${coverageLabel}. The destinations nomads and long-stay travelers actually go. Top visa types per country. We never guess.`,
    },

    pricing: {
      title: 'Pricing',
      subtitle: 'Less than a visa agency consultation. Far less than an overstay fine.',
      plans: [
        {
          name: DEPTH_LABEL.quick,
          tag: 'Free',
          price: '$0',
          priceNote: 'No credit card',
          description: 'Surface scan before you commit. Full brief from all 5 agents, every claim sourced.',
          features: ['Full brief from all 5 agents', '3 sources per agent', 'Every claim cited', 'Shareable link'],
          cta: DEPTH_CTA.quick,
          href: '/app?depth=quick',
          highlight: false,
        },
        {
          name: DEPTH_LABEL.standard,
          tag: 'Popular',
          price: '$5.99',
          priceNote: 'Per report',
          description: 'Full intelligence brief for real decisions. Deeper source coverage, complete conflict report, PDF on file.',
          features: [`Everything in ${DEPTH_LABEL.quick}`, '5 sources per agent', 'Full conflict report', 'PDF download'],
          cta: DEPTH_CTA.standard,
          href: '/app?depth=standard',
          highlight: true,
        },
        {
          name: DEPTH_LABEL.deep,
          tag: 'Max Intel',
          price: '$11.99',
          priceNote: 'Per report',
          description: 'The complete file on your situation. Maximum sources, full border run analysis, every contradiction resolved.',
          features: [`Everything in ${DEPTH_LABEL.standard}`, '8 sources per agent', 'Wider community search', 'Full border run analysis', 'Every contradiction resolved'],
          cta: DEPTH_CTA.deep,
          href: '/app?depth=deep',
          highlight: false,
        },
      ],
    },

    faq: {
      title: 'Common Questions',
      subtitle: 'Everything travelers ask before running their first brief.',
      items: [
        {
          q: 'Is this legal advice?',
          a: 'No. VisaScout aggregates publicly available immigration information and pulls it into a sourced brief. Every brief includes a disclaimer and links to its sources. For personal legal decisions, consult an immigration lawyer.',
        },
        {
          q: 'How current is the data?',
          a: 'Sources are pulled fresh on every run. The Recent Changes agent searches specifically for policy updates in the last 90 days, so outdated travel blog posts never make it into your brief.',
        },
        {
          q: 'What if official sources contradict each other?',
          a: "That's exactly what the Conflict Report is for. Every brief shows what's confirmed (two or more official sources agree), what's contested, and what's unverified. You always know where the uncertainty is, not just what the average answer is.",
        },
        {
          q: 'How long does a brief take to generate?',
          a: `Most briefs are ready in under two minutes. ${DEPTH_LABEL.quick} is fastest. ${DEPTH_LABEL.deep} runs deeper and takes a bit longer. You'll get an email when it's ready if you want to step away.`,
        },
        {
          q: 'Can I share my brief with someone?',
          a: "Yes. Every brief has a permanent shareable link and a PDF download. Send it to a travel partner, a visa agent, or save it for your embassy appointment. No account needed to view a shared brief.",
        },
        {
          q: 'Which countries do you cover?',
          a: `${destinationCount} destinations across Southeast Asia, East Asia, Europe, and Latin America. The places nomads and long-stay travelers actually go. We cover the most common visa types per country. If we don't support a specific visa type yet, we say so clearly and point you to the right official source.`,
        },
        {
          q: 'What if my brief fails to generate?',
          a: "If a technical failure interrupts your brief, reach out and we'll re-run it or refund the charge. Every brief cites its sources. If something looks off, the source link is right there to verify.",
        },
      ],
    },
  },
};
