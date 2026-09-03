# @rello-platform/scoring-bands

Canonical Home Ready scoring band vocabulary for the Rello platform.

Owns two things that must never be re-declared downstream:

1. **the vocabulary** — which range strings are legal for each of the five band fields;
2. **the value maps** — what number each band means.

Owning only the vocabulary would move the drift one layer down: two repos agreeing
on the legal strings but disagreeing on what `740-plus` is worth produce two
different scores for one input, silently.

## Why

The five enums were hand-copied into at least four places (Rello
`src/lib/scoring/defaults.ts`, Rello `src/lib/leads/intake-fields.ts`, HomeReady's
local fallback calculator, HomeReady's capture types). Nothing detected drift, and
the consuming code degraded an unrecognised value to a default — so a caller
sending `740-799`, the natural continuation of the real band `700-739`, got no
error and a score 15 points below the truth.

## The three outcomes

`validateScoringBands(input)` returns exactly one of:

| outcome | meaning | HTTP |
|---|---|---|
| `OK` | every required band answered and recognised | 200 + score |
| `UNRECOGNISED_BAND` | a value outside the vocabulary — caller bug | 400 |
| `INSUFFICIENT_DATA` | too few answers to score without inventing inputs | 422 |

`UNRECOGNISED_BAND` is reported in preference to `INSUFFICIENT_DATA` when both
apply: a caller told only "insufficient data" would add more answers rather than
correct the typo that caused it.

## Absence

A band value is **absent** when it is `null`, `undefined`, or `''` — and only then.
Every other value (a number, a boolean, an object, a non-empty string outside the
vocabulary) is **unrecognised**, not absent.

## Required to score

`creditScoreRange` is the only field not required. An unanswered credit question
resolves through the config-declared `unknownCreditDefault`, which is a scoring
policy rather than a fabricated input, and the vocabulary carries an explicit
`not-sure` member for the answered-but-unknown case.

The other four are required because their absence used to be papered over with a
fabricated $60,000 income / $500,000 price / $20,000 saved / $0 debts. Income,
price and debts are divisors or addends of the DTI computation; price and saved
amount drive the down-payment and reserves components. There is no honest number
without them.

## Usage

```ts
import {
  validateScoringBands,
  CREDIT_SCORE_VALUES,
  type CreditScoreBand,
} from '@rello-platform/scoring-bands';

const v = validateScoringBands(input);
if (v.outcome === 'UNRECOGNISED_BAND') return reject(400, v.unrecognised);
if (v.outcome === 'INSUFFICIENT_DATA') return reject(422, v.missing);
// v.outcome === 'OK' — safe to score
```

Zero runtime dependencies. Pure functions, safe at an API boundary and inside an
offline fallback — which is the point: one rule, not two that must agree.

## Consumers

- **Rello** — `POST /api/scoring/calculate` (boundary validation) and
  `src/lib/scoring/calculator.ts` (`parseRangeInput`).
- **HomeReady** — the local fallback calculator that runs when
  `calculateScoreViaRello` returns null.

Related: `~/.claude/standards/unknown-is-not-absent.md`.
