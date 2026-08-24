import { describe, expect, it } from 'vitest';
import { getManagementConsiderations, NO_PATTERN_MANAGEMENT } from './binocularManagement';

const ALL_PATTERN_IDS = ['ci', 'ce', 'di', 'de', 'basic-exo', 'basic-eso', 'fvd', 'ai', 'ae', 'ainfac'];

describe('getManagementConsiderations', () => {
  it('has an entry for every pattern id the interpretation engine can produce', () => {
    for (const id of ALL_PATTERN_IDS) {
      expect(getManagementConsiderations(id), `missing management considerations for "${id}"`).toBeDefined();
    }
  });

  it('every summary stays short (2-3 lines) so the Summary screen remains fast to scan', () => {
    for (const id of ALL_PATTERN_IDS) {
      const considerations = getManagementConsiderations(id)!;
      expect(considerations.summary.length).toBeLessThanOrEqual(3);
    }
  });

  it('CI management does not default to prism as first-line, and distinguishes BO-trains vs BI-reduces-demand', () => {
    const ci = getManagementConsiderations('ci')!;
    const allText = [...ci.summary, ...(ci.moreDetails ?? [])].join(' ').toLowerCase();
    expect(allText).toContain('therapy');
    expect(allText).toContain('prism is not the default first recommendation');
    expect(allText).toContain('train/build the positive fusional convergence reserve'.toLowerCase());
    expect(allText).toContain('bi prism instead reduces the convergence demand');
    expect(allText).toContain('age alone should not determine therapy vs. prism');
  });

  it('CI management requires trialing prism over best correction and verifying comfort, when prism is considered', () => {
    const ci = getManagementConsiderations('ci')!;
    const allText = [...ci.summary, ...(ci.moreDetails ?? [])].join(' ').toLowerCase();
    expect(allText).toContain('trial it over');
    expect(allText).toContain('verify comfort');
  });

  it('every pattern reminds the clinician to confirm best correction', () => {
    for (const id of ALL_PATTERN_IDS) {
      const considerations = getManagementConsiderations(id)!;
      expect(considerations.summary.some((line) => /correction/i.test(line))).toBe(true);
    }
  });

  it('returns undefined for an unknown pattern id', () => {
    expect(getManagementConsiderations('not-a-real-pattern')).toBeUndefined();
  });
});

describe('NO_PATTERN_MANAGEMENT', () => {
  it('is a short generic fallback', () => {
    expect(NO_PATTERN_MANAGEMENT.summary.length).toBeGreaterThan(0);
    expect(NO_PATTERN_MANAGEMENT.summary.length).toBeLessThanOrEqual(2);
  });
});
