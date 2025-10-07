import { PrismaClient } from '@prisma/client';
import { auth } from '../lib/auth';

const prisma = new PrismaClient();

// Ethiopian employee names from old seed.ts
const employeeNames = [
  // Creative Department
  'Mahlet Zelalem', 'Samuel Chalachew', 'Betelhem Alemu', 'Yared Tesfaye', 'Hana Bekele',
  
  // Cvent-Addis
  'Mariyamwork Yilma', 'Hermella Engdawork', 'Mahader Agegnew', 'Robel Alemu', 'Selam Haftu',
  'Obsinuf Tekel', 'Yosef Samuel', 'Samuel Sheferaw', 'Alazar Endal', 'Elda Jemo',
  'Natnael Mesfin', 'Dawit Assegid', 'Meiraf Tegegne', 'Rediet Samson', 'Tiobsta Debebe',
  'Aman Nigash', 'Raey Kebede', 'Anuar Abdursumed', 'Brook Solomon', 'Zerufael Aemiro',
  'Abezer Fisaha', 'Bethelhem Taddesse', 'Feven Tsgaye', 'Tinu Mesert', 'Emebet Sheferaw',
  'Mekdes Solomon', 'Mahelet Restu', 'Surafel Kebede', 'Solan Anteneh', 'Nardose Getachew',
  
  // Recruitment-Support
  'Elias Negassa', 'Kidus Mekonnen', 'Rahel Tadesse', 'Biruk Alemu', 'Meskerem Abebe',
  
  // OPS-Support
  'Nuhome Mekonene', 'Ruth Hailu', 'Etsube Yohnnes', 'Tarikua G/kidan', 'Betslot Alehegn',
  'Mikedes Solomon', 'Konjet Alemu', 'Yohannes Bekele', 'Hirut Tessema', 'Beza Kebede',
  
  // IT-Support
  'Samuel Baharu', 'Kirubeal Derselgn', 'Veronica Mohamed', 'Abayeneh Taye', 'Eden Fikru',
  'Kaleb Tefera', 'Meron Assefa', 'Natan Girma', 'Seble Tadesse', 'Tesfaye Gebre',
  
  // HR-Support
  'Mohamed Awol', 'Simert Mingeha', 'Helian Taye', 'Sofia Ahmed', 'Yenenesh Tekle',
  'Zelalem Haile', 'Abel Mekonnen', 'Dagmawi Teshome', 'Fetiya Mohammed', 'Lidya Kebede',
  
  // Data Entry
  'Behata Wubshet', 'Melat Tadesse', 'Nebiyat Solomon', 'Samrawit Yohannes', 'Tsegaye Alemu',
  
  // BDR
  'Bethel Yemane', 'Anania G/tsion', 'Sarah Daniel', 'Helen Dawd', 'Liza Meberatu',
  'Alazar Tewodrose', 'Tsion Eshetu', 'Yersema Elias', 'Nigist Desta', 'Tewodros Hailu',
  
  // Internova
  'Henock Getachew', 'Meron Aragaw', 'Mekonene Assefa', 'Sydine Motuma', 'Kendey Buzayehu',
  'Yonass Assefa', 'Amanuel Tadesse', 'Betelhem Tekle', 'Dawit Mengistu', 'Elsabet Girma',
  
  // Trade Surveillance
  'Zekariyas Nicolas', 'Raey Zegeye', 'Yeabsera Solomon', 'Fiker Abebe', 'Girum Tesfaye',
  'Hanna Mengistu', 'Kebede Solomon', 'Lemlem Teshome', 'Martha Alemu', 'Nahom Bekele',
  
  // Altour
  'Luel Mesfin', 'Ezera Fisha', 'Melecot Getachew', 'Abebe Solomon', 'Aster Girma',
  'Behailu Tekle', 'Daniel Yohannes', 'Eleni Assefa', 'Fasil Kebede', 'Genet Haile',
  
  // SDR-CTS
  'Betlhem Zewdu', 'Eyerusalem Aklilu', 'Lily Negasa', 'Zemach Tamene', 'Eyerusalem Yemaneh',
  'Habtamu Bekele', 'Isaiah Tesfaye', 'Jerusalem Alemu', 'Kidist Solomon', 'Leul Mengistu'
];

