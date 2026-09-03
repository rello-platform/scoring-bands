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
/**
 * Credit score bands. `not-sure` is a REAL answer meaning "asked, and the
 * person does not know" — it is deliberately part of the vocabulary and is
 * not the same as the field being absent.
 */
export declare const CREDIT_SCORE_BANDS: readonly ["below-580", "580-619", "620-659", "660-699", "700-739", "740-plus", "not-sure"];
export declare const INCOME_BANDS: readonly ["under-40k", "40k-60k", "60k-80k", "80k-100k", "100k-150k", "150k-180k", "180k-220k", "220k-plus"];
export declare const PRICE_BANDS: readonly ["under-400k", "400k-500k", "500k-600k", "600k-700k", "700k-800k", "800k-900k", "900k-1m", "1m-plus"];
export declare const DOWN_PAYMENT_BANDS: readonly ["under-10k", "10k-25k", "25k-50k", "50k-75k", "75k-100k", "100k-140k", "140k-180k", "180k-220k", "220k-260k", "260k-plus"];
export declare const MONTHLY_DEBT_BANDS: readonly ["none", "under-250", "250-500", "500-1000", "1000-2000", "2000-2500", "2500-3000", "3000-plus"];
export type CreditScoreBand = (typeof CREDIT_SCORE_BANDS)[number];
export type IncomeBand = (typeof INCOME_BANDS)[number];
export type PriceBand = (typeof PRICE_BANDS)[number];
export type DownPaymentBand = (typeof DOWN_PAYMENT_BANDS)[number];
export type MonthlyDebtBand = (typeof MONTHLY_DEBT_BANDS)[number];
/** Representative FICO for each band. `not-sure` is null — unknown, not absent. */
export declare const CREDIT_SCORE_VALUES: Readonly<Record<CreditScoreBand, number | null>>;
/** Representative annual household income (USD) for each band. */
export declare const INCOME_VALUES: Readonly<Record<IncomeBand, number>>;
/** Representative target home price (USD) for each band. */
export declare const PRICE_VALUES: Readonly<Record<PriceBand, number>>;
/** Representative saved-for-down-payment amount (USD) for each band. */
export declare const DOWN_PAYMENT_VALUES: Readonly<Record<DownPaymentBand, number>>;
/** Representative monthly non-housing debt (USD) for each band. */
export declare const MONTHLY_DEBT_VALUES: Readonly<Record<MonthlyDebtBand, number>>;
/** The five band-valued fields of a range-based score input. */
export type ScoringBandField = 'creditScoreRange' | 'annualIncome' | 'priceRange' | 'downPayment' | 'monthlyDebts';
interface ScoringBandFieldSpec {
    readonly bands: readonly string[];
    /**
     * True when the scorer cannot produce a number for this field's component
     * without inventing an input.
     *
     * `creditScoreRange` is the one false: an unanswered credit question already
     * resolves through the config-declared `unknownCreditDefault`, which is a
     * scoring policy rather than a fabricated input, and the vocabulary carries
     * an explicit `not-sure` member for the answered-but-unknown case.
     *
     * The other four are true because their absence used to be papered over with
     * a fabricated $60,000 / $500,000 / $20,000 / $0 — the defect this package
     * closes. Income, price and debts are all divisors or addends of the DTI
     * computation; price and saved amount drive the down-payment and reserves
     * components. There is no honest number without them.
     */
    readonly requiredToScore: boolean;
}
export declare const SCORING_BAND_FIELDS: Readonly<Record<ScoringBandField, ScoringBandFieldSpec>>;
/** Every band field, in a stable order suitable for error messages and docs. */
export declare const SCORING_BAND_FIELD_NAMES: readonly ScoringBandField[];
/** The band fields without which no score can be produced. */
export declare const REQUIRED_SCORING_BAND_FIELDS: readonly ScoringBandField[];
export declare function isCreditScoreBand(value: unknown): value is CreditScoreBand;
export declare function isIncomeBand(value: unknown): value is IncomeBand;
export declare function isPriceBand(value: unknown): value is PriceBand;
export declare function isDownPaymentBand(value: unknown): value is DownPaymentBand;
export declare function isMonthlyDebtBand(value: unknown): value is MonthlyDebtBand;
/** Membership test for an arbitrary band field. */
export declare function isBandValueFor(field: ScoringBandField, value: unknown): boolean;
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
export declare function isAbsentBandValue(value: unknown): boolean;
export interface UnrecognisedBand {
    readonly field: ScoringBandField;
    /** The offending value, stringified for safe transport in an error body. */
    readonly value: string;
    readonly accepted: readonly string[];
}
export type ScoringBandValidation = {
    readonly outcome: 'OK';
} | {
    readonly outcome: 'UNRECOGNISED_BAND';
    readonly unrecognised: readonly UnrecognisedBand[];
} | {
    readonly outcome: 'INSUFFICIENT_DATA';
    readonly missing: readonly ScoringBandField[];
};
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
export declare function validateScoringBands(input: Readonly<Record<string, unknown>> | null | undefined): ScoringBandValidation;
/**
 * The whole vocabulary as a plain serialisable object, for a discovery
 * endpoint. Shaped so an integrator can read the accepted values and the
 * required-to-score flag for every field in one response.
 */
export declare function describeScoringBands(): {
    fields: Record<ScoringBandField, {
        accepted: readonly string[];
        requiredToScore: boolean;
    }>;
    requiredToScore: readonly ScoringBandField[];
    absentMeans: string;
};
export {};
//# sourceMappingURL=index.d.ts.map