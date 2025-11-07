// Centralized Ethiopian name generator for unique employee names
// This ensures 100% uniqueness across all employee creation scripts

import * as fs from 'fs';
import * as path from 'path';

// File to persist used names across processes
const USED_NAMES_FILE = path.join(process.cwd(), '.taskmaster', 'used-ethiopian-names.json');

// Comprehensive Ethiopian first and last names
const ethiopianFirstNames = [
  'Mahlet', 'Samuel', 'Betelhem', 'Yared', 'Hana', 'Mariyamwork', 'Hermella', 'Mahader', 'Robel', 'Selam',
  'Obsinuf', 'Yosef', 'Alazar', 'Elda', 'Natnael', 'Dawit', 'Meiraf', 'Rediet', 'Tiobsta', 'Aman',
  'Raey', 'Anuar', 'Brook', 'Zerufael', 'Abezer', 'Bethelhem', 'Feven', 'Tinu', 'Emebet', 'Mekdes',
  'Mahelet', 'Surafel', 'Solan', 'Nardose', 'Elias', 'Kidus', 'Rahel', 'Biruk', 'Meskerem', 'Nuhome',
  'Ruth', 'Etsube', 'Tarikua', 'Betslot', 'Mikedes', 'Konjet', 'Hirut', 'Beza', 'Kirubeal', 'Veronica',
  'Abayeneh', 'Eden', 'Kaleb', 'Meron', 'Natan', 'Seble', 'Tesfaye', 'Mohamed', 'Simert', 'Helian',
  'Sofia', 'Yenenesh', 'Zelalem', 'Abel', 'Dagmawi', 'Fetiya', 'Lidya', 'Behata', 'Melat', 'Nebiyat',
  'Samrawit', 'Tsegaye', 'Bethel', 'Anania', 'Sarah', 'Helen', 'Liza', 'Tsion', 'Yersema', 'Nigist',
  'Tewodros', 'Henock', 'Mekonene', 'Sydine', 'Kendey', 'Yonass', 'Amanuel', 'Elsabet', 'Zekariyas',
  'Yeabsera', 'Fiker', 'Girum', 'Hanna', 'Kebede', 'Lemlem', 'Martha', 'Nahom', 'Luel', 'Ezera',
  'Melecot', 'Abebe', 'Aster', 'Behailu', 'Daniel', 'Eleni', 'Fasil', 'Genet', 'Eyerusalem', 'Lily',
  'Zemach', 'Habtamu', 'Isaiah', 'Jerusalem', 'Kidist', 'Leul', 'Tekle', 'Geda', 'Worknesh', 'Yemiserach',
  'Yeshi', 'Zenebech', 'Zewditu', 'Aberash', 'Addisu', 'Adanech', 'Alemayehu', 'Almaz', 'Andargachew',
  'Aschalew', 'Asnakech', 'Ayele', 'Aynalem', 'Azeb', 'Bahiru', 'Befekadu', 'Bekele', 'Berhane',
  'Berhanu', 'Beyene', 'Birhanu', 'Bisrat', 'Chernet', 'Chaltu', 'Dagim', 'Demeke', 'Deneke',
  'Derartu', 'Dinkinesh', 'Ejigayehu', 'Elfinesh', 'Ephrem', 'Ermias', 'Esubalew', 'Etenesh',
  'Fantaye', 'Fekadu', 'Frehiwot', 'Gelila', 'Gizachew', 'Gosa', 'Haben', 'Haregewoin', 'Haymanot',
  'Henok', 'Kinfe', 'Liya', 'Mahder', 'Makda', 'Mamitu', 'Meaza', 'Melaku', 'Meles', 'Mengistu',
  'Mesfin', 'Mesirak', 'Mimi', 'Misrak', 'Mulu', 'Muluwork', 'Mulatu', 'Nardos', 'Nebiyou',
  'Seifu', 'Selamawit', 'Semere', 'Senafikish', 'Senait', 'Senay', 'Serawit', 'Sisay', 'Solomon',
  'Sosina', 'Tadelech', 'Taddele', 'Tamrat', 'Tekeste', 'Tena', 'Tenanesh', 'Tewabech', 'Tewolde',
  'Tilahun', 'Tsehay', 'Worku', 'Yared', 'Yeshitila', 'Yonas', 'Yoseph'
];

