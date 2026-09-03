"use strict";
/**
 * @rello-platform/scoring-bands
 *
 * Canonical Home Ready scoring band vocabulary for the Rello platform.
 *
 * WHY THIS PACKAGE EXISTS
 * -----------------------
 * The five range-string enums consumed by the Home Ready scorer used to be
 * hand-copied into (at least) four places: Rello's `src/lib/scoring/defaults.ts`,
 * Rello's `src/lib/leads/intake-fields.ts`, HomeReady's local fallback
 * calculator, and HomeReady's capture types. Nothing detected drift between
 * them, and the consuming code degraded an unrecognised value to a default —
 * so a caller sending `740-799` (the natural continuation of the real band
 * `700-739`) received no error and a score 15 points below the truth.
 *
 * Two things are therefore owned here and must never be re-declared downstream:
 *
 *   1. the VOCABULARY (which strings are legal), and
 *   2. the VALUE MAPS (what number each band means).
 *
 * Owning only (1) would move the drift one layer down: two repos agreeing on
 * the legal strings but disagreeing on what `740-plus` is worth produce two
 * different scores for one input, silently.
 *
 * THE THREE OUTCOMES
 * ------------------
 * `validateScoringBands` exists so the API boundary and the offline fallback
 * apply one rule rather than two that must agree. It keeps three outcomes
 * apart that previously shared a value:
 *
 *   OK                 -> every required band answered and recognised; score it
 *   UNRECOGNISED_BAND  -> a value outside the vocabulary; the caller has a bug
 *   INSUFFICIENT_DATA  -> too few answers to score without inventing inputs
 *
 * Before this package, all three produced a number. `740-799`, `not-sure` and
 * a wholly invented string were byte-identical outcomes, and a caller who
 * answered nothing received a fabricated $60,000 income, a $500,000 target
 * price, $20,000 saved and $0 of debt — scoring a fictional person.
 *
 * See `~/.claude/standards/unknown-is-not-absent.md`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUIRED_SCORING_BAND_FIELDS = exports.SCORING_BAND_FIELD_NAMES = exports.SCORING_BAND_FIELDS = exports.MONTHLY_DEBT_VALUES = exports.DOWN_PAYMENT_VALUES = exports.PRICE_VALUES = exports.INCOME_VALUES = exports.CREDIT_SCORE_VALUES = exports.MONTHLY_DEBT_BANDS = exports.DOWN_PAYMENT_BANDS = exports.PRICE_BANDS = exports.INCOME_BANDS = exports.CREDIT_SCORE_BANDS = void 0;
exports.isCreditScoreBand = isCreditScoreBand;
exports.isIncomeBand = isIncomeBand;
exports.isPriceBand = isPriceBand;
exports.isDownPaymentBand = isDownPaymentBand;
exports.isMonthlyDebtBand = isMonthlyDebtBand;
exports.isBandValueFor = isBandValueFor;
exports.isAbsentBandValue = isAbsentBandValue;
exports.validateScoringBands = validateScoringBands;
exports.describeScoringBands = describeScoringBands;
// ============================================================================
// VOCABULARY — the legal band strings
// ============================================================================
/**
 * Credit score bands. `not-sure` is a REAL answer meaning "asked, and the
 * person does not know" — it is deliberately part of the vocabulary and is
 * not the same as the field being absent.
 */
