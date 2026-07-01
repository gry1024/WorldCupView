export type PlayerProfile = {
  displayName: string;
  photoUrl: string;
  photoCredit: string;
  headline: string;
};

const realPhotoBase = "https://commons.wikimedia.org/wiki/Special:FilePath/";

const knownPlayers: Record<string, PlayerProfile> = {
  "lionel messi": profile("梅西", "Lionel-Messi-Argentina-2022-FIFA-World-Cup (cropped).jpg", "阿根廷领袖"),
  "erling haaland": profile("哈兰德", "Erling Haaland June 2025.jpg", "挪威终结者"),
  "kylian mbappé": profile("姆巴佩", "Kylian Mbappé France.jpg", "法国冲刺核心"),
  "kylian mbappe": profile("姆巴佩", "Kylian Mbappé France.jpg", "法国冲刺核心"),
  "cristiano ronaldo": profile("C罗", "Cristiano Ronaldo with Al Nassr, 19 September 2023 - 54 (cropped).jpg", "葡萄牙门前标志"),
  "harry kane": profile("凯恩", "Harry Kane in Russia 2.jpg", "英格兰队长"),
  "lamine yamal": profile("亚马尔", "Lamine Yamal in 2025 (cropped).jpg", "西班牙边路新星"),
  "vinicius junior": profile("维尼修斯", "Vinicius Jr 2021.jpg", "巴西爆点"),
  "vinicius jr": profile("维尼修斯", "Vinicius Jr 2021.jpg", "巴西爆点"),
  "ousmane dembélé": profile("登贝莱", "Ousmane Dembélé 2018 (cropped).jpg", "法国边路推进器"),
  "ousmane dembele": profile("登贝莱", "Ousmane Dembélé 2018 (cropped).jpg", "法国边路推进器"),
  "brian brobbey": profile("布罗贝伊", "Brian Brobbey (2024).jpg", "荷兰禁区支点"),
  "ismaïla sarr": profile("伊斯梅拉·萨尔", "Ismaïla Sarr 2018.jpg", "塞内加尔纵深点"),
  "ismaila sarr": profile("伊斯梅拉·萨尔", "Ismaïla Sarr 2018.jpg", "塞内加尔纵深点"),
  "jonathan david": profile("乔纳森·戴维", "Jonathan David 2019.jpg", "加拿大射手"),
  "christian pulisic": profile("普利西奇", "Christian Pulisic 2019.jpg", "美国前场核心"),
  "jude bellingham": profile("贝林厄姆", "Jude Bellingham 2023.jpg", "英格兰中场推进"),
  "rafael leão": profile("莱奥", "Rafael Leão 2022.jpg", "葡萄牙左路爆点"),
  "rafael leao": profile("莱奥", "Rafael Leão 2022.jpg", "葡萄牙左路爆点"),
  "alphonso davies": profile("阿方索·戴维斯", "Alphonso Davies 2022.jpg", "加拿大速度核心"),
  "santiago gimenez": profile("希门尼斯", "Santiago Giménez 2023.jpg", "墨西哥中锋"),
  "edson alvarez": profile("埃德松·阿尔瓦雷斯", "Edson Álvarez 2023.jpg", "墨西哥中场屏障"),
  "weston mckennie": profile("麦肯尼", "Weston McKennie 2022.jpg", "美国中场覆盖者"),
  "pedri": profile("佩德里", "Pedri 2022.jpg", "西班牙中场节拍器"),
  "rodrygo": profile("罗德里戈", "Rodrygo Goes 2018.jpg", "巴西灵活前锋"),
  "julian alvarez": profile("阿尔瓦雷斯", "Julián Álvarez 2022.jpg", "阿根廷锋线冲击"),
  "martin odegaard": profile("厄德高", "Martin Ødegaard 2021.jpg", "挪威组织核心"),
  "jamal musiala": profile("穆西亚拉", "Jamal Musiala 2022.jpg", "德国前场灵感"),
  "kai havertz": profile("哈弗茨", "Kai Havertz 2019.jpg", "德国锋线衔接点"),
  "cody gakpo": profile("加克波", "Cody Gakpo 2022.jpg", "荷兰左路终结"),
  "johan manzambi": profile("曼赞比", "Johan Manzambi 2024.jpg", "瑞士前场活力"),
  "matheus cunha": profile("库尼亚", "Matheus Cunha 2021.jpg", "巴西前场游击手"),
  "anthony elanga": profile("埃兰加", "Anthony Elanga 2022.jpg", "瑞典速度点"),
  "aymen hussein": profile("艾曼·侯赛因", "Aymen Hussein 2024.jpg", "伊拉克禁区支点"),
  "ismael saibari": profile("塞巴里", "Ismael Saibari 2023.jpg", "摩洛哥中前场衔接"),
  "daniel munoz": profile("丹尼尔·穆尼奥斯", "Daniel Muñoz 2022.jpg", "哥伦比亚边路冲击"),
  "deniz undav": profile("翁达夫", "Deniz Undav 2024.jpg", "德国门前终结"),
  "folarin balogun": profile("巴洛贡", "Folarin Balogun 2023.jpg", "美国锋线冲击"),
  "ayase ueda": profile("上田绮世", "Ayase Ueda 2023.jpg", "日本门前终结"),
  "amine harit": profile("阿明·阿里特", "Amine Harit 2018.jpg", "摩洛哥前场创造者"),
  "elijah just": profile("伊莱贾·贾斯特", "Elijah Just 2023.jpg", "新西兰反击点"),
  "julian quinones": profile("胡利安·基尼奥内斯", "Julián Quiñones 2023.jpg", "墨西哥禁区冲击手"),
  "leandro trossard": profile("特罗萨德", "Leandro Trossard 2018.jpg", "比利时前场多面手"),
  "maximiliano araujo": profile("马克西米利亚诺·阿劳霍", "Maximiliano Araújo 2022.jpg", "乌拉圭左路推进点"),
  "mikel oyarzabal": profile("奥亚萨瓦尔", "Mikel Oyarzabal 2018.jpg", "西班牙锋线串联点"),
  "riyad mahrez": profile("马赫雷斯", "Riyad Mahrez 2014.jpg", "阿尔及利亚右路核心"),
  "yasin ayari": profile("亚辛·阿亚里", "Yasin Ayari 2023.jpg", "瑞典中场新锐"),
  "alexander isak": profile("伊萨克", "Alexander Isak 2019.jpg", "瑞典锋线支点"),
  "amad diallo": profile("阿马德·迪亚洛", "Amad Diallo 2021.jpg", "科特迪瓦边路冲击"),
  "abdulelah al-amri": profile("阿卜杜勒伊拉·阿姆里", "Abdulelah Al-Amri 2023.jpg", "沙特后场定位球威胁"),
  "nicolas pepe": profile("尼古拉·佩佩", "Nicolas Pépé 2019.jpg", "科特迪瓦边锋"),
  "pape gueye": profile("帕普·盖耶", "Pape Gueye 2021.jpg", "塞内加尔中场插上点"),
  "abbosbek fayzullaev": profile("阿博斯别克·法伊祖拉耶夫", "Abbosbek Fayzullaev 2024.jpg", "乌兹别克斯坦前场核心"),
  "mousa al-taamari": profile("穆萨·塔马里", "Mousa Al-Taamari 2023.jpg", "约旦反击核心"),
  "marcus holmgren pedersen": profile("马库斯·霍尔姆格伦·佩德森", "Marcus Holmgren Pedersen 2022.jpg", "挪威边路推进"),
  "stephen eustaquio": profile("斯蒂芬·欧斯塔基奥", "Stephen Eustáquio 2022.jpg", "加拿大中场枢纽"),
  "abduvohid nematov": profile("阿卜杜沃希德·内马托夫", "Abduvohid Nematov 2022.jpg", "中亚门前定位球参与点"),
  "edin dzeko": profile("埃丁·哲科", "Edin Džeko 2015.jpg", "波黑锋线支点"),
};

