import FlipperFacilityCard from './FlipperFacilityCard';

/** Chair-side visual instruction card for Monocular Accommodative Facility — see FlipperFacilityCard. */
export const MAFQuickCard: React.FC = () => (
  <FlipperFacilityCard
    meta={['40 cm', 'ONE EYE AT A TIME', '60 SEC']}
    equipmentLine="USE ±2.00 D ACCOMMODATIVE FLIPPERS"
    beforeNote="Cover one eye."
    flowSteps={[
      { kind: 'value', label: '+2.00 lens' },
      { kind: 'action', label: 'WAIT UNTIL CLEAR' },
      { kind: 'action', label: 'FLIP' },
      { kind: 'value', label: '−2.00 lens' },
      { kind: 'action', label: 'WAIT UNTIL CLEAR' },
      { kind: 'action', label: 'FLIP & REPEAT FOR 60 SEC' },
    ]}
    afterNote="Then repeat with the other eye."
    cycleQuestion="How many full cycles in 60 seconds?"
    cycleDefinition="+2.00 clear + −2.00 clear = 1 cycle"
    difficultyQuestion="Which lens was difficult to clear?"
    difficultyOptions={['+2.00', '−2.00', 'Both', 'Neither']}
    interpretLines={['+2.00 difficult → difficulty relaxing accommodation', '−2.00 difficult → difficulty stimulating accommodation']}
  />
);

/** Chair-side visual instruction card for Binocular Accommodative Facility — same lens flow as MAF, both eyes together. */
export const BAFQuickCard: React.FC = () => (
  <FlipperFacilityCard
    meta={['40 cm', 'BOTH EYES TOGETHER', '60 SEC']}
    equipmentLine="USE ±2.00 D ACCOMMODATIVE FLIPPERS"
    beforeNote="Both eyes open."
    flowSteps={[
      { kind: 'value', label: '+2.00 lens' },
      { kind: 'action', label: 'WAIT UNTIL CLEAR' },
      { kind: 'action', label: 'FLIP' },
      { kind: 'value', label: '−2.00 lens' },
      { kind: 'action', label: 'WAIT UNTIL CLEAR' },
      { kind: 'action', label: 'FLIP & REPEAT FOR 60 SEC' },
    ]}
    cycleQuestion="How many full cycles in 60 seconds?"
    cycleDefinition="+2.00 clear + −2.00 clear = 1 cycle"
    difficultyQuestion="Which lens was difficult to clear?"
    difficultyOptions={['+2.00', '−2.00', 'Both', 'Neither']}
    extraNote="Also note any diplopia or suppression during the flip."
    interpretLines={['Difficulty binocularly but not monocularly (MAF normal) points toward a vergence-facility contribution rather than a purely accommodative one.']}
  />
);

/** Chair-side visual instruction card for Vergence Facility — prism-flipper analogue of MAF/BAF. */
export const VergenceFacilityQuickCard: React.FC = () => (
  <FlipperFacilityCard
    meta={['NEAR', 'BOTH EYES TOGETHER', '60 SEC']}
    equipmentLine="USE A 3Δ BASE-IN / 12Δ BASE-OUT PRISM FLIPPER"
    beforeNote="Both eyes open, viewing the near target."
    flowSteps={[
      { kind: 'value', label: 'Base-in (BI) prism' },
      { kind: 'action', label: 'WAIT UNTIL SINGLE, CLEAR' },
      { kind: 'action', label: 'FLIP' },
      { kind: 'value', label: 'Base-out (BO) prism' },
      { kind: 'action', label: 'WAIT UNTIL SINGLE, CLEAR' },
      { kind: 'action', label: 'FLIP & REPEAT FOR 60 SEC' },
    ]}
    cycleQuestion="How many full cycles in 60 seconds?"
    cycleDefinition="Base-in clear + base-out clear = 1 cycle"
    difficultyQuestion="Which side was harder to clear?"
    difficultyOptions={['Base-in', 'Base-out', 'Neither']}
    interpretLines={['Reduced cycles per minute supports further vergence testing — not a standalone diagnosis.']}
  />
);