exports.CREDIT_SCORE_BANDS = [
    'below-580',
    '580-619',
    '620-659',
    '660-699',
    '700-739',
    '740-plus',
    'not-sure',
];
exports.INCOME_BANDS = [
    'under-40k',
    '40k-60k',
    '60k-80k',
    '80k-100k',
    '100k-150k',
    '150k-180k',
    '180k-220k',
    '220k-plus',
];
exports.PRICE_BANDS = [
    'under-400k',
    '400k-500k',
    '500k-600k',
    '600k-700k',
    '700k-800k',
    '800k-900k',
    '900k-1m',
    '1m-plus',
];
exports.DOWN_PAYMENT_BANDS = [
    'under-10k',
    '10k-25k',
    '25k-50k',
    '50k-75k',
    '75k-100k',
    '100k-140k',
    '140k-180k',
    '180k-220k',
    '220k-260k',
    '260k-plus',
];
exports.MONTHLY_DEBT_BANDS = [
    'none',
    'under-250',
    '250-500',
    '500-1000',
    '1000-2000',
    '2000-2500',
    '2500-3000',
    '3000-plus',
];
// ============================================================================
// VALUE MAPS — what each band is worth
// ============================================================================
// Typed as a total Record over the band union, so adding a band to a
// vocabulary above without giving it a value is a COMPILE ERROR here rather
// than an `undefined` at runtime.
/** Representative FICO for each band. `not-sure` is null — unknown, not absent. */
exports.CREDIT_SCORE_VALUES = {
    'below-580': 550,
    '580-619': 600,
    '620-659': 640,
    '660-699': 680,
    '700-739': 720,
    '740-plus': 760,
    'not-sure': null,
};
/** Representative annual household income (USD) for each band. */
exports.INCOME_VALUES = {
    'under-40k': 35000,
    '40k-60k': 50000,
    '60k-80k': 70000,
    '80k-100k': 90000,
    '100k-150k': 125000,
    '150k-180k': 165000,
    '180k-220k': 200000,
    '220k-plus': 250000,
};
/** Representative target home price (USD) for each band. */
exports.PRICE_VALUES = {
    'under-400k': 350000,
    '400k-500k': 450000,
    '500k-600k': 550000,
    '600k-700k': 650000,
    '700k-800k': 750000,
    '800k-900k': 850000,
    '900k-1m': 950000,
    '1m-plus': 1200000,
};
/** Representative saved-for-down-payment amount (USD) for each band. */
exports.DOWN_PAYMENT_VALUES = {
    'under-10k': 5000,
    '10k-25k': 17500,
    '25k-50k': 37500,
    '50k-75k': 62500,
    '75k-100k': 87500,
    '100k-140k': 120000,
    '140k-180k': 160000,
    '180k-220k': 200000,
    '220k-260k': 240000,
    '260k-plus': 300000,
};
/** Representative monthly non-housing debt (USD) for each band. */
exports.MONTHLY_DEBT_VALUES = {
    none: 0,
    'under-250': 125,
    '250-500': 375,
    '500-1000': 750,
    '1000-2000': 1500,
    '2000-2500': 2250,
    '2500-3000': 2750,
    '3000-plus': 3500,
};
exports.SCORING_BAND_FIELDS = {
    creditScoreRange: { bands: exports.CREDIT_SCORE_BANDS, requiredToScore: false },
    annualIncome: { bands: exports.INCOME_BANDS, requiredToScore: true },
    priceRange: { bands: exports.PRICE_BANDS, requiredToScore: true },
    downPayment: { bands: exports.DOWN_PAYMENT_BANDS, requiredToScore: true },
    monthlyDebts: { bands: exports.MONTHLY_DEBT_BANDS, requiredToScore: true },
};
/** Every band field, in a stable order suitable for error messages and docs. */
exports.SCORING_BAND_FIELD_NAMES = Object.keys(exports.SCORING_BAND_FIELDS);
/** The band fields without which no score can be produced. */
exports.REQUIRED_SCORING_BAND_FIELDS = exports.SCORING_BAND_FIELD_NAMES.filter((f) => exports.SCORING_BAND_FIELDS[f].requiredToScore);
// ============================================================================
// TYPE GUARDS
// ============================================================================
function isCreditScoreBand(value) {
    return typeof value === 'string' && exports.CREDIT_SCORE_BANDS.includes(value);
}
function isIncomeBand(value) {
    return typeof value === 'string' && exports.INCOME_BANDS.includes(value);
}
function isPriceBand(value) {
    return typeof value === 'string' && exports.PRICE_BANDS.includes(value);
}
function isDownPaymentBand(value) {
    return typeof value === 'string' && exports.DOWN_PAYMENT_BANDS.includes(value);
}
function isMonthlyDebtBand(value) {
    return typeof value === 'string' && exports.MONTHLY_DEBT_BANDS.includes(value);
}
/** Membership test for an arbitrary band field. */
function isBandValueFor(field, value) {
    return (typeof value === 'string' && exports.SCORING_BAND_FIELDS[field].bands.includes(value));
}
// ============================================================================
// ABSENCE
// ============================================================================
/**
 * A band value is ABSENT when it is `null`, `undefined`, or the empty string —
 * and only then. Every other value (a number, a boolean, an object, a
 * non-empty string outside the vocabulary) is UNRECOGNISED, not absent.
 *
 * This line is where "we were not told" and "we were told something we do not
 * understand" are separated. Before this package they shared the falsy check
 * `input.annualIncome ? ... : ...`, which is why a wrong-typed value and an
 * unasked question produced the same fabricated default.
 */
function isAbsentBandValue(value) {
    return value === null || value === undefined || value === '';
}
/** Render a value for an error body without leaking an entire object graph. */
function describeValue(value) {
    if (typeof value === 'string')
        return value;
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return `[${typeof value}]`;
}
/**
 * Classify a range-based score input into exactly one of three outcomes.
 *
 * UNRECOGNISED_BAND is reported in preference to INSUFFICIENT_DATA when both
 * apply, because an unrecognised value is a caller defect that must be fixed
 * before the missing-answer question is even meaningful — and because a caller
 * told only "insufficient data" would add more answers rather than correct the
 * typo that caused it.
 *
 * Pure and dependency-free: safe to call at an API boundary and inside an
 * offline fallback, which is the point — one rule, not two that must agree.
 */
function validateScoringBands(input) {
    const unrecognised = [];
    const missing = [];
    for (const field of exports.SCORING_BAND_FIELD_NAMES) {
        const spec = exports.SCORING_BAND_FIELDS[field];
        const value = input ? input[field] : undefined;
        if (isAbsentBandValue(value)) {
            if (spec.requiredToScore)
                missing.push(field);
            continue;
        }
        if (!isBandValueFor(field, value)) {
            unrecognised.push({
                field,
                value: describeValue(value),
                accepted: spec.bands,
            });
        }
    }
    if (unrecognised.length > 0)
        return { outcome: 'UNRECOGNISED_BAND', unrecognised };
    if (missing.length > 0)
        return { outcome: 'INSUFFICIENT_DATA', missing };
    return { outcome: 'OK' };
}
/**
 * The whole vocabulary as a plain serialisable object, for a discovery
 * endpoint. Shaped so an integrator can read the accepted values and the
 * required-to-score flag for every field in one response.
 */
function describeScoringBands() {
    const fields = {};
    for (const field of exports.SCORING_BAND_FIELD_NAMES) {
        fields[field] = {
            accepted: exports.SCORING_BAND_FIELDS[field].bands,
            requiredToScore: exports.SCORING_BAND_FIELDS[field].requiredToScore,
        };
    }
    return {
        fields,
        requiredToScore: exports.REQUIRED_SCORING_BAND_FIELDS,
        absentMeans: 'null, undefined, or the empty string. Any other value must be one of the accepted band strings.',
    };
}
