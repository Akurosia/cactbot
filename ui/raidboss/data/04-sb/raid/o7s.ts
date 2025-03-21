import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  rot?: boolean;
  seenVirus?: boolean;
  first?: 'dada' | 'biblio';
  second?: 'dada' | 'biblio';
  loadCount?: number;
  runCount?: number;
}

// O7S - Sigmascape 3.0 Savage
const triggerSet: TriggerSet<Data> = {
  id: 'SigmascapeV30Savage',
  zoneId: ZoneId.SigmascapeV30Savage,
  timelineFile: 'o7s.txt',
  triggers: [
    // State
    {
      id: 'O7S Aether Rot Gain',
      type: 'GainsEffect',
      netRegex: { effectId: '5C3' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.rot = true,
    },
    {
      id: 'O7S Aether Rot Lose',
      type: 'LosesEffect',
      netRegex: { effectId: '5C3' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.rot = false,
    },
    {
      id: 'O7S Dadaluma Simulation',
      type: 'GainsEffect',
      netRegex: { target: 'Guardian', effectId: '5D3', capture: false },
      condition: (data) => !data.first || data.seenVirus && !data.second,
      run: (data) => {
        if (data.seenVirus)
          data.second = 'dada';
        else
          data.first = 'dada';
      },
    },
    {
      id: 'O7S Bibliotaph Simulation',
      type: 'GainsEffect',
      netRegex: { target: 'Guardian', effectId: '5D4', capture: false },
      condition: (data) => !data.first || data.seenVirus && !data.second,
      run: (data) => {
        if (data.seenVirus)
          data.second = 'biblio';
        else
          data.first = 'biblio';
      },
    },
    {
      id: 'O7S Virus Tracker',
      type: 'GainsEffect',
      netRegex: { target: 'Guardian', effectId: '5D5', capture: false },
      run: (data) => data.seenVirus = true,
    },
    {
      id: 'O7S Magitek Ray',
      type: 'StartsUsing',
      netRegex: { id: '2788', source: 'Guardian', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Magitek Ray',
          de: 'Magitek-Laser',
          fr: 'Rayon Magitek',
          ja: '魔導レーザー',
          cn: '正面直线AOE',
          ko: '마도 레이저',
        },
      },
    },
    {
      id: 'O7S Arm And Hammer',
      type: 'StartsUsing',
      netRegex: { id: '2789', source: 'Guardian' },
      response: Responses.tankBuster(),
    },
    {
      id: 'O7S Orb Marker',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Orb Marker',
          de: 'Orb Marker',
          fr: 'Orbe',
          ja: 'マーカー',
          cn: '放球点名',
          ko: '원자 파동 징',
        },
      },
    },
    {
      id: 'O7S Blue Marker',
      type: 'HeadMarker',
      netRegex: { id: '000E' },
      alarmText: (data, matches, output) => {
        if (data.me !== matches.target)
          return;
        return output.blueMarkerOnYou!();
      },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return;
        return output.blueMarkerOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        blueMarkerOn: {
          en: 'Blue Marker on ${player}',
          de: 'Aura-Kanone auf ${player}',
          fr: 'Marque Bleue sur ${player}',
          ja: '${player}に青玉',
          cn: '蓝球点 ${player}',
          ko: '"${player}" 파란징',
        },
        blueMarkerOnYou: {
          en: 'Blue Marker on YOU',
          de: 'Aura-Kanone auf DIR',
          fr: 'Marque Bleue sur VOUS',
          ja: '自分に青玉',
          cn: '蓝球点名',
          ko: '파란징 대상자',
        },
      },
    },
    {
      id: 'O7S Prey',
      type: 'HeadMarker',
      netRegex: { id: '001E' },
      response: Responses.preyOn('info'),
    },
    {
      id: 'O7S Searing Wind',
      type: 'GainsEffect',
      netRegex: { effectId: '178' },
      condition: Conditions.targetIsYou(),
      response: Responses.getOut(),
    },
    {
      id: 'O7S Abandonment',
      type: 'GainsEffect',
      netRegex: { effectId: '58A' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Abandonment: stay middle',
          de: 'Verlassen: Bleib mittig',
          fr: 'Isolement : restez au milieu',
          ja: '孤独: 内側へ',
          cn: '待在中间',
          ko: '고독감: 중앙에 있기',
        },
      },
    },
    {
      // Aether Rot
      id: 'O7S Rot',
      type: 'GainsEffect',
      netRegex: { effectId: '5C3' },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.rotOnYou!();

        return output.rotOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        rotOnYou: {
          en: 'Rot on you',
          de: 'Fäule auf DIR',
          fr: 'Pourriture sur VOUS',
          ja: '自分にロット',
          cn: '以太病毒点名',
          ko: '에테르 대상자',
        },
        rotOn: {
          en: 'Rot on ${player}',
          de: 'Fäule auf ${player}',
          fr: 'Pourriture sur ${player}',
          ja: '${player}にロット',
          cn: '以太病毒点名${player}',
          ko: '"${player}" 에테르',
        },
      },
    },
    {
      id: 'O7S Stoneskin',
      type: 'StartsUsing',
      netRegex: { id: '2AB5', source: 'Ultros' },
      response: Responses.interrupt('alarm'),
    },
    {
      id: 'O7S Load',
      type: 'StartsUsing',
      // Load: 275C
      // Skip: 2773
      // Retrieve: 2774
      // Paste: 2776
      netRegex: { id: ['275C', '2773', '2774', '2776'], source: 'Guardian', capture: false },
      alertText: (data, _matches, output) => {
        data.loadCount = (data.loadCount ?? 0) + 1;

        if (data.loadCount === 1) {
          // First load is unknown.
          return output.screen!();
        } else if (data.loadCount === 2) {
          return data.first === 'biblio' ? output.dada!() : output.biblio!();
        } else if (data.loadCount === 3) {
          return data.first === 'biblio' ? output.ultros!() : output.ships!();
        } else if (data.loadCount === 4) {
          return data.first === 'biblio' ? output.ships!() : output.ultros!();
        } else if (data.loadCount === 5) {
          return output.virus!();
        } else if (data.loadCount === 6) {
          return data.first === 'biblio' ? output.ultros!() : output.ships!();
        } else if (data.loadCount === 7) {
          // This is the post-virus Load/Skip divergence.
          return output.screen!();
        } else if (data.loadCount === 8) {
          return data.first === 'biblio' ? output.dada!() : output.biblio!();
        } else if (data.loadCount === 9) {
          return data.first === 'biblio' ? output.ships!() : output.ultros!();
        }

        console.error(`Unknown load: ${data.loadCount}`);
      },
      outputStrings: {
        screen: {
          en: 'Biblio?/Knockback?',
          de: 'Biblio?/Rückstoß?',
          fr: 'Biblio ?/Poussée ?',
          ja: 'ビブリオタフ?/ノックバック?',
          cn: '图书？/击退？',
          ko: '비블리오?/넉백?',
        },
        biblio: {
          en: 'Biblio: Positions',
          de: 'Biblio: Positionen',
          fr: 'Biblio : Positions',
          ja: 'ビブリオタフ: 定めた位置へ',
          cn: '图书：踩塔',
          ko: '비블리오: 지정 위치로',
        },
        dada: {
          en: 'Dada: Knockback',
          de: 'Dada: Rückstoß',
          fr: 'Dada : Poussée',
          ja: 'ダダルマー: ノックバック',
          cn: '达达：击退',
          ko: '다다루마: 넉백',
        },
        ships: {
          en: 'Ships: Out of Melee',
          de: 'Flieger: Raus aus Nahkampf-Reichweite',
          fr: 'Vaisseaux : Sortez de la mêlée',
          ja: 'エアフォース: 離れる',
          cn: '飞机：钢铁',
          ko: '에어포스: 근접 범위 밖으로',
        },
        ultros: {
          en: 'Ultros: Ink Spread',
          de: 'Ultros: Tine - Verteilen',
          fr: 'Orthros : Encre, dispersez-vous',
          ja: 'オルトロス: インク 散開',
          cn: '章鱼：散开',
          ko: '오르트로스: 먹물 산개',
        },
        virus: {
          en: 'VIRUS',
          de: 'VIRUS',
          fr: 'VIRUS',
          ja: 'ウイルス',
          cn: '病毒',
          ko: '바이러스',
        },
      },
    },
    {
      id: 'O7S Run',
      type: 'StartsUsing',
      netRegex: { id: '276F', source: 'Guardian', capture: false },
      infoText: (data, _matches, output) => {
        data.runCount = (data.runCount ?? 0) + 1;

        if (data.runCount === 1)
          return output.dada!();
        else if (data.runCount === 2)
          return data.first === 'biblio' ? output.ultros!() : output.ships!();
        else if (data.runCount === 3)
          return data.first === 'biblio' ? output.ships!() : output.ultros!();
        else if (data.runCount === 4)
          return data.first === 'biblio' ? output.ultros!() : output.ships!();
        else if (data.runCount === 5)
          return output.biblio!();
        else if (data.runCount === 6)
          return data.first === 'biblio' ? output.ships!() : output.ultros!();
      },
      outputStrings: {
        biblio: {
          en: 'Biblio Add',
          de: 'Biblio Add',
          fr: 'Add Biblio',
          ja: '雑魚: ビブリオタフ',
          cn: '图书出现',
          ko: '비블리오 등장',
        },
        dada: {
          en: 'Dada Add',
          de: 'Dada Add',
          fr: 'Add Dada',
          ja: '雑魚: ダダルマー',
          cn: '达达出现',
          ko: '다다루마 등장',
        },
        ships: {
          en: 'Ship Add',
          de: 'Flieger Add',
          fr: 'Add Vaisseau',
          ja: '雑魚: エアフォース',
          cn: '飞机出现',
          ko: '에어포스 등장',
        },
        ultros: {
          en: 'Ultros Add',
          de: 'Ultros Add',
          fr: 'Add Orthros',
          ja: '雑魚: オルトロス',
          cn: '章鱼出现',
          ko: '오르트로스 등장',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Fire Control System': 'Feuerleitsystem',
        'Guardian': 'Wächter',
        'Ultros': 'Ultros',
        'WEAPON SYSTEMS ONLINE': 'Feuerkontrollsystem aktiviert',
      },
      'replaceText': {
        'Aether Rot': 'Ätherfäule',
        'Arm And Hammer': 'Arm-Hammer',
        'Atomic Ray': 'Atomstrahlung',
        'Aura Cannon': 'Aura-Kanone',
        'Biblio': 'Bibliotaph',
        'Bomb Deployment': 'Bombeneinsatz',
        'Chain Cannon': 'Kettenkanone',
        'Chakra Burst': 'Chakra-Ausbruch',
        'Copy(?! Program)': 'Kopieren:',
        'Dada': 'Dadarma',
        'Demon Simulation': 'Dämonensimulation',
        'Diffractive Laser': 'Diffusionslaser',
        'Diffractive Plasma': 'Diffusionsplasma',
        'Ink': 'Tinte',
        'Interrupt Stoneskin': 'Steinhaut unterbrechen',
        'Load': 'Laden:',
        'Magitek Ray': 'Magitek-Laser',
        'Magnetism': 'Magnetismus',
        'Main Cannon': 'Hauptkanone',
        'Missile Simulation': 'Raketensimulation',
        'Paste(?! Program)': 'Einfügen:',
        'Plane Laser': 'Luftwaffe Add Laser',
        'Prey': 'Beute',
        'Radar': 'Radar',
        'Repel': 'Abstoßung',
        'Run(?! Program)': 'Start:',
        'Shockwave': 'Schockwelle',
        'Skip(?! Program)': 'Überspringen:',
        'Temporary Misdirection': 'Plötzliche Panik',
        'Tentacle(?! )': 'Tentakel',
        'Tentacle Simulation': 'Tentakelsimulation',
        'Viral Weapon': 'Panikvirus',
        '(?<!\\w)Virus': 'Virus',
        'Wallop': 'Tentakelklatsche',
        'Air Force': 'Luftwaffe',
        'Ultros': 'Ultros',
        'Retrieve': 'Wiederherstellen:',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Dadaluma': 'Dadaluma',
        'Fire Control System': 'système de contrôle',
        'Guardian': 'gardien',
        'Ultros': 'Orthros',
        'WEAPON SYSTEMS ONLINE': 'Démarrage du système de contrôle',
      },
      'replaceText': {
        '\\?': ' ?',
        'Aether Rot': 'Pourriture éthéréenne',
        'Air Force': 'Force aérienne',
        'Arm And Hammer': 'Marteau stratégique',
        'Atomic Ray': 'Rayon atomique',
        'Aura Cannon': 'Rayon d\'aura',
        'Biblio': 'Bibliotaphe',
        'Bomb Deployment': 'Déploiement de bombes',
        'Chain Cannon': 'Canon automatique',
        'Chakra Burst': 'Explosion d\'aura',
        'Copy': 'Copie',
        'Dada': 'Dadaluma',
        'Demon Simulation': 'Chargement : démon',
        'Diffractive Laser': 'Laser diffracteur',
        'Diffractive Plasma': 'Plasma diffracteur',
        'Ink': 'Encre',
        'Interrupt Stoneskin': 'Interrompre Cuirasse',
        'Load': 'Chargement',
        'Magitek Ray': 'Rayon magitek',
        'Magnetism': 'Magnétisme',
        'Main Cannon': 'Canon principal',
        'Missile Simulation': 'Chargement : missiles',
        'Paste': 'Collage',
        'Plane Laser': 'Laser force aérienne',
        'Prey': 'Proie',
        'Radar': 'Radar',
        'Repel': 'Répulsion',
        'Retrieve': 'Programme Précédent',
        'Run': 'Programme',
        'Shockwave': 'Onde de choc',
        'Skip': 'Saut',
        'Temporary Misdirection': 'Démence',
        'Tentacle(?! Simulation)': 'Tentacule',
        'Tentacle Simulation': 'Chargement : tentacule',
        'Ultros': 'Orthros',
        'Viral Weapon': 'Arme virologique',
        '(?<!\\w)Virus': 'Virus',
        'Wallop': 'Taloche tentaculaire',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Bibliotaph Simulation': 'ビブリオタフ・プログラム',
        'Dadaluma Simulation': 'ダダルマー・プログラム',
        'Fire Control System': 'ファイアコントロールシステム',
        'Guardian': 'ガーディアン',
        'Ultros': 'オルトロス',
        'WEAPON SYSTEMS ONLINE': 'ファイアコントロールシステム起動',
      },
      'replaceText': {
        '\\(H\\)': '(ヒラ)',
        'Aether Rot': 'エーテルロット',
        'Air Force': 'エアフォース',
        'Arm And Hammer': 'アームハンマー',
        'Atomic Ray': 'アトミックレイ',
        'Aura Cannon': 'オーラキャノン',
        'Biblio': 'ビブリオタフ',
        'Bomb Deployment': '爆弾設置',
        'Chain Cannon': 'チェーンガン',
        'Chakra Burst': 'チャクラバースト',
        'Copy(?! Program)': 'コピー',
        'Dada': 'ダダルマー',
        'Demon Simulation': 'ローディング：デーモン',
        'Diffractive Laser': '拡散レーザー',
        'Diffractive Plasma': '拡散プラズマ',
        'Ink': '墨',
        'Interrupt Stoneskin': '沈黙: ストーンスキン',
        'Load': 'ローディング',
        'Magitek Ray': '魔導レーザー',
        'Magnetism': '磁力',
        'Main Cannon': 'メインカノン',
        'Missile Simulation': 'ローディング：ミサイル',
        'Paste(?! Program)': 'ペースト',
        'Plane Laser': 'エアフォース レザー',
        'Prey': 'プレイ',
        'Radar': 'レイダー',
        'Repel': '反発',
        'Retrieve': 'リバース',
        'Run(?! Program)': '実体化',
        'Shockwave': '衝撃波',
        'Skip(?! Program)': 'スキップ',
        'Temporary Misdirection': '心神喪失',
        'Tentacle(?! )': 'たこあし',
        'Tentacle Simulation': 'ローディング：たこあし',
        'Ultros': 'オルトロス',
        'Viral Weapon': 'ウィルス兵器',
        '(?<!\\w)Virus': 'ウイルス',
        'Wallop': '叩きつけ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Dadaluma': '达达鲁玛',
        'Fire Control System': '武器火控系统',
        'Guardian': '守护者',
        'Ultros': '奥尔特罗斯',
        'WEAPON SYSTEMS ONLINE': '武器火控系统启动',
      },
      'replaceText': {
        'Aether Rot': '以太病毒',
        'Arm And Hammer': '臂锤',
        'Atomic Ray': '原子射线',
        'Aura Cannon': '斗气炮',
        'Biblio': '永世珍本',
        'Bomb Deployment': '设置炸弹',
        'Chain Cannon': '链式机关炮',
        'Chakra Burst': '脉轮爆发',
        'Copy(?! Program)': '复制',
        'Dada': '达达鲁玛',
        'Demon Simulation': '加载恶魔模拟程序',
        'Diffractive Laser': '扩散射线',
        'Diffractive Plasma': '扩散离子',
        'Ink': '墨汁',
        'Interrupt Stoneskin': '打断石肤',
        'Load': '加载',
        'Magitek Ray': '魔导激光',
        'Magnetism': '磁力',
        'Main Cannon': '主加农炮',
        'Missile Simulation': '加载导弹模拟程序',
        'Paste(?! Program)': '粘贴',
        'Plane Laser': '小飞机激光',
        'Prey': '猎物',
        'Radar': '雷达',
        'Repel': '相斥',
        'Retrieve Air Force': '接小飞机',
        'Retrieve Ultros': '接奥尔特罗斯',
        'Run(?! Program)': '实体化',
        'Shockwave': '冲击波',
        'Skip(?! Program)': '跳过',
        'Temporary Misdirection': '精神失常',
        'Tentacle(?! )': '腕足',
        'Tentacle Simulation': '加载腕足模拟程序',
        'Viral Weapon': '病毒兵器',
        '(?<!\\w)Virus': '病毒',
        'Wallop': '敲击',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Dadaluma': '다다루마',
        'Fire Control System': '병기 제어 시스템',
        'Guardian': '가디언',
        'Ultros': '오르트로스',
        'WEAPON SYSTEMS ONLINE': '병기 제어 시스템 기동……',
      },
      'replaceText': {
        '\\(H\\)': '(힐러)',
        '\\(DPS\\)': '(딜러)',
        'Aether Rot': '에테르 부패',
        'Air Force': '에어포스',
        'Arm And Hammer': '양팔 내리치기',
        'Atomic Ray': '원자 파동',
        'Aura Cannon': '오라 포격',
        'Biblio': '비블리오',
        'Bomb Deployment': '폭탄 설치',
        'Chain Cannon': '기관총',
        'Chakra Burst': '차크라 폭발',
        'Copy(?! Program)': '복사',
        'Dada': '다다',
        'Demon Simulation': '불러오기: 악마',
        'Diffractive Laser': '확산 레이저',
        'Diffractive Plasma': '확산 플라스마',
        'Ink': '먹물',
        'Interrupt Stoneskin': '스톤스킨 침묵하기',
        'Load': '불러오기',
        'Magitek Ray': '마도 레이저',
        'Magnetism': '자력',
        'Main Cannon': '주포',
        'Missile Simulation': '불러오기: 미사일',
        'Paste(?! Program)': '붙여넣기',
        'Plane Laser': '에어포스 레이저',
        'Prey': '표식',
        'Radar': '레이더',
        'Repel': '반발',
        'Run(?! Program)': '실체화',
        'Shockwave': '충격파',
        'Skip(?! Program)': '건너뛰기',
        'Temporary Misdirection': '심신상실',
        'Tentacle(?! )': '문어발',
        'Tentacle Simulation': '불러오기: 문어발',
        'Retrieve Ultros': '역순 불러오기: 오르트로스',
        'Viral Weapon': '바이러스 병기',
        '(?<!\\w)Virus': '바이러스',
        'Wallop': '매질',
      },
    },
  ],
};

export default triggerSet;
