/**
 * Ethiopian names for realistic seed data
 * Over 100 unique Ethiopian names to ensure very low duplication
 */

export const ethiopianFirstNames = {
  male: [
    'Abebe', 'Alemayehu', 'Bekele', 'Desta', 'Getachew', 'Haile', 'Kebede', 'Lemma', 
    'Mekonnen', 'Negash', 'Tadesse', 'Tesfaye', 'Yohannes', 'Zegeye', 'Addisu', 
    'Alemu', 'Asefa', 'Ayele', 'Dawit', 'Dereje', 'Ephrem', 'Eyob', 'Fikru', 
    'Gebre', 'Girma', 'Habtamu', 'Henok', 'Kassahun', 'Kinfe', 'Mulugeta', 
    'Samson', 'Seyoum', 'Sisay', 'Solomon', 'Taddele', 'Tamrat', 'Tekle', 
    'Tesfaye', 'Tilahun', 'Worku', 'Yared', 'Yeshitila', 'Zelalem', 'Zenebe',
    'Aklilu', 'Andargachew', 'Aschalew', 'Bahiru', 'Befekadu', 'Behailu', 
    'Berhanu', 'Birhanu', 'Chernet', 'Dagim', 'Daniel', 'Demeke', 'Deneke', 
    'Ermias', 'Esubalew', 'Fasil', 'Fekadu', 'Genet', 'Getahun', 'Girum',
    'Gizachew', 'Gosa', 'Habte', 'Hailemariam', 'Hailu', 'Kassa', 'Lidetu',
    'Mekuria', 'Melaku', 'Meles', 'Mengistu', 'Mesfin', 'Mihret', 'Mulatu',
    'Nebiyou', 'Samuel', 'Seifu', 'Semere', 'Senay', 'Tewodros', 'Tewolde',
    'Tsegaye', 'Wondimu', 'Wondwossen', 'Yared', 'Yonas', 'Yoseph', 'Zeleke'
  ],
  female: [
    'Almaz', 'Asnakech', 'Azeb', 'Birtukan', 'Chaltu', 'Dinkinesh', 'Elfinesh', 
    'Ejigayehu', 'Emebet', 'Fantaye', 'Genet', 'Haregewoin', 'Hiwot', 'Lakech', 
    'Lemlem', 'Mahlet', 'Makda', 'Mamitu', 'Meseret', 'Mulu', 'Nigist', 
    'Seble', 'Selam', 'Senait', 'Sofia', 'Tadelech', 'Tigist', 'Tsehay', 
    'Tsion', 'Worknesh', 'Yemiserach', 'Yeshi', 'Zenebech', 'Zewditu',
    'Aberash', 'Adanech', 'Aster', 'Aynalem', 'Betelhem', 'Bezawit', 
    'Bisrat', 'Derartu', 'Etenesh', 'Eyerusalem', 'Frehiwot', 'Gelila', 
    'Haben', 'Haymanot', 'Helen', 'Hirut', 'Kidist', 'Liya', 'Mahder',
    'Mekdes', 'Meaza', 'Meron', 'Mesirak', 'Mimi', 'Misrak', 'Muluwork',
    'Nardos', 'Rahel', 'Ruth', 'Sara', 'Selamawit', 'Senafikish', 'Serawit',
    'Sosina', 'Tena', 'Tenanesh', 'Tewabech', 'Tirunesh', 'Weini', 'Winta',
    'Wubalem', 'Yeshimebet', 'Yordanos', 'Zainab', 'Zewdie'
  ]
};

export const ethiopianLastNames = [
  'Abate', 'Abebe', 'Abera', 'Abreha', 'Adem', 'Admasu', 'Afework', 'Alemu',
  'Ali', 'Amare', 'Amha', 'Aragaw', 'Araya', 'Asefa', 'Ashenafi', 'Assefa',
  'Ayalew', 'Ayele', 'Bacha', 'Bahiru', 'Balcha', 'Bekele', 'Belay', 'Berhane',
  'Berhanu', 'Beyene', 'Birhane', 'Biru', 'Bogale', 'Chala', 'Debebe', 'Demeke',
  'Dereje', 'Degu', 'Desta', 'Endale', 'Eshetie', 'Fenta', 'Fikre', 'Fisseha',
  'G/Selassie', 'Gashaw', 'Gebrehiwot', 'Gebre', 'Gebremariam', 'Gebremeskel', 
  'Gebreselassie', 'Geda', 'Getachew', 'Getahun', 'Getu', 'Girma', 'Gudeta',
  'Gutu', 'Habte', 'Haile', 'Hailemariam', 'Hailu', 'Kebede', 'Kedir', 'Kefale',
  'Kenenisa', 'Lemma', 'Mamo', 'Megersa', 'Mekonnen', 'Melaku', 'Mengesha', 
  'Mergia', 'Mesele', 'Mesfin', 'Molla', 'Mulatu', 'Negash', 'Negussie', 'Reta',
  'Seifu', 'Seyoum', 'Shiferaw', 'Sisay', 'Tadesse', 'Tarekegn', 'Tekle', 
  'Tefera', 'Teferi', 'Teka', 'Tekeste', 'Tesfaye', 'Tessema', 'Tilahun',
  'Tolla', 'Tsegaye', 'Woldemariam', 'Wolde', 'Worku', 'Yilma', 'Yohannes',
  'Zeleke', 'Zenebe', 'Zewde', 'Zewdu'
];

/**
 * Generate a random Ethiopian full name
 */
export function generateEthiopianName(): { fullName: string; firstName: string; lastName: string } {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstName = ethiopianFirstNames[gender][Math.floor(Math.random() * ethiopianFirstNames[gender].length)];
  const lastName = ethiopianLastNames[Math.floor(Math.random() * ethiopianLastNames.length)];
  return {
    fullName: `${firstName} ${lastName}`,
    firstName,
    lastName
  };
}

/**
 * Generate multiple unique Ethiopian names
 */
export function generateUniqueEthiopianNames(count: number): Array<{ fullName: string; firstName: string; lastName: string; email: string }> {
  const names = new Set<string>();
  const result: Array<{ fullName: string; firstName: string; lastName: string; email: string }> = [];
  
  let attempts = 0;
  const maxAttempts = count * 10; // Prevent infinite loop
  
  while (names.size < count && attempts < maxAttempts) {
    const { fullName, firstName, lastName } = generateEthiopianName();
    
    if (!names.has(fullName)) {
      names.add(fullName);
      result.push({
        fullName,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`
      });
    }
    attempts++;
  }
  
  return result;
}
