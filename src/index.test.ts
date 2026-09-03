import { describe, it, expect } from 'vitest';
import {
  CREDIT_SCORE_BANDS,
  INCOME_BANDS,
  PRICE_BANDS,
  DOWN_PAYMENT_BANDS,
  MONTHLY_DEBT_BANDS,
  CREDIT_SCORE_VALUES,
  INCOME_VALUES,
  PRICE_VALUES,
  DOWN_PAYMENT_VALUES,
  MONTHLY_DEBT_VALUES,
  SCORING_BAND_FIELDS,
  SCORING_BAND_FIELD_NAMES,
  REQUIRED_SCORING_BAND_FIELDS,
  isAbsentBandValue,
  isBandValueFor,
  validateScoringBands,
  describeScoringBands,
} from './index';

const FULL = {
  creditScoreRange: '740-plus',
  annualIncome: '180k-220k',
  priceRange: '500k-600k',
  downPayment: '180k-220k',
  monthlyDebts: 'none',
};

describe('vocabulary <-> value map totality', () => {
  const pairs: [string, readonly string[], Record<string, unknown>][] = [
    ['credit', CREDIT_SCORE_BANDS, CREDIT_SCORE_VALUES],
    ['income', INCOME_BANDS, INCOME_VALUES],
    ['price', PRICE_BANDS, PRICE_VALUES],
    ['downPayment', DOWN_PAYMENT_BANDS, DOWN_PAYMENT_VALUES],
    ['monthlyDebts', MONTHLY_DEBT_BANDS, MONTHLY_DEBT_VALUES],
  ];

  for (const [name, bands, values] of pairs) {
    it(`${name}: every band has a value and every value has a band`, () => {
      expect(Object.keys(values).sort()).toEqual([...bands].sort());
    });
  }

  it('not-sure is a real credit answer that maps to null, not to a number', () => {
    expect(CREDIT_SCORE_BANDS).toContain('not-sure');
    expect(CREDIT_SCORE_VALUES['not-sure']).toBeNull();
  });
});

describe('absence', () => {
  it.each([null, undefined, ''])('%p is absent', (v) => {
    expect(isAbsentBandValue(v)).toBe(true);
  });

  it.each([0, false, '740-plus', '740-799', {}, []])('%p is NOT absent', (v) => {
    expect(isAbsentBandValue(v)).toBe(false);
  });
});