const nameRepairs: Record<string, string> = {
  "kvdi khakpv": "Cody Gakpo",
  "prvmis divid": "Jonathan David",
  "jvlian kviinvnz": "Julian Quiñones",
  "nvnv mndz": "Nuno Mendes",
  "tøn kvpmainrz": "Teun Koopmeiners",
  "jvhan mnzambi": "Johan Manzambi",
  "aiash ivida": "Ayase Ueda",
  "armin mhmich": "Amine Harit",
  "asmaail saibari": "Ismael Saibari",
  "dnil mvnvz": "Daniel Munoz",
  "dniz avndav": "Deniz Undav",
  "f. balogun": "Folarin Balogun",
  "h. kane": "Harry Kane",
  "k. havertz": "Kai Havertz",
  "k. mbappé": "Kylian Mbappé",
  "k. mbappe": "Kylian Mbappé",
  "j. quiñones": "Julian Quiñones",
  "j. quinones": "Julian Quiñones",
  "“j. quiñones": "Julian Quiñones",
  "julian quiñones": "Julian Quiñones",
  "y.ayari": "Yasin Ayari",
  "a. isak": "Alexander Isak",
  "a. diallo": "Amad Diallo",
  "nikvlas ph ph": "Nicolas Pepe",
  "paph gviih": "Pape Gueye",
  "abas bk fiz allh af": "Abbosbek Fayzullaev",
  "mvsi altmari": "Mousa Al-Taamari",
  "markvs hlmgrn pdrsn": "Marcus Holmgren Pedersen",
  "astfan avstakviv": "Stephen Eustaquio",
  "abdalvhid namtvf": "Abduvohid Nematov",
  "abvnad": "Edin Dzeko",
};

