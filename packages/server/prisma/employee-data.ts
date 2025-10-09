/**
 * Employee data for seeding organizations with realistic employee records
 * This file provides 45+ employee records for each organization
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
    { name: 'Sarah Johnson', email: 'sarah.johnson@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Michael Chen', email: 'michael.chen@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Emily Rodriguez', email: 'emily.rodriguez@mitchell-transport.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'David Kim', email: 'david.kim@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Lisa Thompson', email: 'lisa.thompson@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'Robert Garcia', email: 'robert.garcia@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Jennifer Lee', email: 'jennifer.lee@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'James Wilson', email: 'james.wilson@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Maria Martinez', email: 'maria.martinez@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Christopher Brown', email: 'christopher.brown@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Amanda Davis', email: 'amanda.davis@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Daniel Miller', email: 'daniel.miller@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Jessica Taylor', email: 'jessica.taylor@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Kevin Anderson', email: 'kevin.anderson@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Rachel White', email: 'rachel.white@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Operations Staff
    { name: 'Steven Harris', email: 'steven.harris@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Michelle Clark', email: 'michelle.clark@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Brian Lewis', email: 'brian.lewis@mitchell-transport.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Stephanie Walker', email: 'stephanie.walker@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Timothy Hall', email: 'timothy.hall@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Nicole Young', email: 'nicole.young@mitchell-transport.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Justin King', email: 'justin.king@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Heather Wright', email: 'heather.wright@mitchell-transport.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Brandon Lopez', email: 'brandon.lopez@mitchell-transport.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Megan Hill', email: 'megan.hill@mitchell-transport.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Alexander Green', email: 'alexander.green@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Olivia Adams', email: 'olivia.adams@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Ethan Baker', email: 'ethan.baker@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Sophia Gonzalez', email: 'sophia.gonzalez@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Mason Nelson', email: 'mason.nelson@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Ava Carter', email: 'ava.carter@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Jackson Mitchell', email: 'jackson.mitchell@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Isabella Perez', email: 'isabella.perez@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Lucas Roberts', email: 'lucas.roberts@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Charlotte Turner', email: 'charlotte.turner@mitchell-transport.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Aiden Phillips', email: 'aiden.phillips@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Harper Campbell', email: 'harper.campbell@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Elijah Parker', email: 'elijah.parker@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Aria Evans', email: 'aria.evans@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Logan Edwards', email: 'logan.edwards@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Abigail Collins', email: 'abigail.collins@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Caleb Stewart', email: 'caleb.stewart@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Ella Sanchez', email: 'ella.sanchez@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Carter Morris', email: 'carter.morris@mitchell-transport.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Scarlett Rogers', email: 'scarlett.rogers@mitchell-transport.com', department: 'Administration', shift: 'Afternoon Shift' }
  ],

  'metro-transit': [
    // Transit Operations
    { name: 'Victoria Patel', email: 'victoria.patel@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Ryan Murphy', email: 'ryan.murphy@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Hannah Rivera', email: 'hannah.rivera@metro-transit.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Tyler Cooper', email: 'tyler.cooper@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Madison Reed', email: 'madison.reed@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'Nathan Bailey', email: 'nathan.bailey@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Grace Kelly', email: 'grace.kelly@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Dylan Howard', email: 'dylan.howard@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Zoe Ramirez', email: 'zoe.ramirez@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Luke James', email: 'luke.james@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Savannah Bennett', email: 'savannah.bennett@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Cameron Brooks', email: 'cameron.brooks@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Natalie Sanders', email: 'natalie.sanders@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Owen Price', email: 'owen.price@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Brooklyn Barnes', email: 'brooklyn.barnes@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Transit Staff
    { name: 'Levi Ross', email: 'levi.ross@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Zoey Henderson', email: 'zoey.henderson@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Julian Coleman', email: 'julian.coleman@metro-transit.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Layla Jenkins', email: 'layla.jenkins@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Grayson Perry', email: 'grayson.perry@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Penelope Powell', email: 'penelope.powell@metro-transit.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Wyatt Long', email: 'wyatt.long@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Nora Patterson', email: 'nora.patterson@metro-transit.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Gabriel Hughes', email: 'gabriel.hughes@metro-transit.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Riley Flores', email: 'riley.flores@metro-transit.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Lincoln Butler', email: 'lincoln.butler@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Madelyn Simmons', email: 'madelyn.simmons@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Mateo Foster', email: 'mateo.foster@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Maya Gonzales', email: 'maya.gonzales@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Asher Bryant', email: 'asher.bryant@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Ruby Russell', email: 'ruby.russell@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Kai Griffin', email: 'kai.griffin@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Lillian Diaz', email: 'lillian.diaz@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Jayden Hayes', email: 'jayden.hayes@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Melody Myers', email: 'melody.myers@metro-transit.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Ezekiel Ford', email: 'ezekiel.ford@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Aurora Hamilton', email: 'aurora.hamilton@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Jack Harrison', email: 'jack.harrison@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Nova Stone', email: 'nova.stone@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Luca Gibson', email: 'luca.gibson@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Stella Wood', email: 'stella.wood@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Hudson Warren', email: 'hudson.warren@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Violet Fox', email: 'violet.fox@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Theodore Riley', email: 'theodore.riley@metro-transit.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Hazel Armstrong', email: 'hazel.armstrong@metro-transit.com', department: 'Administration', shift: 'Afternoon Shift' }
  ],

  'garcia-freight': [
    // Freight Operations
    { name: 'Julia Washington', email: 'julia.washington@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Xavier Peterson', email: 'xavier.peterson@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Kennedy Butler', email: 'kennedy.butler@garcia-freight.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Ian Simmons', email: 'ian.simmons@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Samantha Foster', email: 'samantha.foster@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'Ryder Powell', email: 'ryder.powell@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Valentina Jenkins', email: 'valentina.jenkins@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Jaxson Perry', email: 'jaxson.perry@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Everly Russell', email: 'everly.russell@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Greyson Long', email: 'greyson.long@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Emilia Patterson', email: 'emilia.patterson@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Rowan Hughes', email: 'rowan.hughes@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Isla Flores', email: 'isla.flores@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Kai Butler', email: 'kai.butler@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Elena Simmons', email: 'elena.simmons@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Freight Staff
    { name: 'Sawyer Foster', email: 'sawyer.foster@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Delilah Gonzales', email: 'delilah.gonzales@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Hunter Bryant', email: 'hunter.bryant@garcia-freight.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Madeline Russell', email: 'madeline.russell@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Easton Griffin', email: 'easton.griffin@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Claire Diaz', email: 'claire.diaz@garcia-freight.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Luca Hayes', email: 'luca.hayes@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Lila Myers', email: 'lila.myers@garcia-freight.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Parker Ford', email: 'parker.ford@garcia-freight.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Bella Hamilton', email: 'bella.hamilton@garcia-freight.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Nolan Graham', email: 'nolan.graham@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Millie Sullivan', email: 'millie.sullivan@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Roman Elliott', email: 'roman.elliott@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Sadie Hayes', email: 'sadie.hayes@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Kai Castillo', email: 'kai.castillo@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Margaret Fisher', email: 'margaret.fisher@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Cole Reynolds', email: 'cole.reynolds@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Faith Fuller', email: 'faith.fuller@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Silas Lawson', email: 'silas.lawson@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Rose Palmer', email: 'rose.palmer@garcia-freight.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Wyatt Wallace', email: 'wyatt.wallace@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Alice Sparks', email: 'alice.sparks@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Leo Bowman', email: 'leo.bowman@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Ivy Holland', email: 'ivy.holland@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Jasper McCoy', email: 'jasper.mccoy@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Jade Briggs', email: 'jade.briggs@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Ryker Steele', email: 'ryker.steele@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Melanie Bates', email: 'melanie.bates@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Dean Huff', email: 'dean.huff@garcia-freight.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Lola Singleton', email: 'lola.singleton@garcia-freight.com', department: 'Administration', shift: 'Afternoon Shift' }
  ],

  'johnson-delivery': [
    // Delivery Operations
    { name: 'Nova Jensen', email: 'nova.jensen@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Everett Carlson', email: 'everett.carlson@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Genesis Hart', email: 'genesis.hart@johnson-delivery.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Emmett Cunningham', email: 'emmett.cunningham@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Iris Barnett', email: 'iris.barnett@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'August Bradley', email: 'august.bradley@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Athena Byrd', email: 'athena.byrd@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Waylon Caldwell', email: 'waylon.caldwell@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Juniper Rios', email: 'juniper.rios@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Kaiya Valdez', email: 'kaiya.valdez@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Legend Hogan', email: 'legend.hogan@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Serenity Salinas', email: 'serenity.salinas@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Braxton Yang', email: 'braxton.yang@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Amaya Wolf', email: 'amaya.wolf@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Mylo McDaniel', email: 'mylo.mcdaniel@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Delivery Staff
    { name: 'Kinsley Hester', email: 'kinsley.hester@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Finley McConnell', email: 'finley.mcconnell@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Palmer Acevedo', email: 'palmer.acevedo@johnson-delivery.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Callie Landry', email: 'callie.landry@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Legacy Durham', email: 'legacy.durham@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Ocean Villegas', email: 'ocean.villegas@johnson-delivery.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Tatum Hurst', email: 'tatum.hurst@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Amirah Orozco', email: 'amirah.orozco@johnson-delivery.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Kamdyn McKee', email: 'kamdyn.mckee@johnson-delivery.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Ayleen Roach', email: 'ayleen.roach@johnson-delivery.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Colter Frost', email: 'colter.frost@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Karter Howe', email: 'karter.howe@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Novah McCarty', email: 'novah.mccarty@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Ensley Hurley', email: 'ensley.hurley@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Remy Whitney', email: 'remy.whitney@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Kallie McKenzie', email: 'kallie.mckenzie@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Boone Oneill', email: 'boone.oneill@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Kori Roach', email: 'kori.roach@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Caspian Estes', email: 'caspian.estes@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Meadow McLaughlin', email: 'meadow.mclaughlin@johnson-delivery.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Ridge Avery', email: 'ridge.avery@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Lennon Pittman', email: 'lennon.pittman@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Oakleigh McCullough', email: 'oakleigh.mccullough@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Crosby McMahon', email: 'crosby.mcmahon@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Harlow Coffey', email: 'harlow.coffey@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Remy McKenzie', email: 'remy.mckenzie@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Denver McLaughlin', email: 'denver.mclaughlin@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Oakley Estes', email: 'oakley.estes@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Marley Avery', email: 'marley.avery@johnson-delivery.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Rowen Pittman', email: 'rowen.pittman@johnson-delivery.com', department: 'Administration', shift: 'Afternoon Shift' }
  ],

  'sterling-logistics': [
    // Logistics Operations
    { name: 'Raelynn McDonald', email: 'raelynn.mcdonald@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Zayn French', email: 'zayn.french@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Alaiya Church', email: 'alaiya.church@sterling-logistics.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Rohan Pope', email: 'rohan.pope@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Tori McMillan', email: 'tori.mcmillan@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },

    // Maintenance Team
    { name: 'Jaxen McIntyre', email: 'jaxen.mcintyre@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Aubrielle McBride', email: 'aubrielle.mcbride@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Ronan McCall', email: 'ronan.mccall@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Kiera McLaughlin', email: 'kiera.mclaughlin@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Kaison McKenzie', email: 'kaison.mckenzie@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },

    // Administration
    { name: 'Averi McConnell', email: 'averi.mcconnell@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Rudy McCoy', email: 'rudy.mccoy@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Kynlee McCullough', email: 'kynlee.mccullough@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Memphis McDaniel', email: 'memphis.mcdaniel@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Novalee McDonald', email: 'novalee.mcdonald@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },

    // Additional Logistics Staff
    { name: 'Koa McDowell', email: 'koa.mcdowell@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Layne McGee', email: 'layne.mcgee@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Rio McGuire', email: 'rio.mcguire@sterling-logistics.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Sloan McHale', email: 'sloan.mchale@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Tate McIntosh', email: 'tate.mcintosh@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Wren McKee', email: 'wren.mckee@sterling-logistics.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Zara McKinley', email: 'zara.mckinley@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },
    { name: 'Beck McKnight', email: 'beck.mcknight@sterling-logistics.com', department: 'Fleet Operations', shift: 'Afternoon Shift' },
    { name: 'Dakota McLean', email: 'dakota.mclean@sterling-logistics.com', department: 'Fleet Operations', shift: 'Night Shift' },
    { name: 'Ellis McLeod', email: 'ellis.mcleod@sterling-logistics.com', department: 'Fleet Operations', shift: 'Morning Shift' },

    // Additional Maintenance Staff
    { name: 'Finnegan McMahon', email: 'finnegan.mcmahon@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Galilea McMillan', email: 'galilea.mcmillan@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Hendrix McNamara', email: 'hendrix.mcnamara@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Indigo McNeil', email: 'indigo.mcneil@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Jream McPherson', email: 'jream.mcpherson@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Kalliope McQueen', email: 'kalliope.mcqueen@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Legacy McRae', email: 'legacy.mcrae@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },
    { name: 'Meadow McReynolds', email: 'meadow.mcreynolds@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Afternoon Shift' },
    { name: 'Nolan McRobbie', email: 'nolan.mcrobbie@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Night Shift' },
    { name: 'Oaklee McShane', email: 'oaklee.mcshane@sterling-logistics.com', department: 'Vehicle Maintenance', shift: 'Morning Shift' },

    // Additional Admin Staff
    { name: 'Palmer McWilliams', email: 'palmer.mcwilliams@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Quinn McAllister', email: 'quinn.mcallister@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Reign McArthur', email: 'reign.mcarthur@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Sage McBride', email: 'sage.mcbride@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Talon McCaffrey', email: 'talon.mccaffrey@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Unity McCall', email: 'unity.mccall@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Vesper McCann', email: 'vesper.mccann@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Willow McCarthy', email: 'willow.mccarthy@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' },
    { name: 'Xander McCarty', email: 'xander.mccarty@sterling-logistics.com', department: 'Administration', shift: 'Morning Shift' },
    { name: 'Yara McCauley', email: 'yara.mccauley@sterling-logistics.com', department: 'Administration', shift: 'Afternoon Shift' }
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