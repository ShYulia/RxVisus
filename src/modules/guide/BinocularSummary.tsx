import CautionBox from '../../components/CautionBox';
import { getManagementConsiderations, NO_PATTERN_MANAGEMENT, type ManagementConsiderations } from '../../domain/reference/binocularManagement';
import { parseBinocularFindings, type MemNottFinding, type ParsedBinocularData, type Phoria, type VergencePair } from '../../domain/reference/binocularFindings';
import { interpretBinocularAssessment, type BinocularInterpretation } from '../../domain/reference/binocularPatterns';
import { SYMPTOM_LABELS } from '../../domain/reference/binocularQuickScreen';
import { evaluateDistanceSheard, evaluateNearSheard, type SheardResult } from '../../domain/reference/binocularSheard';

export interface BinocularSummaryProps {
  findings: Record<string, string>;
}

const VERGENCE_PATTERN_IDS = new Set(['ci', 'ce', 'di', 'de', 'basic-exo', 'basic-eso', 'fvd']);
const ACCOMMODATIVE_PATTERN_IDS = new Set(['ai', 'ae', 'ainfac']);

function formatPhoria(phoria?: Phoria): string | undefined {
  if (!phoria) return undefined;
  if (phoria.type === 'ortho') return 'Ortho';
  return phoria.amount !== undefined ? `${phoria.amount}Δ ${phoria.type}` : phoria.type;
}

function formatVergence(pair?: VergencePair): string | undefined {
  if (!pair) return undefined;
  const one = (label: string, f?: { blur?: number; blurAbsent?: boolean; break?: number; recovery?: number }) => {
    if (!f) return undefined;
    const parts = [
      f.blurAbsent ? 'no blur' : f.blur !== undefined && `blur ${f.blur}`,
      f.break !== undefined && `break ${f.break}`,
      f.recovery !== undefined && `recovery ${f.recovery}`,
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

/** No significant associated dysfunction in the *other* domain, shown only for a single well-identified pattern — never asserted for "mixed" or "no pattern". */
function reassuranceLine(interpretation: BinocularInterpretation): string | undefined {
  if (interpretation.category !== 'pattern' || interpretation.patterns.length !== 1) return undefined;
  const id = interpretation.patterns[0].id;
  if (ACCOMMODATIVE_PATTERN_IDS.has(id)) return 'No significant associated vergence dysfunction demonstrated.';
  if (VERGENCE_PATTERN_IDS.has(id)) return 'No significant associated accommodative dysfunction demonstrated.';
  return undefined;
}

function managementFor(interpretation: BinocularInterpretation): ManagementConsiderations | undefined {
  // 'pattern' always carries its primary finding first, whether it's the sole match or paired
  // with a secondary 'possible' finding (see interpretBinocularAssessment) — management follows
  // the primary either way.
  if (interpretation.category === 'pattern' && interpretation.patterns.length >= 1) {
    return getManagementConsiderations(interpretation.patterns[0].id);
  }
  if (interpretation.category === 'mixed' && interpretation.patterns.length === 2) {
    const [a, b] = interpretation.patterns.map((p) => getManagementConsiderations(p.id));
    if (!a || !b) return a ?? b;
    return { summary: [...new Set([...a.summary, ...b.summary])], moreDetails: [...(a.moreDetails ?? []), ...(b.moreDetails ?? [])] };
  }
  if (interpretation.category === 'no-pattern') return NO_PATTERN_MANAGEMENT;
  return undefined;
}

/**
 * Always terminal: the main result is the dominant element, followed by supporting findings,
 * a short "What next?" (management is clinical decision support, never an automatic
 * prescription — detail stays behind "How to manage →"), then the patient's actual
 * measurements — key ones directly, the full set behind "All measurements" so the summary
 * stays fast to scan at point of care.
 */
const BinocularSummary: React.FC<BinocularSummaryProps> = ({ findings }) => {
  const data = parseBinocularFindings(findings);
  const interpretation = interpretBinocularAssessment(data);
  const nearSheard = evaluateNearSheard(data);
  const distanceSheard = evaluateDistanceSheard(data);
  const keyRows = buildKeyRows(data, nearSheard, distanceSheard);
  const allRows = buildAllRows(data, nearSheard, distanceSheard);
  const reassurance = reassuranceLine(interpretation);
  const management = managementFor(interpretation);

  return (
    <div className="rx-final-rx">
      <p className="rx-summary-headline rx-summary-headline-dominant">{interpretation.headline}</p>

      <div className="rx-summary-disclaimer">
        <CautionBox>
          Decision support, not a diagnosis — confirm and correlate clinically. You remain responsible for diagnosis and management.
        </CautionBox>
      </div>

      {interpretation.patterns.map((pattern) => (
        <div key={pattern.id} className={pattern.confidence === 'possible' ? 'rx-summary-pattern rx-summary-pattern-possible' : 'rx-summary-pattern'}>
          <p className="rx-summary-pattern-label">
            {pattern.label} <span className="rx-summary-pattern-confidence">({pattern.confidence})</span>
          </p>
          <ul>
            {pattern.supportingFindings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
          {pattern.note && <p className="rx-summary-pattern-note">{pattern.note}</p>}
        </div>
      ))}

      {reassurance && <p className="rx-summary-reassurance">{reassurance}</p>}

      {management && (
        <div className="rx-summary-whatnext">
          <p className="rx-list-section-label">What next?</p>
          <p className="rx-summary-whatnext-note">
            For clinical reference — decision support only, not automatic treatment or prescribing instructions.
          </p>
          <ul>
            {management.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {management.moreDetails && management.moreDetails.length > 0 && (
            <details className="rx-more-details">
              <summary>How to manage →</summary>
              <ul>
                {management.moreDetails.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="rx-summary-measurements">
        <p className="rx-list-section-label">Key measurements</p>
        {keyRows.map((row) => (
          <Row key={row.label} label={row.label} value={row.value} />
        ))}
      </div>

      <details className="rx-more-details">
        <summary>All measurements</summary>
        <div className="rx-summary-measurements" style={{ marginTop: 10 }}>
          {allRows.map((row) => (
            <Row key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </details>
    </div>
  );
};

export default BinocularSummary;