export function getPlayerProfile(name: string): PlayerProfile {
  const repaired = repairPlayerName(name);
  const key = normalizeName(repaired);
  const known = knownPlayers[key];
  if (known) return known;

  return {
    displayName: `外文名：${toReadableName(repaired)}`,
    photoUrl: `${realPhotoBase}${encodeURIComponent("Association football match 2022.jpg")}`,
    photoCredit: "Wikimedia Commons real football photo",
    headline: "本届进球球员",
  };
}

export function repairPlayerName(name: string): string {
  return nameRepairs[normalizeName(name)] ?? name;
}

export function toChineseNewsTitle(title: string, source: string): string {
  const lower = title.toLowerCase();
  const sourceLabel = source ? `｜${source}` : "";
  const team = detectTeam(lower);
  const topic = detectTopic(lower);
  const tone = detectTone(lower);

  if (team) {
    return `${team}${topic}${tone}${sourceLabel}`;
  }

  return `全球媒体关注：2026 世界杯${topic}${tone}${sourceLabel}`;
}

function profile(displayName: string, fileName: string, headline: string): PlayerProfile {
  return {
    displayName,
    photoUrl: `${realPhotoBase}${encodeURIComponent(fileName)}`,
    photoCredit: "Wikimedia Commons real player photo",
    headline,
  };
}

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”"'`]/g, "")
    .toLowerCase()
    .trim();
}

function toReadableName(value: string): string {
  return repairPlayerName(value)
    .replace(/\s+/g, " ")
    .trim();
}

function detectTeam(lower: string): string {
  const teams: Array<[string, string]> = [
    ["argentina", "阿根廷"],
    ["brazil", "巴西"],
    ["france", "法国"],
    ["england", "英格兰"],
    ["spain", "西班牙"],
    ["portugal", "葡萄牙"],
    ["germany", "德国"],
    ["mexico", "墨西哥"],
    ["canada", "加拿大"],
    ["united states", "美国"],
    ["usa", "美国"],
    ["qatar", "卡塔尔"],
    ["japan", "日本"],
    ["norway", "挪威"],
  ];

  return teams.find(([needle]) => lower.includes(needle))?.[1] ?? "";
}

function detectTopic(lower: string): string {
  if (/fixture|schedule|match|group/.test(lower)) return "赛程与小组形势更新";
  if (/ticket|travel|hotel|visa|bank|airways|sponsor|business/.test(lower)) return "商业、出行与观赛服务升温";
  if (/injury|squad|coach|roster|lineup/.test(lower)) return "阵容与伤病动态值得关注";
  if (/win|beat|advance|goal|final|knockout/.test(lower)) return "赛果与淘汰赛走势成为焦点";
  if (/fan|support|social|media|trend/.test(lower)) return "球迷声量和社交媒体讨论上升";
  return "最新动态汇总";
}

function detectTone(lower: string): string {
  if (/injury|ban|loss|concern|controversy|probe/.test(lower)) return "，情绪偏谨慎";
  if (/win|historic|brilliant|advance|record|thriller/.test(lower)) return "，情绪偏积极";
  return "，情绪中性";
}
