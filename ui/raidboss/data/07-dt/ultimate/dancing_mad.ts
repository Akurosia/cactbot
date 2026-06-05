import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { OutputStrings, TriggerSet } from '../../../../../types/trigger';

// TODO: P1 Tethers
// TODO: P1 Halfroom Cleaves
// TODO: P1 Replace Mystery Magic Ice Only with tether combination
// TODO: P1 Tele-Portent configuration options

type Phase = 'p1' | 'p2' | 'p3';
const phases: { [id: string]: Phase } = {
  'C24C': 'p2', // Ultimate Embrace, God Kefka
  'C3F7': 'p3', // Aero III Assault (from Kefka), Chaos and Exdeath
};

// const centerX = 100;
// const centerY = 100;

export interface Data extends RaidbossData {
  // General
  phase: Phase | 'unknown';
  // Phase 1
  blueTowerIds: string[];
  yellowTowerIds: string[];
  purpleTowerIds: string[];
  tower?: 'blue' | 'yellow' | 'purple';
  fireMarker?: string;
  isFireTrue?: boolean;
  isIceTrue?: boolean;
  isThunderTrue?: boolean;
  doubleTroubleTrapTargets: string[];
  myTelePortent1?: 'up' | 'down' | 'right' | 'left';
  myTelePortent2?: 'up' | 'down' | 'right' | 'left';
}

const headMarkerData = {
  // Phase 1 Boss
  'fakeFire': '02A1',
  'trueFire': '02A2',
  'fakeIce': '02A3',
  'trueIce': '02A4',
  'fakeThunder': '02A5',
  'trueThunder': '02A6',
  // Phase 1 Players
  'tankbuster': '00DA', // Revolting Ruin III tankbuster
  'dorito': '007F', // spread (real) or stack (fake)
  'stack': '0080', // spread (fake) or stack (real)
} as const;

const mysteryMagicOutputStrings: OutputStrings = {
  spread: Outputs.spread,
  stack: {
    en: 'Stack',
    de: 'Stacken',
    fr: 'Packez-vous',
    ja: 'スタック',
    cn: '集合',
    ko: '집합',
    tc: '集合',
  },
  trueThunder: {
    en: 'True Thunder',
    de: 'Wahrer Blitz',
    fr: 'Vraie foudre',
    ja: '真サンダガ',
    cn: '真雷',
    ko: '진실 선더가',
    tc: '真雷',
  },
  fakeThunder: {
    en: 'Fake Thunder',
    de: 'Falscher Blitz',
    fr: 'Fausse foudre',
    ja: 'にせサンダガ',
    cn: '假雷',
    ko: '거짓 선더가',
    tc: '假雷',
  },
  trueIce: {
    en: 'True Ice',
    de: 'Wahres Eis',
    fr: 'Vraie glace',
    ja: '真ブリザガ',
    cn: '真冰',
    ko: '진실 블리자가',
    tc: '真冰',
  },
  fakeIce: {
    en: 'Fake Ice',
    de: 'Falsches Eis',
    fr: 'Fausse glace',
    ja: 'にせブリザガ',
    cn: '假冰',
    ko: '거짓 블리자가',
    tc: '假冰',
  },
  stackTrueIce: {
    en: '${mech} + ${ice}',
    de: '${mech} + ${ice}',
  },
  stackFakeIce: {
    en: '${mech} + ${ice}',
    de: '${mech} + ${ice}',
  },
  spreadTrueIce: {
    en: '${mech} + ${ice}',
    de: '${mech} + ${ice}',
  },
  spreadFakeIce: {
    en: '${mech} + ${ice}',
    de: '${mech} + ${ice}',
  },
  trueIceTrueThunder: {
    en: '${ice} + ${thunder}',
    de: '${ice} + ${thunder}',
  },
  fakeIceTrueThunder: {
    en: '${ice} + ${thunder}',
    de: '${ice} + ${thunder}',
  },
  trueIceFakeThunder: {
    en: '${ice} + ${thunder}',
    de: '${ice} + ${thunder}',
  },
  fakeIceFakeThunder: {
    en: '${ice} + ${thunder}',
    de: '${ice} + ${thunder}',
  },
  stackTrueThunder: {
    en: '${mech} + ${thunder}',
    de: '${mech} + ${thunder}',
  },
  stackFakeThunder: {
    en: '${mech} + ${thunder}',
    de: '${mech} + ${thunder}',
  },
  spreadTrueThunder: {
    en: '${mech} + ${thunder}',
    de: '${mech} + ${thunder}',
  },
  spreadFakeThunder: {
    en: '${mech} + ${thunder}',
    de: '${mech} + ${thunder}',
  },
};

