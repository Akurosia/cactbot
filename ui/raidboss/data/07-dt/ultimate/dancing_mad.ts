import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import Util, { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { OutputStrings, TriggerSet } from '../../../../../types/trigger';

// TODO: P1 Tele-Portent configuration options
// TODO: Earlier phase tracking for P5 (counting the jumps to middle?)

type Phase = 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
const phases: { [id: string]: Phase } = {
  'C24C': 'p2', // Ultimate Embrace, God Kefka
  'C3F7': 'p3', // Aero III Assault (from Kefka), Chaos and Exdeath
  'C2DC': 'p4', // Kefka Says, Kefka with Chaos and Neo Exdeath
  'BB40': 'p5', // Ultima Repeater, Ultima Kefka
};

const centerX = 100;
const centerY = 100;

type forsakenHeadmarker = 'cone' | 'spread' | 'stack' | 'unknown';
type forsakenHeadmarkerMap = { [key: string]: forsakenHeadmarker };
const forsakenHeadmarkerIdToName: forsakenHeadmarkerMap = {
  '02CB': 'stack',
  '02CD': 'cone',
  '02CC': 'spread',
} as const;

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    teleportent: 'clockwise' | 'filipino' | 'none';
    forsaken: 'kroxy-rinon' | 'abba' | 'bowtie' | 'none';
  };
  // General
  phase: Phase | 'unknown';
  // Phase 1
  actorPositions: { [id: string]: { x: number; y: number; heading: number } };
  gravenImageCount: number;
  blueTowerIds: string[];
  purpleTowerIds: string[];
  yellowTowerIds: string[];
  eyeTowerIds: string[];
  fakeEyeTowerIds: string[];
  gravenImageTether?:
    | 'pulse'
    | 'gravitas'
    | 'vitrophyre'
    | 'indulgent'
    | 'idyllic'
    | 'unknown';
  fireMarker?: string;
  isFireTrue?: boolean;
  isIceTrue?: boolean;
  isThunderTrue?: boolean;
  waveCannonTargets: string[];
  doubleTroubleTrapTargets: string[];
  myTelePortent1?: 'up' | 'down' | 'right' | 'left';
  myTelePortent2?: 'up' | 'down' | 'right' | 'left';
  // Phase 2
  pathOfLightCounter: number;
  pathOfLightStackPlayers: string[]; // Quick lookup/listing of players with stacks
  forsakenPlayerHeadmarkers: { [id: string]: forsakenHeadmarker }; // Quickly check player's headmarker
  isForsakenGroupA: boolean; // Quick lookup for group check
  forsakenGroupA: string[]; // List of players in Group A
  forsakenGroupB: string[]; // List of players in Group B
  trineDirNums: number[];
  middleTrineFacing?: 'east' | 'west';
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
  // Phase 1 Tethers
  'imageTether': '002D',
  // Phase 2
  'sharedBuster': '0103', // Ultimate Embrace shared tankbuster
  'stackPath': '02CB', // When standing in Path of Light tower, causes BAC0 Spelldriver (3-person stack)
  'conePath': '02CD', // When standing in Path of Light tower, causes BAC2 Spellwave (cone targetting nearest player)
  'spreadPath': '02CC', // When standing in Path of Light tower, causes BAC1 Spellscatter (small aoe on the player)
} as const;

const mysteryMagicOutputStrings: OutputStrings = {
  puddle: {
    en: 'Bait Puddle',
    de: 'Fläche ködern',
    fr: 'Déposez',
    ja: 'AOE誘導',
    cn: '诱导AOE',
    ko: '장판 유도',
    tc: '誘導AOE',
  },
  spread: Outputs.spread,
  middle: Outputs.goIntoMiddle,
  stack: {
    en: 'Stack',
    de: 'Stacken',
    fr: 'Packez-vous',
    ja: 'スタック',
    cn: '集合',
    ko: '쉐어',
    tc: '集合',
  },
  trueThunder: {
    en: 'Avoid Tell',
    de: 'Wahrer Blitz',
    ko: '예고 피하기',
  },
  fakeThunder: {
    en: 'In Line',
    de: 'Falscher Blitz',
    ko: '직선 안으로',
  },
  trueIce: {
    en: 'Avoid Tell',
    de: 'Wahres Eis',
    ko: '예고 피하기',
  },
  fakeIce: {
    en: 'In Cone',
    de: 'Falsches Eis',
    ko: '부채꼴 안으로',
  },
  trueIcePuddle: {
    en: '${mech1} + ${mech2} => ${mech3}',
    de: '${mech1} + ${mech2} => ${mech3}',
    ko: '${mech1} + ${mech2} => ${mech3}',
  },
  fakeIcePuddle: {
    en: '${mech1} + ${mech2} => ${mech3}',
    de: '${mech1} + ${mech2} => ${mech3}',
    ko: '${mech1} + ${mech2} => ${mech3}',
  },
  stackTrueIce: {
    en: '${mech} + ${ice}',
    de: '${mech} + ${ice}',
    ko: '${mech} + ${ice}',
  },
  stackFakeIce: {
    en: '${mech} + ${ice}',
    de: '${mech} + ${ice}',
    ko: '${mech} + ${ice}',
  },
  spreadTrueIce: {
    en: '${mech} + ${ice}',
    de: '${mech} + ${ice}',
    ko: '${mech} + ${ice}',
  },
  spreadFakeIce: {
    en: '${mech} + ${ice}',
    de: '${mech} + ${ice}',
    ko: '${mech} + ${ice}',
  },
  trueIceTrueThunder: {
    en: 'Avoid Tells',
    de: 'Wahres Eis, Wahrer Blitz',
    ko: '예고 다 피하기',
  },
  fakeIceTrueThunder: {
    en: 'Cone (only)',
    de: 'Falsches Eis, Wahrer Blitz',
    ko: '부채꼴만',
  },
  trueIceFakeThunder: {
    en: 'Line (only)',
    de: 'Wahres Eis, Falscher Blitz',
    ko: '직선만',
  },
  fakeIceFakeThunder: {
    en: 'Cone + Line',
    de: 'Falsches Eis, Falscher Blitz',
    ko: '부채꼴 + 직선',
  },
  stackTrueThunder: {
    en: '${mech} + ${thunder}',
    de: '${mech} + ${thunder}',
    ko: '${mech} + ${thunder}',
  },
  stackFakeThunder: {
    en: '${mech} + ${thunder}',
    de: '${mech} + ${thunder}',
    ko: '${mech} + ${thunder}',
  },
  spreadTrueThunder: {
    en: '${mech} + ${thunder}',
    de: '${mech} + ${thunder}',
    ko: '${mech} + ${thunder}',
  },
  spreadFakeThunder: {
    en: '${mech} + ${thunder}',
    de: '${mech} + ${thunder}',
    ko: '${mech} + ${thunder}',
  },
};

const trapOutputStrings: OutputStrings = {
  you: {
    en: 'YOU',
    de: 'DIR',
    ko: '나',
  },
  knockbackFrom1: {
    en: 'Knockback from ${players}',
    de: 'Rückstoß von ${players}',
    ko: '${players}에서 넉백',
  },
  knockbackFrom2: {
    en: 'Knockback from ${players}',
    de: 'Rückstoß von ${players}',
    ko: '${players}에서 넉백',
  },
  knockbackFrom3: {
    en: 'Knockback from ${players} => Debuffs',
    de: 'Rückstoß von ${players} => Debuffs',
    ko: '${players}에서 넉백 => 디버프',
  },
  knockbackFrom3Sleep: {
    en: 'Knockback from ${players} => Sleep',
    de: 'Rückstoß von ${players} => Schlaf',
    ko: '${players}에서 넉백 => 수면',
  },
  knockbackFrom3Confuse: {
    en: 'Knockback from ${players} => Confuse',
    de: 'Rückstoß von ${players} => Verwirrung',
    ko: '${players}에서 넉백 => 혼란',
  },
  knockbackFromLater: {
    en: 'Knockback from ${players} (later)',
    de: 'Rückstoß von ${players} (später)',
    ko: '${players}에서 넉백 (나중에)',
  },
};

const forsakenOutputStrings: OutputStrings = {
  spreadBowtie: Outputs.spread,
  tower: Outputs.getTowers,
  leftTower: {
    en: 'Left Tower',
    de: 'Linker Turm',
  },
  rightTower: {
    en: 'Right Tower',
    de: 'Rechter Turm',
  },
  towerOrBeNear: { // Used in even towers with no strategy
    en: '${tower} / ${near}',
    de: '${tower} / ${near}',
  },
  avoid: {
    en: 'Avoid towers',
    de: 'Türme vermeiden',
    fr: 'Évitez les tours',
    ja: '塔回避',
    cn: '远离塔',
    ko: '기둥 피하기',
    tc: '遠離塔',
  },
  outOfHitbox: Outputs.outOfHitbox,
  cone: {
    en: 'Cone on YOU',
    de: 'Kegel auf DIR',
  },
  spread: {
    en: 'Spread on YOU',
    de: 'Verteilen auf DIR',
  },
  stack: { // This generally won't get called unless there is a wrong config or missed tower
    en: 'Stack stored on YOU',
    de: 'Sammel gespeichert auf DIR',
  },
  num: {
    en: '${num}: ',
    de: '${num}: ',
    fr: '${num}: ',
    ja: '${num}: ',
    cn: '${num}: ',
    ko: '${num}: ',
    tc: '${num}: ',
  },
  you: {
    en: 'YOU',
    de: 'DIR',
  },
  beNear: {
    en: 'Be Near',
    de: 'Sei Nahe',
    cn: '站近',
    ko: '가까이 있기',
  },
  beFar: {
    en: 'Be Far',
    de: 'Sei Fern',
    cn: '站远',
    ko: '멀리 있기',
  },
  stackOnYou: Outputs.stackOnYou,
  stackOnPlayer: { // Used only in first tower (role-based)
    en: 'Stack is on ${player}',
    de: 'Sammeln ist auf ${player}',
  },
  stacksOnPlayers: {
    en: 'Stacks on ${players}',
    de: 'Sammeln ist auf ${players}',
  },
  stacksOnPlayersTower: { // Used after first tower
    en: '${num}${stack} + ${tower}',
    de: '${num}${stack} + ${tower}',
  },
  stackOnYouTower: { // Used in first tower only
    en: '${num}${tower} + ${marker}',
    de: '${num}${tower} + ${marker}',
  },
  swapTowers: { // Used in second tower only
    en: '${num}Swap Towers',
    de: '${num}Wechsel Türme',
  },
  markerOnYouStacksOnPlayers: { // Used only for first tower
    en: '${num}${marker} + ${stacks}',
    de: '${num}${marker} + ${stacks}',
  },
  markerOnYouTower: { // Used for Cone or Spread
    en: '${num}${marker} + ${tower}',
    de: '${num}${marker} + ${tower}',
  },
  baitLeftConeOutOdds: {
    en: '${num}Bait Left Cone Out',
    de: '${num}Köder Linken Kegel Raus',
  },
  baitLeftConeLeftEvens: {
    en: '${num}Bait Left Cone Left',
    de: '${num}Köder Linken Kegel nach Links',
  },
  leftStack: {
    en: '${num}Left Stack + ${avoid}',
    de: '${num}Links Sammeln + ${avoid}',
  },
  rightStack: {
    en: '${num}Right Stack + ${avoid}',
    de: '${num}Rechts Sammeln + ${avoid}',
  },
  mechs: {
    en: '${num}${mech1} + ${mech2}',
    de: '${num}${mech1} + ${mech2}',
  },
  mechs3: {
    en: '${num}${mech1} + ${mech2} + ${mech3}',
    de: '${num}${mech1} + ${mech2} + ${mech3}',
  },
  bait: {
    en: '${num}Bait Cone Right or Clone Near',
    de: '${num}Köder Rechten Kegel oder Klon nahe',
  },
  baitConeFromPlayer: {
    en: 'Bait Cone from ${player}',
    de: 'Köder Kegel von ${player}',
  },
  spreadWithPlayer: {
    en: 'Spread with ${player}',
    de: 'Verteilen mit ${player}',
  },
  baitCloneOppositeTowers: {
    en: '${num}Bait Clone Opposite Towers Near',
    de: '${num}Köder Klon gegenüber Türmen nah',
  },
  numBeNearSpreadBowtie: {
    en: '${num}${near} + ${spread}',
    de: '${num}${near} + ${spread}',
  },
  baitLeftConeOutBowtie: {
    en: '${num}Bait Left Cone Out',
    de: '${num}Köder Linken Kegel Raus',
  },
  baitLeftConeLeftBowtie: {
    en: '${num}Bait Left Cone Left',
    de: '${num}Köder Linken Kegel nach Links',
  },
  getHitBySpreadRightBowtie: { // Used only in 5th tower for AAAABBBB
    en: '${num}Get Right + Hit by Spread',
    de: '${num}Geh Rechts + vom Verteilen treffen lassen',
  },
  spreadTowersBowtie: { // Used only in last tower for AAAABBBB
    en: '${num}${tower} + ${spread}',
    de: '${num}${tower} + ${spread}',
  },
  markerOnYouNoStrategy: { // Odd Towers
    en: '${num}${marker}',
    de: '${num}${marker}',
  },
  mechsNoStrategy: {
    en: '${num}${marker} + ${mechs}',
    de: '${num}${marker} + ${mechs}',
  },
  baitNoStrategy: { // No marker and no strategy was selected
    en: '${num}Bait Cone or Clone Near',
    de: '${num}Köder Kegel oder Klon nah',
  },
  baitConeOrStackNoStrategy: {
    en: '${num}Bait Cone or Stack',
    de: '${num}Köder Kegel oder Sammeln',
  },
};