async function addEmployeesFromOldSeed() {
  console.log('🏢 Adding employees from old seed.ts to Sterling Logistics...\n');

  try {
    const org = await prisma.organization.findFirst({
      where: { slug: 'sterling-logistics' }
    });

    if (!org) {
      throw new Error('Sterling Logistics Solutions not found');
    }

    console.log(`✅ Found organization: ${org.name} (${org.id})\n`);

    const departments = await prisma.department.findMany({
      where: { organizationId: org.id }
    });

    if (departments.length === 0) {
      throw new Error('No departments found for Sterling Logistics');
    }

    console.log(`📂 Found ${departments.length} departments\n`);

    const shifts = await prisma.shift.findMany({
      where: { organizationId: org.id }
    });

    if (shifts.length === 0) {
      throw new Error('No shifts found for Sterling Logistics');
    }

    console.log(`⏰ Found ${shifts.length} shifts\n`);

    // Use the first shift for ALL employees
    const primaryShift = shifts[0];
    console.log(`📍 Using primary shift: ${primaryShift.name} for all employees\n`);

    let usersCreated = 0;
    let membersAdded = 0;
    let employeesCreated = 0;

    for (let i = 0; i < employeeNames.length; i++) {
      const name = employeeNames[i];
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@sterling.com`;

      try {
        let userData;
        let userCreated = false;
        
        // Step 1: Create or get user via Better Auth
        try {
          userData = await auth.api.signUpEmail({
            body: {
              name: name,
              email: email,
              password: 'Employee123!',
            },
          });
          console.log(`✅ Created user: ${name} (${email})`);
          usersCreated++;
          userCreated = true;
        } catch (error: any) {
          if (error.body?.code === 'USER_ALREADY_EXISTS') {
            console.log(`⚠️  User ${email} already exists, fetching...`);
            const existingUser = await prisma.user.findUnique({
              where: { email: email }
            });
            
            if (!existingUser) {
              console.log(`❌ Could not find user ${email}, skipping...\n`);
              continue;
            }
            
            userData = { user: existingUser };
          } else {
            console.log(`❌ Failed to create user ${name}: ${error.message}\n`);
            continue;
          }
        }

        // Verify user exists before proceeding
        const userExists = await prisma.user.findUnique({
          where: { id: userData.user.id }
        });

        if (!userExists) {
          console.log(`❌ User verification failed for ${name}, skipping...\n`);
          continue;
        }

        // Step 2: Add as member to organization via Better Auth
        let memberAdded = false;
        try {
          await auth.api.addMember({
            body: {
              organizationId: org.id,
              userId: userData.user.id,
              role: 'employee' as const,
            },
          });
          console.log(`   ➕ Added to organization as employee`);
          membersAdded++;
          memberAdded = true;
        } catch (error: any) {
          if (error.body?.code === 'MEMBER_ALREADY_EXISTS' || error.message?.includes('already exists')) {
            console.log(`   ⚠️  Already a member of organization`);
            memberAdded = true;
          } else {
            console.log(`   ❌ Could not add to org: ${error.message}, skipping...\n`);
            continue;
          }
        }

        // Verify member was created
        if (memberAdded) {
          const memberExists = await prisma.member.findFirst({
            where: {
              userId: userData.user.id,
              organizationId: org.id
            }
          });

          if (!memberExists) {
            console.log(`   ❌ Member verification failed for ${name}, skipping...\n`);
            continue;
          }
        }

        // Step 3: Create employee record (only if user and member exist)
        const existingEmployee = await prisma.employee.findFirst({
          where: {
            userId: userData.user.id,
            organizationId: org.id
          }
        });

        if (existingEmployee) {
          console.log(`   ⚠️  Employee record already exists\n`);
          continue;
        }

        // Distribute across departments
        const departmentIndex = employeesCreated % departments.length;
        const department = departments[departmentIndex];

        const employee = await prisma.employee.create({
          data: {
            name: name,
            organizationId: org.id,
            departmentId: department.id,
            shiftId: primaryShift.id, // ALL employees use the same shift
            userId: userData.user.id,
          },
        });

        console.log(`   👤 Created employee record (Dept: ${department.name}, Shift: ${primaryShift.name})\n`);
        employeesCreated++;

      } catch (error: any) {
        console.error(`❌ Error processing ${name}:`, error.message, '\n');
      }
    }

    console.log('✅ Completed!\n');
    console.log(`📊 Summary:`);
    console.log(`   Users created: ${usersCreated}`);
    console.log(`   Members added to org: ${membersAdded}`);
    console.log(`   Employee records created: ${employeesCreated}`);
    console.log(`   All employees assigned to: ${primaryShift.name}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addEmployeesFromOldSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
