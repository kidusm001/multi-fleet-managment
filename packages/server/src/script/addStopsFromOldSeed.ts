import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Addis Ababa locations from old seed.ts
const locations = [
  { name: 'Addis Ketema', lat: 9.0236913, lng: 38.7337122 },
  { name: 'Asco', lat: 9.0724916, lng: 38.6920762 },
  { name: 'Ferensay', lat: 9.0599154, lng: 38.7872513 },
  { name: 'Merkato', lat: 9.0309985, lng: 38.7370686 },
  { name: 'Piazza', lat: 9.034585, lng: 38.753376 },
  { name: 'Sheraton', lat: 9.0204847, lng: 38.7598406 },
  { name: 'Teklehaymanot', lat: 9.0483229, lng: 38.8843436 },
  { name: 'Akaki', lat: 8.9013695, lng: 38.8003557 },
  { name: 'Kaliti', lat: 8.9013695, lng: 38.8003557 },
  { name: 'Hana Mariam', lat: 8.931587, lng: 38.7427947 },
  { name: 'Amist Kilo', lat: 9.037716, lng: 38.7626764 },
  { name: 'Arat Kilo', lat: 9.0329476, lng: 38.7633823 },
  { name: 'Jan Meda', lat: 9.0428425, lng: 38.7691586 },
  { name: 'Piassa', lat: 9.0336984, lng: 38.7547538 },
  { name: 'Senga Tera', lat: 9.012142, lng: 38.746739 },
  { name: 'Sidist Kilo', lat: 9.0442226, lng: 38.7603182 },
  { name: 'Ayat', lat: 9.0345734, lng: 38.8460555 },
  { name: 'Ayat 15', lat: 9.0345734, lng: 38.8460555 },
  { name: 'Ayat 20', lat: 9.0462595, lng: 38.8800087 },
  { name: 'Ayat 30', lat: 9.0345734, lng: 38.8460555 },
  { name: 'Ayat 49', lat: 9.010764438, lng: 38.89454587 },
  { name: 'Ayat Real Estate', lat: 9.0285696, lng: 38.8758452 },
  { name: 'Atlas', lat: 9.0014019, lng: 38.7820045 },
  { name: 'Bole 24', lat: 8.9867182, lng: 38.7933956 },
  { name: 'Bole Bulbula', lat: 8.9670841, lng: 38.7802242 },
  { name: 'Bole Gerji', lat: 9.0029208, lng: 38.7996178 },
  { name: 'Bole Homes', lat: 8.9875092, lng: 38.7972194 },
  { name: 'Bole Michael', lat: 8.9832153, lng: 38.7728548 },
  { name: 'Bole Rwanda', lat: 8.9877683, lng: 38.7845593 },
  { name: 'Gerji', lat: 8.9953787, lng: 38.8094849 },
  { name: 'Goro', lat: 8.9969606, lng: 38.8320534 },
  { name: 'Haya Hulet', lat: 9.0148988, lng: 38.7839669 },
  { name: 'Megenagna', lat: 9.0196149, lng: 38.8016732 },
  { name: 'Olympia', lat: 9.0039145, lng: 38.7681189 },
  { name: 'CMC', lat: 9.019766, lng: 38.8475773 },
  { name: 'CMC Michael', lat: 9.019636, lng: 38.8395126 },
  { name: 'Figa', lat: 9.0108915, lng: 38.8380608 },
  { name: 'Goro 3', lat: 9.0020554, lng: 38.8423073 },
  { name: 'Jacros', lat: 9.0063603, lng: 38.8195279 },
  { name: 'Kotebe', lat: 9.0371282, lng: 38.8398518 },
  { name: 'Lem Hotel', lat: 9.0177928, lng: 38.7956402 },
  { name: 'Shola Gebeya', lat: 9.0261984, lng: 38.7928876 },
  { name: 'Summit', lat: 9.0027598, lng: 38.8421337 },
  { name: 'Summit 1', lat: 9.0099202, lng: 38.8519373 },
  { name: 'Summit 2', lat: 9.0036129, lng: 38.8590772 }
];

async function addStopsFromOldSeed() {
  console.log('🚏 Creating stops for Sterling Logistics employees from old seed.ts...\n');

  try {
    const sterling = await prisma.organization.findFirst({
      where: { slug: 'sterling-logistics' }
    });

    if (!sterling) {
      throw new Error('Sterling Logistics Solutions not found');
    }

    console.log(`✅ Found organization: ${sterling.name} (${sterling.id})\n`);

    const employeesWithoutStops = await prisma.employee.findMany({
      where: {
        organizationId: sterling.id,
        stopId: null
      },
      include: { user: true }
    });

    console.log(`📊 Found ${employeesWithoutStops.length} employees without stops\n`);

    if (employeesWithoutStops.length === 0) {
      console.log('✅ All employees already have stops assigned!\n');
      return;
    }

    console.log(`🔄 Creating unique stops for each employee...\n`);

    let stopsCreated = 0;
    for (let i = 0; i < employeesWithoutStops.length; i++) {
      const emp = employeesWithoutStops[i];
      const baseLocation = locations[i % locations.length];
      
      // Add small random offset to ensure uniqueness while keeping clustering
      const uniqueLat = baseLocation.lat + (Math.random() * 0.0002 - 0.0001);
      const uniqueLng = baseLocation.lng + (Math.random() * 0.0002 - 0.0001);

      const stop = await prisma.stop.create({
        data: {
          name: `${emp.user?.name || emp.name}'s Stop`,
          address: `${baseLocation.name}, Addis Ababa, Ethiopia`,
          latitude: uniqueLat,
          longitude: uniqueLng,
          organizationId: sterling.id
        }
      });

      await prisma.employee.update({
        where: { id: emp.id },
        data: { stopId: stop.id }
      });

      console.log(`✓ Created stop for ${emp.user?.name || emp.name} near ${baseLocation.name}`);
      stopsCreated++;
    }

    console.log(`\n✅ Done! Created ${stopsCreated} stops for Sterling employees`);
    console.log(`📍 Stops distributed across ${locations.length} locations in Addis Ababa`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addStopsFromOldSeed().catch(console.error);
