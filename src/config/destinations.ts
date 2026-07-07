// src/config/destinations.ts — single source of truth for all destination logic
// Agents call getGovDomains(). Never hand-maintain SUPPORTED_DESTINATION_NAMES or SCHENGEN_MEMBERS.

export type Region = 'SEA' | 'East Asia' | 'Schengen' | 'Latin America';

export interface DestinationConfig {
  name: string;             // canonical name passed to agents
  aliases: string[];        // variations orchestrator normalizes from ("Korea", "日本")
  govDomains: string[];     // Tier 1 domain bias for Tavily queries
  visaTypes: string[];      // top 5-6 visa types; unsupported types get "not supported" flag
  region: Region;
  schengenMember?: boolean; // triggers 90/180 rule injection in synthesis
  notes?: string;           // destination-specific brief constraints (~50-100 tokens)
}

export const ENABLED_REGIONS: Region[] = [
  'SEA',
  'East Asia',
  'Schengen',
  'Latin America',
];

const ALL_DESTINATIONS: DestinationConfig[] = [
  // ─── SEA ───────────────────────────────────────────────────────────────────
  {
    name: 'Thailand',
    aliases: ['Thailand', 'TH'],
    govDomains: [
      'thaievisa.go.th',
      'immigration.go.th',
      'mfa.go.th',
      'thaigov.go.th',
      'consular.go.th',
    ],
    visaTypes: [
      'Visa Exemption (30/60 days)',
      'Tourist Visa (TR)',
      'Thailand Privilege Card',
      'Long-Term Resident (LTR) Visa',
      'Non-Immigrant B (Business)',
      'Non-Immigrant O (Retirement/Family)',
    ],
    region: 'SEA',
  },
  {
    name: 'Vietnam',
    aliases: ['Vietnam', 'Viet Nam', 'VN'],
    govDomains: [
      'immigration.gov.vn',
      'evisa.gov.vn',
      'xuatnhapcanh.gov.vn',
      'mofa.gov.vn',
    ],
    visaTypes: [
      'E-Visa (90 days)',
      'Visa on Arrival',
      'Tourist Visa',
      'Business Visa',
      'Temporary Residence Card',
      'Permanent Residence',
    ],
    region: 'SEA',
  },
  {
    name: 'Indonesia',
    aliases: ['Indonesia', 'ID'],
    govDomains: [
      'imigrasi.go.id',
      'kemlu.go.id',
      'evisa.imigrasi.go.id',
    ],
    visaTypes: [
      'Visa-Free (30 days)',
      'Visa on Arrival (VOA)',
      'B211A Tourist/Social',
      'E-Visa',
      'KITAS Work/Stay Permit',
      'Second Home Visa',
    ],
    region: 'SEA',
  },
  {
    name: 'Malaysia',
    aliases: ['Malaysia', 'MY'],
    govDomains: [
      'imi.gov.my',
      'kln.gov.my',
      'motac.gov.my',
    ],
    visaTypes: [
      'Visa-Free (90 days)',
      'eVisa',
      'MM2H (My Second Home)',
      'Employment Pass',
      'Professional Visit Pass',
      'DE Rantau Nomad Pass',
    ],
    region: 'SEA',
  },
  {
    name: 'Philippines',
    aliases: ['Philippines', 'PH'],
    govDomains: [
      'immigration.gov.ph',
      'dfa.gov.ph',
      'evisa.gov.ph',
    ],
    visaTypes: [
      'Visa-Free (30 days)',
      'Tourist Visa Extension',
      '9(a) Temporary Visitor',
      'Special Work Permit',
      'SRRV Retirement Visa',
      'ACR I-Card',
    ],
    region: 'SEA',
  },
  {
    name: 'Cambodia',
    aliases: ['Cambodia', 'KH'],
    govDomains: [
      'evisa.gov.kh',
      'mfaic.gov.kh',
      'immigration.gov.kh',
    ],
    visaTypes: [
      'Visa on Arrival (T/E)',
      'E-Visa',
      'Ordinary Visa (ER)',
      'Business Visa (EB)',
      'Retirement Visa',
      'MICE Visa',
    ],
    region: 'SEA',
  },
  {
    name: 'Laos',
    aliases: ['Laos', 'Lao PDR', 'LA'],
    govDomains: [
      'laoevisa.gov.la',
      'mofa.gov.la',
      'immigration.gov.la',
    ],
    visaTypes: [
      'Visa on Arrival (30 days)',
      'E-Visa',
      'Tourist Visa (L)',
      'Business Visa (B)',
      'Investment Visa',
      'Non-Immigrant Visa',
    ],
    region: 'SEA',
  },
  {
    name: 'Myanmar',
    aliases: ['Myanmar', 'Burma', 'MM'],
    govDomains: [
      'evisa.moip.gov.mm',
      'mofa.gov.mm',
      'mip.gov.mm',
    ],
    visaTypes: [
      'E-Visa (Tourist)',
      'Tourist Visa on Arrival',
      'Business Visa',
      'Social Visit Visa',
      'Multiple Journey Visa',
      'Special Economic Zone Permit',
    ],
    region: 'SEA',
  },
  {
    name: 'Singapore',
    aliases: ['Singapore', 'SG'],
    govDomains: [
      'ica.gov.sg',
      'mfa.gov.sg',
      'mom.gov.sg',
    ],
    visaTypes: [
      'Visa-Free (30/90 days)',
      'Tourist Visa',
      'Employment Pass (EP)',
      'EntrePass',
      'Personalised Employment Pass (PEP)',
      'ONE Pass',
    ],
    region: 'SEA',
  },
  {
    name: 'Brunei',
    aliases: ['Brunei', 'Brunei Darussalam', 'BN'],
    govDomains: [
      'immigration.gov.bn',
      'mfa.gov.bn',
    ],
    visaTypes: [
      'Visa-Free (14/30 days)',
      'Tourist Visa',
      'Business Visa',
      'Employment Pass',
      'Dependent Pass',
      'Permanent Residence',
    ],
    region: 'SEA',
  },

  // ─── East Asia ─────────────────────────────────────────────────────────────
  {
    name: 'Japan',
    aliases: ['Japan', '日本', 'JP'],
    govDomains: [
      'www.mofa.go.jp',
      'www.moj.go.jp',
      'www.immi-moj.go.jp',
      'jnto.go.jp',
    ],
    visaTypes: [
      'Visa-Free/Waiver (varies by nationality)',
      'Tourist Visa',
      'Highly Skilled Professional (HSP)',
      'Working Holiday',
      'Business Visa',
      'Long-term Resident',
    ],
    region: 'East Asia',
    notes:
      "Do not use the label 'digital nomad visa' for any Japanese visa — Japan has no officially named digital nomad visa. Use the official visa category name (e.g. 'Highly Skilled Professional visa'). Visa-free duration varies by nationality — do not assume 90 days. Always cite mofa.go.jp as the authoritative source.",
  },
  {
    name: 'South Korea',
    aliases: ['South Korea', 'Korea', 'Republic of Korea', '한국', 'KR'],
    govDomains: [
      'www.mofa.go.kr',
      'www.hikorea.go.kr',
      'www.immigration.go.kr',
      'english.visitkorea.or.kr',
    ],
    visaTypes: [
      'K-ETA (visa-free eligible nationalities)',
      'Tourist C-3',
      'Digital Nomad F-1-D',
      'Working Holiday H-1',
      'Business C-2/C-3-2',
      'E-7 Skilled Worker',
    ],
    region: 'East Asia',
    notes:
      'K-ETA eligibility varies by nationality — do not state it is required for all nationalities. F-1-D digital nomad visa has nationality restrictions and requirements that change — do not assert universal availability. Always verify current eligibility at www.hikorea.go.kr.',
  },

  // ─── Schengen ──────────────────────────────────────────────────────────────
  {
    name: 'Germany',
    aliases: ['Germany', 'Deutschland', 'DE'],
    govDomains: [
      'bamf.de',
      'auswaertiges-amt.de',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Schengen C Tourist Visa',
      'Freelancer Visa (Freiberufler)',
      'EU Blue Card',
      'Working Holiday (limited nationalities)',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
  },
  {
    name: 'Portugal',
    aliases: ['Portugal', 'PT'],
    govDomains: [
      'aima.gov.pt',
      'vistos.mne.gov.pt',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'D8 Digital Nomad Visa',
      'D7 Passive Income Visa',
      'Job Seeker Visa',
      'Working Holiday',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
  },
  {
    name: 'Spain',
    aliases: ['Spain', 'España', 'ES'],
    govDomains: [
      'exteriores.gob.es',
      'policia.es',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Digital Nomad Visa (DNV)',
      'Non-lucrative Residence',
      'Working Holiday',
      'Schengen C Tourist Visa',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
  },
  {
    name: 'Netherlands',
    aliases: ['Netherlands', 'Holland', 'Nederland', 'NL'],
    govDomains: [
      'ind.nl',
      'government.nl',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Highly Skilled Migrant',
      'Orientation Year Visa',
      'DAFT (Dutch-American Friendship Treaty)',
      'Schengen C Tourist Visa',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
  },
  {
    name: 'France',
    aliases: ['France', 'FR'],
    govDomains: [
      'france-visas.gouv.fr',
      'diplomatie.gouv.fr',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Long Stay Visa (VLS-TS)',
      'Talent Passport',
      'Working Holiday',
      'Schengen C Tourist Visa',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
  },

  // ─── Latin America ─────────────────────────────────────────────────────────
  {
    name: 'Mexico',
    aliases: ['Mexico', 'México', 'MX'],
    govDomains: [
      'www.inm.gob.mx',
      'consulmex.sre.gob.mx',
      'www.gob.mx',
    ],
    visaTypes: [
      'Visa-Free (180 days most nationalities)',
      'Tourist Card FMM',
      'Temporary Resident Visa',
      'Permanent Resident Visa',
      'Working Holiday (limited)',
    ],
    region: 'Latin America',
    notes:
      'FMM tourist card is legally required for all foreign visitors. Enforcement is inconsistent — some entry points do not issue or verify it. Instruct users to request it proactively at entry and retain it until departure. Do not dismiss FMM as unimportant, and do not overstate enforcement as universal. Border exits reset the FMM — re-entry with a new FMM is a legitimate strategy unlike Schengen.',
  },
  {
    name: 'Colombia',
    aliases: ['Colombia', 'CO'],
    govDomains: [
      'www.cancilleria.gov.co',
      'www.migracioncolombia.gov.co',
    ],
    visaTypes: [
      'Visa-Free (90 days, extendable to 180)',
      'Digital Nomad Visa M-10',
      'Retirement Visa',
      'Investor Visa',
      'Working Visa',
    ],
    region: 'Latin America',
    notes:
      'Do not cite specific M-10 processing time estimates — processing times vary from 2 weeks to 3+ months and change frequently. Direct users to check current timelines at migracioncolombia.gov.co. The 90-day visa-free stay is extendable to 180 days by visiting a Migracion Colombia office — surface this option explicitly.',
  },

  // ─── Schengen bloc-level entry ────────────────────────────────────────────
  // Handles users who type "Schengen" without specifying a country.
  {
    name: 'Schengen',
    aliases: ['Schengen', 'Schengen Area', 'Europe', 'EU'],
    govDomains: [
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Visa-Free Short Stay (90/180 rule)',
      'Schengen C Visa (Short Stay)',
      'ETIAS (pending launch)',
      'National D Visa (country-specific)',
    ],
    region: 'Schengen',
    schengenMember: true,
    notes:
      'User queried the Schengen Area as a whole rather than a specific country. Surface the 90/180 rule prominently. Explain that a Schengen C visa is applied for at the consulate of the primary destination country. Recommend the user specify their target country for country-specific D visa options — Portugal D8, Spain Digital Nomad Visa, Germany Freiberufler are distinct visas requiring separate applications. Do not produce country-specific border crossing options — the answer depends on which member state the user will be in.',
  },
];

export const DESTINATIONS = ALL_DESTINATIONS.filter((d) =>
  ENABLED_REGIONS.includes(d.region)
);

// Derived — never hand-maintain these
export const SUPPORTED_DESTINATION_NAMES = DESTINATIONS.map((d) => d.name);
export const SCHENGEN_MEMBERS = DESTINATIONS.filter((d) => d.schengenMember).map((d) => d.name);

export function getGovDomains(destinationName: string): string[] {
  const dest = DESTINATIONS.find((d) => d.name === destinationName);
  return dest?.govDomains ?? ['.gov'];
}

// ─── Coverage labels (consumed by config/client.ts) ────────────────────────

export const REGION_LABELS: Record<Region, string> = {
  SEA: 'Southeast Asia',
  'East Asia': 'East Asia',
  Schengen: 'Europe',
  'Latin America': 'Latin America',
};

// "Southeast Asia, East Asia, Europe & Latin America" — auto-updates when ENABLED_REGIONS changes
export const coverageLabel = ENABLED_REGIONS.map((r) => REGION_LABELS[r])
  .join(', ')
  .replace(/, ([^,]+)$/, ' & $1');

// Country count metric — auto-updates
export const destinationCount = DESTINATIONS.length;
