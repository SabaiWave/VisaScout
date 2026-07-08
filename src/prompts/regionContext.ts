import type { VisaRequest } from '../types/index';
import type { DestinationConfig } from '../config/destinations';

const SCHENGEN_CONTEXT = `
SCHENGEN-SPECIFIC RULES (read carefully — getting these wrong causes real traveler harm):

- The 90/180 rule: a traveler may stay in the Schengen area for a maximum of 90 days
  in any 180-day rolling window. This counter does NOT reset when leaving Schengen and
  entering another Schengen country. It resets only when 90 days have elapsed since first entry.
- Border runs DO NOT WORK in Schengen. Leaving Schengen and returning does not reset
  the 90-day counter. Never suggest this as a strategy.
- Short-stay visa (Schengen C): applied at the consulate of the country where most time
  is spent (or first entry if time is equal). Valid across all 27 member states.
- Long-stay visa (national D visa): country-specific. Not interchangeable. Portugal D8,
  Spain DNV, Germany Freiberufler are distinct visas requiring separate applications.
- ETIAS: electronic travel authorization launching for visa-exempt nationalities.
  Do not assert that ETIAS is currently active or required. Verify current ETIAS launch
  status and if unconfirmed, state "ETIAS has been announced but not yet launched — verify before travel."
- Do not calculate the user's remaining Schengen days. Explain the 90/180 rule clearly.
  Direct the user to the official EU Schengen short-stay calculator at ec.europa.eu to
  calculate their specific remaining days.
- Always distinguish: Schengen visa-free ≠ EU membership ≠ right to work.
`.trim();

const EAST_ASIA_CONTEXT = `
EAST ASIA-SPECIFIC RULES:

- Japan: visa-free duration VARIES by nationality — never assume 90 days, always verify
  for the specific nationality. Japan has an officially named "Designated Activities (Digital Nomad)"
  visa on mofa.go.jp — use this full official name. Do not use informal labels that do not
  match the official mofa.go.jp designation. Always cite mofa.go.jp as the authoritative source.
- South Korea: K-ETA (Korea Electronic Travel Authorization) required for many
  visa-exempt nationalities. Eligibility varies — do not state it is required for all nationalities.
  The Korea F-1-D digital nomad visa has nationality restrictions. Do not state it is available
  to all nationalities — advise verification of current eligibility at www.hikorea.go.kr.
- For both countries: income from remote work for a foreign employer exists in a legal gray
  area. Surface this nuance explicitly rather than implying work is freely permitted.
`.trim();

const LATIN_AMERICA_CONTEXT = `
LATIN AMERICA-SPECIFIC RULES:

- Mexico: most Western nationalities enter visa-free up to 180 days. FMM (Forma Migratoria
  Múltiple) tourist card is legally required for all foreign visitors. Enforcement is
  inconsistent — some entry points do not issue or verify it. Advise users to request it
  proactively at entry and keep it — it must be surrendered at departure. Fines and entry
  complications can result if unavailable. Do not dismiss FMM as unimportant, and do not
  overstate enforcement as universal.
  Border exits reset the FMM — re-entry with a new FMM is a legitimate and common strategy
  unlike Schengen.
- Colombia: visa-free duration and any extension procedure vary by nationality — do not
  assert a universal figure; verify from search results for the user's specific passport.
  Digital Nomad Visa (M-10) available — do not cite specific processing time estimates;
  direct users to migracioncolombia.gov.co for current timelines.
- Remote work legal status: both countries have informal tolerance but no formal remote work
  visa for tourist-entry workers. Surface this nuance.
`.trim();

const SEA_CONTEXT = `
SOUTHEAST ASIA-SPECIFIC RULES:

- Border runs: common, generally accepted practice in SEA. Each country resets independently.
  Verify enforcement posture per country — Thailand in particular has tightened border run limits.
- Thailand specifically: land border entries have separate limits from air entries for some
  visa types. Verify current rules — enforcement has changed multiple times recently.
- Vietnam: e-visa availability and visa-on-arrival rules have changed — always verify current
  entry requirements rather than relying on cached knowledge.
`.trim();

export function getRegionContext(req: VisaRequest): string {
  if (req.schengenMember) return SCHENGEN_CONTEXT;
  if (req.region === 'East Asia') return EAST_ASIA_CONTEXT;
  if (req.region === 'Latin America') return LATIN_AMERICA_CONTEXT;
  return SEA_CONTEXT;
}

export function buildAgentContext(req: VisaRequest, dest: DestinationConfig): string {
  const region = getRegionContext(req);
  const country = dest.notes ?? '';
  return country ? `${region}\n\n${country}` : region;
}

export { SCHENGEN_CONTEXT, EAST_ASIA_CONTEXT, LATIN_AMERICA_CONTEXT, SEA_CONTEXT };