describe('validateScoringBands — three distinct outcomes', () => {
  it('OK when every required band is answered and recognised', () => {
    expect(validateScoringBands(FULL)).toEqual({ outcome: 'OK' });
  });

  it('OK when credit is absent — it is the one field with a config-declared unknown path', () => {
    const { creditScoreRange: _drop, ...rest } = FULL;
    expect(validateScoringBands(rest)).toEqual({ outcome: 'OK' });
  });

  it('OK when credit is the explicit not-sure answer', () => {
    expect(validateScoringBands({ ...FULL, creditScoreRange: 'not-sure' })).toEqual({
      outcome: 'OK',
    });
  });

  it('UNRECOGNISED_BAND for 740-799, the natural continuation of 700-739', () => {
    const r = validateScoringBands({ ...FULL, creditScoreRange: '740-799' });
    expect(r.outcome).toBe('UNRECOGNISED_BAND');
    if (r.outcome !== 'UNRECOGNISED_BAND') throw new Error('unreachable');
    expect(r.unrecognised).toHaveLength(1);
    expect(r.unrecognised[0]!.field).toBe('creditScoreRange');
    expect(r.unrecognised[0]!.value).toBe('740-799');
    expect(r.unrecognised[0]!.accepted).toContain('740-plus');
  });

  it('reports EVERY unrecognised field, not just the first', () => {
    const r = validateScoringBands({
      ...FULL,
      creditScoreRange: '740-799',
      annualIncome: '200k-250k',
      monthlyDebts: '0',
    });
    if (r.outcome !== 'UNRECOGNISED_BAND') throw new Error('expected UNRECOGNISED_BAND');
    expect(r.unrecognised.map((u) => u.field).sort()).toEqual(
      ['annualIncome', 'creditScoreRange', 'monthlyDebts'].sort(),
    );
  });

  it('a wrong-typed value is UNRECOGNISED, never absent', () => {
    const r = validateScoringBands({ ...FULL, monthlyDebts: 0 });
    expect(r.outcome).toBe('UNRECOGNISED_BAND');
  });

  it('INSUFFICIENT_DATA when nothing at all is answered', () => {
    const r = validateScoringBands({});
    expect(r.outcome).toBe('INSUFFICIENT_DATA');
    if (r.outcome !== 'INSUFFICIENT_DATA') throw new Error('unreachable');
    expect([...r.missing].sort()).toEqual([...REQUIRED_SCORING_BAND_FIELDS].sort());
  });

  it('INSUFFICIENT_DATA on a null input, not a crash', () => {
    expect(validateScoringBands(null).outcome).toBe('INSUFFICIENT_DATA');
  });

  it('INSUFFICIENT_DATA names exactly the missing required fields', () => {
    const r = validateScoringBands({ creditScoreRange: '740-plus', annualIncome: '180k-220k' });
    if (r.outcome !== 'INSUFFICIENT_DATA') throw new Error('expected INSUFFICIENT_DATA');
    expect([...r.missing].sort()).toEqual(['downPayment', 'monthlyDebts', 'priceRange']);
  });

  it('credit alone never makes an input scoreable', () => {
    expect(validateScoringBands({ creditScoreRange: '740-plus' }).outcome).toBe(
      'INSUFFICIENT_DATA',
    );
  });

  it('UNRECOGNISED_BAND wins when a value is both bad and answers are missing', () => {
    const r = validateScoringBands({ annualIncome: '200k-250k' });
    expect(r.outcome).toBe('UNRECOGNISED_BAND');
  });

  it('one answer short of scoreable is INSUFFICIENT_DATA', () => {
    const { monthlyDebts: _drop, ...oneShort } = FULL;
    const r = validateScoringBands(oneShort);
    expect(r.outcome).toBe('INSUFFICIENT_DATA');
    if (r.outcome !== 'INSUFFICIENT_DATA') throw new Error('unreachable');
    expect(r.missing).toEqual(['monthlyDebts']);
  });

  it('exactly scoreable — the required four and nothing else', () => {
    expect(
      validateScoringBands({
        annualIncome: '180k-220k',
        priceRange: '500k-600k',
        downPayment: '180k-220k',
        monthlyDebts: 'none',
      }),
    ).toEqual({ outcome: 'OK' });
  });

  it('an unknown extra key is ignored, not treated as a band', () => {
    expect(validateScoringBands({ ...FULL, somethingElse: 'nonsense' })).toEqual({
      outcome: 'OK',
    });
  });
});

describe('registry', () => {
  it('every band field is registered exactly once', () => {
    expect(SCORING_BAND_FIELD_NAMES).toEqual([
      'creditScoreRange',
      'annualIncome',
      'priceRange',
      'downPayment',
      'monthlyDebts',
    ]);
  });

  it('credit is the only field not required to score', () => {
    expect(REQUIRED_SCORING_BAND_FIELDS).toEqual([
      'annualIncome',
      'priceRange',
      'downPayment',
      'monthlyDebts',
    ]);
    expect(SCORING_BAND_FIELDS.creditScoreRange.requiredToScore).toBe(false);
  });

  it('isBandValueFor agrees with the registry for every legal value', () => {
    for (const field of SCORING_BAND_FIELD_NAMES) {
      for (const band of SCORING_BAND_FIELDS[field].bands) {
        expect(isBandValueFor(field, band)).toBe(true);
      }
      expect(isBandValueFor(field, 'definitely-not-a-band')).toBe(false);
    }
  });
});

describe('describeScoringBands — the discovery payload', () => {
  it('carries every field, its accepted values and its required flag', () => {
    const d = describeScoringBands();
    expect(Object.keys(d.fields).sort()).toEqual([...SCORING_BAND_FIELD_NAMES].sort());
    expect(d.fields.creditScoreRange.accepted).toContain('740-plus');
    expect(d.fields.creditScoreRange.accepted).not.toContain('740-799');
    expect(d.fields.annualIncome.requiredToScore).toBe(true);
    expect(d.requiredToScore).toEqual(REQUIRED_SCORING_BAND_FIELDS);
  });

  it('survives JSON round-trip unchanged', () => {
    const d = describeScoringBands();
    expect(JSON.parse(JSON.stringify(d))).toEqual(JSON.parse(JSON.stringify(d)));
    expect(JSON.parse(JSON.stringify(d)).fields.monthlyDebts.accepted).toEqual([
      ...MONTHLY_DEBT_BANDS,
    ]);
  });
});
