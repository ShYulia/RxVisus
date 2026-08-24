import { parseBinocularFindings, type ParsedBinocularData, type Phoria, type VergencePair } from '../../domain/reference/binocularFindings';
import { interpretBinocularAssessment } from '../../domain/reference/binocularPatterns';
import { evaluateDistanceSheard, evaluateNearSheard, type SheardResult } from '../../domain/reference/binocularSheard';

export interface BinocularSummaryProps {
  findings: Record<string, string>;
}

function formatPhoria(phoria?: Phoria): string | undefined {
  if (!phoria) return undefined;
  if (phoria.type === 'ortho') return 'Ortho';
  return `${phoria.amount ?? '?'}Δ ${phoria.type}`;
}

function formatVergence(pair?: VergencePair): string | undefined {
  if (!pair) return undefined;
  const one = (label: string, f?: { blur?: number; break?: number; recovery?: number }) => {
    if (!f) return undefined;
    const parts = [f.blur !== undefined && `blur ${f.blur}`, f.break !== undefined && `break ${f.break}`, f.recovery !== undefined && `recovery ${f.recovery}`].filter(
      Boolean,
    );
    return parts.length > 0 ? `${label} ${parts.join('/')}` : undefined;
  };
  return [one('BI', pair.bi), one('BO', pair.bo)].filter(Boolean).join('  ') || undefined;
}

function formatSheard(label: string, sheard: SheardResult): string | undefined {
  if (!sheard.applicable) return undefined;
  return `${label} Sheard's: ${sheard.pass ? 'PASS' : 'FAIL'} (${sheard.compensatingDirection?.toUpperCase()} ${sheard.reserveSource} ${sheard.reserveUsed}Δ vs. ${sheard.phoriaAmount}Δ phoria)`;
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

function buildRows(data: ParsedBinocularData, nearSheard: SheardResult, distanceSheard: SheardResult): { label: string; value?: string }[] {
  return [
    { label: 'Symptoms', value: data.symptoms.size > 0 && !data.symptoms.has('none') ? [...data.symptoms].join(', ') : data.symptoms.has('none') ? 'None reported' : undefined },
    { label: 'Distance phoria', value: formatPhoria(data.distancePhoria) },
    { label: 'Near phoria', value: formatPhoria(data.nearPhoria) },
    { label: 'NPC', value: data.npcBreakCm !== undefined ? `break ${data.npcBreakCm}cm${data.npcRecoveryCm !== undefined ? ` / recovery ${data.npcRecoveryCm}cm` : ''}` : undefined },
    { label: 'Near vergence', value: formatVergence(data.nearVergence) },
    { label: 'Distance vergence', value: formatVergence(data.distanceVergence) },
    { label: 'Near Sheard', value: formatSheard('Near', nearSheard) },
    { label: 'Distance Sheard', value: formatSheard('Distance', distanceSheard) },
    { label: 'Amplitude of accommodation', value: data.aaOD !== undefined || data.aaOS !== undefined ? `OD ${data.aaOD ?? '—'}D  OS ${data.aaOS ?? '—'}D` : undefined },
    { label: 'MAF', value: data.maf ? `OD ${data.maf.od ?? '—'} cpm  OS ${data.maf.os ?? '—'} cpm${data.maf.difficulty ? `  (difficulty: ${data.maf.difficulty})` : ''}` : undefined },
    { label: 'BAF', value: data.baf ? `${data.baf.cyclesPerMin ?? '—'} cpm${data.baf.difficulty ? `  (difficulty: ${data.baf.difficulty})` : ''}` : undefined },
    { label: 'Gradient AC/A', value: data.acaGradient !== undefined ? `${data.acaGradient}Δ/D` : undefined },
    { label: 'NRA / PRA', value: data.nra !== undefined || data.pra !== undefined ? `NRA +${data.nra ?? '—'}  PRA -${data.pra ?? '—'}` : undefined },
    {
      label: 'Vergence facility',
      value: data.vergenceFacilityUnavailable ? 'Equipment not available' : data.vergenceFacilityCpm !== undefined ? `${data.vergenceFacilityCpm} cpm` : undefined,
    },
    { label: 'MEM / Nott retinoscopy', value: data.memNott },
    { label: 'Stereoacuity', value: data.stereoacuity },
  ];
}

/**
 * Always terminal: the patient's actual measurements alongside the
 * pattern-interpretation engine's output — never interpretation labels
 * alone. Each pattern's own supporting findings are shown so the clinician
 * can see exactly what evidence produced it (or didn't).
 */
const BinocularSummary: React.FC<BinocularSummaryProps> = ({ findings }) => {
  const data = parseBinocularFindings(findings);
  const interpretation = interpretBinocularAssessment(data);
  const nearSheard = evaluateNearSheard(data);
  const distanceSheard = evaluateDistanceSheard(data);
  const rows = buildRows(data, nearSheard, distanceSheard);

  return (
    <div className="rx-final-rx">
      <p className="rx-summary-headline">{interpretation.headline}</p>

      {interpretation.patterns.map((pattern) => (
        <div key={pattern.id} className="rx-summary-pattern">
          <p className="rx-summary-pattern-label">
            {pattern.label} <span className="rx-summary-pattern-confidence">({pattern.confidence})</span>
          </p>
          <ul>
            {pattern.supportingFindings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="rx-summary-measurements">
        <p className="rx-list-section-label">Recorded measurements</p>
        {rows.map((row) => (
          <Row key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
};

export default BinocularSummary;