const triggerSet: TriggerSet<Data> = {
  id: 'DancingMadUltimate',
  zoneId: ZoneId.DancingMadUltimate,
  config: [
    {
      id: 'teleportent',
      comment: {
        en: `Clockwise: <a href="https://pastebin.com/7fs57PyQ" target="_blank">Kefka Bin</a><br />
          Filipino Box: <a href="https://raidplan.io/plan/5rf2uhud5ztsbud5" target="_blank">Raidplan</a>`,
        de:
          `Uhrzeigersinn: <a href="https://pastebin.com/7fs57PyQ" target="_blank">Kefka Bin</a><br />
          Filipino Box: <a href="https://raidplan.io/plan/5rf2uhud5ztsbud5" target="_blank">Raidplan</a>`,
      },
      name: {
        en: 'P1 Graven Image 3 Tele-Portent Strategy',
        de: 'P1 Göttliche Statue 3 Tückischer Teleport Strategie',
      },
      type: 'select',
      options: {
        en: {
          'Tele-portent arrows placed pointing clockwise around the arena.': 'clockwise',
          'Tele-portent arrows placed in 4 small boxes along intercardinals.': 'filipino',
          'Call Debuffs only': 'none',
        },
        de: {
          'Tückischer Teleport Pfeile im Uhrzeigersinn um die Arena plazieren.': 'clockwise',
          'Tückischer Teleport Pfeile in 4 kleinen Boxen in den interkardinalen plazieren':
            'filipino',
          'Nur Debuffs nennen': 'none',
        },
      },
      default: 'none',
    },
    {
      id: 'forsaken',
      comment: {
        en: `There should be two groups of four players, choose tower soak order.<br \>
          Kroxy-Rinon 3/4/1: <a href="https://pastebin.com/7fs57PyQ" target="_blank">Kefka Bin</a><br \>
          Modified ABBA: <a href="https://raidplan.io/plan/b5tgewax4kb746sf" target="_blank">Raidplan</a><br \>
          Bowtie: <a href="https://raidplan.io/plan/kj2d734d36es2ugs" target="_blank">Raidplan</a> (Will require Tank LB3)<br \>
          Default will be Cones + Support Stack Left and Spread + DPS Stack Right, relative towers to facing in.`,
        de:
          `Es sollten zwei Gruppen mit je vier Spielern gebildet werden; wählt die Reihenfolge für das Abwehren der Türme.
          Kroxy-Rinon 3/4/1: <a href="https://pastebin.com/7fs57PyQ" target="_blank">Kefka Bin</a><br \>
          Modified ABBA: <a href="https://raidplan.io/plan/b5tgewax4kb746sf" target="_blank">Raidplan</a><br \>
          Bowtie: <a href="https://raidplan.io/plan/kj2d734d36es2ugs" target="_blank">Raidplan</a> (Erfordert Tank LB3)<br \>
          Generell gilt: Kegel + Support-Stack links und Verteilen + DPS-Stack rechts, relativ zu den Türmen, in deren Richtung man blickt.`,
      },
      name: {
        en: 'P2 Forsaken Strategy',
        de: 'P2 Verloren Strategie',
      },
      type: 'select',
      options: {
        en: {
          'AAABBBBA (3/4/1), Kroxy-Rinon': 'kroxy-rinon',
          'ABBAABBA (1/2/2/2/1) Modified': 'abba',
          'AAAABBBB (4/4) Bowtie': 'bowtie',
          'Generic calls.': 'none',
        },
        de: {
          'AAABBBBA (3/4/1), Kroxy-Rinon': 'kroxy-rinon',
          'ABBAABBA (1/2/2/2/1) Modified': 'abba',
          'AAAABBBB (4/4) Bowtie': 'bowtie',
          'Generic calls.': 'none',
        },
      },
      default: 'none',
    },
  ],
  timelineFile: 'dancing_mad.txt',
  initData: () => {
    return {
      phase: 'p1',
      // Phase 1
      actorPositions: {},
      gravenImageCount: 0,
      blueTowerIds: [],
      purpleTowerIds: [],
      yellowTowerIds: [],
      eyeTowerIds: [],
      fakeEyeTowerIds: [],
      waveCannonTargets: [],
      doubleTroubleTrapTargets: [],
      // Phase 2
      pathOfLightCounter: 1,
      pathOfLightStackPlayers: [],
      forsakenPlayerHeadmarkers: {},
      isForsakenGroupA: false,
      forsakenGroupA: [],
      forsakenGroupB: [],
      trineDirNums: [],
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
      id: 'DMU ActorSetPos Tracker',
      // Only in use for P1 Graven Image tethers
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'DMU P1 Revolting Ruin III',
      // Tankbuster targets highest enmity then second highest enmity
      // A tank swap can happen to have MT take both hits
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['tankbuster'], capture: true },
      alertText: (data, matches, output) => {
        const target = matches.target;
        if (target === data.me)
          return output.cleaveOnYou!();

        if (data.role === 'tank')
          return output.cleaveSwap!({
            player: data.party.member(target),
          });

        if (data.role === 'healer')
          return output.cleaveOnPlayer!({
            player: data.party.member(target),
          });

        return output.avoidCleaves!();
      },
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        cleaveOnYou: Outputs.tankCleaveOnYou,
        avoidCleaves: Outputs.avoidTankCleaves,
        cleaveOnPlayer: {
          en: 'Tank Cleave on ${player}',
          de: 'Tank Cleave auf ${player}',
          ko: '${player}에게 광역 탱버',
        },
        cleaveSwap: { // Defaulting to same output as cleaveOnPlayer
          en: 'Tank Cleave on ${player}',
          de: 'Tank Cleave auf ${player}',
          ko: '${player}에게 광역 탱버',
        },
      },
    },
    {
      id: 'DMU P1 Graven Image Counter',
      // Used for timing of tether triggers
      type: 'StartsUsing',
      netRegex: { id: 'BCF2', source: 'Kefka', capture: false },
      run: (data) => data.gravenImageCount = data.gravenImageCount + 1,
    },
    {
      id: 'DMU P1 Graven Image Tether Collect',
      // 271 ActorSetPos lines indicate where the tether is coming from
      // 261 CombatantMemory lines may also indicate this
      // Graven Image 1:
      // (100, 56, 18.5) Center Tether, Will be target of BAA9 Pulse Wave (knockback)
      // Graven Image 2:
      // (102.5, 27, 22.5) Center Tether, Will be target of BAAC Gravitas (puddles)
      // (126, 41.5, 7) Right Tether, Will be target of BAB0 Vitrophyre (rocks)
      // Graven Image 3:
      // (95, 25, 27) Left Tether, Will be target of BAB5 Indulgent Will which causes 503 Confused
      // (107, 43, 8.5) Right tether, Will be target of BAB6 Idyllic Will which causes 131E Sleep
      type: 'Tether',
      netRegex: { id: headMarkerData['imageTether'], capture: true },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.1, // Actor position data can come after tether in log
      run: (data, matches) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined) {
          data.gravenImageTether = 'unknown';
          return;
        }

        const x = actor.x;
        // Graven Image 1: Pulse Wave target
        if (x < 101 && x > 99)
          data.gravenImageTether = 'pulse';
        else if (x < 103 && x > 101) // Graven Image 2: Gravitas target
          data.gravenImageTether = 'gravitas';
        else if (x > 125) // Graven Image 2: Vitrophyre target
          data.gravenImageTether = 'vitrophyre';
        else if (x < 100) // Graven Image 3: Indulgent Will target
          data.gravenImageTether = 'indulgent';
        else if (x < 108 && x > 106) // Graven Image 3: Idyllic Will target
          data.gravenImageTether = 'idyllic';
        else
          data.gravenImageTether = 'unknown';
      },
    },
    {
      id: 'DMU P1 Pulse Wave Tethers',
      type: 'Tether',
      netRegex: { id: headMarkerData['imageTether'], capture: true },
      condition: (data, matches) => {
        return data.me === matches.target && data.gravenImageCount === 1;
      },
      delaySeconds: 0.1, // Actor position data can come after tether in log
      durationSeconds: 7,
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return output.tetherOnYou!();

        const x = actor.x;
        // Graven Image 1: Pulse Wave target
        if (x < 101 && x > 99)
          return output.pulse!();
        return output.tetherOnYou!();
      },
      outputStrings: {
        tetherOnYou: {
          en: 'Tether on YOU',
          de: 'Verbindung auf DIR',
          fr: 'Lien sur VOUS',
          ja: '線ついた',
          cn: '连线点名',
          ko: '선 대상자 지정됨',
          tc: '連線點名',
        },
        pulse: Outputs.knockback, // Cannot be immuned, happens within 6s of tether
      },
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
      id: 'DMU P1 Graven Image Tether Cleanup',
      // Clear on Ability:
      // BAA9 Pulse Wave
      // BAAC Gravitas
      // BAB0 vitrophyre
      // BAB5 Indulgent Will
      // BAB6 Idyllic Will
      type: 'Ability',
      netRegex: {
        id: ['BAA9', 'BAAC', 'BAB0', 'BAB5', 'BAB6'],
        source: 'Graven Image',
        capture: true,
      },
      suppressSeconds: 1,
      run: (data, matches) => {
        // Player could die and this ability then not target them
        // Need intelligent way to remove once related ability has executed
        // Clear data if ability matches our tether
        const abilityMap = {
          'pulse': 'BAAC',
          'gravitas': 'BAA9',
          'vitrophyre': 'BAB0',
          'indulgent': 'BAB5',
          'idyllic': 'BAB6',
          'unknown': 'unknown',
        };
        const tether = data.gravenImageTether ?? 'unknown';
        const tetherAbilityId = abilityMap[tether];
        if (tetherAbilityId === matches.id || tether === 'unknown')
          delete data.gravenImageTether;
      },
    },
    {
      id: 'DMU P1 Graven Image Collect',
      // Tower entity actions
      // The CombatantMemory Add lines are added prior to combat
      // OverlayPlugin can retrieve the matching BNpcID
      // However, these entities seem to always spawn in the same order and the
      // first tower is the highest ID and the towers are in sequential order
      // These are the BNpcID values:
      // 1EBFBB (2015163) => Wave Cannon entity (blue)
      // 1EBFBC (2015164) => Gravitational Wave entity (purple)
      // 1EBFBD (2015165) => Intemperate Will entity (yellow)
      // 1EBFBE (2015166) => Indolent Will entity (eye)
      // 1EBFBF (2015167) => Ave Maria entity (fake eye)
      // There are two of each, they are added at start of fight
      type: 'ActorControlExtra',
      netRegex: { category: '019D', param1: '40', param2: '80', capture: true },
      preRun: (data, matches) => {
        const id = parseInt(matches.id, 16);
        const blueTowers = [id, id - 1]; // First tower is blue and highest ID
        const purpleTowers = [id - 2, id - 4]; // Next are in pair with yellow
        const yellowTowers = [id - 3, id - 5];
        const eyeTowers = [id - 7, id - 9]; // Next are in paire with fake
        const fakeEyeTowers = [id - 6, id - 8];

        const toStringId = (id: number): string => {
          return id.toString(16).toUpperCase();
        };
        data.blueTowerIds = blueTowers.map((id) => toStringId(id));
        data.purpleTowerIds = purpleTowers.map((id) => toStringId(id));
        data.yellowTowerIds = yellowTowers.map((id) => toStringId(id));
        data.eyeTowerIds = eyeTowers.map((id) => toStringId(id));
        data.fakeEyeTowerIds = fakeEyeTowers.map((id) => toStringId(id));
      },
      suppressSeconds: 99999,
    },
    {
      id: 'DMU P1 Wave Cannon',
      // BAA8 Wave Cannon is an instant cast from Graven Image
      // This gives a ~5 second warning to spread
      type: 'ActorControlExtra',
      netRegex: { category: '019D', param1: '40', param2: '80', capture: false },
      suppressSeconds: 99999, // First instance is a blue tower
      alertText: (_data, _matches, output) => output.waveCannonLine!(),
      outputStrings: {
        waveCannonLine: {
          en: 'E/W Spread',
          de: 'O/W Verteilen',
          ko: '동/서 산개',
        },
      },
    },
    {
      id: 'DMU P1 Wave Cannon Collect',
      // Collect players hit by Wave Cannon to tell who soaks tower followup and who avoids tower
      type: 'Ability',
      netRegex: { id: 'BAA8', source: 'Graven Image', capture: true },
      run: (data, matches) => data.waveCannonTargets.push(matches.target),
    },
    {
      id: 'DMU P1 Double-trouble Trap Collect',
      // Times are 5s, 68s, and 49s
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      run: (data, matches) => data.doubleTroubleTrapTargets.push(matches.target),
    },
    {
      id: 'DMU P1 Wave Cannon Explosion Towers',
      // Wave Cannon gives a vulnerability which causes death to BAAA Explosion soaks
      // Sacraficing a player who clipped to prevent party 90% damage down from
      // BAAB Unmitigated Explosion seems ideal, although different clients may
      // get different order
      // Suprisingly the Unmitigated Explosion doesn't deal damage
      // Players have ~4s to soak the tower
      type: 'Ability',
      netRegex: { id: 'BAA8', source: 'Graven Image', capture: false },
      delaySeconds: 0.1,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          getTowers: Outputs.getTowers,
          avoid: {
            en: 'Avoid towers',
            de: 'Türme vermeiden',
            fr: 'Évitez les tours',
            ja: '塔回避',
            cn: '远离塔',
            ko: '탑 피하기',
            tc: '遠離塔',
          },
          extra: {
            en: 'Extra Tower',
            de: 'Extra Turm',
            ko: '남는 탑',
          },
        };
        const avoidedCannon = data.waveCannonTargets.indexOf(data.me) !== -1;

        // Option for player to soak the tower for p1 prog?
        if (avoidedCannon && data.waveCannonTargets.length > 4)
          return { infoText: output.extra!() };

        // Avoid the tower
        if (avoidedCannon)
          return { alertText: output.avoid!() };

        // Player didn't get hit, they will need to soak a tower
        return { alertText: output.getTowers!() };
      },
    },
    {
      id: 'DMU P1 Double-trouble Trap Knockback',
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3.9, // First one needs 0.1 delay for collect
      durationSeconds: 3.9,
      suppressSeconds: 1,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = trapOutputStrings;

        // If players died before the duration ended
        if (data.doubleTroubleTrapTargets.length === 0)
          return;

        const severity = data.doubleTroubleTrapTargets.includes(data.me) ? 'alertText' : 'infoText';
        const players = data.doubleTroubleTrapTargets.map(
          (player) => {
            if (player === data.me)
              return output.you!();
            return data.party.member(player);
          },
        );
        const msg = players?.join(', ');

        const duration = parseFloat(matches.duration);
        if (duration < 6)
          return { [severity]: output.knockbackFrom1!({ players: msg }) };
        if (duration > 67)
          return { [severity]: output.knockbackFrom2!({ players: msg }) };

        if (data.gravenImageTether === 'idyllic')
          return { [severity]: output.knockbackFrom3Sleep!({ players: msg }) };
        if (data.gravenImageTether === 'indulgent')
          return { [severity]: output.knockbackFrom3Confuse!({ players: msg }) };
        return { [severity]: output.knockbackFrom3!({ players: msg }) };
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
      id: 'DMU P1 Double-trouble Trap 2 Early',
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      delaySeconds: 0.3, // Time between debuff and dying from the application
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        // Ignore first set and third set
        if (parseFloat(matches.duration) < 67)
          return;

        // Check if players died
        if (data.doubleTroubleTrapTargets.length === 0)
          return;

        const players = data.doubleTroubleTrapTargets.map(
          (player) => {
            if (player === data.me)
              return output.you!();
            return data.party.member(player);
          },
        );
        const msg = players?.join(', ');
        return output.knockbackFromLater!({ players: msg });
      },
      outputStrings: trapOutputStrings,
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
            ? output.trueIceTrueThunder!()
            : output.fakeIceTrueThunder!();
        }
        return data.isIceTrue
          ? output.trueIceFakeThunder!()
          : output.fakeIceFakeThunder!();
      },
      outputStrings: mysteryMagicOutputStrings,
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
      id: 'DMU P1 Mystery Magic Ice, and Gravitas and Vitrophyre Tethers 1',
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
        const hasVitrophyre = data.gravenImageTether === 'vitrophyre';
        return data.isIceTrue
          ? output.trueIcePuddle!({
            mech1: output.trueIce!(),
            mech2: output.puddle!(),
            mech3: hasVitrophyre ? output.spread!() : output.middle!(),
          })
          : output.fakeIcePuddle!({
            mech1: output.fakeIce!(),
            mech2: output.puddle!(),
            mech3: hasVitrophyre ? output.spread!() : output.middle!(),
          });
      },
      outputStrings: mysteryMagicOutputStrings,
    },
    {
      id: 'DMU P1 Vitrophyre',
      // Trigger on BAAC Gravitas, ~4s to get away
      type: 'Ability',
      netRegex: { id: 'BAAC', source: 'Graven Image', capture: false },
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.gravenImageTether === 'vitrophyre')
          return output.spread!();
        return output.avoidTethers!();
      },
      outputStrings: {
        avoidTethers: {
          en: 'Avoid Tethered Players',
          de: 'Vermeide verbundene Spieler',
          ko: '선 대상자 피하기',
        },
        spread: {
          en: 'Spread (avoid puddles)',
          de: 'Verteilen (vermeide Flächen)',
          ko: '산개 (장판 피하기)',
        },
      },
    },
    {
      id: 'DMU P1 Double-trouble Trap 3 Early',
      type: 'GainsEffect',
      netRegex: { effectId: '13D6', capture: true },
      delaySeconds: 0.3, // Time between debuff and dying from the application
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        const duration = parseFloat(matches.duration);
        // Only capture 3rd set
        if (duration < 48 || duration > 50)
          return;

        // Check if players died
        if (data.doubleTroubleTrapTargets.length === 0)
          return;

        const players = data.doubleTroubleTrapTargets.map(
          (player) => {
            if (player === data.me)
              return output.you!();
            return data.party.member(player);
          },
        );
        const msg = players?.join(', ');
        return output.knockbackFromLater!({ players: msg });
      },
      outputStrings: trapOutputStrings,
    },
    {
      id: 'DMU P1 Impertinent Will',
      type: 'ActorControlExtra',
      netRegex: { category: '019D', param1: '40', param2: '80', capture: true },
      condition: (data, matches) => data.yellowTowerIds.includes(matches.id),
      alertText: (_data, _matches, output) => output.goWest!(),
      outputStrings: {
        goWest: Outputs.getLeftAndWest,
      },
    },
    {
      id: 'DMU P1 Gravitational Wave',
      type: 'ActorControlExtra',
      netRegex: { category: '019D', param1: '40', param2: '80', capture: true },
      condition: (data, matches) => data.purpleTowerIds.includes(matches.id),
      alertText: (_data, _matches, output) => output.goEast!(),
      outputStrings: {
        goEast: Outputs.getRightAndEast,
      },
    },
    {
      id: 'DMU P1 Gravitas and Vitrophyre Tethers 2',
      type: 'Tether',
      netRegex: { id: headMarkerData['imageTether'], capture: true },
      condition: (data, matches) => {
        return data.me === matches.target &&
          data.isIceTrue !== undefined &&
          data.isThunderTrue === undefined &&
          data.isFireTrue === undefined;
      },
      delaySeconds: 2,
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return output.tetherOnYou!();

        const x = actor.x;
        if (x < 103 && x > 101) // Graven Image 2: Gravitas target
          return output.gravitas!({
            mech1: output.puddle!(),
            mech2: output.middle!(),
          });
        if (x > 125) // Graven Image 2: Vitrophyre target
          return output.vitrophyre!({
            mech1: output.puddle!(),
            mech2: output.spread!(),
          });
        return output.tetherOnYou!();
      },
      outputStrings: {
        puddle: {
          en: 'Bait Puddle',
          de: 'Fläche ködern',
          fr: 'Déposez',
          ja: 'AOE誘導',
          cn: '诱导AOE',
          ko: '장판 유도',
          tc: '誘導AOE',
        },
        middle: Outputs.goIntoMiddle,
        spread: Outputs.spread,
        tetherOnYou: {
          en: 'Tether on YOU',
          de: 'Verbindung auf DIR',
          fr: 'Lien sur VOUS',
          ja: '線ついた',
          cn: '连线点名',
          ko: '선 대상자 지정됨',
          tc: '連線點名',
        },
        gravitas: {
          en: '${mech1} => ${mech2}',
          de: '${mech1} => ${mech2}',
          ko: '${mech1} => ${mech2}',
        },
        vitrophyre: {
          en: '${mech1} => ${mech2}',
          de: '${mech1} => ${mech2}',
          ko: '${mech1} => ${mech2}',
        },
        indulgent: {
          en: 'Confuse Tether on YOU',
          de: 'Verwirrt Verbindung auf DIR',
          ko: '혼란 선 대상자',
        },
        idyllic: {
          en: 'Sleep Tether on YOU',
          de: 'Schlaf Verbindung auf DIR',
          ko: '수면 선 대상자',
        },
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

        if (data.triggerSetConfig.teleportent === 'clockwise') {
          // Relative to center of arena
          const dir1Map: { [tps: string]: typeof portents } = {
            'upup': 'west',
            'downdown': 'east',
            'rightright': 'north',
            'leftleft': 'south',
            'downleft': 'dirESE',
            'downright': 'northeast',
            'rightup': 'northwest',
            'rightdown': 'dirNNE',
            'leftup': 'dirSSW',
            'leftdown': 'southeast',
            'upright': 'dirWNW',
            'upleft': 'southwest',
          };
          // Relative to where player is
          const dir2Map: { [tps: string]: typeof portents } = {
            'upup': 'south',
            'downdown': 'north',
            'rightright': 'west',
            'leftleft': 'east',
            'downleft': 'south',
            'downright': 'west',
            'rightup': 'south',
            'rightdown': 'east',
            'leftup': 'west',
            'leftdown': 'north',
            'upright': 'north',
            'upleft': 'east',
          };
          const dir1 = dir1Map[portents];
          const dir2 = dir2Map[portents];

          return output.clockwise!({
            dir1: output[dir1 ?? 'unknown']!(),
            dir2: output[dir2 ?? 'unknown']!(),
          });
        }
        if (data.triggerSetConfig.teleportent === 'filipino') {
          const dir2Map: { [tps: string]: typeof portents } = {
            'upup': 'north',
            'downdown': 'south',
            'rightright': 'east',
            'leftleft': 'west',
            'downleft': 'onMarker',
            'downright': 'south',
            'rightup': 'east',
            'rightdown': 'onMarker',
            'leftup': 'onMarker',
            'leftdown': 'west',
            'upright': 'onMarker',
            'upleft': 'north',
          };
          const dir1 = `${portents}Filipino1`;
          const dir2 = dir2Map[portents];

          return output.filipino!({
            dir1: output[dir1 ?? 'unknown']!(),
            dir2: output[dir2 ?? 'unknown']!(),
          });
        }
        return output[portents]!();
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        north: Outputs.north,
        northeast: Outputs.northeast,
        east: Outputs.east,
        southeast: Outputs.southeast,
        south: Outputs.south,
        southwest: Outputs.southwest,
        west: Outputs.west,
        northwest: Outputs.northwest,
        unknown: Outputs.unknown,
        upup: {
          en: 'Up Portents',
          de: 'Hoch Zeichen',
          ko: '위쪽 화살표',
        },
        downdown: {
          en: 'Down Portents',
          de: 'Runter Zeichen',
          ko: '아래쪽 화살표',
        },
        rightright: {
          en: 'Right Portents',
          de: 'Rechts Zeichen',
          ko: '오른쪽 화살표',
        },
        leftleft: {
          en: 'Left Portents',
          de: 'Links Zeichen',
          ko: '왼쪽 화살표',
        },
        downleft: {
          en: 'Down => Left Portent',
          de: 'Runter => Links Zeichen',
          ko: '아래 => 왼쪽 화살표',
        },
        downright: {
          en: 'Down => Right Portent',
          de: 'Runter => Rechts Zeichen',
          ko: '아래 => 오른쪽 화살표',
        },
        rightup: {
          en: 'Right => Up Portent',
          de: 'Rechts => Hoch Zeichen',
          ko: '오른쪽 => 위 화살표',
        },
        rightdown: {
          en: 'Right => Down Portent',
          de: 'Rechts => Runter Zeichen',
          ko: '오른쪽 => 아래 화살표',
        },
        leftup: {
          en: 'Left => Up Portent',
          de: 'Links => Hoch Zeichen',
          ko: '왼쪽 => 위 화살표',
        },
        leftdown: {
          en: 'Left => Down Portent',
          de: 'Links => Runter Zeichen',
          ko: '왼쪽 => 아래 화살표',
        },
        upright: {
          en: 'Up => Right Portent',
          de: 'Hoch => Rechts Zeichen',
          ko: '위 => 오른쪽 화살표',
        },
        upleft: {
          en: 'Up => Left Portent',
          de: 'Hoch => Links Zeichen',
          ko: '위 => 왼쪽 화살표',
        },
        clockwise: {
          en: '${dir1} => ${dir2}',
        },
        filipino: {
          en: '${dir1} => ${dir2}',
        },
        onMarker: {
          en: 'On Marker',
        },
        upupFilipino1: Outputs.southeast,
        downdownFilipino1: Outputs.northwest,
        rightrightFilipino1: Outputs.southwest,
        leftleftFilipino1: Outputs.northeast,
        downleftFilipino1: {
          en: 'West of Southwest',
        },
        downrightFilipino1: {
          en: 'Southeast Marker',
        },
        rightupFilipino1: {
          en: 'Northeast Marker',
        },
        rightdownFilipino1: {
          en: 'South of Southeast',
        },
        leftupFilipino1: {
          en: 'North of Northwest',
        },
        leftdownFilipino1: {
          en: 'Southwest Marker',
        },
        uprightFilipino1: {
          en: 'East of Northeast',
        },
        upleftFilipino1: {
          en: 'Northwest Marker',
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
    {
      id: 'DMU P1 Indulgent Will and Idyllic Will Tethers',
      type: 'Tether',
      netRegex: { id: headMarkerData['imageTether'], capture: true },
      condition: (data, matches) => {
        return data.me === matches.target && data.gravenImageCount === 3;
      },
      delaySeconds: 0.1, // Delay for collect of tower type
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return output.tetherOnYou!();

        const x = actor.x;
        if (x < 100) // Graven Image 3: Indulgent Will target
          return output.indulgent!();
        if (x < 108 && x > 106) // Graven Image 3: Idyllic Will target
          return output.idyllic!();
        return output.tetherOnYou!();
      },
      outputStrings: {
        tetherOnYou: {
          en: 'Tether on YOU',
          de: 'Verbindung auf DIR',
          fr: 'Lien sur VOUS',
          ja: '線ついた',
          cn: '连线点名',
          ko: '선 대상자 지정됨',
          tc: '連線點名',
        },
        indulgent: {
          en: 'Confuse Tether on YOU',
          de: 'Verwirrt Verbindung auf DIR',
          ko: '혼란 선 대상자',
        },
        idyllic: {
          en: 'Sleep Tether on YOU',
          de: 'Schlaf Verbindung auf DIR',
          ko: '수면 선 대상자',
        },
      },
    },
    {
      id: 'DMU P1 Ave Maria',
      // BAB3 Ave Maria
      // The animation is visible ~9.89s before cast goes off, however
      // When animation becomes visible, the players will be asleep or
      // confused for another ~3.4s. Once the debuff ends the players have
      // ~6.4s to turn character
      type: 'ActorControlExtra',
      netRegex: { category: '019D', param1: '40', param2: '80', capture: true },
      condition: (data, matches) => data.fakeEyeTowerIds.includes(matches.id),
      durationSeconds: 9.5,
      countdownSeconds: 3.4, // Estimated time debuff would expire
      infoText: (_data, _matches, output) => output.lookAt!(),
      outputStrings: {
        lookAt: {
          en: 'Look At Statue',
          de: 'Statue anschauen',
          fr: 'Regardez la statue',
          ja: '像を見る！',
          cn: '面对神像',
          ko: '시선 바라보기',
          tc: '面對神像',
        },
      },
    },
    {
      id: 'DMU P1 Indolent Will',
      // BAB4 Indolent Will
      type: 'ActorControlExtra',
      netRegex: { category: '019D', param1: '40', param2: '80', capture: true },
      condition: (data, matches) => data.eyeTowerIds.includes(matches.id),
      durationSeconds: 9.5,
      countdownSeconds: 3.4, // Estimated time debuff would expire
      infoText: (_data, _matches, output) => output.lookAway!(),
      outputStrings: {
        lookAway: {
          en: 'Look Away From Statue',
          de: 'Von Statue wegschauen',
          fr: 'Ne regardez pas la statue',
          ja: '塔を見ない！',
          cn: '背对神像',
          ko: '시선 피하기',
          tc: '背對神像',
        },
      },
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
      id: 'DMU P2 Ultimate Embrace',
      type: 'StartsUsing',
      netRegex: { id: 'C24C', source: 'Kefka', capture: true },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'DMU P2 Forsaken',
      // 7s cast
      type: 'StartsUsing',
      netRegex: { id: 'BABC', source: 'Kefka', capture: false },
      durationSeconds: 6.7,
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'DMU P2 Spell\'s Trouble Clear Current Headmarker',
      // Each player gets 4 of these, using this to track when to clear from
      // Track when last one is lost
      type: 'LosesEffect',
      netRegex: { effectId: '13DB', capture: true },
      run: (data, matches) => {
        delete data.forsakenPlayerHeadmarkers[matches.target];
      },
    },
    {
      id: 'DMU P2 Path of Light Headmarker Tracker',
      // When standing in Path of Light tower, causes BAC0 Spelldriver (3-person stack)
      // When standing in Path of Light tower, causes BAC2 Spellwave (cone targetting nearest player)
      // When standing in Path of Light tower, causes BAC1 Spellscatter (small aoe on the player)
      // Headmarkers update ~2.5s prior to 13DB Spell's Trouble debuff count decrementing
      //
      // Stacks cannot exist with Even towers, there isn't enough players for near Baits
      // However, it is still possible to do an odd tower without having stacks
      // This seems to be treated as a special case as we find tower 7 give 4 stacks
      //
      // Possible Group solutions:
      // AAABBBBA
      // ABBAABBA
      // AAAABBBB, requires Tank LB3 due to forced 4 stacks from tower 7
      type: 'HeadMarker',
      netRegex: {
        id: [
          headMarkerData['stackPath'],
          headMarkerData['conePath'],
          headMarkerData['spreadPath'],
        ],
        capture: true,
      },
      run: (data, matches) => {
        const id = matches.id;
        const target = matches.target;

        // Clear previous Headmarker if set
        data.pathOfLightStackPlayers = data.pathOfLightStackPlayers.filter((t) => t !== target);
        data.forsakenPlayerHeadmarkers[matches.target] = forsakenHeadmarkerIdToName[id] ??
          'unknown';

        // On first headmarker, start everyone in same group
        // Excluding self as this reduces number of lookups to find partner
        if (data.pathOfLightCounter === 1 && data.me !== matches.target)
          data.forsakenGroupB.push(matches.target);

        // If the groups are uneven a tower was missed and it's probably a wipe
        if (data.pathOfLightCounter === 2) {
          // Remove from Group B
          data.forsakenGroupB = data.forsakenGroupB.filter((t) => t !== target);
          if (data.me === matches.target)
            data.isForsakenGroupA = true;
          else
            data.forsakenGroupA.push(matches.target);
        }

        if (id === headMarkerData['stackPath'])
          data.pathOfLightStackPlayers.push(target);
      },
    },
    {
      id: 'DMU P2 Path of Light Towers 1',
      // First Tower:
      // 2 Soak markers
      // 3 Cone markers (same role)
      // 3 Spread markers (same role)
      // If not marked for soak, check role of soak marked players, if matches
      // player, add to output. Player will then know if they need to soak
      // Unfortunately we do not know partners until the first tower is taken
      type: 'HeadMarker',
      netRegex: {
        id: [
          headMarkerData['stackPath'],
          headMarkerData['conePath'],
          headMarkerData['spreadPath'],
        ],
        capture: true,
      },
      condition: (data, matches) => {
        return data.me === matches.target && data.pathOfLightCounter === 1;
      },
      delaySeconds: 0.1, // Delay for party headmarker collect
      durationSeconds: 9,
      infoText: (data, matches, output) => {
        const id = matches.id;
        const marker = forsakenHeadmarkerIdToName[id];
        if (marker === undefined)
          return;
        const num = output.num!({ num: data.pathOfLightCounter });
        const config = data.triggerSetConfig.forsaken;

        if (marker === 'stack') {
          // These players must get a tower
          if (config !== 'none') {
            if (data.role === 'healer' || data.role === 'tank')
              return output.stackOnYouTower!({
                num: num,
                tower: output.leftTower!(),
                marker: output.stackOnYou!(),
              });
            return output.stackOnYouTower!({
              num: num,
              tower: output.rightTower!(),
              marker: output.stackOnYou!(),
            });
          }

          // Assuming no strategy avoids stack soaking tower in first set
          return output.stackOnYouTower!({
            num: num,
            tower: output.tower!(),
            marker: output.stackOnYou!(),
          });
        }

        const stack1 = data.pathOfLightStackPlayers[0] ?? 'unknown';
        const stack2 = data.pathOfLightStackPlayers[1] ?? 'unknown';
        const stack1IsDPS = data.party.isDPS(stack1);
        const stack2IsDPS = data.party.isDPS(stack2);
        const myRoleIsDPS = data.party.isDPS(data.me);

        // If both stack players are the same role, output both players
        // This would be a non-standard composition
        if (myRoleIsDPS === stack1IsDPS && myRoleIsDPS === stack2IsDPS) {
          const players = data.pathOfLightStackPlayers.map(
            (player) => {
              return data.party.member(player);
            },
          );
          const msg = players?.join(', ');
          return output.markerOnYouStacksOnPlayers!({
            num: num,
            marker: output[marker]!(),
            stacks: output.stacksOnPlayers!({ players: msg }),
          });
        }

        // Our partner will be the role that matches us
        // If not, then assuredly the strategy used something like conga line for each role
        const possiblePartner = data.party.member(myRoleIsDPS === stack1IsDPS ? stack1 : stack2);
        return output.markerOnYouStacksOnPlayers!({
          num: num,
          marker: output[marker]!(),
          stacks: output.stackOnPlayer!({ player: possiblePartner }),
        });
      },
      outputStrings: forsakenOutputStrings,
    },
    {
      id: 'DMU P2 Path of Light Counter',
      // Used to track which step of the paths we are own
      // 4 Players soak Odd Towers, 4 Players soak Even Towers
      // Headmarkers get applied to those hit ~0.5s after
      type: 'Ability',
      netRegex: { id: 'BABE', source: 'Kefka', capture: false },
      suppressSeconds: 1,
      run: (data) => data.pathOfLightCounter = data.pathOfLightCounter + 1,
    },
    {
      id: 'DMU P2 Path of Light Towers 2',
      // Expecting 2 Cones and 2 Spreads soak towers
      //
      // Headmarkers come out ~2s before Future's/Past's End
      type: 'HeadMarker',
      netRegex: {
        id: [
          headMarkerData['stackPath'],
          headMarkerData['conePath'],
          headMarkerData['spreadPath'],
        ],
        capture: false,
      },
      condition: (data) => data.pathOfLightCounter === 2,
      delaySeconds: 0.1, // Delay for party headmarker collect
      durationSeconds: 9,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
        const num = output.num!({ num: data.pathOfLightCounter });
        const marker = playerHeadmarkers[data.me] ?? 'unknown'; // Current headmarker
        const config = data.triggerSetConfig.forsaken;
        const isForsakenGroupA = data.isForsakenGroupA;

        // Modified ABBA and Kroxy-Rinon Baits
        if (
          (!isForsakenGroupA && config === 'kroxy-rinon') ||
          (isForsakenGroupA && config === 'abba')
        ) {
          if (data.role === 'healer')
            return output.baitLeftConeLeftEvens!({
              num: num,
            });
          if (data.role === 'tank')
            return output.baitCloneOppositeTowers!({
              num: num,
            });
          // DPS Unknown party composition
          return output.bait!({
            num: num,
          });
        }

        // ABBA (unmodified) and AAAABBBB, Baits
        if (config === 'bowtie' && !data.isForsakenGroupA) {
          // Group A Avoids Towers (ABBA)
          // Group B Avoids Towers (AAAABBBB)
          return output.mechs!({
            num: num,
            mech1: output.beNear!(),
            mech2: output.avoid!(),
          });
        }

        // If someone has stack from beginning
        if (
          (config !== 'none') &&
          (marker === 'stack' || marker === 'unknown')
        )
          return;

        // Modified ABBA and Kroxy-Rinon Tower Soaks
        if (
          (isForsakenGroupA && config === 'kroxy-rinon') ||
          (!isForsakenGroupA && config === 'abba')
        ) {
          // Spread Players have to be far in the tower, cones need to bait end
          const nearFar = marker === 'spread'
            ? output.beFar!()
            : output.beNear!();

          if (data.role === 'healer') {
            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: output.leftTower!(),
              mech3: nearFar,
            });
          }

          const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
          const group = config === 'kroxy-rinon' ? data.forsakenGroupA : data.forsakenGroupB;
          const member1 = group[0] ?? '';
          const member2 = group[1] ?? '';
          const member3 = group[2] ?? '';
          if (data.role === 'tank') {
            // Need to look at what healer has in relation to us
            // Partner is whoever has the same marker
            const partner = data.party.isHealer(member1)
              ? member1
              : data.party.isHealer(member2)
              ? member2
              : data.party.isHealer(member3)
              ? member3
              : 'unknown';
            // Get partner's marker
            const pMarker = playerHeadmarkers[partner ?? 0];

            // Could not get priority
            if (
              partner === 'unknown' ||
              pMarker === undefined ||
              pMarker === 'unknown'
            )
              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: output.tower!(),
                mech3: nearFar,
              });

            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: pMarker === marker
                ? output.rightTower!()
                : output.leftTower!(),
              mech3: nearFar,
            });
          }

          if (Util.isMeleeDpsJob(data.job)) {
            const isRangedDPS = (
              x: string,
            ): boolean => {
              const jobName = data.party.jobName(x);
              if (jobName === undefined)
                return false;
              return Util.isRangedDpsJob(jobName) || Util.isCasterDpsJob(jobName);
            };
            // Partner should be a ranged dps, for standard comp
            const partner = isRangedDPS(member1)
              ? member1
              : isRangedDPS(member2)
              ? member2
              : isRangedDPS(member3)
              ? member3
              : 'unknown';
            // Get partner's marker
            const pMarker = playerHeadmarkers[partner ?? 0];

            // Could not find caster or phys ranged partner
            if (
              partner === 'unknown' ||
              pMarker === undefined ||
              pMarker === 'unknown'
            )
              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: output.tower!(),
                mech3: nearFar,
              });

            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: pMarker === marker
                ? output.leftTower!()
                : output.rightTower!(),
              mech3: nearFar,
            });
          }

          // If we find a melee in our group we are the ranged priority
          // Partner should be a melee dps, for optimal comp
          const isMeleeDPS = (
            x: string,
          ): boolean => {
            const jobName = data.party.jobName(x);
            if (jobName === undefined)
              return false;
            return Util.isMeleeDpsJob(jobName);
          };
          const partner = isMeleeDPS(member1)
            ? member1
            : isMeleeDPS(member2)
            ? member2
            : isMeleeDPS(member3)
            ? member3
            : 'unknown';
          // Get partner's marker
          const pMarker = playerHeadmarkers[partner ?? 0];

          // Could not find melee dps
          if (
            partner === 'unknown' ||
            pMarker === undefined ||
            pMarker === 'unknown'
          )
            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: output.tower!(),
              mech3: nearFar,
            });

          // Highest priority right
          return output.mechs3!({
            num: num,
            mech1: output[marker]!(),
            mech2: output.rightTower!(),
            mech3: nearFar,
          });
        }

        // ABBA (unmodified) and AAAABBBB, Soaks
        if (config === 'bowtie' && isForsakenGroupA) {
          // Tower soakers don't bait ends
          // Group B Soaks Towers (ABBA)
          // Group A Soaks Towers (AAAA)
          const group = data.forsakenGroupA;
          // Partner is whoever has the same marker
          const partner = playerHeadmarkers[group[0] ?? 0] === marker
            ? group[0]
            : playerHeadmarkers[group[1] ?? 0] === marker
            ? group[1]
            : group[2]; // Or unknown matched
          const name = data.party.member(partner);
          if (marker === 'spread')
            return output.mechs3!({
              num: num,
              mech1: output.rightTower!(),
              mech2: output.spreadWithPlayer!({ player: name }),
              mech3: output.outOfHitbox!(),
            });
          if (marker === 'cone')
            return output.mechs3!({
              num: num,
              mech1: output.leftTower!(),
              mech2: output.baitConeFromPlayer!({ player: name }),
              mech3: output.outOfHitbox!(),
            });
        }

        // No strategy selected
        // Many options: Tower, Bait Cone, Share Stack?
        return output.mechsNoStrategy!({
          num: num,
          marker: output[marker]!(),
          mechs: output.towerOrBeNear!({
            tower: output.tower!(),
            near: output.beNear!(),
          }),
        });
      },
      outputStrings: forsakenOutputStrings,
    },
    {
      id: 'DMU P2 All Things Ending Baits',
      // Using the following spells for timing:
      // BAD2 Future's End => Need to bait BACD All Things Ending
      // BAD3 Past's End => Need to bait BADD All Things Ending
      // There are four end casts, each 10s apart
      // BAD2 and BAD3 are the castbar, damage doesn't go out until later
      // TODO: Get Tower Locations
      type: 'Ability',
      netRegex: { id: ['BAD2', 'BAD3'], source: 'Kefka', capture: true },
      delaySeconds: 1.2, // Time until headmarker and future/past damage
      alertText: (data, matches, output) => {
        const isFuture = matches.id === 'BAD2';
        if (data.pathOfLightCounter !== 9)
          return isFuture ? output.future!() : output.past!();

        return isFuture
          ? output.lastFuture!({ action: output.behind!() })
          : output.lastPast!({ action: output.stay!() });
      },
      outputStrings: {
        behind: Outputs.getBehind,
        stay: {
          en: 'Stay',
          de: 'Bleib stehen',
          fr: 'Restez',
          cn: '停',
          ko: '대기',
          tc: '停',
        },
        future: {
          en: 'Bait Ending opposite Towers',
        },
        past: {
          en: 'Bait Ending between Towers',
        },
        lastFuture: {
          en: 'Bait Ending => ${action}',
        },
        lastPast: {
          en: 'Bait Ending => ${action}',
        },
      },
    },
    {
      id: 'DMU P2 Path of Light Towers 3',
      // BADC All Things Ending (Future)
      // BADD All Things Ending (Past)
      // Expecting 2 Stacks, 1 Cone, and 1 Spread soak towers
      type: 'StartsUsing',
      netRegex: { id: ['BADC', 'BADD'], source: 'Kefka', capture: false },
      condition: (data) => data.pathOfLightCounter === 3,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
        const num = output.num!({ num: data.pathOfLightCounter });
        const marker = playerHeadmarkers[data.me] ?? 'unknown'; // Current headmarker
        const config = data.triggerSetConfig.forsaken;
        const isForsakenGroupA = data.isForsakenGroupA;

        // Stacks should soak towers
        if (marker === 'stack') {
          if (
            (
              isForsakenGroupA && (config === 'kroxy-rinon' || config === 'bowtie')
            ) ||
            (!isForsakenGroupA && config === 'abba') ||
            (config === 'none')
          ) {
            // Need to know for priority
            const players = data.pathOfLightStackPlayers.map(
              (player) => {
                if (player === data.me)
                  return output.you!();
                return data.party.member(player);
              },
            );
            const msg = players?.join(', ');

            // Assuming none config soaks
            return output.stacksOnPlayersTower!({
              num: num,
              stack: output.stacksOnPlayers!({ players: msg }),
              tower: output.tower!(),
            });
          }
        }

        // Tower soakers, non stack markers
        if (
          (
            isForsakenGroupA && (config === 'kroxy-rinon' || config === 'bowtie')
          ) ||
          (!isForsakenGroupA && config === 'abba')
        ) {
          return output.markerOnYouTower!({
            num: num,
            marker: output[marker]!(),
            tower: marker === 'cone'
              ? output.leftTower!()
              : output.rightTower!(),
          });
        }

        // Baits and Stacks
        if (
          (
            !isForsakenGroupA && (config === 'kroxy-rinon' || config === 'bowtie')
          ) ||
          (isForsakenGroupA && config === 'abba')
        ) {
          // So long as it is standard party composition...
          if (data.role === 'tank')
            return output.leftStack!({
              num: num,
              avoid: output.avoid!(),
            });
          if (data.role === 'healer')
            return output.baitLeftConeOutOdds!({
              num: num,
            });
          // 2 DPS in stack
          return output.rightStack!({
            num: num,
            avoid: output.avoid!(),
          });
        }

        // No strategy selected
        return output.markerOnYouNoStrategy!({
          num: num,
          marker: output[marker]!(),
        });
      },
      outputStrings: forsakenOutputStrings,
    },
    {
      id: 'DMU P2 Path of Light Towers 4',
      // This set should not contain stack markers
      // If stacks exist, they came from first set
      // Expecting 2 Cones and 2 Spreads soak towers
      //
      // Headmarkers come out ~2s before Future's/Past's End
      type: 'HeadMarker',
      netRegex: {
        id: [
          headMarkerData['stackPath'],
          headMarkerData['conePath'],
          headMarkerData['spreadPath'],
        ],
        capture: false,
      },
      condition: (data) => data.pathOfLightCounter === 4,
      delaySeconds: 0.1, // Delay for party headmarker collect
      durationSeconds: 9,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
        const num = output.num!({ num: data.pathOfLightCounter });
        const marker = playerHeadmarkers[data.me] ?? 'unknown'; // Current headmarker
        const config = data.triggerSetConfig.forsaken;
        const isForsakenGroupA = data.isForsakenGroupA;

        // Baits
        if (
          (isForsakenGroupA && config === 'kroxy-rinon') ||
          (!isForsakenGroupA && config === 'abba')
        ) {
          if (data.role === 'healer')
            return output.baitLeftConeLeftEvens!({
              num: num,
            });
          if (data.role === 'tank')
            return output.baitCloneOppositeTowers!({
              num: num,
            });
          // DPS Unknown party composition
          return output.bait!({
            num: num,
          });
        }

        // AAAABBBB, Baits
        if (config === 'bowtie' && !isForsakenGroupA) {
          // Group B Avoids Towers
          return output.mechs!({
            num: num,
            mech1: output.beNear!(),
            mech2: output.avoid!(),
          });
        }

        // If someone has stack from beginning
        if (
          (config !== 'none') &&
          (marker === 'stack' || marker === 'unknown')
        )
          return;

        // AAAABBBB, Soaks
        if (config === 'bowtie' && isForsakenGroupA) {
          // Tower soakers don't bait ends
          // Group A Soaks Towers
          const group = data.forsakenGroupA;
          // Partner is whoever has the same marker
          const partner = playerHeadmarkers[group[0] ?? 0] === marker
            ? group[0]
            : playerHeadmarkers[group[1] ?? 0] === marker
            ? group[1]
            : group[2]; // Or unknown matched
          const name = data.party.member(partner);
          if (marker === 'spread')
            return output.mechs3!({
              num: num,
              mech1: output.rightTower!(),
              mech2: output.spreadWithPlayer!({ player: name }),
              mech3: output.outOfHitbox!(),
            });
          if (marker === 'cone')
            return output.mechs3!({
              num: num,
              mech1: output.leftTower!(),
              mech2: output.baitConeFromPlayer!({ player: name }),
              mech3: output.outOfHitbox!(),
            });
        }

        // Tower Soaks
        if (config === 'kroxy-rinon' || config === 'abba') {
          // Spread Players have to be far in the tower, cones need to bait end
          const nearFar = marker === 'spread'
            ? output.beFar!()
            : output.beNear!();

          if (data.role === 'healer') {
            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: output.leftTower!(),
              mech3: nearFar,
            });
          }

          const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
          const group = data.forsakenGroupB;
          const member1 = group[0] ?? '';
          const member2 = group[1] ?? '';
          const member3 = group[2] ?? '';
          if (data.role === 'tank') {
            // Need to look at what healer has in relation to us
            // Partner is whoever has the same marker
            const partner = data.party.isHealer(member1)
              ? member1
              : data.party.isHealer(member2)
              ? member2
              : data.party.isHealer(member3)
              ? member3
              : 'unknown';
            // Get partner's marker
            const pMarker = playerHeadmarkers[partner ?? 0];

            // Could not get priority
            if (
              partner === 'unknown' ||
              pMarker === undefined ||
              pMarker === 'unknown'
            )
              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: output.tower!(),
                mech3: nearFar,
              });

            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: pMarker === marker
                ? output.rightTower!()
                : output.leftTower!(),
              mech3: nearFar,
            });
          }

          if (Util.isMeleeDpsJob(data.job)) {
            const isRangedDPS = (
              x: string,
            ): boolean => {
              const jobName = data.party.jobName(x);
              if (jobName === undefined)
                return false;
              return Util.isRangedDpsJob(jobName) || Util.isCasterDpsJob(jobName);
            };
            // Partner should be a ranged dps, for standard comp
            const partner = isRangedDPS(member1)
              ? member1
              : isRangedDPS(member2)
              ? member2
              : isRangedDPS(member3)
              ? member3
              : 'unknown';
            // Get partner's marker
            const pMarker = playerHeadmarkers[partner ?? 0];

            // Could not find caster or phys ranged partner
            if (
              partner === 'unknown' ||
              pMarker === undefined ||
              pMarker === 'unknown'
            )
              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: output.tower!(),
                mech3: nearFar,
              });

            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: pMarker === marker
                ? output.leftTower!()
                : output.rightTower!(),
              mech3: nearFar,
            });
          }

          // If we find a melee in our group we are the ranged priority
          // Partner should be a melee dps, for optimal comp
          const isMeleeDPS = (
            x: string,
          ): boolean => {
            const jobName = data.party.jobName(x);
            if (jobName === undefined)
              return false;
            return Util.isMeleeDpsJob(jobName);
          };
          const partner = isMeleeDPS(member1)
            ? member1
            : isMeleeDPS(member2)
            ? member2
            : isMeleeDPS(member3)
            ? member3
            : 'unknown';
          // Get partner's marker
          const pMarker = playerHeadmarkers[partner ?? 0];

          // Could not find melee dps
          if (
            partner === 'unknown' ||
            pMarker === undefined ||
            pMarker === 'unknown'
          )
            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: output.tower!(),
              mech3: nearFar,
            });

          // Highest priority right
          return output.mechs3!({
            num: num,
            mech1: output[marker]!(),
            mech2: output.rightTower!(),
            mech3: nearFar,
          });
        }

        // No strategy selected
        // Many options: Tower, Bait Cone, Share Stack?
        return output.mechsNoStrategy!({
          num: num,
          marker: output[marker]!(),
          mechs: output.towerOrBeNear!({
            tower: output.tower!(),
            near: output.beNear!(),
          }),
        });
      },
      outputStrings: forsakenOutputStrings,
    },
    {
      id: 'DMU P2 Path of Light Towers 5',
      // BADC All Things Ending (Future)
      // BADD All Things Ending (Past)
      // Expecting 2 Stacks, 1 Cone, and 1 Spread soak towers
      // However, AAAABBBB has 2 Cones and 2 Spreads soak towers
      type: 'StartsUsing',
      netRegex: { id: ['BADC', 'BADD'], source: 'Kefka', capture: false },
      condition: (data) => data.pathOfLightCounter === 5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
        const num = output.num!({ num: data.pathOfLightCounter });
        const marker = playerHeadmarkers[data.me] ?? 'unknown'; // Current headmarker
        const config = data.triggerSetConfig.forsaken;
        const isForsakenGroupA = data.isForsakenGroupA;

        // Baits and Stacks
        if (
          (isForsakenGroupA && config === 'kroxy-rinon') ||
          (!isForsakenGroupA && config === 'abba')
        ) {
          // So long as it is standard party composition...
          if (data.role === 'tank')
            return output.leftStack!({
              num: num,
              avoid: output.avoid!(),
            });
          if (data.role === 'healer')
            return output.baitLeftConeOutOdds!({
              num: num,
            });
          return output.rightStack!({
            num: num,
            avoid: output.avoid!(),
          });
        }

        if (config === 'bowtie') {
          // Bowtie has  people bait cones, but cones could bait eachother if they wanted
          if (!isForsakenGroupA) {
            return output.markerOnYouTower!({
              num: num,
              marker: output[marker]!(),
              tower: marker === 'cone'
                ? output.leftTower!()
                : output.rightTower!(),
            });
          }
          if (data.role === 'tank')
            return output.baitLeftConeLeftBowtie!({
              num: num,
            });
          if (data.role === 'healer')
            return output.baitLeftConeOutBowtie!({
              num: num,
            });
          return output.getHitBySpreadRightBowtie!({
            num: num,
          });
        }

        // Tower Soaks
        // In AAAABBBB, there is no stack
        if (marker === 'stack') {
          // Need to know for priority
          const players = data.pathOfLightStackPlayers.map(
            (player) => {
              if (player === data.me)
                return output.you!();
              return data.party.member(player);
            },
          );
          const msg = players?.join(', ');

          // Assuming none config soaks
          return output.stacksOnPlayersTower!({
            num: num,
            stack: output.stacksOnPlayers!({ players: msg }),
            tower: output.tower!(),
          });
        }

        // This ends up being Group B || Group A for respective config
        if (config === 'kroxy-rinon' || config === 'abba') {
          return output.markerOnYouTower!({
            num: num,
            marker: output[marker]!(),
            tower: marker === 'cone'
              ? output.leftTower!()
              : output.rightTower!(),
          });
        }

        // No strategy
        if (marker === 'unknown')
          return output.baitConeOrStackNoStrategy!({
            num: num,
          });
        return output.markerOnYouNoStrategy!({
          num: num,
          marker: output[marker]!(),
        });
      },
      outputStrings: forsakenOutputStrings,
    },
    {
      id: 'DMU P2 Path of Light Towers 6',
      // Expecting 2 Cones and 2 Spreads soak towers
      //
      // Headmarkers come out ~2s before Future's/Past's End
      type: 'HeadMarker',
      netRegex: {
        id: [
          headMarkerData['stackPath'],
          headMarkerData['conePath'],
          headMarkerData['spreadPath'],
        ],
        capture: false,
      },
      condition: (data) => data.pathOfLightCounter === 6,
      delaySeconds: 0.1, // Delay for party headmarker collect
      durationSeconds: 9,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
        const num = output.num!({ num: data.pathOfLightCounter });
        const marker = playerHeadmarkers[data.me] ?? 'unknown'; // Current headmarker
        const config = data.triggerSetConfig.forsaken;
        const isForsakenGroupA = data.isForsakenGroupA;

        // Baits
        if (
          isForsakenGroupA &&
          (config === 'kroxy-rinon' || config === 'abba')
        ) {
          if (data.role === 'healer')
            return output.baitLeftConeLeftEvens!({
              num: num,
            });
          if (data.role === 'tank')
            return output.baitCloneOppositeTowers!({
              num: num,
            });
          // DPS Unknown party composition
          return output.bait!({
            num: num,
          });
        }

        if (config === 'bowtie') {
          // Group A Baits Ends
          if (isForsakenGroupA)
            return output.numBeNearSpreadBowtie!({
              num: num,
              near: output.beNear!(),
              spread: output.spreadBowtie!(),
            });

          // Tower soakers don't bait ends
          // Group B Soaks Towers
          const group = data.forsakenGroupB;
          // Partner is whoever has the same marker
          const partner = playerHeadmarkers[group[0] ?? 0] === marker
            ? group[0]
            : playerHeadmarkers[group[1] ?? 0] === marker
            ? group[1]
            : group[2]; // Or unknown matched
          const name = data.party.member(partner);
          if (marker === 'spread')
            return output.mechs3!({
              num: num,
              mech1: output.rightTower!(),
              mech2: output.spreadWithPlayer!({ player: name }),
              mech3: output.outOfHitbox!(),
            });
          if (marker === 'cone')
            return output.mechs3!({
              num: num,
              mech1: output.leftTower!(),
              mech2: output.baitConeFromPlayer!({ player: name }),
              mech3: output.outOfHitbox!(),
            });
        }

        // Group B
        if (config === 'kroxy-rinon' || config === 'abba') {
          // Spread Players have to be far in the tower, cones need to bait end
          const nearFar = marker === 'spread'
            ? output.beFar!()
            : output.beNear!();

          if (data.role === 'healer') {
            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: output.leftTower!(),
              mech3: nearFar,
            });
          }

          const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
          const group = data.forsakenGroupB;
          const member1 = group[0] ?? '';
          const member2 = group[1] ?? '';
          const member3 = group[2] ?? '';
          if (data.role === 'tank') {
            // Need to look at what healer has in relation to us
            // Partner is whoever has the same marker
            const partner = data.party.isHealer(member1)
              ? member1
              : data.party.isHealer(member2)
              ? member2
              : data.party.isHealer(member3)
              ? member3
              : 'unknown';
            // Get partner's marker
            const pMarker = playerHeadmarkers[partner ?? 0];

            // Could not get priority
            if (
              partner === 'unknown' ||
              pMarker === undefined ||
              pMarker === 'unknown'
            )
              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: output.tower!(),
                mech3: nearFar,
              });

            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: pMarker === marker
                ? output.rightTower!()
                : output.leftTower!(),
              mech3: nearFar,
            });
          }

          if (Util.isMeleeDpsJob(data.job)) {
            const isRangedDPS = (
              x: string,
            ): boolean => {
              const jobName = data.party.jobName(x);
              if (jobName === undefined)
                return false;
              return Util.isRangedDpsJob(jobName) || Util.isCasterDpsJob(jobName);
            };
            // Partner should be a ranged dps, for standard comp
            const partner = isRangedDPS(member1)
              ? member1
              : isRangedDPS(member2)
              ? member2
              : isRangedDPS(member3)
              ? member3
              : 'unknown';
            // Get partner's marker
            const pMarker = playerHeadmarkers[partner ?? 0];

            // Could not find caster or phys ranged partner
            if (
              partner === 'unknown' ||
              pMarker === undefined ||
              pMarker === 'unknown'
            )
              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: output.tower!(),
                mech3: nearFar,
              });

            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: pMarker === marker
                ? output.leftTower!()
                : output.rightTower!(),
              mech3: nearFar,
            });
          }

          // If we find a melee in our group we are the ranged priority
          // Partner should be a melee dps, for optimal comp
          const isMeleeDPS = (
            x: string,
          ): boolean => {
            const jobName = data.party.jobName(x);
            if (jobName === undefined)
              return false;
            return Util.isMeleeDpsJob(jobName);
          };
          const partner = isMeleeDPS(member1)
            ? member1
            : isMeleeDPS(member2)
            ? member2
            : isMeleeDPS(member3)
            ? member3
            : 'unknown';
          // Get partner's marker
          const pMarker = playerHeadmarkers[partner ?? 0];

          // Could not find melee dps
          if (
            partner === 'unknown' ||
            pMarker === undefined ||
            pMarker === 'unknown'
          )
            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: output.tower!(),
              mech3: nearFar,
            });

          // Highest priority right
          return output.mechs3!({
            num: num,
            mech1: output[marker]!(),
            mech2: output.rightTower!(),
            mech3: nearFar,
          });
        }

        // No strategy selected
        // Many options: Tower, Bait Cone, Share Stack?
        if (marker === 'unknown')
          return output.baitNoStrategy!({
            num: num,
          });
        return output.mechsNoStrategy!({
          num: num,
          marker: output[marker]!(),
          mechs: output.towerOrBeNear!({
            tower: output.tower!(),
            near: output.beNear!(),
          }),
        });
      },
      outputStrings: forsakenOutputStrings,
    },
    {
      id: 'DMU P2 Path of Light Towers 7',
      // BADC All Things Ending (Future)
      // BADD All Things Ending (Past)
      // Expecting 2 Stacks, 1 Cone, and 1 Spread soak towers
      type: 'StartsUsing',
      netRegex: { id: ['BADC', 'BADD'], source: 'Kefka', capture: false },
      condition: (data) => data.pathOfLightCounter === 7,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
        const num = output.num!({ num: data.pathOfLightCounter });
        const marker = playerHeadmarkers[data.me] ?? 'unknown'; // Current headmarker
        const config = data.triggerSetConfig.forsaken;

        // Baits and Stacks
        if (data.isForsakenGroupA && config !== 'none') {
          // So long as it is standard party composition...
          if (data.role === 'tank')
            return output.leftStack!({
              num: num,
              avoid: output.avoid!(),
            });
          if (data.role === 'healer')
            return output.baitLeftConeOutOdds!({
              num: num,
            });
          return output.rightStack!({
            num: num,
            avoid: output.avoid!(),
          });
        }

        // Tower soaks
        if (marker === 'stack') {
          // Need to know for priority
          const players = data.pathOfLightStackPlayers.map(
            (player) => {
              if (player === data.me)
                return output.you!();
              return data.party.member(player);
            },
          );
          const msg = players?.join(', ');

          // Assuming none config soaks
          return output.stacksOnPlayersTower!({
            num: num,
            stack: output.stacksOnPlayers!({ players: msg }),
            tower: output.tower!(),
          });
        }

        // Cone/Stack Tower Soaks
        // Group B
        if (config !== 'none')
          return output.markerOnYouTower!({
            num: num,
            marker: output[marker]!(),
            tower: marker === 'cone'
              ? output.leftTower!()
              : output.rightTower!(),
          });

        // No strategy
        if (marker === 'unknown')
          return output.baitConeOrStackNoStrategy!({
            num: num,
          });
        return output.markerOnYouNoStrategy!({
          num: num,
          marker: output[marker]!(),
        });
      },
      outputStrings: forsakenOutputStrings,
    },
    {
      id: 'DMU P2 Path of Light Towers 8',
      // Shouldn't be new headmarkers from previous towers
      // This set should not contain stack markers
      // Expecting 2 Cones and 2 Spreads soak towers
      // However AAAABBBB will have 4 Stacks soak towers
      //
      // Track based on tower soak or fail
      // BABF The River of Light
      // BAC0 Spelldriver
      // BAC1 Spellscatter
      // BAC2 Spellwave
      type: 'Ability',
      netRegex: {
        id: ['BABF', 'BAC0', 'BAC1', 'BAC2'],
        source: 'Kefka',
        capture: false,
      },
      condition: (data) => data.pathOfLightCounter === 8,
      delaySeconds: 0.1, // Delay for party headmarker collect
      durationSeconds: 9,
      suppressSeconds: 9999,
      infoText: (data, _matches, output) => {
        const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
        const num = output.num!({ num: data.pathOfLightCounter });
        const marker = playerHeadmarkers[data.me] ?? 'unknown'; // Current headmarker
        const config = data.triggerSetConfig.forsaken;

        if (data.isForsakenGroupA) {
          // Tower Soaks for ABBABBA and AAABBBBA
          if (config === 'kroxy-rinon' || config === 'abba') {
            // This means player from A accidentally took tower previously
            if (marker === 'stack' || marker === 'unknown')
              return;

            // Spread Players have to be far in the tower, cones need to bait end
            const nearFar = marker === 'spread'
              ? output.beFar!()
              : output.beNear!();

            if (data.role === 'healer') {
              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: output.leftTower!(),
                mech3: nearFar,
              });
            }

            const playerHeadmarkers = data.forsakenPlayerHeadmarkers;
            const group = data.forsakenGroupA;
            const member1 = group[0] ?? '';
            const member2 = group[1] ?? '';
            const member3 = group[2] ?? '';
            if (data.role === 'tank') {
              // Need to look at what healer has in relation to us
              // Partner is whoever has the same marker
              const partner = data.party.isHealer(member1)
                ? member1
                : data.party.isHealer(member2)
                ? member2
                : data.party.isHealer(member3)
                ? member3
                : 'unknown';
              // Get partner's marker
              const pMarker = playerHeadmarkers[partner ?? 0];

              // Could not get priority
              if (
                partner === 'unknown' ||
                pMarker === undefined ||
                pMarker === 'unknown'
              )
                return output.mechs3!({
                  num: num,
                  mech1: output[marker]!(),
                  mech2: output.tower!(),
                  mech3: nearFar,
                });

              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: pMarker === marker
                  ? output.rightTower!()
                  : output.leftTower!(),
                mech3: nearFar,
              });
            }

            if (Util.isMeleeDpsJob(data.job)) {
              const isRangedDPS = (
                x: string,
              ): boolean => {
                const jobName = data.party.jobName(x);
                if (jobName === undefined)
                  return false;
                return Util.isRangedDpsJob(jobName) || Util.isCasterDpsJob(jobName);
              };
              // Partner should be a ranged dps, for standard comp
              const partner = isRangedDPS(member1)
                ? member1
                : isRangedDPS(member2)
                ? member2
                : isRangedDPS(member3)
                ? member3
                : 'unknown';
              // Get partner's marker
              const pMarker = playerHeadmarkers[partner ?? 0];

              // Could not find caster or phys ranged partner
              if (
                partner === 'unknown' ||
                pMarker === undefined ||
                pMarker === 'unknown'
              )
                return output.mechs3!({
                  num: num,
                  mech1: output[marker]!(),
                  mech2: output.tower!(),
                  mech3: nearFar,
                });

              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: pMarker === marker
                  ? output.leftTower!()
                  : output.rightTower!(),
                mech3: nearFar,
              });
            }

            // If we find a melee in our group we are the ranged priority
            // Partner should be a melee dps, for optimal comp
            const isMeleeDPS = (
              x: string,
            ): boolean => {
              const jobName = data.party.jobName(x);
              if (jobName === undefined)
                return false;
              return Util.isMeleeDpsJob(jobName);
            };
            const partner = isMeleeDPS(member1)
              ? member1
              : isMeleeDPS(member2)
              ? member2
              : isMeleeDPS(member3)
              ? member3
              : 'unknown';
            // Get partner's marker
            const pMarker = playerHeadmarkers[partner ?? 0];

            // Could not find melee dps
            if (
              partner === 'unknown' ||
              pMarker === undefined ||
              pMarker === 'unknown'
            )
              return output.mechs3!({
                num: num,
                mech1: output[marker]!(),
                mech2: output.tower!(),
                mech3: nearFar,
              });

            // Highest priority right
            return output.mechs3!({
              num: num,
              mech1: output[marker]!(),
              mech2: output.rightTower!(),
              mech3: nearFar,
            });
          }

          // End Baits for AAAABBBB
          if (config === 'bowtie')
            return output.numBeNearSpreadBowtie!({
              num: num,
              near: output.beNear!(),
              spread: output.spreadBowtie!(),
            });
        }

        // Baits for ABBAABBA and AAABBBBA
        if (config === 'kroxy-rinon' || config === 'abba') {
          if (data.role === 'healer')
            return output.baitLeftConeLeftEvens!({
              num: num,
            });
          if (data.role === 'tank')
            return output.baitCloneOppositeTowers!({
              num: num,
            });
          return output.bait!({
            num: num,
          });
        }
        if (config === 'bowtie') {
          // Each person in Group B will have a stack marker
          if (data.role === 'healer' || data.role === 'tank')
            return output.spreadTowersBowtie!({
              num: num,
              tower: output.leftTower!(),
              spread: output.spreadBowtie!(),
            });
          return output.spreadTowersBowtie!({
            num: num,
            tower: output.rightTower!(),
            spread: output.spreadBowtie!(),
          });
        }

        // No strategy selected
        // Many options: Tower, Bait Cone, Share Stack?
        if (marker === 'unknown')
          return output.baitNoStrategy!({
            num: num,
          });
        return output.mechsNoStrategy!({
          num: num,
          marker: output[marker]!(),
          mechs: output.towerOrBeNear!({
            tower: output.tower!(),
            near: output.beNear!(),
          }),
        });
      },
      outputStrings: forsakenOutputStrings,
    },
    {
      id: 'DMU P2 Path of Light Tower 8 AAAABBBB Special',
      // BAD2 Future's End or BAD3 Past's End will go off same time as 4 players
      // take a 3-person stack solo
      // For some reason the phase is coded such that the 7th tower will give 4 stacks
      // under this scenario
      type: 'StartsUsing',
      netRegex: { id: ['BAD2', 'BAD3'], source: 'Kefka', capture: true },
      condition: (data) => {
        return data.role === 'tank' && data.pathOfLightCounter === 8 &&
          data.triggerSetConfig.forsaken === 'bowtie';
      },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 3, // 6.4s castTime, this is 4s before damage
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'TANK LB!!',
          de: 'TANK LB!!',
          fr: 'LB TANK !!',
          ja: 'タンクLB!!',
          cn: '坦克LB!!',
          ko: '탱리밋!!',
          tc: '坦克LB!!',
        },
      },
    },
    {
      id: 'DMU P2 Light of Judgment',
      type: 'StartsUsing',
      netRegex: { id: 'BABD', source: 'Kefka', capture: false },
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'DMU P2 Trine Collector',
      // TODO: Get other two pattern coords
      // Kefkabin solution: https://raidplan.io/plan/apkh6ytq72w8pt3v
      // Trines are added ~0.5s after BADF Trine ability
      // They have BNpcID 1EBFB3 and 1EBFB2.
      // On release of Patch 7.51, the Northwest-ish trine is bugged (rotated 60 degrees)
      // There are 3 patterns
      // Pattern 1:
      // Set 1: Northwest-ish(88.45, 90), South-ish (97.11, 115), North-ish(102.89, 85)
      // Set 2: Southeast-ish (115.55, 110)
      // Set 3: West-ish (85.57, 105), Middle (100,100)3*, East-ish(114.43, 95)
      //
      // Pattern 2:
      // Set 1:
      // Set 2:
      // Set 3:
      //
      // Pattern 3:
      // Set 1:
      // Set 2:
      // Set 3:
      //
      // * Guaranteed in set 3, and its heading points West or East
      //
      // 273 ActorControlExtra lines that follow:
      // 019D|10|20 => Falling down animation?
      // 019D|40|80 => Landed animation? (~1.4s after add)
      // 019D|4|8 => Explosion animation?
      //
      // Trines starts with 3 Trines spawning, then 1, then 3 More
      // BACD/BACE Wings of Destruction halfroom cleave happens while 3rd set is landing
      // As Trines 1 detonate, the near/far tankbuster C487 Wings of Destruction begins casting
      // At the 3rd detonation, the tankbuster will snapshot
      type: 'CombatantMemory',
      netRegex: {
        change: 'Add',
        pair: [{ key: 'BNpcID', value: ['1EBFB2', '1EBFB3'] }],
        capture: true,
      },
      run: (data, matches) => {
        // Need heading of middle trine for near tank bait and/or greedy melee
        // With exception of bugged 7.51 NW Trine rotated 60 degrees off, Heading is defined by the BNpcID
        // 1EBFB3 => West
        // 1EBFB2 => East
        const x = parseFloat(matches.pairPosX ?? '0');
        const y = parseFloat(matches.pairPosY ?? '0');

        // Exception for center trine
        if (data.trineDirNums.length === 3) {
          if (x > 99 && x < 101) {
            data.middleTrineFacing = matches.pairBNpcID === '1EBFB2' ? 'west' : 'east';
            return;
          }
        }

        // Not storing the last two sets' x,y coords
        if (data.trineDirNums.length !== 3) {
          const dirNum = Directions.xyTo16DirNum(centerX, centerY, x, y);
          data.trineDirNums.push(dirNum);
        }
      },
    },
    {
      id: 'DMU P2 Trines 1 (Early)',
      type: 'CombatantMemory',
      netRegex: {
        change: 'Add',
        pair: [{ key: 'BNpcID', value: ['1EBFB2', '1EBFB3'] }],
        capture: false,
      },
      condition: (data) => data.trineDirNums.length === 3,
      durationSeconds: 12, // Detonation occurs ~12.9s
      suppressSeconds: 99999,
      infoText: (data, _matches, output) => {
        const dirNums = data.trineDirNums;
        const sorted = dirNums.sort((a, b) => a - b); // Sorts clockwise
        const trine1 = sorted[0] !== undefined
          ? Directions.output16Dir[sorted[0]] ?? 'unknown'
          : 'unknown';
        const trine2 = sorted[1] !== undefined
          ? Directions.output16Dir[sorted[1]] ?? 'unknown'
          : 'unknown';
        const trine3 = sorted[2] !== undefined
          ? Directions.output16Dir[sorted[2]] ?? 'unknown'
          : 'unknown';

        return output.safeSpots!({
          dir1: output[trine1]!(),
          dir2: output[trine2]!(),
          dir3: output[trine3]!(),
        });
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        unknown: Outputs.unknown,
        safeSpots: {
          en: '${dir1}/${dir2}/${dir3} Later',
        },
      },
    },
    {
      id: 'DMU P2 Single Wing of Destruction',
      // BACD Wings of Destruction, Left wing highlight
      // BACE Wingso of Desctruction, Right wing highlight
      // Halfroom cleaves
      type: 'StartsUsing',
      netRegex: { id: ['BACD', 'BACE'], source: 'Kefka', capture: true },
      infoText: (_data, matches, output) => {
        if (matches.id === 'BACD')
          return output.right!();
        return output.left!();
      },
      outputStrings: {
        right: Outputs.right,
        left: Outputs.left,
      },
    },
    {
      id: 'DMU P2 Wings of Destruction',
      // In DMU, players need to move for trines at same time as the tankbuster call
      // Melee most likely won't be able to hit the boss due to trine aoes
      type: 'StartsUsing',
      netRegex: { id: 'C487', source: 'Kefka', capture: false },
      alertText: (data, _matches, output) => {
        const dirNums = data.trineDirNums;
        const sorted = dirNums.sort((a, b) => a - b); // Sorts clockwise
        const trine1 = sorted[0] !== undefined
          ? Directions.output16Dir[sorted[0]] ?? 'unknown'
          : 'unknown';
        const trine2 = sorted[1] !== undefined
          ? Directions.output16Dir[sorted[1]] ?? 'unknown'
          : 'unknown';
        const trine3 = sorted[2] !== undefined
          ? Directions.output16Dir[sorted[2]] ?? 'unknown'
          : 'unknown';

        return output.dirWings!({
          dirs: output.safeSpots!({
            dir1: output[trine1]!(),
            dir2: output[trine2]!(),
            dir3: output[trine3]!(),
          }),
          wings: data.role !== 'tank'
            ? output.wingsParty!()
            : data.middleTrineFacing
            ? output.wingsTrine!({
              wings: output.wingsTank!(),
              trine: output[data.middleTrineFacing]!(),
            })
            : output.wingsTank!(),
        });
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        unknown: Outputs.unknown,
        safeSpots: {
          en: '${dir1}/${dir2}/${dir3}',
        },
        wingsTrine: {
          en: '${wings} + ${trine}',
        },
        dirWings: {
          en: '${dirs} + ${wings}',
        },
        wingsParty: {
          en: 'Outer 2 Rings',
        },
        wingsTank: {
          en: 'Be Near/Far',
        },
        east: {
          en: 'Eastward Trine',
        },
        west: {
          en: 'Westward Trine',
        },
      },
    },
    {
      id: 'DMU P2 Aero III Assault',
      // Knockback from boss that can't be resisted
      // Applies 306 Down for the Count
      type: 'StartsUsing',
      netRegex: { id: 'C3F7', source: 'Kefka', capture: false },
      response: Responses.getUnder('alert'),
    },
    {
      id: 'DMU P3 Epic Hero/Fated Hero Debuffs',
      // Applied to 4 nearest players when Chaos and Exdeath finish casting
      // C2E2/C2E3 The Decisive Battle
      // 1060 Epic Hero: Can only damage Chaos, preferred by Melee DPS
      // 1062 Fated Hero: Can only damage Exdeath, preferred by Ranged DPS
      // These fall off once Exdeath casts BB12 Thunder III
      type: 'GainsEffect',
      netRegex: { effectId: ['1060', '1062'], capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, matches, output) => {
        return matches.effectId === '1060' ? output.epic!() : output.fated!();
      },
      outputStrings: {
        epic: {
          en: 'Attack Chaos',
          de: 'Greife Chaos an',
        },
        fated: {
          en: 'Attack Exdeath',
          de: 'Greife Exdeath an',
        },
      },
    },
    {
      id: 'DMU P3 Headwind/Tailwind Debuffs',
      // Applied at BAF2 Bowels of Agony
      // Debuffs trigger if hit by certain sources, causing a knockback
      // 642 Headwind: Face away from damage source
      // 643 Tailwind: Face towards damage source
      type: 'GainsEffect',
      netRegex: { effectId: ['642', '643'], capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, matches, output) => {
        return matches.effectId === '642' ? output.headwind!() : output.tailwind!();
      },
      outputStrings: {
        headwind: {
          en: 'Headwind on YOU',
          de: 'Chaosböen auf DIR',
        },
        tailwind: {
          en: 'Tailwind on You',
          de: 'Chaossturm auf DIR',
        },
      },
    },
    {
      id: 'DMU P3 Longitudinal Implosion',
      type: 'StartsUsing',
      netRegex: { id: 'BAFD', source: 'Chaos', capture: false },
      infoText: (_data, _matches, output) => output.sides!(),
      outputStrings: {
        sides: Outputs.sidesThenFrontBack,
      },
    },
    {
      id: 'DMU P3 Latitudinal Implosion',
      type: 'StartsUsing',
      netRegex: { id: 'BAFE', source: 'Chaos', capture: false },
      infoText: (_data, _matches, output) => output.frontBack!(),
      outputStrings: {
        frontBack: Outputs.frontBackThenSides,
      },
    },
    {
      id: 'DMU P3 Vaccuum Wave',
      type: 'StartsUsing',
      netRegex: { id: 'BB13', source: 'Chaos', capture: true },
      infoText: (_data, matches, output) => {
        return output.knockbackFromBoss!({ chaos: matches.source });
      },
      outputStrings: {
        knockbackFromBoss: {
          en: 'Knockback from ${chaos}',
          de: 'Rückstoß von ${chaos}',
        },
      },
    },
    {
      id: 'DMU P3 Damning Edict',
      type: 'StartsUsing',
      netRegex: { id: 'BB01', source: 'Chaos', capture: false },
      response: Responses.getBehind(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Future\'s End/Past\'s End': 'Future/Past\'s End',
        'Spelldriver/Spellscatter/Spellwave': 'Spelldriver/scatter/wave',
        'Longitudinal Implosion/Latitudinal Implosion': 'Long/Lat Implosion',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Black Hole': 'schwarz(?:e|er|es|en) Loch',
        'Chaos': 'Chaos',
        '(?<! )Exdeath': 'Exdeath',
        'Graven Image': 'heilig(?:e|er|es|en) Statue',
        'Kefka': 'Kefka',
        'Neo Exdeath': 'Neo Exdeath',
      },
      'replaceText': {
        '\\(castbar\\)': '(wirlen)',
        'Aero III Assault': 'Wallendes Windga',
        'All Things Ending': 'Ende aller Dinge',
        'Ave Maria': 'Ave Maria',
        'Big Bang': 'Quantengravitationsschleife',
        'Black Hole': 'schwarzes Loch',
        'Black Spark': 'Schwarzer Funke',
        'Blackblood': 'Schwarzes Blut',
        'Blizzard III(?! )': 'Eisga-Säule',
        'Blizzard III Blowout': 'Expandierendes Eisga',
        'Bowels of Agony': 'Quälende Eingeweide',
        'Cyclone': 'Zyklon',
        'Damning Edict': 'Verdammendes Edikt',
        'Definition of Insanity': 'Rekonstruktion',
        'Double-Trouble Trap': 'Fiese Falle',
        'Earthquake': 'Erdbeben',
        'Explosion': 'Explosion',
        'Flagrant Fire III': 'Flammendes Feuga',
        'Forsaken': 'Verloren',
        'Future\'s End': 'Ende der Zukunft',
        'Grand Cross': 'Supernova',
        'Graven Image': 'heilige Statue',
        'Gravitas': 'Gravitas',
        'Gravitational Wave': 'Gravitationswelle',
        'Gravity III': 'Graviga',
        'Hyperdrive': 'Hyperantrieb',
        'Idyllic Will': 'Idyllischer Wille',
        'Indolent Will': 'Träger Wille',
        'Indulgent Will': 'Nachsichtiger Wille',
        'Inferno': 'Flamme',
        'Intemperate Will': 'Unmäßiger Wille',
        'Latitudinal Implosion': 'Horizontale Implosion',
        'Light of Judgment': 'Licht des Urteils',
        'Longitudinal Implosion': 'Vertikale Implosion',
        'Max': 'Riese',
        'Mystery Magic': 'Mysteriöse Magie',
        'Nothingness': 'Welle der Leere',
        'Past\'s End': 'Ende der Vergangenheit',
        'Pulse Wave': 'Pulswelle',
        'Revolting Ruin III': 'Revoltierendes Ruinga',
        'Shockwave': 'Schockwelle',
        'Spelldriver': 'Risikofaktor: Antrieb',
        'Spellscatter': 'Risikofaktor: Streuung',
        'Spellwave': 'Risikofaktor: Welle',
        'Stray Flames': 'Chaosflammen',
        'Stray Spray': 'Chaosspritzer',
        'Tele-trouncing': 'Tückischer Teleport',
        'the Decisive Battle': 'Entscheidungsschlacht',
        'The Path of Light': 'Pfad des Lichts',
        'Thrumming Thunder III': 'Brachiales Blitzga',
        '(?<! )Thunder III': 'Blitzga',
        'Trance': 'Trance',
        'Trine': 'Trine',
        'Tsunami': 'Sturzflut',
        'Ultimate Embrace': 'Ultima-Umarmung',
        'Umbra Smash': 'Schattenschlag',
        'Vacuum Wave': 'Vakuumwelle',
        'Vitrophyre': 'Vitrophyr',
        'Wave Cannon': 'Wellenkanone',
        'White Hole': 'Weißes Loch',
        'Wings of Destruction': 'Vernichtungsschwinge',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Black Hole': 'trou noir',
        'Chaos': 'Chaos',
        '(?<! )Exdeath': 'Exdeath',
        'Graven Image': 'statue divine',
        'Kefka': 'Kefka',
        'Neo Exdeath': 'Néo-Exdeath',
      },
      'replaceText': {
        'Aero III Assault': 'Méga Vent véhément',
        'All Things Ending': 'Fin de toutes choses',
        'Ave Maria': 'Ave Maria',
        'Big Bang': 'Ordre de saillie',
        'Black Hole': 'trou noir',
        'Black Spark': 'Étincelle noire',
        'Blackblood': 'Sang noir',
        'Blizzard III(?! )': 'pilier Méga Glace',
        'Blizzard III Blowout': 'Méga Glace propagatrice',
        'Bowels of Agony': 'Entrailles de l\'agonie',
        'Cyclone': 'cyclone',
        'Damning Edict': 'Décret accablant',
        'Double-Trouble Trap': 'Pièges successifs',
        'Double-trouble Trap': 'Pièges successifs',
        'Earthquake': 'Tremblement de terre',
        'Explosion': 'Explosion',
        'Flagrant Fire III': 'Méga Feu faufilant',
        'Forsaken': 'Cataclysme',
        'Future\'s End': 'Fin du futur',
        'Grand Cross': 'Croix suprême',
        'Graven Image': 'statue divine',
        'Gravitas': 'Tir gravitationnel',
        'Gravitational Wave': 'Onde gravitationnelle',
        'Gravity III': 'Méga Gravité',
        'Hyperdrive': 'Colonne de feu',
        'Idyllic Will': 'Volonté idyllique',
        'Indolent Will': 'Volonté indolente',
        'Indulgent Will': 'Volonté indulgente',
        'Inferno': 'Inferno',
        'Intemperate Will': 'Volonté intempérante',
        'Latitudinal Implosion': 'Implosion horizontale',
        'Light of Judgment': 'Triade guerrière',
        'Longitudinal Implosion': 'Implosion verticale',
        'Max': 'Maxi',
        'Mystery Magic': 'Magie énigmatique',
        'Nothingness': 'Rayon du néant',
        'Past\'s End': 'Fin du passé',
        'Pulse Wave': 'Pulsation spirituelle',
        'Revolting Ruin III': 'Méga Ruine ravageuse',
        'Shockwave': 'Onde de choc',
        'Spelldriver': 'Péril magique chargé',
        'Spellscatter': 'Peril magique dispersé',
        'Spellwave': 'Peril magique ondulé',
        'Stray Flames': 'Flammes du chaos',
        'Stray Spray': 'Eaux du chaos',
        'Tele-trouncing': 'Téléportation perfide',
        'the Decisive Battle': 'Combat décisif',
        'The Path of Light': 'Voie de Lumière',
        'Thrumming Thunder III': 'Méga Foudre fourmillante',
        '(?<! )Thunder III': 'Méga Foudre',
        'Trine': 'Trine',
        'Tsunami': 'Tsunami',
        'Ultimate Embrace': 'Étreinte fatidique',
        'Umbra Smash': 'Fracas ombral',
        'Vacuum Wave': 'Vague de vide',
        'Vitrophyre': 'Vitrophyre',
        'Wave Cannon': 'Canon plasma',
        'White Hole': 'Trou blanc',
        'Wings of Destruction': 'Aile de la destruction',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Black Hole': 'ブラックホール',
        'Chaos': 'カオス',
        '(?<! )Exdeath': 'エクスデス',
        'Graven Image': '神々の像',
        'Kefka': 'ケフカ',
        'Neo Exdeath': 'ネオエクスデス',
      },
      'replaceText': {
        'Aero III Assault': 'ずんずんエアロガ',
        'All Things Ending': '消滅の脚',
        'Ave Maria': 'アヴェ・マリア',
        'Big Bang': '突出せよ',
        'Black Hole': 'ブラックホール',
        'Black Spark': 'ブラックスパーク',
        'Blackblood': 'ブラックブラッド',
        'Blizzard III(?! )': 'ブリザガ・ピラー',
        'Blizzard III Blowout': 'ひろげるブリザガ',
        'Bowels of Agony': 'バウル・オブ・アゴニー',
        'Cyclone': 'サイクロン',
        'Damning Edict': 'ダミングイーディクト',
        'Double-Trouble Trap': 'つぎつぎトラップ',
        'Double-trouble Trap': 'つぎつぎトラップ',
        'Earthquake': '地震',
        'Explosion': '爆発',
        'Flagrant Fire III': 'めらめらファイガ',
        'Forsaken': 'ミッシング',
        'Future\'s End': '未来の終焉',
        'Grand Cross': 'グランドクロス',
        'Graven Image': '神々の像',
        'Gravitas': '重力弾',
        'Gravitational Wave': '重力波',
        'Gravity III': 'グラビガ',
        'Hyperdrive': 'ハイパードライブ',
        'Idyllic Will': '睡魔の神気',
        'Indolent Will': '惰眠の神気',
        'Indulgent Will': '聖母の神気',
        'Inferno': 'インフェルノ',
        'Intemperate Will': '撲殺の神気',
        'Latitudinal Implosion': 'ホリゾンタルインプロージョン',
        'Light of Judgment': '裁きの光',
        'Longitudinal Implosion': 'ヴァーティカルインプロージョン',
        'Max': 'マキシマム',
        'Mystery Magic': 'なぞなぞマジック',
        'Nothingness': '無の波動',
        'Past\'s End': '過去の終焉',
        'Pulse Wave': '波動弾',
        'Revolting Ruin III': 'ばりばりルインガ',
        'Shockwave': 'ショックウェーブ',
        'Spelldriver': 'スペルハザード・ドライブ',
        'Spellscatter': 'スペルハザード・スキャッター',
        'Spellwave': 'スペルハザード・ウェーブ',
        'Stray Flames': '混沌の炎',
        'Stray Spray': '混沌の水',
        'Tele-trouncing': 'ずびずばテレポ',
        'the Decisive Battle': '決戦',
        'The Path of Light': '光の波動',
        'Thrumming Thunder III': 'もりもりサンダガ',
        '(?<! )Thunder III': 'サンダガ',
        'Trine': 'トライン',
        'Tsunami': '大海嘯',
        'Ultimate Embrace': '終末の双腕',
        'Umbra Smash': 'アンブラスマッシュ',
        'Vacuum Wave': '真空波',
        'Vitrophyre': '岩石弾',
        'Wave Cannon': '波動砲',
        'White Hole': 'ホワイトホール',
        'Wings of Destruction': '破壊の翼',
      },
    },
    {
      'locale': 'ko',
      'missingTranslations': true,
      'replaceSync': {
        'Chaos': '카오스',
        '(?<! )Exdeath': '엑스데스',
        'Graven Image': '신들의 상',
        'Kefka': '케프카',
      },
      'replaceText': {
        '\\(Pop Window\\)': '(활성화)',
        '\\(castbar\\)': '(시전바)',
        'Aero III Assault': '갈기갈기 에어로가',
        'All Things Ending': '소멸의 발차기',
        'Ave Maria': '아베 마리아',
        'Blizzard III Blowout': '널리널리 블리자가',
        'Bowels of Agony': '고통의 심핵',
        'Cyclone': '회오리',
        'Definition of Insanity': '재구성',
        'Double-Trouble Trap': '줄줄이 함정',
        'Explosion': '폭발',
        'Flagrant Fire III': '이글이글 파이가',
        'Forsaken': '행방불명',
        'Future\'s End/Past\'s End': '과거/미래의 종언',
        'Graven Image': '신들의 상',
        'Gravitas': '중력탄',
        'Gravitational Wave': '중력파',
        'Gravity III': '그라비가',
        'Hyperdrive': '하이퍼드라이브',
        'Idyllic Will': '수마의 신기',
        'Indolent Will': '태만의 신기',
        'Indulgent Will': '성모의 신기',
        'Inferno': '화염',
        'Intemperate Will': '박살의 신기',
        'Light of Judgment': '심판의 빛',
        'Longitudinal Implosion': '세로 내파',
        'Mystery Magic': '알쏭달쏭 마법',
        'Pulse Wave': '파동탄',
        'Revolting Ruin III': '파삭파삭 루인가',
        'Shockwave': '충격파',
        'Spelldriver': '위험한 주문: 집중',
        'Spellscatter': '위험한 주문: 분산',
        'Spellwave': '위험한 주문: 파동',
        'Stray Flames': '혼돈의 불',
        'Stray Spray': '혼돈의 물',
        'Tele-trouncing': '성큼성큼 텔레포',
        'The Path of Light': '빛의 파동',
        'Thrumming Thunder III': '찌릿찌릿 선더가',
        '(?<! )Thunder III': '선더가',
        'Trance': '자아도취',
        'Trine': '트라인',
        'Tsunami': '해일',
        'Ultimate Embrace': '종말의 포옹',
        'Vitrophyre': '암석탄',
        'Wave Cannon': '파동포',
        'Wings of Destruction': '파괴의 날개',
        'the Decisive Battle': '결전',
      },
    },
  ],
};

export default triggerSet;
