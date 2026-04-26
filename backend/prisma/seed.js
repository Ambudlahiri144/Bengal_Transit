const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clear old schedules
  await prisma.booking.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.bus.deleteMany({});

  // 2. Create the Express Buses
  const bus1 = await prisma.bus.create({
    data: { operatorName: 'Bengal Transit Express', busNumber: 'WB-72-2969', capacity: 25, type: 'AC Seater' }
  });
  const bus2 = await prisma.bus.create({
    data: { operatorName: 'Bengal Transit Express', busNumber: 'WB-15-6251', capacity: 25, type: 'AC Seater' }
  });

  // 3. Define the Master Route Data with EXACT Flight Identifiers
  const masterRoutes = [
    // ── BARDHAMAN ↔ AIRPORT ROUTE ──
    { org: 'Nababhat Bus Stop', dest: 'KNI Airport', depH: 10, depM: 0,  arrH: 11, arrM: 45,  flights: 'HYD_DEP_1310,MUM_DEP_1425,BLR_DEP_1425,MAA_DEP_1550,MAA_DEP_1655', busId: bus1.id },
    { org: 'KNI Airport', dest: 'Nababhat Bus Stop', depH: 12, depM: 0,  arrH: 13, arrM: 45,  flights: 'HYD_DEP_1310,MUM_DEP_1425,BLR_DEP_1425,MAA_DEP_1550,MAA_DEP_1655', busId: bus1.id },
    { org: 'KNI Airport', dest: 'Nababhat Bus Stop', depH: 18, depM: 30, arrH: 20, arrM: 15, flights: 'HYD_ARR_1800,MAA_ARR_1615', busId: bus1.id },
    { org: 'Nababhat Bus Stop', dest: 'KNI Airport', depH: 20, depM: 30, arrH: 22, arrM: 15, flights: 'HYD_ARR_1800,MAA_ARR_1615', busId: bus1.id },
    
    
    // ── DURGAPUR CITY CENTRE ↔ AIRPORT ROUTE ──
    { org: 'KNI Airport', dest: 'City Centre', depH: 13, depM: 0,  arrH: 14, arrM: 45, flights: 'DEL_ARR_1240,MAA_DEP_1550,MAA_DEP_1655', busId: bus2.id },
    { org: 'City Centre', dest: 'KNI Airport', depH: 13, depM: 30,  arrH: 15, arrM: 15, flights: 'DEL_ARR_1240,MAA_DEP_1550,MAA_DEP_1655', busId: bus2.id },
    { org: 'KNI Airport', dest: 'City Centre', depH: 14, depM: 0, arrH: 15, arrM: 45,  flights: 'DEL_ARR_1240,MAA_DEP_1550,MAA_DEP_1655', busId: bus2.id },
    
    { org: 'KNI Airport', dest: 'City Centre', depH: 14, depM: 15, arrH: 16, arrM: 0, flights: 'MUM_ARR_1340,BLR_ARR_1355,MAA_DEP_1550,MAA_DEP_1655', busId: bus2.id },
    { org: 'City Centre', dest: 'KNI Airport', depH: 14, depM: 45, arrH: 16, arrM: 30, flights: 'MUM_ARR_1340,BLR_ARR_1355,MAA_DEP_1550,MAA_DEP_1655', busId: bus2.id },
    { org: 'KNI Airport', dest: 'City Centre', depH: 15, depM: 15, arrH: 17, arrM: 0, flights: 'MUM_ARR_1340,BLR_ARR_1355,MAA_DEP_1550,MAA_DEP_1655', busId: bus2.id },
    
    { org: 'KNI Airport', dest: 'City Centre', depH: 16, depM: 30, arrH: 18, arrM: 15, flights: 'MAA_ARR_1615,MAA_ARR_1440,DEL_DEP_1830', busId: bus2.id },
    { org: 'City Centre', dest: 'KNI Airport', depH: 17, depM: 0, arrH: 18, arrM: 45, flights: 'MAA_ARR_1615,MAA_ARR_1440,DEL_DEP_1830', busId: bus2.id },
    { org: 'KNI Airport', dest: 'City Centre', depH: 17, depM: 30, arrH: 19, arrM: 15, flights: 'MAA_ARR_1615,MAA_ARR_1440,DEL_DEP_1830', busId: bus2.id },
  ];

  // 4. Generate schedules for the next 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    for (const route of masterRoutes) {
      const depTime = new Date(currentDate);
      depTime.setHours(route.depH, route.depM, 0, 0);

      const arrTime = new Date(currentDate);
      arrTime.setHours(route.arrH, route.arrM, 0, 0);

      await prisma.schedule.create({
        data: {
          origin: route.org,
          destination: route.dest,
          departureTime: depTime,
          arrivalTime: arrTime,
          busId: route.busId,
          cateredFlights: route.flights,
          price: 150 
        }
      });
    }
  }

  console.log('✅ Seed complete! New routes and explicit flight ID mappings generated.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });