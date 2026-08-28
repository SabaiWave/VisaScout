// src/config/destinations.ts — single source of truth for all destination logic
// Agents call getGovDomains(). Never hand-maintain SUPPORTED_DESTINATION_NAMES or SCHENGEN_MEMBERS.

export type Region = 'SEA' | 'East Asia' | 'Schengen' | 'Latin America' | 'Middle East' | 'South Asia' | 'Caucasus';

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
  'Middle East',
  'South Asia',
  'Caucasus',
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
      'Visa Exemption (60 days, extendable +30 days)',
      'Tourist Visa (TR)',
      'Thailand Privilege Card',
      'Long-Term Resident (LTR) Visa',
      'Non-Immigrant B (Business)',
      'Non-Immigrant O / O-A (Retirement/Family)',
    ],
    region: 'SEA',
    notes:
      'Always surface: (1) current visa exemption duration and extendability for the user\'s nationality — do not assume any specific day count, confirm from search results; (2) whether Visa on Arrival applies to the user\'s nationality; (3) TDAC pre-arrival requirement — affects all travelers regardless of visa type, replaces TM6. Never conflate Non-Immigrant O and O-A — they are distinct sub-types with different conditions. Do not state O-A eligibility criteria as settled — requirements have been under revision; verify from search results before advising.',
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
    notes:
      'Always distinguish e-visa approval validity from maximum stay per entry — they are different values; confirm both from search results. Surface whether the user\'s nationality qualifies for any bilateral visa exemption — exemption programs have expanded recently. Do not assert Golden Visa or long-stay investor program availability without confirming from official sources — they have been in finalization stage. Primary e-visa portal: evisa.xuatnhapcanh.gov.vn — verify current active portal from search results.',
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
      'Visa on Arrival (VOA) / e-VOA',
      '211A/C1 Visitor Visa (Tourist/Social)',
      'E-Visa',
      'KITAS Work/Stay Permit',
      'Second Home Visa',
    ],
    region: 'SEA',
    notes:
      'All extensions (VOA, KITAS) require in-person biometric collection — always surface this to users planning to extend; do not assume standard online-only renewal is available. A pre-arrival card must be submitted via evisa.imigrasi.go.id before arrival — surface to all travelers. New education visa categories exist — surface if user mentions study purposes. Long-stay investor visa pathway exists — surface if user is an investor or skilled professional.',
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
    notes:
      'Employment Pass renewals involving a category change require additional documentation — do not assume standard renewal process; verify current requirements from search results. MM2H program has undergone significant requirement revisions — do not rely on cached requirements; always verify current eligibility thresholds at imi.gov.my. DE Rantau Nomad Pass: verify current application status at mdec.com.my before advising.',
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
      'Visa-Free (varies by nationality)',
      '9(a) Temporary Visitors Visa',
      'Special Work Permit',
      'SRRV Retirement Visa',
      'Pre-arranged Employment Visa (9G)',
      'Temporary Resident Visa (TRV)',
    ],
    region: 'SEA',
    notes:
      'E-Visas (evisa.gov.ph) are non-extendable and non-convertible — do not suggest extending an e-Visa; extensions apply only to 9(a) visas via immigration.gov.ph. Do not assert a universal visa-free duration — it varies by nationality. ACR I-Card is an alien registration document required for long-stay holders, not a visa type. Digital Nomad Visa has been announced — verify current launch status and requirements at immigration.gov.ph before advising. Passport valid 6 months beyond departure required.',
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
      'E-Visa',
      'Visa Exemption',
      'Ordinary Visa (ER)',
      'Business Visa (EB)',
      'Retirement Visa',
      'MICE Visa',
    ],
    region: 'SEA',
    notes:
      'Do not confidently recommend Visa on Arrival without verifying current availability from search results — status is uncertain. Always surface Cambodia e-Arrival registration requirement to all travelers. Verify ER/EB visa codes and current processing against official sources before advising on those types.',
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
      'E-Visa (30-day stay, 60-day approval validity)',
      'Tourist Visa (L)',
      'Business Visa (B)',
      'Investment Visa',
      'Non-Immigrant Visa',
    ],
    region: 'SEA',
    notes:
      'Never conflate e-Visa approval letter validity with actual stay duration — they are different values; confirm both from search results. A digital immigration card requirement may be in effect at some entry points, replacing paper cards — surface this to travelers. Always confirm current visa-free policy for the user\'s nationality from search results — expanded temporary policies may have lapsed. Passport valid 180+ days from arrival required.',
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
      'Social Visa',
      'Religious / Education Visa',
      'Official Visa',
    ],
    region: 'SEA',
    notes:
      'Multiple-entry is a sub-tier within individual visa types (Business, Social, Religious, etc.) — not a standalone product. Business Visa fees vary between gov portals — surface both values and note the discrepancy rather than asserting a single figure; verify current fees from search results. Do not recommend Special Economic Zone Permit without confirming current availability from official sources. Any US entry restrictions on Myanmar nationals affect outbound travel from Myanmar, not foreigners entering Myanmar.',
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
    notes:
      'Always verify current Employment Pass qualifying salary threshold from mom.gov.sg — it has been updated and may change further. Visa-Free Transit Facility (VFTF) is a distinct entry pathway for transit passengers — different from standard visa-free entry; surface when user mentions transit.',
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
      'Visit Visa',
      'Business Visit Visa',
      'Employment Pass',
      'Dependent Visa',
      'Permanent Residence',
    ],
    region: 'SEA',
    notes:
      'Always surface mandatory travel insurance requirement — verify current status at mfa.gov.bn. Business Visit Visa and Professional Visit Visa have distinct document requirements — do not conflate them. Long-Term Pass option exists for foreigners with established ties — surface if relevant. All visitors require valid passport, onward ticket, and sufficient funds.',
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
      'Tourist Visa (Short-Term Stay)',
      'Highly Skilled Professional (HSP)',
      'Working Holiday',
      'Business Manager Visa (経営・管理ビザ)',
      'Designated Activities (Digital Nomad)',
    ],
    region: 'East Asia',
    notes:
      "Use the full official name 'Designated Activities (Digital Nomad)' for Japan's digital nomad visa — do not use informal labels not matching mofa.go.jp. Verify current income and insurance requirements from search results before citing specifics. Business Manager Visa requirements have been updated — verify current criteria from search results. Visa-free duration varies by nationality — do not assume 90 days. JESTA pre-clearance rollout is in progress for visa-exempt travelers — verify current status. Always cite mofa.go.jp as authoritative source.",
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
      'K-ETA (Korea Electronic Travel Authorization)',
      'Tourist C-3',
      'Digital Nomad F-1-D',
      'Working Holiday H-1',
      'Business C-2/C-3-2',
      'E-7 Skilled Worker',
    ],
    region: 'East Asia',
    notes:
      'Do not state K-ETA is universally required — eligibility varies by nationality; some nationalities are temporarily exempt from both visa and K-ETA. Verify current K-ETA status for the user\'s specific nationality at www.immigration.go.kr. F-1-D digital nomad visa has nationality restrictions — do not assert universal availability. F-3 dependent visa rules have changed materially — verify current requirements before advising on family situations. Always verify current eligibility at www.immigration.go.kr.',
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
    notes:
      'Always surface EES biometric border registration to visa-free travelers — it changes how the 90/180 rule is enforced and how overstays are detected. Verify current National D Visa application process at auswaertiges-amt.de — procedures have been updated. Surface that visa rejection appeals now require court proceedings, not an administrative remonstration process. Vocational-experience and expanded student immigration pathways exist — surface if relevant to the user\'s situation.',
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
      'Skilled Job Seeker Visa (pending, not yet open)',
      'Working Holiday',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
    notes:
      'Do not recommend the Job Seeker Visa — it has been discontinued. A replacement Skilled Job Seeker Visa exists — verify whether it is currently open for applications at vistos.mne.gov.pt before advising; it may still be pending implementing regulations. Portugal\'s immigration framework has been under active legislative revision — verify current visa type availability and eligibility at aima.gov.pt and vistos.mne.gov.pt before advising.',
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
    notes:
      'Do not recommend the Golden Visa — it has been terminated. Arraigo/Settlement residency requirements have been updated — do not cite prior requirements; verify current rules from search results. A family residence permit for family members of Spanish nationals has been introduced — surface if relevant. Consular requirements vary by consulate — always direct users to their specific exteriores.gob.es consulate page.',
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
    notes:
      'Verify current visa application submission requirements — procedures have been updated. Schengen C visa holders may be eligible to convert single-entry to multiple-entry while in the Netherlands — surface this option if relevant. EU Blue Card and Startup Visa are valid pathways not in the visaTypes list — surface if user asks about skilled worker or entrepreneur routes.',
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
    notes:
      'UK nationals are not visa-free — they require a Schengen or national visa. Talent Passport holders have exemptions from language and civics requirements that apply to other long-stay pathways — surface this distinction when comparing options. All applicants over 12 must appear in person for biometric capture — surface to users planning to apply. Verify current remote worker and long-stay pathways at france-visas.gouv.fr — rules have been updated.',
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
      'FMM tourist card is legally required for all foreign visitors — instruct users to request it proactively at entry and retain until departure (surrendered at exit). Enforcement is inconsistent — do not dismiss FMM as unimportant, and do not overstate enforcement as universal. Border exits reset the FMM — re-entry with a new FMM is a legitimate strategy, unlike Schengen. Verify current FMM procedures and format from search results — administrative processes may have changed. Advise users that INM processing timelines may be extended — verify current timelines before citing estimates.',
  },
  {
    name: 'Colombia',
    aliases: ['Colombia', 'CO'],
    govDomains: [
      'www.cancilleria.gov.co',
      'www.migracioncolombia.gov.co',
    ],
    visaTypes: [
      'Visa-Free (up to 180 days)',
      'Digital Nomad Visa M-10',
      'Retirement Visa',
      'Investor Visa',
      'Working Visa',
    ],
    region: 'Latin America',
    notes:
      'Do not assume a specific visa-free duration or extension procedure — allowances vary by nationality; verify the user\'s specific entitlement from search results before advising. Do not cite specific M-10 processing time estimates — direct users to migracioncolombia.gov.co for current timelines. Investor visa has a minimum investment threshold — verify current requirement from official sources before citing a figure.',
  },

  // ─── Schengen (new members) ────────────────────────────────────────────────
  {
    name: 'Italy',
    aliases: ['Italy', 'Italia', 'IT'],
    govDomains: [
      'vistoperitalia.esteri.it',
      'esteri.it',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Schengen C Tourist Visa',
      'Elective Residency Visa',
      'Self-Employment / Freelancer Visa',
      'EU Blue Card',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
    notes:
      'Elective Residency Visa requires proof of passive income sufficient to support stay without working — verify current income threshold from search results; do not cite a specific figure. Self-employment visa (lavoro autonomo) requires a pre-approval (nulla osta) from the Italian Questura — surface this procedural requirement. Italy participates in EES biometric border registration — surface to visa-exempt travelers. Consular requirements and appointment availability vary significantly by country — always direct users to their local Italian consulate.',
  },
  {
    name: 'Greece',
    aliases: ['Greece', 'Hellas', 'GR'],
    govDomains: [
      'mfa.gr',
      'migration.gov.gr',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Schengen C Tourist Visa',
      'Digital Nomad Visa',
      'Golden Visa (Investor Residence)',
      'EU Blue Card',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
    notes:
      "Greece's Digital Nomad Visa minimum income threshold and application process — verify current requirements at mfa.gr before citing specifics. Golden Visa investment threshold has been raised in popular areas (Athens, Thessaloniki, Mykonos, Santorini) — do not cite the lower historical threshold; verify current minimum from search results. EES biometric border registration applies — surface to visa-exempt travelers.",
  },
  {
    name: 'Czech Republic',
    aliases: ['Czech Republic', 'Czechia', 'Česko', 'CZ'],
    govDomains: [
      'mzv.gov.cz',
      'mvcr.cz',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Schengen C Tourist Visa',
      'Employee Card (long-stay work)',
      'EU Blue Card',
      'National D Long-Stay Visa',
      'Freelancer Trade License (živnostenský list)',
    ],
    region: 'Schengen',
    schengenMember: true,
    notes:
      'Czech Republic has been a Schengen member since 2007 — do not confuse with non-Schengen EU states. The živnostenský list (trade license) is a popular pathway for self-employed expats but requires a Czech tax presence — verify current requirements from search results. Employee Card processing timelines can be extended — advise users to verify current estimates at mvcr.cz. EES biometric border registration applies — surface to visa-exempt travelers.',
  },
  {
    name: 'Poland',
    aliases: ['Poland', 'Polska', 'PL'],
    govDomains: [
      'gov.pl',
      'msz.gov.pl',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Schengen C Tourist Visa',
      'Temporary Residence Permit',
      'EU Blue Card',
      'National D Visa',
      'Work Permit (single-entry authorization)',
    ],
    region: 'Schengen',
    schengenMember: true,
    notes:
      'Temporary Residence Permit applications require in-person submission at a regional Voivode office — surface this procedural requirement; remote filing is not available. Work Permit processing timelines vary by Voivode — do not cite a universal estimate; direct users to the relevant regional office at gov.pl. Poland participates in EES biometric border registration — surface to visa-exempt travelers. Border crossing wait times at eastern land borders may be elevated — verify current conditions from search results if relevant to the user.',
  },
  {
    name: 'Croatia',
    aliases: ['Croatia', 'Hrvatska', 'HR'],
    govDomains: [
      'mvp.gov.hr',
      'mup.gov.hr',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Schengen C Tourist Visa',
      'Digital Nomad Temporary Stay',
      'Temporary Stay Permit',
      'Work Permit',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
    notes:
      'Croatia joined Schengen on 1 January 2023 — the 90/180 rule now applies; do not advise Croatia as a Schengen reset destination post-2023. The Digital Nomad Temporary Stay permit allows up to one year — verify current income threshold and application process at mup.gov.hr before citing specifics. EES biometric border registration applies — surface to visa-exempt travelers. Kuna replaced by Euro in 2023 — do not reference the Kuna.',
  },
  {
    name: 'Hungary',
    aliases: ['Hungary', 'Magyarország', 'HU'],
    govDomains: [
      'kormany.hu',
      'bmbah.hu',
      'ec.europa.eu',
      'travel-europe.europa.eu',
    ],
    visaTypes: [
      'Schengen Visa-Free (90/180)',
      'Schengen C Tourist Visa',
      'White Card (Digital Nomad Residence)',
      'EU Blue Card',
      'Guest Worker Permit',
      'National D Visa',
    ],
    region: 'Schengen',
    schengenMember: true,
    notes:
      "Hungary's White Card (digital nomad residence permit) allows up to one year — verify current minimum income threshold and application process at bmbah.hu before citing specifics. Guest Worker Permit is a distinct pathway from the EU Blue Card — verify current eligibility and sponsorship requirements from search results. EES biometric border registration applies — surface to visa-exempt travelers.",
  },

  // ─── Middle East ───────────────────────────────────────────────────────────
  {
    name: 'United Arab Emirates',
    aliases: ['United Arab Emirates', 'UAE', 'Dubai', 'Abu Dhabi', 'AE'],
    govDomains: [
      'icp.gov.ae',
      'mofaic.gov.ae',
      'evisa.icp.gov.ae',
      'gdrfad.gov.ae',
    ],
    visaTypes: [
      'Visa on Arrival (varies by nationality)',
      'Tourist Visa (30/60/90 days)',
      'Freelancer / Remote Work Visa',
      'Golden Visa (10-year long-term residence)',
      'Green Visa (5-year self-sponsored)',
      'Employment Residence Visa',
    ],
    region: 'Middle East',
    notes:
      "Dubai and Abu Dhabi share the same federal visa system — do not differentiate by emirate for visa types. Visa on Arrival eligibility and duration vary significantly by nationality — never generalize; verify the user's specific nationality entitlement at icp.gov.ae. The Green Visa (5-year self-sponsored) and Golden Visa (10-year for investors/talent) are distinct products — do not conflate them. Freelancer visa requires a permit from a relevant free zone authority — surface this multi-step requirement. UAE immigration policy evolves quickly — always verify current sponsor-free pathways from search results.",
  },
  {
    name: 'Turkey',
    aliases: ['Turkey', 'Türkiye', 'TR'],
    govDomains: [
      'evisa.gov.tr',
      'mfa.gov.tr',
      'goc.gov.tr',
      'turkiye.gov.tr',
    ],
    visaTypes: [
      'E-Visa (single/multiple entry, up to 90 days)',
      'Visa on Arrival (limited nationalities)',
      'Sticker Tourist Visa (consulate)',
      'Short-Term Residence Permit',
      'Work Permit',
      'Digital Nomad Visa (verify current status)',
    ],
    region: 'Middle East',
    notes:
      "E-visa eligibility is nationality-dependent and not universal — verify the user's specific nationality at evisa.gov.tr before advising. Short-Term Residence Permit is the standard long-stay option for visitors — commonly applied for inside Turkey; verify current application requirements and processing times at goc.gov.tr. Turkey digital nomad visa has been announced — verify current launch status and application availability from search results before advising. Turkish Lira inflation affects cost-of-living — do not cite specific cost amounts; direct users to current sources.",
  },

  // ─── South Asia ────────────────────────────────────────────────────────────
  {
    name: 'India',
    aliases: ['India', 'IN'],
    govDomains: [
      'indianvisaonline.gov.in',
      'mea.gov.in',
      'boi.gov.in',
      'grfrvisa.gov.in',
    ],
    visaTypes: [
      'e-Tourist Visa (30 days)',
      'Tourist Visa (long-term, multiple entry)',
      'Business Visa',
      'Employment Visa',
      'Conference Visa',
      'Medical Visa',
    ],
    region: 'South Asia',
    notes:
      "India visa rules vary dramatically by nationality — do not generalize. Nationals of Pakistan, Bangladesh, and certain other countries face significant restrictions — always confirm the user's nationality against current eligibility before advising. e-Tourist Visa is available to most nationalities but has duration and purpose restrictions — do not conflate with the long-term Tourist Visa. Visa on Arrival is available only at specific airports for specific nationalities — verify current list at indianvisaonline.gov.in. Specific ports of entry required for some visa types — surface to travelers.",
  },

  // ─── Caucasus ──────────────────────────────────────────────────────────────
  {
    name: 'Georgia',
    aliases: ['Georgia', 'Sakartvelo', 'GE'],
    govDomains: [
      'geoconsul.gov.ge',
      'mfa.gov.ge',
      'napr.gov.ge',
      'evisa.gov.ge',
    ],
    visaTypes: [
      'Visa-Free (365 days for eligible nationalities)',
      'E-Visa',
      'Temporary Residence Permit',
      'Work Permit',
      'Investment Residence',
      'Diplomatic / Official Visa',
    ],
    region: 'Caucasus',
    notes:
      "Georgia's 365-day visa-free stay is a headline benefit but does NOT apply to all nationalities — verify the user's specific nationality at mfa.gov.ge before citing it. E-Visa is available as a fallback for nationalities not covered by visa-free access — verify eligibility at evisa.gov.ge. Temporary Residence Permit (TRP) is available for long-stay residents — commonly used by digital nomads who stay beyond the visa-free window. Tax residency rules in Georgia are favorable (flat rate) — surface if user mentions tax concerns, but note this is separate from immigration status and verify current rules from the Georgian Revenue Service. Property registration (NAPR) is a common parallel process for long-term residents — surface if relevant.",
  },

  // ─── Latin America (new) ───────────────────────────────────────────────────
  {
    name: 'Argentina',
    aliases: ['Argentina', 'AR'],
    govDomains: [
      'cancilleria.gob.ar',
      'migraciones.gob.ar',
      'argentina.gob.ar',
    ],
    visaTypes: [
      'Visa-Free (90 days, most nationalities)',
      'Tourist Visa',
      'Rentista Visa (passive income)',
      'Retirement Visa (Jubilado)',
      'Working Holiday (limited nationalities)',
      'Permanent Residence',
    ],
    region: 'Latin America',
    notes:
      "Argentina's visa-free duration for most nationalities is 90 days, extendable once at migraciones.gob.ar — verify current extension procedure and fee from search results. Economic and political conditions in Argentina have been volatile — flag that visa processing timelines and administrative requirements may be subject to change; advise users to verify current status close to travel. Rentista and Jubilado visas require demonstrating ongoing income — verify current minimum thresholds from search results before citing figures. Do not endorse or explain unofficial currency exchange practices; reference only official BCRA exchange rates.",
  },
  {
    name: 'Brazil',
    aliases: ['Brazil', 'Brasil', 'BR'],
    govDomains: [
      'viajaobrasil.itamaraty.gov.br',
      'portalconsular.itamaraty.gov.br',
      'pf.gov.br',
      'gov.br',
    ],
    visaTypes: [
      'Visa-Free (90 days, varies by nationality)',
      'Tourist Visa (Visto de Turismo)',
      'Digital Nomad Visa (VITEM XIV)',
      'Retirement / Passive Income Visa',
      'Work Permit',
      'Permanent Residence',
    ],
    region: 'Latin America',
    notes:
      "Visa-free eligibility for Brazil varies significantly by nationality — verify the user's specific nationality entitlement at viajaobrasil.itamaraty.gov.br before advising. The VITEM XIV (Digital Nomad Visa) allows up to one year — verify current minimum income threshold and application requirements from search results. Visa-free nationals can generally stay 90 days per 180-day period — verify current rules and extension availability at pf.gov.br. Entry documentation (onward ticket, proof of funds) is enforced at Brazilian airports — surface this to all travelers.",
  },
  {
    name: 'Peru',
    aliases: ['Peru', 'Perú', 'PE'],
    govDomains: [
      'rree.gob.pe',
      'migraciones.gob.pe',
    ],
    visaTypes: [
      'Visa-Free (183 days, most nationalities)',
      'Tourist Visa',
      'Business Visa',
      'Temporary Resident Visa',
      'Rentista Visa',
      'Work Permit',
    ],
    region: 'Latin America',
    notes:
      "Peru is visa-free for most nationalities for up to 183 days — verify the user's specific nationality entitlement at rree.gob.pe before advising. The 183-day stay is not automatic — immigration officers may stamp a shorter initial period; advise travelers to request the full duration at the port of entry. Temporary Resident Visa is available for long-stay purposes (work, retirement, income) — verify current requirements at migraciones.gob.pe. Altitude acclimatization for Cusco and Andean destinations is outside VisaScout's scope — do not address it in the brief.",
  },
  {
    name: 'Costa Rica',
    aliases: ['Costa Rica', 'CR'],
    govDomains: [
      'migracion.go.cr',
      'rree.go.cr',
    ],
    visaTypes: [
      'Visa-Free (90 days, most nationalities)',
      'Tourist Visa',
      'Rentista Visa (passive income)',
      'Pensionado (retirement)',
      'Inversionista (investor)',
      'Work Permit',
    ],
    region: 'Latin America',
    notes:
      "Costa Rica is visa-free for most nationalities for up to 90 days — verify current eligibility at rree.go.cr. Rentista Visa requires a certified monthly passive income — verify current minimum threshold from search results before citing a figure. Pensionado Visa requires a qualifying government pension — verify current minimum from search results. An onward ticket (salida) is technically required for visa-free entry and is sometimes enforced — surface this requirement. CAJA (public health insurance) enrollment is required for residency-based visa holders — surface as a procedural step if relevant.",
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
      'ETIAS (post-EES launch, fee ~€7)',
      'National D Visa (country-specific)',
    ],
    region: 'Schengen',
    schengenMember: true,
    notes:
      'User queried the Schengen Area as a whole rather than a specific country. Surface the 90/180 rule prominently. EES biometric border registration is being implemented — surface to visa-exempt travelers as it changes how overstay enforcement works; verify current EES launch status from search results. ETIAS pre-travel authorisation has been announced — do not assert it is currently active or required; verify current ETIAS status from search results. Explain that a Schengen C visa is applied for at the consulate of the primary destination country. Recommend the user specify their target country for country-specific D visa options — Portugal D8, Spain Digital Nomad Visa, Germany Freiberufler are distinct visas requiring separate applications. Do not produce country-specific border crossing options — the answer depends on which member state the user will be in.',
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
  'Middle East': 'Middle East',
  'South Asia': 'South Asia',
  Caucasus: 'Caucasus',
};

// User-facing display groups — collapses internal region codes into broad labels for UI copy.
// SEA, East Asia, South Asia, Caucasus all surface as "Asia" to avoid "Asia" appearing 4× in one line.
// When adding a new Region: assign it a display group here.
export const REGION_DISPLAY_GROUPS: Record<Region, string> = {
  SEA: 'Asia',
  'East Asia': 'Asia',
  Schengen: 'Europe',
  'Latin America': 'Latin America',
  'Middle East': 'Middle East',
  'South Asia': 'Asia',
  Caucasus: 'Asia',
};

// Unique display groups in ENABLED_REGIONS order — deduplicates Asia sub-regions automatically
const uniqueDisplayGroups = [...new Set(ENABLED_REGIONS.map((r) => REGION_DISPLAY_GROUPS[r]))];

// "Asia, Europe, Latin America & Middle East" — auto-updates when ENABLED_REGIONS changes
export const coverageLabel = uniqueDisplayGroups
  .join(', ')
  .replace(/, ([^,]+)$/, ' & $1');

// "Asia · Europe · Latin America · Middle East" — dot-separated for stat cards
export const coverageLabelDot = uniqueDisplayGroups.join(' · ');

// Country count metric — auto-updates
export const destinationCount = DESTINATIONS.length;