const ethiopianLastNames = [
  'Zelalem', 'Chalachew', 'Alemu', 'Tesfaye', 'Bekele', 'Yilma', 'Engdawork', 'Agegnew', 'Tekel', 'Samuel',
  'Sheferaw', 'Endal', 'Jemo', 'Mesfin', 'Assegid', 'Tegegne', 'Samson', 'Debebe', 'Nigash', 'Kebede',
  'Abdursumed', 'Aemiro', 'Fisaha', 'Taddesse', 'Mesert', 'Restu', 'Anteneh', 'Getachew', 'Negassa',
  'Mekonnen', 'Tadesse', 'Abebe', 'Mekonene', 'Hailu', 'Yohnnes', 'Alehegn', 'Solomon', 'Tessema',
  'Baharu', 'Derselgn', 'Mohamed', 'Taye', 'Fikru', 'Tefera', 'Assefa', 'Girma', 'Gebre', 'Awol',
  'Mingeha', 'Ahmed', 'Tekle', 'Haile', 'Teshome', 'Mohammed', 'Wubshet', 'Yohannes', 'Alemu',
  'Yemane', 'Daniel', 'Dawd', 'Meberatu', 'Tewodrose', 'Eshetu', 'Elias', 'Desta', 'Aragaw',
  'Motuma', 'Buzayehu', 'Nicolas', 'Zegeye', 'Fisha', 'Aklilu', 'Negasa', 'Tamene', 'Yemaneh',
  'Abate', 'Abera', 'Abreha', 'Adem', 'Admasu', 'Afework', 'Ali', 'Amare', 'Amha', 'Araya',
  'Ashenafi', 'Ayalew', 'Bacha', 'Balcha', 'Belay', 'Biru', 'Chala', 'Dereje', 'Degu', 'Eshetie',
  'Gashaw', 'Gebrehiwot', 'Gebremariam', 'Gebremeskel', 'Gebreselassie', 'Geda', 'Getahun', 'Getu',
  'Gudeta', 'Gutema', 'Habte', 'Hailemariam', 'Kassa', 'Kedir', 'Kefale', 'Lemma', 'Mamo', 'Megersa',
  'Mekuria', 'Melaku', 'Mihret', 'Molla', 'Mulugeta', 'Negash', 'Negussie', 'Reta', 'Semere',
  'Seyoum', 'Shiferaw', 'Taddese', 'Tarekegn', 'Teferi', 'Teka', 'Tessema', 'Tolla', 'Tsegaye',
  'Woldemariam', 'Wolde', 'Zeleke', 'Zenebe', 'Zewde', 'Zewdu'
];

// Global set to track used names across all scripts
let globalUsedNames: Set<string>;

// Load used names from file
function loadUsedNames(): Set<string> {
  try {
    if (fs.existsSync(USED_NAMES_FILE)) {
      const data = fs.readFileSync(USED_NAMES_FILE, 'utf8');
      const names = JSON.parse(data);
      return new Set(names);
    }
  } catch (error) {
    console.warn('Warning: Could not load used names file, starting fresh:', error instanceof Error ? error.message : String(error));
  }
  return new Set<string>();
}

// Save used names to file
function saveUsedNames(usedNames: Set<string>): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(USED_NAMES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USED_NAMES_FILE, JSON.stringify([...usedNames], null, 2));
  } catch (error) {
    console.warn('Warning: Could not save used names file:', error instanceof Error ? error.message : String(error));
  }
}

// Initialize global set
globalUsedNames = loadUsedNames();

// Function to generate unique Ethiopian names
export function generateUniqueEthiopianNames(count: number): Array<{name: string, email: string}> {
  const members: Array<{name: string, email: string}> = [];

  while (members.length < count) {
    const firstName = ethiopianFirstNames[Math.floor(Math.random() * ethiopianFirstNames.length)];
    const lastName = ethiopianLastNames[Math.floor(Math.random() * ethiopianLastNames.length)];
    const fullName = `${firstName} ${lastName}`;

    // Check global uniqueness
    if (!globalUsedNames.has(fullName)) {
      globalUsedNames.add(fullName);
      saveUsedNames(globalUsedNames); // Persist to file
      const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@sterling.com`;
      members.push({
        name: fullName,
        email: emailName
      });
    }

    // Safety check - if we've tried too many combinations, break to avoid infinite loop
    if (globalUsedNames.size > ethiopianFirstNames.length * ethiopianLastNames.length * 0.8) {
      console.warn(`Warning: Generated ${globalUsedNames.size} unique names, approaching limit`);
      break;
    }
  }

  return members;
}

// Function to check if a name is already used
export function isNameUsed(name: string): boolean {
  return globalUsedNames.has(name);
}

// Function to get total unique names generated so far
export function getTotalUniqueNames(): number {
  return globalUsedNames.size;
}

// Function to reset the global name tracker (use with caution)
export function resetNameTracker(): void {
  globalUsedNames.clear();
  saveUsedNames(globalUsedNames);
}