const trapEarlyOutputStrings: OutputStrings = {
  trapOnYou: {
    en: 'Trap on YOU (later)',
    de: 'Falle auf DIR (später)',
  },
  trapOnYouPlayer: {
    en: 'Traps on YOU, ${player} (later)',
    de: 'Fallen auf DIR, ${player} (später)',
  },
  trapOnPlayer: {
    en: 'Trap on ${player} (later)',
    de: 'Falle auf ${player} (später)',
  },
  trapOnPlayers: {
    en: 'Traps on ${player1}, ${player2} (later)',
    de: 'Fallen auf ${player1}, ${player2} (später)',
  },
};

const trapOutputStrings: OutputStrings = {
  trapOnYou: {
    en: 'Trap on YOU ',
    de: 'Falle auf DIR ',
  },
  trapOnYouPlayer: {
    en: 'Traps on YOU, ${player}',
    de: 'Fallen auf DIR, ${player}',
  },
  trapOnPlayer: {
    en: 'Trap on ${player}',
    de: 'Falle auf ${player}',
  },
  trapOnPlayers: {
    en: 'Traps on ${player1}, ${player2}',
    de: 'Fallen auf ${player1}, ${player2}',
  },
};

const triggerSet: TriggerSet<Data> = {
  id: 'DancingMadUltimate',
  zoneId: ZoneId.DancingMadUltimate,
  timelineFile: 'dancing_mad.txt',
  initData: () => {
    return {
      phase: 'p1',
      // Phase 1
      blueTowerIds: [],
      yellowTowerIds: [],
      purpleTowerIds: [],
      doubleTroubleTrapTargets: [],
    };
  },
  triggers: [
    {
      id: 'DMU Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases) },
      run: (data, matches) => data.phase = phases[matches.id] ?? 'unknown',
    },
    {
      id: 'DMU P1 CombatantMemory Tower Tracker',
      // 1EBFBB => Wave Cannon entity (blue)
      // 1EBFBC => Gravitational Wave entity (purple)
      // 1EBFBD => Intemperate Will entity (yellow)
      // There are two of each, they are added at start of fight
      type: 'CombatantMemory',
      netRegex: {
        change: 'Add',
        pair: [{ key: 'BNpcID', value: ['1EBFBB', '1EBFBC', '1EBFBD'] }],
        capture: true,
      },
      run: (data, matches) => {
        const towerMap = {
          '1EBFBB': 'blue',
          '1EBFBC': 'purple',
          '1EBFBD': 'yellow',
          'unknown': 'unknown',
        };
        const bnpcid = matches.pairBNpcID ?? 'unknown';
        const kind = towerMap[bnpcid as keyof typeof towerMap];
        if (kind === 'blue') {
          data.blueTowerIds.push(matches.id);
          return;
        }
        if (kind === 'yellow') {
          data.yellowTowerIds.push(matches.id);
          return;
        }
        if (kind === 'purple') {
          data.purpleTowerIds.push(matches.id);
          return;
        }
      },
    },
    {
      id: 'DMU P1 Graven Image Collect',
      // Tower entity actions
      type: 'ActorControlExtra',
      netRegex: { category: '019D', param1: '40', param2: '80', capture: true },
      run: (data, matches) => {
        const id = matches.id;

        if (data.yellowTowerIds.indexOf(id) !== -1) {
          data.tower = 'yellow';
          return;
        }
        if (data.purpleTowerIds.indexOf(id) !== -1) {
          data.tower = 'purple';
          return;
        }
        if (data.blueTowerIds.indexOf(id) !== -1) {
          data.tower = 'blue';
          return;
        }
      },
    },
    {
      id: 'DMU P1 Revolting Ruin III',
      // Tankbuster targets highest enmity then the nearest player that is not the highest enmity
      // Offtank can provoke to cause the main tank to take both hits so long as main tank is closest
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['tankbuster'], capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'DMU P1 Mystery Magic Collect',
      type: 'HeadMarker',
      netRegex: {
        id: [
          headMarkerData['trueFire'],
          headMarkerData['trueIce'],
          headMarkerData['trueThunder'],
          headMarkerData['fakeFire'],
          headMarkerData['fakeIce'],
          headMarkerData['fakeThunder'],
        ],
        capture: true,
      },
      run: (data, matches) => {
        switch (matches.id) {
          case headMarkerData['trueFire']:
            data.isFireTrue = true;
            return;
          case headMarkerData['fakeFire']:
            data.isFireTrue = false;
            return;
          case headMarkerData['trueIce']:
            data.isIceTrue = true;
            return;
          case headMarkerData['fakeIce']:
            data.isIceTrue = false;
            return;
          case headMarkerData['trueThunder']:
            data.isThunderTrue = true;
            return;
          case headMarkerData['fakeThunder']:
            data.isThunderTrue = false;
            return;
        }
      },
    },
    {
      id: 'DMU P1 Fire Head Marker Collect',
      type: 'HeadMarker',
      netRegex: { id: [headMarkerData['dorito'], headMarkerData['stack']], capture: true },
      suppressSeconds: 2,
      run: (data, matches) => data.fireMarker = matches.id,
    },
    {
      id: 'DMU P1 Mystery Magic Ice and Fire',
      // Set 1: Only Ice and Fire should be set
      type: 'StartsUsing',
      netRegex: { id: 'BA94', source: 'Kefka', capture: false },
      condition: (data) => {
        return data.isIceTrue !== undefined && data.isFireTrue !== undefined;
      },
      infoText: (data, _matches, output) => {
        const fireMarker = data.fireMarker;
        if (
          (fireMarker === headMarkerData['dorito'] && data.isFireTrue) ||
          (fireMarker === headMarkerData['stack'] && !data.isFireTrue)
        )
          return data.isIceTrue
            ? output.spreadTrueIce!({ mech: output.spread!(), ice: output.trueIce!() })
            : output.spreadFakeIce!({ mech: output.spread!(), ice: output.fakeIce!() });

        if (
          (fireMarker === headMarkerData['dorito'] && !data.isFireTrue) ||
          (fireMarker === headMarkerData['stack'] && data.isFireTrue)
        ) {
          return data.isIceTrue
            ? output.stackTrueIce!({ mech: output.stack!(), ice: output.trueIce!() })
            : output.stackFakeIce!({ mech: output.stack!(), ice: output.fakeIce!() });
        }
      },
      outputStrings: mysteryMagicOutputStrings,
    },
    {
      id: 'DMU P1 Mystery Magic Ice and Thunder',
      // Set 2: Only Ice and Thunder should be set
      type: 'StartsUsing',
      netRegex: { id: 'BA94', source: 'Kefka', capture: false },
      condition: (data) => {
        return data.isIceTrue !== undefined && data.isThunderTrue !== undefined;
      },
      infoText: (data, _matches, output) => {
        if (data.isThunderTrue) {
          return data.isIceTrue
            ? output.trueIceTrueThunder!({
              ice: output.trueIce!(),
              thunder: output.trueThunder!(),
            })
            : output.fakeIceTrueThunder!({
              ice: output.fakeIce!(),
              thunder: output.trueThunder!(),
            });
        }
        return data.isIceTrue
          ? output.trueIceTrueThunder!({
            ice: output.trueIce!(),
            thunder: output.fakeThunder!(),
          })
          : output.fakeIceFakeThunder!({
            ice: output.fakeIce!(),
            thunder: output.fakeThunder!(),
          });
      },
      outputStrings: mysteryMagicOutputStrings,
    },
    {
      id: 'DMU P1 Mystery Magic Ice Only',
      // Occurs between Set 2 and Set 3
      // BA95 Blizzard Blowout III cast
      type: 'StartsUsing',
      netRegex: { id: 'BA95', source: 'Kefka', capture: false },
      condition: (data) => {
        if (
          data.isIceTrue !== undefined &&
          data.isThunderTrue === undefined &&
          data.isFireTrue === undefined
        )
          return true;
        return false;
      },
      infoText: (data, _matches, output) => {
        return data.isIceTrue
          ? output.trueIce!()
          : output.fakeIce!();
      },
      outputStrings: mysteryMagicOutputStrings,
    },
    {
      id: 'DMU P1 Mystery Magic Fire and Thunder',
      // Set 3: Only Fire and Thunder should be set
      type: 'StartsUsing',
      netRegex: { id: 'BA94', source: 'Kefka', capture: false },
      condition: (data) => {
        return data.isFireTrue !== undefined && data.isThunderTrue !== undefined;
      },
      infoText: (data, _matches, output) => {
        const fireMarker = data.fireMarker;
        if (
          (fireMarker === headMarkerData['dorito'] && data.isFireTrue) ||
          (fireMarker === headMarkerData['stack'] && !data.isFireTrue)
        )
          return data.isThunderTrue
            ? output.spreadTrueThunder!({
              mech: output.spread!(),
              thunder: output.trueThunder!(),
            })
            : output.spreadFakeThunder!({
              mech: output.spread!(),
              thunder: output.fakeThunder!(),
            });

        if (
          (fireMarker === headMarkerData['dorito'] && !data.isFireTrue) ||
          (fireMarker === headMarkerData['stack'] && data.isFireTrue)
        ) {
          return data.isThunderTrue
            ? output.stackTrueThunder!({
              mech: output.stack!(),
              thunder: output.trueThunder!(),
            })
            : output.stackFakeThunder!({
              mech: output.stack!(),
              thunder: output.fakeThunder!(),
            });
        }
      },
      outputStrings: mysteryMagicOutputStrings,
    },
    {
      id: 'DMU P1 Mystery Magic Cleanup',
      // C622 Light of Judgment to reset for the Graven Image 2
      type: 'StartsUsing',
      netRegex: { id: ['BA94', 'C622'], source: 'Kefka', capture: false },
      run: (data) => {
        delete data.isFireTrue;
        delete data.isIceTrue;
        delete data.isThunderTrue;
        delete data.fireMarker;
      },
    },
    {
      id: 'DMU P1 Double-trouble Trap Collect',
      // Times are 5s, 68s, and 49s
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      run: (data, matches) => data.doubleTroubleTrapTargets.push(matches.target),
    },
    {
      id: 'DMU P1 Double-trouble Trap 2 Early',
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      delaySeconds: 0.1,
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        // Ignore first set and third set
        if (parseFloat(matches.duration) < 67)
          return;

        const target1 = data.doubleTroubleTrapTargets[0];
        // Check if players died from a knockback
        if (target1 === undefined)
          return;

        if (data.doubleTroubleTrapTargets.length === 2) {
          const target2 = data.doubleTroubleTrapTargets[1];

          if (target1 === data.me)
            return output.trapOnYouPlayer!({
              player: data.party.member(target1),
            });

          if (target2 === data.me)
            return output.trapOnYouPlayer!({
              player: data.party.member(target2),
            });

          return output.trapOnPlayers!({
            player1: data.party.member(target1),
            player2: data.party.member(target2),
          });
        }

        if (target1 === data.me)
          return output.trapOnYou!();
        return output.trapOnPlayer!({
          player: data.party.member(target1),
        });
      },
      outputStrings: trapEarlyOutputStrings,
    },
    {
      id: 'DMU P1 Double-trouble Trap 3 Early',
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      delaySeconds: 0.1,
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        const duration = parseFloat(matches.duration);
        // Only capture 3rd set
        if (duration < 48 || duration > 50)
          return;

        const target1 = data.doubleTroubleTrapTargets[0];
        // Check if players died from a knockback
        if (target1 === undefined)
          return;

        if (data.doubleTroubleTrapTargets.length === 2) {
          const target2 = data.doubleTroubleTrapTargets[1];

          if (target1 === data.me)
            return output.trapOnYouPlayer!({
              player: data.party.member(target1),
            });

          if (target2 === data.me)
            return output.trapOnYouPlayer!({
              player: data.party.member(target2),
            });

          return output.trapOnPlayers!({
            player1: data.party.member(target1),
            player2: data.party.member(target2),
          });
        }

        if (target1 === data.me)
          return output.trapOnYou!();
        return output.trapOnPlayer!({
          player: data.party.member(target1),
        });
      },
      outputStrings: trapEarlyOutputStrings,
    },
    {
      id: 'DMU P1 Double-trouble Trap 1',
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      condition: (_data, matches) => parseFloat(matches.duration) < 6,
      delaySeconds: 0.1,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = trapOutputStrings;

        const target1 = data.doubleTroubleTrapTargets[0];
        if (data.doubleTroubleTrapTargets.length === 2) {
          const target2 = data.doubleTroubleTrapTargets[1];

          if (target1 === data.me)
            return {
              alertText: output.trapOnYouPlayer!({
                player: data.party.member(target1),
              }),
            };

          if (target2 === data.me)
            return {
              alertText: output.trapOnYouPlayer!({
                player: data.party.member(target2),
              }),
            };

          return {
            infoText: output.trapOnPlayers!({
              player1: data.party.member(target1),
              player2: data.party.member(target2),
            }),
          };
        }

        if (target1 === data.me)
          return { alertText: output.trapOnYou!() };
        return {
          infoText: output.trapOnPlayer!({
            player: data.party.member(target1),
          }),
        };
      },
    },
    {
      id: 'DMU P1 Double-trouble Trap 2',
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      condition: (_data, matches) => parseFloat(matches.duration) > 67,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = trapOutputStrings;

        const target1 = data.doubleTroubleTrapTargets[0];
        // Check if players died
        if (target1 === undefined)
          return;

        if (data.doubleTroubleTrapTargets.length === 2) {
          const target2 = data.doubleTroubleTrapTargets[1];

          if (target1 === data.me)
            return {
              alertText: output.trapOnYouPlayer!({
                player: data.party.member(target1),
              }),
            };

          if (target2 === data.me)
            return {
              alertText: output.trapOnYouPlayer!({
                player: data.party.member(target2),
              }),
            };

          return {
            infoText: output.trapOnPlayers!({
              player1: data.party.member(target1),
              player2: data.party.member(target2),
            }),
          };
        }

        if (target1 === data.me)
          return { alertText: output.trapOnYou!() };
        return {
          infoText: output.trapOnPlayer!({
            player: data.party.member(target1),
          }),
        };
      },
    },
    {
      id: 'DMU P1 Double-trouble Trap 3',
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      condition: (_data, matches) => {
        const duration = parseFloat(matches.duration);
        return duration > 48 && duration < 50;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = trapOutputStrings;

        const target1 = data.doubleTroubleTrapTargets[0];
        // Check if players died
        if (target1 === undefined)
          return;

        if (data.doubleTroubleTrapTargets.length === 2) {
          const target2 = data.doubleTroubleTrapTargets[1];

          if (target1 === data.me)
            return {
              alertText: output.trapOnYouPlayer!({
                player: data.party.member(target1),
              }),
            };

          if (target2 === data.me)
            return {
              alertText: output.trapOnYouPlayer!({
                player: data.party.member(target2),
              }),
            };

          return {
            infoText: output.trapOnPlayers!({
              player1: data.party.member(target1),
              player2: data.party.member(target2),
            }),
          };
        }

        if (target1 === data.me)
          return { alertText: output.trapOnYou!() };
        return {
          infoText: output.trapOnPlayer!({
            player: data.party.member(target1),
          }),
        };
      },
    },
    {
      id: 'DMU P1 Double-trouble Trap Cleanup',
      // Players dying will also trigger this
      type: 'LosesEffect',
      netRegex: { effectId: '13D6', capture: true },
      run: (data, matches) => {
        data.doubleTroubleTrapTargets = data.doubleTroubleTrapTargets.filter(
          (target) => target !== matches.target,
        );
      },
    },
    {
      id: 'DMU P1 Light of Judgment',
      type: 'StartsUsing',
      netRegex: { id: 'C622', source: 'Kefka', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'DMU P1 Hyperdrive',
      // This hits three times
      // Occurs 3.1s after C622 Light of Judgment, which is a 5s cast
      type: 'StartsUsing',
      netRegex: { id: 'C622', source: 'Kefka', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2, // Result in ~5.1s warning
      response: Responses.tankBuster(),
    },
    {
      id: 'DMU P1 Impertinent Will/Gravitational Wave',
      type: 'ActorControlExtra',
      netRegex: { category: '019D', param1: '40', param2: '80', capture: true },
      alertText: (data, matches, output) => {
        const id = matches.id;
        if (data.yellowTowerIds.indexOf(id) !== -1) {
          return output.goWest!();
        }
        if (data.purpleTowerIds.indexOf(id) !== -1) {
          return output.goEast!();
        }
      },
      outputStrings: {
        goWest: Outputs.getLeftAndWest,
        goEast: Outputs.getRightAndEast,
      },
    },
    {
      id: 'DMU P1 Tele-Portent Collect',
      // Debuffs distributed to 8 players:
      // Players with 2 of the same are always:
      // 130F Left  (7s) + 130F Left  (10s)
      // 130E Right (7s) + 130E Right (10s)
      // 130D Down  (7s) + 130D Down  (10s)
      // 130C Up    (7s) + 130C Up    (10s)
      //
      // The remaining players may have differing patterns:
      // Pattern 1:
      // 130D Down  (7s) + 13DA Left  (10s)
      // 13D9 Right (7s) + 130C Up    (10s)
      // 13D8 Down  (7s) + 130E Right (10s)
      // 130F Left  (7s) + 13D7 Up    (10s)
      //
      // Pattern 2:
      // 130D Down  (7s) + 13DA Left  (10s)
      // 13D9 Right (7s) + 130C Up    (10s)
      // 130E Right (7s) + 13D8 Down  (10s)
      // 13D7 Up    (7s) + 130F Left  (10s)
      //
      // Pattern 3:
      // 130D Down  (7s) + 13DA Left  (10s)
      // 13D9 Right (7s) + 130C Up    (10s)
      // 130E Right (7s) + 13D8 Down  (10s)
      // 130F Left  (7s) + 13D7 Up    (10s)
      //
      // Pattern 4:
      // 13DA Left  (7s) + 130D Down  (10s)
      // 130C Up    (7s) + 13D9 Right (10s)
      // 130E Right (7s) + 13D8 Down  (10s)
      // 130F Left  (7s) + 13D7 Up    (10s)
      //
      // Possibly More?
      // Varying strategies to resolve
      // Players with the same arrows will get a 6s 503 Confused which causes them to target nearest players
      // Players with different arrows will cause a 6s 131E Sleep aoe
      type: 'GainsEffect',
      netRegex: {
        effectId: [
          '130C', // Up
          '130D', // Down
          '130E', // Right
          '130F', // Left
          '13D7', // Up
          '13D8', // Down
          '13D9', // Right
          '13DA', // Left
        ],
        capture: true,
      },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const effectMap: { [effectId: string]: typeof data.myTelePortent1 } = {
          '130C': 'up',
          '130D': 'down',
          '130E': 'right',
          '130F': 'left',
          '13D7': 'up',
          '13D8': 'down',
          '13D9': 'right',
          '13DA': 'left',
        };
        const duration = parseFloat(matches.duration);
        if (duration < 8) {
          data.myTelePortent1 = effectMap[matches.effectId];
          return;
        }
        data.myTelePortent2 = effectMap[matches.effectId];
      },
    },
    {
      id: 'DMU P1 Tele-Portents',
      type: 'GainsEffect',
      netRegex: {
        effectId: [
          '130C', // Up
          '130D', // Down
          '130E', // Right
          '130F', // Left
          '13D7', // Up
          '13D8', // Down
          '13D9', // Right
          '13DA', // Left
        ],
        capture: true,
      },
      condition: Conditions.targetIsYou(),
      durationSeconds: 7,
      infoText: (data, _matches, output) => {
        if (data.myTelePortent1 === undefined || data.myTelePortent2 === undefined)
          return;
        const portents = data.myTelePortent1 + data.myTelePortent2;
        return output[portents]!();
      },
      outputStrings: {
        upup: {
          en: 'Up Portents',
          de: 'Hoch Zeichen',
        },
        downdown: {
          en: 'Down Portents',
          de: 'Runter Zeichen',
        },
        rightright: {
          en: 'Right Portents',
          de: 'Rechts Zeichen',
        },
        leftleft: {
          en: 'Left Portents',
          de: 'Links Zeichen',
        },
        downleft: {
          en: 'Down => Left Portent',
          de: 'Runter => Links Zeichen',
        },
        downright: {
          en: 'Down => Right Portent',
          de: 'Runter => Rechts Zeichen',
        },
        rightup: {
          en: 'Right => Up Portent',
          de: 'Rechts => Hoch Zeichen',
        },
        rightdown: {
          en: 'Right => Down Portent',
          de: 'Rechts => Runter Zeichen',
        },
        leftup: {
          en: 'Left => Up Portent',
          de: 'Links => Hoch Zeichen',
        },
        leftdown: {
          en: 'Left => Down Portent',
          de: 'Links => Runter Zeichen',
        },
        upright: {
          en: 'Up => Right Portent',
          de: 'Hoch => Rechts Zeichen',
        },
        upleft: {
          en: 'Up => Left Portent',
          de: 'Hoch => Links Zeichen',
        },
      },
    },
    {
      id: 'DMU P1 Tele-Portent 2',
      // Not enough time to have lengthy TTS, but could configure this to give direction instead of move
      type: 'LosesEffect',
      netRegex: {
        effectId: [
          '130C', // Up
          '130D', // Down
          '130E', // Right
          '130F', // Left
          '13D7', // Up
          '13D8', // Down
          '13D9', // Right
          '13DA', // Left
        ],
        capture: true,
      },
      condition: (data, matches) => {
        if (data.me === matches.target)
          if (data.myTelePortent1 !== undefined)
            return true;
        return false;
      },
      durationSeconds: 3,
      response: Responses.moveAway('alert'),
    },
    {
      id: 'DMU P1 Tele-Portent Cleanup',
      type: 'LosesEffect',
      netRegex: {
        effectId: [
          '130C', // Up
          '130D', // Down
          '130E', // Right
          '130F', // Left
          '13D7', // Up
          '13D8', // Down
          '13D9', // Right
          '13DA', // Left
        ],
        capture: true,
      },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 1,
      run: (data) => {
        delete data.myTelePortent1;
        delete data.myTelePortent2;
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Future\'s End/Past\'s End': 'Future/Past\'s End',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Chaos': 'Chaos',
        'Exdeath': 'Exdeath',
        'Graven Image': 'heilig(?:e|er|es|en) Statue',
        'Kefka': 'Kefka',
      },
      'replaceText': {
        '\\(castbar\\)': '(wirlen)',
        'Definition of Insanity': 'Rekonstruktion',
        'Hyperdrive': 'Hyperantrieb',
        'Revolting Ruin III': 'Revoltierendes Ruinga',
        'Tele-trouncing': 'Tückischer Teleport',
        'The Path of Light': 'Pfad des Lichts',
        'Trance': 'Trance',
        'Aero III Assault': 'Wallendes Windga',
        'All Things Ending': 'Ende aller Dinge',
        'Ave Maria': 'Ave Maria',
        'Blizzard III Blowout': 'Expandierendes Eisga',
        'Bowels of Agony': 'Quälende Eingeweide',
        'Cyclone': 'Zyklon',
        'Double-Trouble Trap': 'Fiese Falle',
        'Explosion': 'Explosion',
        'Flagrant Fire III': 'Flammendes Feuga',
        'Forsaken': 'Verloren',
        'Future\'s End': 'Ende der Zukunft',
        'Gravitas': 'Gravitas',
        'Graven Image': 'Göttliche Statue',
        'Gravitational Wave': 'Gravitationswelle',
        'Gravity III': 'Graviga',
        'Idyllic Will': 'Idyllischer Wille',
        'Indolent Will': 'Träger Wille',
        'Indulgent Will': 'Nachsichtiger Wille',
        'Inferno': 'Flamme',
        'Intemperate Will': 'Unmäßiger Wille',
        'Light of Judgment': 'Licht des Urteils',
        'Longitudinal Implosion': 'Vertikale Implosion',
        'Mystery Magic': 'Mysteriöse Magie',
        'Past\'s End': 'Ende der Vergangenheit',
        'Pulse Wave': 'Pulswelle',
        'Shockwave': 'Schockwelle',
        'Spelldriver': 'Risikofaktor: Antrieb',
        'Spellscatter': 'Risikofaktor: Streuung',
        'Spellwave': 'Risikofaktor: Welle',
        'Stray Flames': 'Chaosflammen',
        'Stray Spray': 'Chaosspritzer',
        'the Decisive Battle': 'Entscheidungsschlacht',
        'Thrumming Thunder III': 'Brachiales Blitzga',
        '(?<! )Thunder III': 'Blitzga',
        'Trine': 'Trine',
        'Tsunami': 'Sturzflut',
        'Ultimate Embrace': 'Ultima-Umarmung',
        'Vitrophyre': 'Vitrophyr',
        'Wave Cannon': 'Wellenkanone',
        'Wings of Destruction': 'Vernichtungsschwinge',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Chaos': 'Chaos',
        'Exdeath': 'Exdeath',
        'Graven Image': 'statue divine',
        'Kefka': 'Kefka',
      },
      'replaceText': {
        'Aero III Assault': 'Méga Vent véhément',
        'All Things Ending': 'Fin de toutes choses',
        'Ave Maria': 'Ave Maria',
        'Blizzard III Blowout': 'Méga Glace propagatrice',
        'Bowels of Agony': 'Entrailles de l\'agonie',
        'Cyclone': 'cyclone',
        'Double-Trouble Trap': 'Pièges successifs',
        'Double-trouble Trap': 'Pièges successifs',
        'Explosion': 'Explosion',
        'Flagrant Fire III': 'Méga Feu faufilant',
        'Forsaken': 'Cataclysme',
        'Future\'s End': 'Fin du futur',
        'Gravitas': 'Tir gravitationnel',
        'Gravitational Wave': 'Onde gravitationnelle',
        'Gravity III': 'Méga Gravité',
        'Idyllic Will': 'Volonté idyllique',
        'Indolent Will': 'Volonté indolente',
        'Indulgent Will': 'Volonté indulgente',
        'Inferno': 'Inferno',
        'Intemperate Will': 'Volonté intempérante',
        'Light of Judgment': 'Triade guerrière',
        'Longitudinal Implosion': 'Implosion verticale',
        'Mystery Magic': 'Magie énigmatique',
        'Past\'s End': 'Fin du passé',
        'Pulse Wave': 'Pulsation spirituelle',
        'Shockwave': 'Onde de choc',
        'Spelldriver': 'Péril magique chargé',
        'Spellscatter': 'Peril magique dispersé',
        'Spellwave': 'Peril magique ondulé',
        'Stray Flames': 'Flammes du chaos',
        'Stray Spray': 'Eaux du chaos',
        'the Decisive Battle': 'Combat décisif',
        'Thrumming Thunder III': 'Méga Foudre fourmillante',
        '(?<! )Thunder III': 'Méga Foudre',
        'Trine': 'Trine',
        'Tsunami': 'Tsunami',
        'Ultimate Embrace': 'Étreinte fatidique',
        'Vitrophyre': 'Vitrophyre',
        'Wave Cannon': 'Canon plasma',
        'Wings of Destruction': 'Aile de la destruction',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Chaos': 'カオス',
        'Exdeath': 'エクスデス',
        'Graven Image': '神々の像',
        'Kefka': 'ケフカ',
      },
      'replaceText': {
        'Aero III Assault': 'ずんずんエアロガ',
        'All Things Ending': '消滅の脚',
        'Ave Maria': 'アヴェ・マリア',
        'Blizzard III Blowout': 'ひろげるブリザガ',
        'Bowels of Agony': 'バウル・オブ・アゴニー',
        'Cyclone': 'サイクロン',
        'Double-Trouble Trap': 'つぎつぎトラップ',
        'Double-trouble Trap': 'つぎつぎトラップ',
        'Explosion': '爆発',
        'Flagrant Fire III': 'めらめらファイガ',
        'Forsaken': 'ミッシング',
        'Future\'s End': '未来の終焉',
        'Gravitas': '重力弾',
        'Gravitational Wave': '重力波',
        'Gravity III': 'グラビガ',
        'Idyllic Will': '睡魔の神気',
        'Indolent Will': '惰眠の神気',
        'Indulgent Will': '聖母の神気',
        'Inferno': 'インフェルノ',
        'Intemperate Will': '撲殺の神気',
        'Light of Judgment': '裁きの光',
        'Longitudinal Implosion': 'ヴァーティカルインプロージョン',
        'Mystery Magic': 'なぞなぞマジック',
        'Past\'s End': '過去の終焉',
        'Pulse Wave': '波動弾',
        'Shockwave': 'ショックウェーブ',
        'Spelldriver': 'スペルハザード・ドライブ',
        'Spellscatter': 'スペルハザード・スキャッター',
        'Spellwave': 'スペルハザード・ウェーブ',
        'Stray Flames': '混沌の炎',
        'Stray Spray': '混沌の水',
        'the Decisive Battle': '決戦',
        'Thrumming Thunder III': 'もりもりサンダガ',
        '(?<! )Thunder III': 'サンダガ',
        'Trine': 'トライン',
        'Tsunami': '大海嘯',
        'Ultimate Embrace': '終末の双腕',
        'Vitrophyre': '岩石弾',
        'Wave Cannon': '波動砲',
        'Wings of Destruction': '破壊の翼',
      },
    },
  ],
};

export default triggerSet;
