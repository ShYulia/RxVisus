import { useState } from 'react';
import { ChevronDownIcon, InfoIcon } from '../../components/icons';
import { getManagementConsiderations, type ManagementConsiderations } from '../../domain/reference/binocularManagement';
import { parseBinocularFindings, type MemNottFinding, type ParsedBinocularData, type Phoria, type VergencePair } from '../../domain/reference/binocularFindings';
import { evaluateBinocularPatterns, hasCoreBinocularData, type PatternMatch } from '../../domain/reference/binocularPatterns';
import { getPatternSource } from '../../domain/reference/binocularPatternSources';
import { SYMPTOM_LABELS } from '../../domain/reference/binocularQuickScreen';
import { evaluateDistanceSheard, evaluateNearSheard, type SheardResult } from '../../domain/reference/binocularSheard';

export interface BinocularSummaryProps {
  findings: Record<string, string>;
}

function formatPhoria(phoria?: Phoria): string | undefined {
  if (!phoria) return undefined;
  if (phoria.type === 'ortho') return 'Ortho';
  return phoria.amount !== undefined ? `${phoria.amount}Δ ${phoria.type}` : phoria.type;
}

function formatVergence(pair?: VergencePair): string | undefined {
  if (!pair) return undefined;
  const one = (
    label: string,
    f?: { blur?: number; blurAbsent?: boolean; break?: number; breakExceedsRange?: boolean; recovery?: number; recoveryExceedsRange?: boolean },
  ) => {
    if (!f) return undefined;
    const parts = [
      f.blurAbsent ? 'no blur' : f.blur !== undefined && `blur ${f.blur}`,
      f.breakExceedsRange ? 'break exceeds range' : f.break !== undefined && `break ${f.break}`,
      f.recoveryExceedsRange ? 'recovery exceeds range' : f.recovery !== undefined && `recovery ${f.recovery}`,
    ].filter(Boolean);
    return parts.length > 0 ? `${label} ${parts.join('/')}` : undefined;
  };
  return [one('BI', pair.bi), one('BO', pair.bo)].filter(Boolean).join('  ') || undefined;
}

function formatSheard(label: string, sheard: SheardResult): string | undefined {
  if (!sheard.applicable) return undefined;
  return `${label} Sheard's: ${sheard.pass ? 'PASS' : 'FAIL'} (${sheard.compensatingDirection?.toUpperCase()} ${sheard.reserveSource} ${sheard.reserveUsed}Δ vs. ${sheard.phoriaAmount}Δ phoria)`;
}

