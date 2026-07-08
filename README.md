# VisaScout

[![CI](https://github.com/SabaiWave/VisaScout/actions/workflows/ci.yml/badge.svg)](https://github.com/SabaiWave/VisaScout/actions/workflows/ci.yml)

**Visa intelligence for digital nomads and long-stay travelers.**

[visascout.io](https://www.visascout.io) · Built by [Sabai Wave](https://sabaiwave.com)

---

Tell VisaScout your nationality, destination, and situation. It returns a structured visa brief with recommended actions, deadlines, entry requirements, border run options, and per-claim confidence scores — sourced from official immigration portals, recent policy changes, and traveler ground truth.

**Supported destinations:** Thailand, Vietnam, Indonesia, Malaysia, Philippines, Cambodia, Laos, Myanmar, Singapore, Brunei, Japan, South Korea, Germany, Portugal, Spain, Netherlands, France, Mexico, Colombia, Schengen

---

## Getting started

```bash
git clone https://github.com/SabaiWave/visascout.git
cd visascout
npm install
cp .env.example .env.local
# Fill in required API keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Legal

VisaScout aggregates publicly available information. It is not a legal advisor. Every brief includes a disclaimer and source citations. Verify all visa requirements with official sources before travel.
