// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Wiping old dummy data...');
  await prisma.booking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating default test user...');
  const user = await prisma.user.create({
    data: {
      name: 'Test Passenger',
      email: 'passenger@bengaltransit.in',
      passwordHash: 'dummy_hash_for_testing_purposes_only' // <-- Add this line!
    }
  });

  console.log('Creating real bus fleet...');
  // Random WB Bus Number Generator
  const generateBusNumber = () => `WB-${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const bus1 = await prisma.bus.create({
    data: {
      busNumber: generateBusNumber(),
      capacity: 15,
      type: 'Premium Seater 1x2',
      operatorName: 'KNI Airport Transit'
    }
  });

  const bus2 = await prisma.bus.create({
    data: {
      busNumber: generateBusNumber(),
      capacity: 15,
      type: 'Premium Seater 1x2',
      operatorName: 'KNI Airport Transit'
    }
  });

  console.log('Generating daily schedules for the next 30 days...');
  const schedules = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    // ── ROUTE 1: KNI to Nababhat (2:00 PM to 3:45 PM) ──
    const dep1 = new Date(currentDate);
    dep1.setHours(14, 0, 0, 0); // 14:00 (2:00 PM)
    const arr1 = new Date(currentDate);
    arr1.setHours(15, 45, 0, 0); // 15:45 (3:45 PM)

    schedules.push({
      busId: bus1.id,
      origin: 'KNI Airport',
      destination: 'Nababhat Bus Stop',
      departureTime: dep1,
      arrivalTime: arr1,
      price: 600.00 // Adjust this if your short route is cheaper!
    });

    // ── ROUTE 2: Nababhat to KNI (4:45 PM to 6:30 PM) ──
    const dep2 = new Date(currentDate);
    dep2.setHours(16, 45, 0, 0); // 16:45 (4:45 PM)
    const arr2 = new Date(currentDate);
    arr2.setHours(18, 30, 0, 0); // 18:30 (6:30 PM)

    schedules.push({
      busId: bus2.id,
      origin: 'Nababhat Bus Stop',
      destination: 'KNI Airport',
      departureTime: dep2,
      arrivalTime: arr2,
      price: 600.00
    });
  }

  await prisma.schedule.createMany({ data: schedules });
  console.log(`✅ Successfully generated ${schedules.length} schedules!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });