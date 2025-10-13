/**
 * Employee data for seeding organizations with realistic employee records
 * This file provides 45+ employee records for each organization
 * Using Ethiopian names for authentic localization
 */

export interface EmployeeData {
  name: string;
  email: string;
  department?: string;
  shift?: string;
  location?: string;
}

export interface OrganizationEmployeeData {
  [organizationSlug: string]: EmployeeData[];
}

// Employee data for each organization
export const employeeData: OrganizationEmployeeData = {
  'mitchell-transport': [
    // Operations Team
    { name: 'Almaz Bekele', email: 'almaz.bekele@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Getachew Haile', email: 'getachew.haile@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Tigist Abebe', email: 'tigist.abebe@mitchell-transport.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Alemayehu Kebede', email: 'alemayehu.kebede@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Seble Tadesse', email: 'seble.tadesse@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'Tesfaye Lemma', email: 'tesfaye.lemma@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Hiwot Mekonnen', email: 'hiwot.mekonnen@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Dawit Negash', email: 'dawit.negash@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Meseret Zegeye', email: 'meseret.zegeye@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Yohannes Ayele', email: 'yohannes.ayele@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Birtukan Asefa', email: 'birtukan.asefa@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Dereje Alemu', email: 'dereje.alemu@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Genet Desta', email: 'genet.desta@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Fikru Girma', email: 'fikru.girma@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Selam Worku', email: 'selam.worku@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Operations Staff
    { name: 'Habtamu Gebre', email: 'habtamu.gebre@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Mahlet Tilahun', email: 'mahlet.tilahun@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Eyob Sisay', email: 'eyob.sisay@mitchell-transport.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Senait Solomon', email: 'senait.solomon@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Tamrat Seyoum', email: 'tamrat.seyoum@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Tsion Mulugeta', email: 'tsion.mulugeta@mitchell-transport.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Samson Kassahun', email: 'samson.kassahun@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Lakech Taddele', email: 'lakech.taddele@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Berhanu Tekle', email: 'berhanu.tekle@mitchell-transport.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Mulu Zenebe', email: 'mulu.zenebe@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Aklilu Bahiru', email: 'aklilu.bahiru@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Fantaye Berhane', email: 'fantaye.berhane@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Andargachew Birhanu', email: 'andargachew.birhanu@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Azeb Beyene', email: 'azeb.beyene@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Befekadu Bogale', email: 'befekadu.bogale@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Chaltu Chala', email: 'chaltu.chala@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Chernet Debebe', email: 'chernet.debebe@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Dinkinesh Demeke', email: 'dinkinesh.demeke@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Daniel Degu', email: 'daniel.degu@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Elfinesh Endale', email: 'elfinesh.endale@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Ephrem Fenta', email: 'ephrem.fenta@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Ejigayehu Fikre', email: 'ejigayehu.fikre@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Fasil Fisseha', email: 'fasil.fisseha@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Emebet Gashaw', email: 'emebet.gashaw@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Fekadu Getahun', email: 'fekadu.getahun@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Haregewoin Getu', email: 'haregewoin.getu@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Girum Gudeta', email: 'girum.gudeta@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Lemlem Gutu', email: 'lemlem.gutu@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Gizachew Habte', email: 'gizachew.habte@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Makda Hailemariam', email: 'makda.hailemariam@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' }
  ],

  'metro-transit': [
    // Transit Operations
    { name: 'Mamitu Hailu', email: 'mamitu.hailu@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Henok Kassa', email: 'henok.kassa@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Nigist Kedir', email: 'nigist.kedir@metro-transit.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Kinfe Kefale', email: 'kinfe.kefale@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Selamawit Lidetu', email: 'selamawit.lidetu@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'Melaku Mamo', email: 'melaku.mamo@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Tadelech Megersa', email: 'tadelech.megersa@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Meles Mekuria', email: 'meles.mekuria@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Tsehay Melesse', email: 'tsehay.melesse@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Mengistu Mesfin', email: 'mengistu.mesfin@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Worknesh Mihret', email: 'worknesh.mihret@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Mulatu Molla', email: 'mulatu.molla@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Yemiserach Mulugeta', email: 'yemiserach.mulugeta@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Nebiyou Negussie', email: 'nebiyou.negussie@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Yeshi Reta', email: 'yeshi.reta@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Transit Staff
    { name: 'Samuel Seifu', email: 'samuel.seifu@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Zenebech Semere', email: 'zenebech.semere@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Senay Shiferaw', email: 'senay.shiferaw@metro-transit.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Zewditu Taddese', email: 'zewditu.taddese@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Tewodros Tarekegn', email: 'tewodros.tarekegn@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Aberash Tefera', email: 'aberash.tefera@metro-transit.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Tewolde Teferi', email: 'tewolde.teferi@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Adanech Teka', email: 'adanech.teka@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Tekeste Tekle', email: 'tekeste.tekle@metro-transit.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Aster Tessema', email: 'aster.tessema@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Tilahun Tolla', email: 'tilahun.tolla@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Aynalem Tsegaye', email: 'aynalem.tsegaye@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Worku Woldemariam', email: 'worku.woldemariam@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Betelhem Wolde', email: 'betelhem.wolde@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Yared Yilma', email: 'yared.yilma@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Bezawit Yohannes', email: 'bezawit.yohannes@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Yonas Zeleke', email: 'yonas.zeleke@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Bisrat Zenebe', email: 'bisrat.zenebe@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Yoseph Zewde', email: 'yoseph.zewde@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Derartu Zewdu', email: 'derartu.zewdu@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Zelalem Abate', email: 'zelalem.abate@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Etenesh Abera', email: 'etenesh.abera@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Aschalew Abreha', email: 'aschalew.abreha@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Eyerusalem Adem', email: 'eyerusalem.adem@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Behailu Admasu', email: 'behailu.admasu@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Frehiwot Afework', email: 'frehiwot.afework@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Birhanu Ali', email: 'birhanu.ali@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Gelila Amare', email: 'gelila.amare@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Dagim Amha', email: 'dagim.amha@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Haben Aragaw', email: 'haben.aragaw@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' }
  ],

    'garcia-freight': [
    // Freight Operations
    { name: 'Haymanot Araya', email: 'haymanot.araya@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Ermias Ashenafi', email: 'ermias.ashenafi@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Helen Assefa', email: 'helen.assefa@garcia-freight.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Esubalew Ayalew', email: 'esubalew.ayalew@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Hirut Bacha', email: 'hirut.bacha@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'Demeke Balcha', email: 'demeke.balcha@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Kidist Belay', email: 'kidist.belay@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Deneke Berhanu', email: 'deneke.berhanu@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Liya Biru', email: 'liya.biru@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Gosa Chala', email: 'gosa.chala@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Mahder Debebe', email: 'mahder.debebe@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Kenenisa Dereje', email: 'kenenisa.dereje@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Meaza Degu', email: 'meaza.degu@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Lidetu Eshetie', email: 'lidetu.eshetie@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Mekdes Gashaw', email: 'mekdes.gashaw@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Freight Staff
    { name: 'Mesfin Gebrehiwot', email: 'mesfin.gebrehiwot@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Meron Gebre', email: 'meron.gebre@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Mulatu Gebremariam', email: 'mulatu.gebremariam@garcia-freight.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Mesirak Gebremeskel', email: 'mesirak.gebremeskel@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Seifu Gebreselassie', email: 'seifu.gebreselassie@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Mimi Geda', email: 'mimi.geda@garcia-freight.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Semere Getachew', email: 'semere.getachew@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Misrak Getahun', email: 'misrak.getahun@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Sisay Getu', email: 'sisay.getu@garcia-freight.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Muluwork Habte', email: 'muluwork.habte@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Solomon Hailemariam', email: 'solomon.hailemariam@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Nardos Hailu', email: 'nardos.hailu@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Taddele Kassa', email: 'taddele.kassa@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Rahel Kedir', email: 'rahel.kedir@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Tamrat Kefale', email: 'tamrat.kefale@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Ruth Lemma', email: 'ruth.lemma@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Tekle Mamo', email: 'tekle.mamo@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Sara Megersa', email: 'sara.megersa@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Tesfaye Mekuria', email: 'tesfaye.mekuria@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Selamawit Melaku', email: 'selamawit.melaku@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Tilahun Mengistu', email: 'tilahun.mengistu@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Senafikish Mesfin', email: 'senafikish.mesfin@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Tsegaye Mihret', email: 'tsegaye.mihret@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Serawit Molla', email: 'serawit.molla@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Worku Negash', email: 'worku.negash@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Sosina Negussie', email: 'sosina.negussie@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Yared Reta', email: 'yared.reta@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Tena Seifu', email: 'tena.seifu@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Yeshitila Semere', email: 'yeshitila.semere@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Tenanesh Seyoum', email: 'tenanesh.seyoum@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' }
  ],

  'johnson-delivery': [
    // Delivery Operations
    { name: 'Tewabech Shiferaw', email: 'tewabech.shiferaw@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Addisu Tadesse', email: 'addisu.tadesse@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Tirunesh Tarekegn', email: 'tirunesh.tarekegn@johnson-delivery.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Alemu Tefera', email: 'alemu.tefera@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Weini Teferi', email: 'weini.teferi@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'Asefa Teka', email: 'asefa.teka@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Winta Tekeste', email: 'winta.tekeste@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Ayele Tessema', email: 'ayele.tessema@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Wubalem Tolla', email: 'wubalem.tolla@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Desta Tsegaye', email: 'desta.tsegaye@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Yeshimebet Woldemariam', email: 'yeshimebet.woldemariam@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Gebre Wolde', email: 'gebre.wolde@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Yordanos Yilma', email: 'yordanos.yilma@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Girma Yohannes', email: 'girma.yohannes@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Zainab Zeleke', email: 'zainab.zeleke@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Delivery Staff
    { name: 'Henok Zenebe', email: 'henok.zenebe@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Zewdie Zewde', email: 'zewdie.zewde@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Kinfe Zewdu', email: 'kinfe.zewdu@johnson-delivery.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Sofia Abate', email: 'sofia.abate@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Lemma Abera', email: 'lemma.abera@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Elfinesh Abreha', email: 'elfinesh.abreha@johnson-delivery.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Mekonnen Adem', email: 'mekonnen.adem@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Ejigayehu Admasu', email: 'ejigayehu.admasu@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Negash Afework', email: 'negash.afework@johnson-delivery.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Emebet Ali', email: 'emebet.ali@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Zegeye Amare', email: 'zegeye.amare@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Fantaye Amha', email: 'fantaye.amha@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Yohannes Aragaw', email: 'yohannes.aragaw@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Asnakech Araya', email: 'asnakech.araya@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Tadesse Asefa', email: 'tadesse.asefa@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Chaltu Ashenafi', email: 'chaltu.ashenafi@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Tesfaye Assefa', email: 'tesfaye.assefa@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Dinkinesh Ayalew', email: 'dinkinesh.ayalew@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Bekele Bacha', email: 'bekele.bacha@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Genet Bahiru', email: 'genet.bahiru@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Haile Balcha', email: 'haile.balcha@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Hiwot Belay', email: 'hiwot.belay@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Kebede Berhane', email: 'kebede.berhane@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Lakech Berhanu', email: 'lakech.berhanu@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Dawit Beyene', email: 'dawit.beyene@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Mahlet Birhane', email: 'mahlet.birhane@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Dereje Biru', email: 'dereje.biru@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Meseret Bogale', email: 'meseret.bogale@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Eyob Chala', email: 'eyob.chala@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Mulu Debebe', email: 'mulu.debebe@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' }
  ],

  'sterling-logistics': [
    // Logistics Operations
    { name: 'Fikru Demeke', email: 'fikru.demeke@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Nigist Deneke', email: 'nigist.deneke@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Samson Dereje', email: 'samson.dereje@sterling-logistics.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Seble Degu', email: 'seble.degu@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Senait Endale', email: 'senait.endale@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'Seyoum Eshetie', email: 'seyoum.eshetie@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Selam Fenta', email: 'selam.fenta@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Sisay Fikre', email: 'sisay.fikre@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Sofia Fisseha', email: 'sofia.fisseha@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Solomon Gashaw', email: 'solomon.gashaw@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Tadelech Gebrehiwot', email: 'tadelech.gebrehiwot@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Taddele Gebre', email: 'taddele.gebre@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Tigist Gebremariam', email: 'tigist.gebremariam@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Tamrat Gebremeskel', email: 'tamrat.gebremeskel@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Tsehay Gebreselassie', email: 'tsehay.gebreselassie@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Logistics Staff
    { name: 'Tekle Geda', email: 'tekle.geda@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Tsion Getachew', email: 'tsion.getachew@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Tesfaye Getahun', email: 'tesfaye.getahun@sterling-logistics.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Worknesh Getu', email: 'worknesh.getu@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Yared Girma', email: 'yared.girma@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Yemiserach Gudeta', email: 'yemiserach.gudeta@sterling-logistics.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Yeshi Gutu', email: 'yeshi.gutu@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Yohannes Habte', email: 'yohannes.habte@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Zenebech Hailemariam', email: 'zenebech.hailemariam@sterling-logistics.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Zewditu Hailu', email: 'zewditu.hailu@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Abebe Kassa', email: 'abebe.kassa@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Aberash Kedir', email: 'aberash.kedir@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Addisu Kefale', email: 'addisu.kefale@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Adanech Lemma', email: 'adanech.lemma@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Alemayehu Mamo', email: 'alemayehu.mamo@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Almaz Megersa', email: 'almaz.megersa@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Andargachew Mekuria', email: 'andargachew.mekuria@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Aschalew Melaku', email: 'aschalew.melaku@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Asnakech Meles', email: 'asnakech.meles@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Aster Mengistu', email: 'aster.mengistu@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Ayele Mesfin', email: 'ayele.mesfin@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Aynalem Mihret', email: 'aynalem.mihret@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Azeb Molla', email: 'azeb.molla@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Bahiru Mulatu', email: 'bahiru.mulatu@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Befekadu Negash', email: 'befekadu.negash@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Behailu Negussie', email: 'behailu.negussie@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Bekele Reta', email: 'bekele.reta@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Berhane Seifu', email: 'berhane.seifu@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Berhanu Semere', email: 'berhanu.semere@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Betelhem Senay', email: 'betelhem.senay@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' }
  ]
};

/**
 * Function to create additional employees for an organization
 * This function should be called after the basic seed data is created
 */
export async function createAdditionalEmployees(organizationId: string, prisma: any, auth: any) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true, name: true }
  });

  if (!org || !employeeData[org.slug]) {
    console.log(`No additional employee data found for organization: ${org?.name || organizationId}`);
    return 0;
  }

  const employeesToCreate = employeeData[org.slug];
  console.log(`Creating ${employeesToCreate.length} additional employees for ${org.name}...`);

  // Get existing departments, shifts, and HQ location
  const departments = await prisma.department.findMany({
    where: { organizationId },
    select: { id: true, name: true }
  });

  const shifts = await prisma.shift.findMany({
    where: { organizationId },
    select: { id: true, name: true }
  });

  const hqLocation = await prisma.location.findFirst({
    where: {
      organizationId,
      type: 'HQ'
    },
    select: { id: true, address: true }
  });

  if (departments.length === 0 || shifts.length === 0) {
    console.log(`❌ Missing departments or shifts for ${org.name}`);
    return 0;
  }

  if (!hqLocation) {
    console.log(`❌ Missing HQ location for ${org.name}`);
    return 0;
  }

  const departmentMap = new Map(departments.map((d: any) => [d.name, d.id]));
  const shiftMap = new Map(shifts.map((s: any) => [s.name, s.id]));

  let createdCount = 0;

  for (const empData of employeesToCreate) {
    try {
      // Check if employee already exists
      const existingEmp = await prisma.employee.findFirst({
        where: {
          name: empData.name,
          organizationId
        }
      });

      if (existingEmp) {
        console.log(`⚠️  Employee ${empData.name} already exists`);
        continue;
      }

      // Get department and shift IDs
      const departmentId = empData.department ? departmentMap.get(empData.department) : departments[0].id;
      const shiftId = empData.shift ? shiftMap.get(empData.shift) : shifts[0].id;

      if (!departmentId || !shiftId) {
        console.log(`❌ Missing department or shift mapping for ${empData.name}`);
        continue;
      }

      // Create user account first
      let userData;
      let userCreated = false;

      try {
        userData = await auth.api.signUpEmail({
          body: {
            name: empData.name,
            email: empData.email,
            password: 'Employee123!',
          },
        });
        console.log(`✅ Created user: ${empData.name} (${empData.email})`);
        userCreated = true;
      } catch (error: any) {
        if (error.body?.code === 'USER_ALREADY_EXISTS') {
          console.log(`⚠️  User ${empData.email} already exists, fetching...`);
          const existingUser = await prisma.user.findUnique({
            where: { email: empData.email }
          });

          if (!existingUser) {
            console.log(`❌ Could not find user ${empData.email}, skipping...`);
            continue;
          }

          userData = { user: existingUser };
        } else {
          console.log(`❌ Failed to create user ${empData.name}: ${error.message}`);
          continue;
        }
      }

      // Verify user exists before proceeding
      const userExists = await prisma.user.findUnique({
        where: { id: userData.user.id }
      });

      if (!userExists) {
        console.log(`❌ User verification failed for ${empData.name}, skipping...`);
        continue;
      }

      // Add as member to organization via Better Auth
      let memberAdded = false;
      try {
        await auth.api.addMember({
          body: {
            organizationId,
            userId: userData.user.id,
            role: 'employee' as const,
          },
        });
        console.log(`   ➕ Added to organization as employee`);
        memberAdded = true;
      } catch (error: any) {
        if (error.body?.code === 'MEMBER_ALREADY_EXISTS' || error.message?.includes('already exists')) {
          console.log(`   ⚠️  Already a member of organization`);
          memberAdded = true;
        } else {
          console.log(`   ❌ Could not add to org: ${error.message}, skipping...`);
          continue;
        }
      }

      // Verify member was created
      if (memberAdded) {
        const memberExists = await prisma.member.findFirst({
          where: {
            userId: userData.user.id,
            organizationId
          }
        });

        if (!memberExists) {
          console.log(`   ❌ Member verification failed for ${empData.name}, skipping...`);
          continue;
        }
      }

      // Create employee record (only if user and member exist)
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          userId: userData.user.id,
          organizationId
        }
      });

      if (existingEmployee) {
        console.log(`   ⚠️  Employee record already exists`);
        continue;
      }

      // Create employee record with proper location
      await prisma.employee.create({
        data: {
          name: empData.name,
          location: hqLocation.address,
          locationId: hqLocation.id,
          organizationId,
          departmentId,
          shiftId,
          userId: userData.user.id
        }
      });

      createdCount++;
      console.log(`✅ Created employee: ${empData.name}`);

    } catch (error: any) {
      console.log(`❌ Failed to create employee ${empData.name}: ${error.message}`);
    }
  }

  console.log(`✅ Created ${createdCount} additional employees for ${org.name}`);
  return createdCount;
}