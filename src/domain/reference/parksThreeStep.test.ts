import { describe, expect, it } from 'vitest';
import { localizeParks3Step, type Side } from './parksThreeStep';

describe('localizeParks3Step', () => {
  it('localizes the classic right superior oblique palsy pattern', () => {
    expect(localizeParks3Step({ hyperEye: 'right', worseGaze: 'left', worseTilt: 'right' })).toBe('Right superior oblique');
  });

  it('localizes the classic left superior oblique palsy pattern', () => {
    expect(localizeParks3Step({ hyperEye: 'left', worseGaze: 'right', worseTilt: 'left' })).toBe('Left superior oblique');
  });

  it('is left/right symmetric across all 8 combinations', () => {
    const mirror = (side: Side): Side => (side === 'right' ? 'left' : 'right');
    const mirrorMuscle = (muscle: string) => (muscle.startsWith('Right') ? muscle.replace('Right', 'Left') : muscle.replace('Left', 'Right'));
    const sides: Side[] = ['right', 'left'];
    for (const hyperEye of sides) {
      for (const worseGaze of sides) {
        for (const worseTilt of sides) {
          const muscle = localizeParks3Step({ hyperEye, worseGaze, worseTilt });
          const mirroredMuscle = localizeParks3Step({ hyperEye: mirror(hyperEye), worseGaze: mirror(worseGaze), worseTilt: mirror(worseTilt) });
          expect(mirroredMuscle).toBe(mirrorMuscle(muscle));
        }
      }
    }
  });

  it('every combination resolves to a defined muscle', () => {
    const sides: Side[] = ['right', 'left'];
    for (const hyperEye of sides) {
      for (const worseGaze of sides) {
        for (const worseTilt of sides) {
          expect(localizeParks3Step({ hyperEye, worseGaze, worseTilt })).toBeTruthy();
        }
      }
    }
  });
});
