export const clientConfig = {
  brandName: 'VisaScout',
  tagline: 'Visa intelligence for digital nomads.',
  primaryColor: '#1e3a5f',
  accentColor: '#f59e0b',
  logoUrl: '/logo.svg',
  disclaimerText:
    'This report aggregates publicly available information. Verify all visa requirements with official sources before travel. Not legal advice.',
  supportEmail: 'hello@visascout.io',
  supportedDestinations: [
    'Thailand',
    'Vietnam',
    'Indonesia',
    'Malaysia',
    'Philippines',
    'Cambodia',
    'Laos',
    'Myanmar',
    'Singapore',
    'Brunei',
  ],

  landingPage: {
    hero: {
      eyebrow: 'Southeast Asia · Visa Intelligence',
      h1: 'Know your visa situation. Before it becomes a problem.',
      subhead:
        'You found six answers. Three contradict each other. Two are from 2021. VisaScout cross-checks official immigration sources, recent enforcement data, and real traveler reports. One brief. Every claim sourced.',
      cta: 'Start free',
      ctaHref: '/app?depth=quick',
      metrics: [
        { value: '10', label: 'Countries' },
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
          body: 'Your nationality, destination, how long you\'re staying, and anything specific: visa run history, current visa type, prior overstays. Plain English, not a form.',
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
      subtitle: 'Top visa types covered per country. If we don\'t support it, we say so. We never guess.',
    },

    pricing: {
      title: 'Pricing',
      subtitle: 'Less than a visa agency consultation. Far less than an overstay fine.',
      plans: [
        {
          name: 'Quick',
          tag: 'Free',
          price: '$0',
          priceNote: 'No credit card',
          description: 'Good for a short trip or a quick check. Full brief, every claim cited.',
          features: ['Full brief from all 5 agents', '3 sources per agent', 'Every claim cited', 'Shareable link'],
          cta: 'Start free',
          href: '/app?depth=quick',
          highlight: false,
        },
        {
          name: 'Standard',
          tag: 'Popular',
          price: '$5.99',
          priceNote: 'Per report',
          description: 'For longer stays and real decisions. More sources, full conflict report, PDF you can keep.',
          features: ['Everything in Quick', '5 sources per agent', 'Full conflict report', 'PDF download'],
          cta: 'Run Standard',
          href: '/app?depth=standard',
          highlight: true,
        },
        {
          name: 'Deep',
          tag: 'Max Intel',
          price: '$11.99',
          priceNote: 'Per report',
          description: 'For complex situations. Maximum sources, full border run analysis, every contradiction explained.',
          features: ['Everything in Standard', '8 sources per agent', 'Wider community search', 'Full border run analysis', 'Every contradiction explained'],
          cta: 'Go Deep',
          href: '/app?depth=deep',
          highlight: false,
        },
      ],
    },
  },
};
