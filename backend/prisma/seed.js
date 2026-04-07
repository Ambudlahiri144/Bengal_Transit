// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); 
const prisma = new PrismaClient();

async function main() {
  console.log('Wiping old dummy data...');
  await prisma.booking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating default Admin test user...');
  
  // Hash a real password so you can actually log in with this account!
  const hashedPassword = await bcrypt.hash('admin123', 10); 

  const user = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@bengaltransit.in',
      password: hashedPassword, 
      role: 'ADMIN'             
    }
  });

  console.log('Creating real bus fleet...');
  const generateBusNumber = () => `WB-${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 🚌 Created 3 buses instead of 2 for the different time slots
  const bus1 = await prisma.bus.create({
    data: { busNumber: generateBusNumber(), capacity: 15, type: 'Premium Seater 1x2', operatorName: 'Bengal Transit Express' }
  });
  const bus2 = await prisma.bus.create({
    data: { busNumber: generateBusNumber(), capacity: 15, type: 'Premium Seater 1x2', operatorName: 'Bengal Transit Express' }
  });
  const bus3 = await prisma.bus.create({
    data: { busNumber: generateBusNumber(), capacity: 15, type: 'Premium Seater 1x2', operatorName: 'Bengal Transit Express' }
  });

  console.log('Generating daily schedules for the next 30 days...');
  const schedules = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    // Helper function to make setting times much cleaner
    const createTime = (hours, mins) => {
      const d = new Date(currentDate);
      d.setHours(hours, mins, 0, 0);
      return d;
    };

    // ── ROUTE 1: KNI to Nababhat (1h 45m journey) ──
    // Morning (8:30 AM - 10:15 AM)
    schedules.push({ busId: bus1.id, origin: 'KNI Airport', destination: 'Nababhat Bus Stop', departureTime: createTime(8, 30), arrivalTime: createTime(10, 15), price: 150.00 });
    // Afternoon (2:00 PM - 3:45 PM)
    schedules.push({ busId: bus2.id, origin: 'KNI Airport', destination: 'Nababhat Bus Stop', departureTime: createTime(14, 0), arrivalTime: createTime(15, 45), price: 150.00 });
    // Evening (6:15 PM - 8:00 PM)
    schedules.push({ busId: bus3.id, origin: 'KNI Airport', destination: 'Nababhat Bus Stop', departureTime: createTime(18, 15), arrivalTime: createTime(20, 0), price: 150.00 });

    // ── ROUTE 2: Nababhat to KNI (1h 45m journey) ──
    // Morning (11:00 AM - 12:45 PM)
    schedules.push({ busId: bus1.id, origin: 'Nababhat Bus Stop', destination: 'KNI Airport', departureTime: createTime(11, 0), arrivalTime: createTime(12, 45), price: 150.00 });
    // Afternoon (4:30 PM - 6:15 PM)
    schedules.push({ busId: bus2.id, origin: 'Nababhat Bus Stop', destination: 'KNI Airport', departureTime: createTime(16, 30), arrivalTime: createTime(18, 15), price: 150.00 });
    // Night (9:00 PM - 10:45 PM)
    schedules.push({ busId: bus3.id, origin: 'Nababhat Bus Stop', destination: 'KNI Airport', departureTime: createTime(21, 0), arrivalTime: createTime(22, 45), price: 150.00 });
  }

  await prisma.schedule.createMany({ data: schedules });
  console.log(`✅ Successfully generated ${schedules.length} schedules!`);
  console.log(`✅ Test Admin Created! Email: admin@bengaltransit.in | Password: admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });