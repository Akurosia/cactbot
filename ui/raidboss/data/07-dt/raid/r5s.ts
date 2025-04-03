import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutputCardinal, Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODOs:
// - Arcady Night Fever/Get Down - dodge followup cleave call
// - Frogtourage 1 - E+W or N+S safe
// - Frogtourage 2 - safe wedges + boss e/w cleave
// - Frogtourage 3 - inside/outside + baits

type EastWest = 'east' | 'west';
type SnapCount = 'two' | 'three' | 'four';

// map of ids to number of hits and first safe side
const snapTwistIdMap: { [id: string]: [SnapCount, EastWest] } = {
  // 2-snap Twist & Drop the Needle
  'A728': ['two', 'west'],
  'A729': ['two', 'west'],
  'A72A': ['two', 'west'],
  'A72B': ['two', 'east'],
  'A72C': ['two', 'east'],
  'A72D': ['two', 'east'],
  // 3-snap Twist & Drop the Needle
  'A730': ['three', 'west'],
  'A731': ['three', 'west'],
  'A732': ['three', 'west'],
  'A733': ['three', 'east'],
  'A734': ['three', 'east'],
  'A735': ['three', 'east'],
  // 4-snap Twist & Drop the Needle
  'A739': ['four', 'west'],
  'A73A': ['four', 'west'],
  'A73B': ['four', 'west'],
  'A73C': ['four', 'east'],
  'A73D': ['four', 'east'],
  'A73E': ['four', 'east'],
};

// map of Frogtourage cast ids to safe dirs
const feverIdMap: { [id: string]: DirectionOutputCardinal } = {
  'A70A': 'dirN', // south cleave
  'A70B': 'dirS', // north cleave
  'A70C': 'dirW', // east cleave
  'A70D': 'dirE', // west cleave
};

export interface Data extends RaidbossData {
  deepCutTargets: string[];
  storedABSideMech?: 'lightParty' | 'roleGroup';
  discoInfernalCount: number;
  seenFunkyFloor: boolean;
  feverSafeDirs: DirectionOutputCardinal[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM1Savage',
  zoneId: ZoneId.AacCruiserweightM1Savage,
  timelineFile: 'r5s.txt',
  initData: () => ({
    deepCutTargets: [],
    discoInfernalCount: 0,
    seenFunkyFloor: false,
    feverSafeDirs: [],
  }),
  triggers: [
    {
      // headmarkers with self-targeted cast
      id: 'R5S Deep Cut',
      type: 'HeadMarker',
      netRegex: { id: '01D7' },
      infoText: (data, matches, output) => {
        data.deepCutTargets.push(matches.target);
        if (data.deepCutTargets.length < 2)
          return;

        if (data.deepCutTargets.includes(data.me))
          return output.cleaveOnYou!();
        return output.avoidCleave!();
      },
      run: (data) => {
        if (data.deepCutTargets.length >= 2)
          data.deepCutTargets = [];
      },
      outputStrings: {
        cleaveOnYou: Outputs.tankCleaveOnYou,
        avoidCleave: Outputs.avoidTankCleave,
      },
    },
    {
      // For the initial sequence, collect only without an alert
      // as the X-Snap twist immediately follows.
      id: 'R5S Flip to AB Side',
      type: 'StartsUsing',
      netRegex: { id: ['A780', 'A781'], source: 'Dancing Green' },
      infoText: (data, matches, output) => {
        // A780 = Flip to A-side, A781 = Flip to B-side
        data.storedABSideMech = matches.id === 'A780' ? 'roleGroup' : 'lightParty';
        if (data.seenFunkyFloor)
          return output.stored!({ mech: output[data.storedABSideMech]!() });
      },
      outputStrings: {
        stored: {
          en: '(${mech} later)',
        },
        lightParty: Outputs.healerGroups,
        roleGroup: Outputs.rolePositions,
      },
    },
    {
      id: 'R5S X-Snap Twist',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(snapTwistIdMap), source: 'Dancing Green' },
      durationSeconds: 10,
      alertText: (data, matches, output) => {
        const snapTwist = snapTwistIdMap[matches.id];
        if (!snapTwist)
          return;

        const snapCountStr = output[snapTwist[0]]!();
        const safeDirStr = output[snapTwist[1]]!();
        const mechStr = output[data.storedABSideMech ?? 'unknown']!();
        return output.combo!({ dir: safeDirStr, num: snapCountStr, mech: mechStr });
      },
      run: (data) => delete data.storedABSideMech,
      outputStrings: {
        combo: {
          en: 'Start ${dir} (${num} hits) => ${mech}',
        },
        lightParty: Outputs.healerGroups,
        roleGroup: Outputs.rolePositions,
        east: Outputs.east,
        west: Outputs.west,
        two: Outputs.num2,
        three: Outputs.num3,
        four: Outputs.num4,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Celebrate Good Times',
      type: 'StartsUsing',
      netRegex: { id: 'A723', source: 'Dancing Green', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R5S Disco Inferno',
      type: 'StartsUsing',
      netRegex: { id: 'A756', source: 'Dancing Green', capture: false },
      response: Responses.bigAoe(),
      run: (data) => data.discoInfernalCount++,
    },
    {
      id: 'R5S Funky Floor Tracker',
      type: 'Ability',
      netRegex: { id: 'A752', source: 'Dancing Green', capture: false },
      run: (data) => data.seenFunkyFloor = true,
    },
    {
      id: 'R5S Burn Baby Burn 1 Early',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) =>
        data.discoInfernalCount === 1 &&
        data.me === matches.target,
      durationSeconds: 7,
      infoText: (_data, matches, output) => {
        // During Disco 1, debuffs are by role: 23.5s or 31.5s
        if (parseFloat(matches.duration) < 25)
          return output.shortBurn!();
        return output.longBurn!();
      },
      outputStrings: {
        shortBurn: {
          en: '(short cleanse)',
        },
        longBurn: {
          en: '(long cleanse)',
        },
      },
    },
    {
      id: 'R5S Burn Baby Burn 1 Cleanse',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) =>
        data.discoInfernalCount === 1 &&
        data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      countdownSeconds: 5,
      alertText: (_data, _matches, output) => output.cleanse!(),
      outputStrings: {
        cleanse: {
          en: 'Cleanse in spotlight',
        },
      },
    },
    {
      id: 'R5S Burn Baby Burn 2 First',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) =>
        data.discoInfernalCount === 2 &&
        data.me === matches.target,
      durationSeconds: 9,
      alertText: (_data, matches, output) => {
        // During Disco 2, debuffs are by role: 9s or 19s
        if (parseFloat(matches.duration) < 14)
          return output.cleanse!();
        return output.bait!();
      },
      outputStrings: {
        cleanse: {
          en: 'Cleanse in spotlight',
        },
        bait: {
          en: 'Bait Frog',
        },
      },
    },
    {
      id: 'R5S Burn Baby Burn 2 Second',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) =>
        data.discoInfernalCount === 2 &&
        data.me === matches.target,
      delaySeconds: 11,
      durationSeconds: 8,
      alertText: (_data, matches, output) => {
        // During Disco 2, debuffs are by role: 9s or 19s
        if (parseFloat(matches.duration) < 14)
          return output.bait!();
        return output.cleanse!();
      },
      outputStrings: {
        cleanse: {
          en: 'Cleanse in spotlight',
        },
        bait: {
          en: 'Bait Frog',
        },
      },
    },
    {
      id: 'R5S Inside Out',
      type: 'StartsUsing',
      netRegex: { id: 'A77C', source: 'Dancing Green', capture: false },
      durationSeconds: 8.5,
      alertText: (_data, _matches, output) => output.insideOut!(),
      outputStrings: {
        insideOut: {
          en: 'Max Melee => Under',
        },
      },
    },
    {
      id: 'R5S Outside In',
      type: 'StartsUsing',
      netRegex: { id: 'A77E', source: 'Dancing Green', capture: false },
      durationSeconds: 8.5,
      alertText: (_data, _matches, output) => output.outsideIn!(),
      outputStrings: {
        outsideIn: {
          en: 'Under => Max Melee',
        },
      },
    },
    {
      id: 'R5S Wavelength',
      type: 'GainsEffect',
      netRegex: { effectId: ['116E', '116F'] },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      alertText: (_data, _matches, output) => output.merge!(),
      outputStrings: {
        merge: {
          en: 'Merge debuff',
        },
      },
    },
    {
      id: 'R5S Quarter Beats',
      type: 'StartsUsing',
      netRegex: { id: 'A75B', source: 'Dancing Green', capture: false },
      infoText: (_data, _matches, output) => output.quarterBeats!(),
      outputStrings: {
        quarterBeats: Outputs.stackPartner,
      },
    },
    {
      id: 'R5S Eighth Beats',
      type: 'StartsUsing',
      netRegex: { id: 'A75D', source: 'Dancing Green', capture: false },
      infoText: (_data, _matches, output) => output.eighthBeats!(),
      outputStrings: {
        eighthBeats: Outputs.spread,
      },
    },
    {
      // cast order of the 8 adds is always W->E, same as firing order
      id: 'R5S Arcady Night Fever + Encore Collect',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(feverIdMap), source: 'Frogtourage' },
      run: (data, matches) => data.feverSafeDirs.push(feverIdMap[matches.id] ?? 'unknown'),
    },
    {
      id: 'R5S Let\'s Dance!',
      type: 'StartsUsing',
      // A76A - Let's Dance!; A390 - Let's Dance! Remix
      // Remix is faster, so use a shorter duration
      netRegex: { id: ['A76A', 'A390'], source: 'Dancing Green' },
      durationSeconds: (_data, matches) => matches.id === 'A76A' ? 23 : 18,
      infoText: (data, _matches, output) => {
        if (data.feverSafeDirs.length < 8)
          return output['unknown']!();
        const dirStr = data.feverSafeDirs.map((dir) => output[dir]!()).join(output.next!());
        return dirStr;
      },
      run: (data) => data.feverSafeDirs = [],
      outputStrings: {
        ...Directions.outputStringsCardinalDir,
        next: Outputs.next,
      },
    },
    {
      id: 'R5S Let\'s Pose',
      type: 'StartsUsing',
      netRegex: { id: 'A770', source: 'Dancing Green', capture: false },
      response: Responses.bigAoe(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Dancing Green': 'Springhis Khan',
        'Frogtourage': 'Schenkelschwinger',
      },
      'replaceText': {},
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Dancing Green': 'Dancing Green',
        'Frogtourage': 'danceur batracien',
      },
      'replaceText': {},
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Dancing Green': 'ダンシング・グリーン',
        'Frogtourage': 'フロッグダンサー',
      },
      'replaceText': {},
    },
  ],
};

export default triggerSet;