function formatSignedD(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}D`;
}

/** Signed per-eye lag(+)/lead(−) — see MemNottFinding. Omits an eye that wasn't recorded. */
function formatMemNott(finding?: MemNottFinding): string | undefined {
  if (!finding) return undefined;
  const parts = [finding.od !== undefined && `OD ${formatSignedD(finding.od)}`, finding.os !== undefined && `OS ${formatSignedD(finding.os)}`].filter(Boolean);
  return parts.length > 0 ? parts.join('  ') : undefined;
}

function formatSymptoms(data: ParsedBinocularData): string | undefined {
  if (data.symptoms.has('none')) return 'None reported';
  if (data.symptoms.size === 0) return undefined;
  return [...data.symptoms].map((key) => SYMPTOM_LABELS[key] ?? key).join(', ');
}

/** Row helper — omits the row entirely when the value is undefined, since missing data is "not tested", never shown as zero/normal. */
const Row: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (value === undefined) return null;
  return (
    <p className="rx-final-rx-row">
      <span>{label}:</span> <strong>{value}</strong>
    </p>
  );
};

function buildKeyRows(data: ParsedBinocularData, nearSheard: SheardResult, distanceSheard: SheardResult): { label: string; value?: string }[] {
  return [
    { label: 'Symptoms', value: formatSymptoms(data) },
    { label: 'Distance phoria', value: formatPhoria(data.distancePhoria) },
    { label: 'Near phoria', value: formatPhoria(data.nearPhoria) },
    { label: 'NPC', value: data.npcBreakCm !== undefined ? `break ${data.npcBreakCm}cm${data.npcRecoveryCm !== undefined ? ` / recovery ${data.npcRecoveryCm}cm` : ''}` : undefined },
    { label: 'Near Sheard', value: formatSheard('Near', nearSheard) },
    { label: 'Distance Sheard', value: formatSheard('Distance', distanceSheard) },
  ];
}

function buildAllRows(data: ParsedBinocularData, nearSheard: SheardResult, distanceSheard: SheardResult): { label: string; value?: string }[] {
  return [
    ...buildKeyRows(data, nearSheard, distanceSheard),
    { label: 'Near vergence', value: formatVergence(data.nearVergence) },
    { label: 'Distance vergence', value: formatVergence(data.distanceVergence) },
    { label: 'Amplitude of accommodation', value: data.aaOD !== undefined || data.aaOS !== undefined ? `OD ${data.aaOD ?? '—'}D  OS ${data.aaOS ?? '—'}D` : undefined },
    {
      label: 'MAF',
      value: data.maf
        ? `OD ${data.maf.od ?? '—'} cycles/min  OS ${data.maf.os ?? '—'} cycles/min${data.maf.difficulty ? `  (difficulty: ${data.maf.difficulty})` : ''}`
        : undefined,
    },
    {
      label: 'BAF',
      value: data.baf ? `${data.baf.cyclesPerMin ?? '—'} cycles/min${data.baf.difficulty ? `  (difficulty: ${data.baf.difficulty})` : ''}` : undefined,
    },
    { label: 'Gradient AC/A', value: data.acaGradient !== undefined ? `${data.acaGradient}Δ/D` : undefined },
    { label: 'NRA / PRA', value: data.nra !== undefined || data.pra !== undefined ? `NRA +${data.nra ?? '—'}  PRA -${data.pra ?? '—'}` : undefined },
    {
      label: 'Vergence facility',
      value: data.vergenceFacilityUnavailable ? 'Equipment not available' : data.vergenceFacilityCpm !== undefined ? `${data.vergenceFacilityCpm} cycles/min` : undefined,
    },
    { label: 'MEM / Nott retinoscopy', value: formatMemNott(data.memNott) },
    { label: 'Stereoacuity', value: data.stereoacuity },
  ];
}

/** "a" before a consonant sound, "an" before a vowel sound — every current pattern label starts with a plain letter, so a simple vowel check is sufficient. */
function articleFor(label: string): string {
  return /^[aeiou]/i.test(label) ? 'an' : 'a';
}

/**
 * A small, compact, tappable row that expands its content on click — no native <details> marker.
 * Used for every piece of optional/secondary detail (source, management, measurements) so the
 * primary result and its supporting findings stay the visual focus of the screen.
 */
const CompactCard: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rx-summary-compact">
      <button type="button" className="rx-summary-compact-trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{label}</span>
        <ChevronDownIcon size={14} className={open ? 'rx-summary-compact-chevron rx-summary-compact-chevron-open' : 'rx-summary-compact-chevron'} />
      </button>
      {open && <div className="rx-summary-compact-content">{children}</div>}
    </div>
  );
};

/**
 * One pattern's full block: the large primary result card (suggestion + compact disclaimer),
 * the always-expanded "why" card, then compact optional detail (source, then management, with
 * any further "how to manage" detail flattened into the same card rather than nested another
 * level deep). Visual hierarchy only — no clinical wording, threshold, source, or management
 * content changes.
 */
const PatternBlock: React.FC<{ pattern: PatternMatch; management?: ManagementConsiderations }> = ({ pattern, management }) => (
  <div className="rx-summary-block">
    <div className="rx-summary-result-card">
      <p className="rx-summary-result-label">Findings suggest</p>
      <p className="rx-summary-result-value">
        {articleFor(pattern.label)} {pattern.label} pattern
      </p>
      <p className="rx-summary-result-disclaimer">
        <InfoIcon size={14} className="rx-summary-result-disclaimer-icon" />
        <span>Decision support only — confirm clinically. You remain responsible for diagnosis and management.</span>
      </p>
    </div>

    <div className="rx-summary-why-card">
      <p className="rx-summary-pattern-why">Why this pattern was suggested</p>
      <ul>
        {pattern.supportingFindings.map((finding) => (
          <li key={finding}>{finding}</li>
        ))}
      </ul>
    </div>

    <CompactCard label="Clinical Source">
      <p className="rx-summary-source-text">{getPatternSource(pattern.id)}</p>
    </CompactCard>

    {management && (
      <CompactCard label="Clinical considerations">
        <p className="rx-summary-whatnext-note">For clinical reference — decision support only, not automatic treatment or prescribing instructions.</p>
        <ul>
          {management.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {management.moreDetails && management.moreDetails.length > 0 && (
          <>
            <p className="rx-summary-more-manage-label">More on managing this</p>
            <ul>
              {management.moreDetails.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}
      </CompactCard>
    )}
  </div>
);

/**
 * Always terminal: every pattern the findings suggest is shown independently, in order — never a
 * single "primary" picked out of several, never merged. Each pattern's large result card and
 * expanded supporting findings are the visual focus; source, management, and measurements are
 * all compact, collapsed-by-default detail kept out of the way until asked for.
 */
const BinocularSummary: React.FC<BinocularSummaryProps> = ({ findings }) => {
  const data = parseBinocularFindings(findings);
  const patterns = evaluateBinocularPatterns(data);
  const hasCoreData = hasCoreBinocularData(data);
  const nearSheard = evaluateNearSheard(data);
  const distanceSheard = evaluateDistanceSheard(data);
  const keyRows = buildKeyRows(data, nearSheard, distanceSheard);
  const allRows = buildAllRows(data, nearSheard, distanceSheard);

  return (
    <div className="rx-final-rx">
      {!hasCoreData && (
        <p className="rx-summary-headline">Insufficient data to interpret — complete the core Alignment/Convergence steps first.</p>
      )}

      {hasCoreData && patterns.length === 0 && <p className="rx-summary-headline">No pattern from this list was suggested by the findings entered.</p>}

      {patterns.map((pattern) => (
        <PatternBlock key={pattern.id} pattern={pattern} management={getManagementConsiderations(pattern.id)} />
      ))}

      <div className="rx-summary-measurements-group">
        <CompactCard label="Key measurements">
          <div className="rx-summary-measurements">
            {keyRows.map((row) => (
              <Row key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </CompactCard>

        <CompactCard label="All measurements">
          <div className="rx-summary-measurements">
            {allRows.map((row) => (
              <Row key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </CompactCard>
      </div>
    </div>
  );
};

export default BinocularSummary;
