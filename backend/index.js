// index.js
const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(cors({ 
  origin: [
    "http://localhost:3000", 
    "https://bengal-transit.vercel.app" // ⚠️ Replace this with your EXACT Vercel URL
  ] 
}));
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const deletedLocks = await prisma.booking.deleteMany({
            where: {
                status: 'Pending',
                lockedUntil: { lt: now } // If the lock time is in the past
            }
        });

        if (deletedLocks.count > 0) {
            console.log(`[CRON] Released ${deletedLocks.count} expired seat locks.`);
        }
    } catch (error) {
        console.error("[CRON] Error clearing expired locks:", error);
    }
});

// Middleware
app.use(cors()); // Allows your Next.js frontend to make requests
app.use(express.json()); // Parses incoming JSON payloads

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Bus Booking API is running.' });
});

// Search Schedules Endpoint
app.get('/api/schedules/search', async (req, res) => {
    try {
        // 1. Extract query parameters from the URL
        const { origin, destination, date } = req.query;

        // 2. Input Validation
        if (!origin || !destination || !date) {
            return res.status(400).json({ 
                error: 'Missing required parameters. Please provide origin, destination, and date (YYYY-MM-DD).' 
            });
        }

        // 3. Date Math (The tricky part)
        // Parse the incoming string 'YYYY-MM-DD' into a starting and ending Date object
        const searchDate = new Date(date);
        const startOfDay = new Date(searchDate.setUTCHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setUTCHours(23, 59, 59, 999));

        // 4. Execute the Prisma Query
        const schedules = await prisma.schedule.findMany({
            where: {
                origin: {
                    equals: origin,
                    mode: 'insensitive' // Makes 'kolkata' match 'Kolkata'
                },
                destination: {
                    equals: destination,
                    mode: 'insensitive'
                },
                departureTime: {
                    gte: startOfDay, // Greater than or equal to 00:00:00
                    lte: endOfDay    // Less than or equal to 23:59:59
                }
            },
            // We use 'include' to join the Bus table so the frontend knows what type of bus it is
            include: {
                bus: true 
            },
            // Order the results by departure time (earliest first)
            orderBy: {
                departureTime: 'asc'
            }
        });

        // 5. Send the response
        res.status(200).json(schedules);

    } catch (error) {
        console.error("Search Endpoint Error:", error);
        res.status(500).json({ error: 'Internal server error while searching for schedules.' });
    }
});
app.post('/api/bookings/lock', async (req, res) => {
    // 1. We no longer rely on the userId from the frontend
    const { scheduleId, seatNumbers } = req.body;

    if (!scheduleId || !seatNumbers || !seatNumbers.length) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        // 2. TEMPORARY FIX: Dynamically grab the "Test Passenger" from the DB
        const testUser = await prisma.user.findFirst();
        if (!testUser) {
            return res.status(500).json({ error: 'No user found. Please run seed script.' });
        }
        const activeUserId = testUser.id; // Automatically gets the correct ID (2, 5, etc.)

        // Start an Interactive Transaction
        const booking = await prisma.$transaction(async (tx) => {
            
            await tx.$executeRaw`SELECT * FROM "Schedule" WHERE id = ${scheduleId} FOR UPDATE`;

            const existingBookings = await tx.booking.findMany({
                where: {
                    scheduleId: scheduleId,
                    seatNumbers: { hasSome: seatNumbers }, 
                    OR: [
                        { status: 'Confirmed' },
                        { 
                            status: 'Pending', 
                            lockedUntil: { gt: new Date() }
                        }
                    ]
                }
            });

            if (existingBookings.length > 0) {
                throw new Error('SEATS_UNAVAILABLE');
            }

            const lockExpiration = new Date();
            lockExpiration.setMinutes(lockExpiration.getMinutes() + 10);

            const newBooking = await tx.booking.create({
                data: {
                    userId: activeUserId, // 3. Use the dynamically fetched ID here!
                    scheduleId,
                    seatNumbers,
                    status: 'Pending',
                    lockedUntil: lockExpiration
                }
            });

            return newBooking;
        });

        res.status(200).json({ 
            message: 'Seats locked successfully.', 
            booking 
        });
    } catch (error) {
        console.error("Booking Lock Error:", error.message);
        if (error.message === 'SEATS_UNAVAILABLE') {
            return res.status(409).json({ error: 'One or more selected seats are already booked.' });
        }
        res.status(500).json({ error: 'Internal server error during booking.' });
    }
});
app.get('/api/bookings/:id', async (req, res) => {
    const bookingId = parseInt(req.params.id);
 
    if (isNaN(bookingId)) {
        return res.status(400).json({ error: 'Invalid booking ID.' });
    }
 
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { 
                    select: { id: true, name: true, email: true } 
                },
                schedule: { 
                    include: { bus: true } 
                }
            }
        });
 
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found.' });
        }
 
        res.status(200).json(booking);
 
    } catch (error) {
        console.error("Get Booking Error:", error);
        res.status(500).json({ error: 'Internal server error while fetching booking.' });
    }
});
app.get('/api/schedules/:id', async (req, res) => {
    const scheduleId = parseInt(req.params.id);
 
    if (isNaN(scheduleId)) {
        return res.status(400).json({ error: 'Invalid schedule ID.' });
    }
 
    try {
        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId },
            include: { bus: true }
        });
 
        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found.' });
        }
 
        res.status(200).json(schedule);
 
    } catch (error) {
        console.error("Get Schedule Error:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
app.get('/api/schedules/:id/seats', async (req, res) => {
    const scheduleId = parseInt(req.params.id);
 
    if (isNaN(scheduleId)) {
        return res.status(400).json({ error: 'Invalid schedule ID.' });
    }
 
    try {
        const now = new Date();
 
        // Confirmed seats — permanently booked
        const confirmedBookings = await prisma.booking.findMany({
            where: {
                scheduleId,
                status: 'Confirmed'
            },
            select: { seatNumbers: true }
        });
 
        // Pending seats — actively locked (lock hasn't expired yet)
        const pendingBookings = await prisma.booking.findMany({
            where: {
                scheduleId,
                status:      'Pending',
                lockedUntil: { gt: now }
            },
            select: { seatNumbers: true }
        });
 
        // Flatten the arrays-of-arrays into flat number arrays
        const confirmedSeats = confirmedBookings.flatMap(b => b.seatNumbers);
        const pendingSeats   = pendingBookings.flatMap(b => b.seatNumbers);
 
        res.status(200).json({ confirmedSeats, pendingSeats });
 
    } catch (error) {
        console.error("Get Seats Error:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
app.patch('/api/bookings/:id/confirm', async (req, res) => {
    const bookingId = parseInt(req.params.id);

    if (isNaN(bookingId)) {
        return res.status(400).json({ error: 'Invalid booking ID.' });
    }

    try {
        // Find the booking first to ensure it exists
        const existingBooking = await prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!existingBooking) {
            return res.status(404).json({ error: 'Booking not found.' });
        }

        // Update the booking: Set status to Confirmed and remove the lock expiration
        const confirmedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'Confirmed',
                lockedUntil: null 
            }
        });

        res.status(200).json({ 
            message: 'Booking confirmed successfully.', 
            booking: confirmedBooking 
        });

    } catch (error) {
        console.error("Confirm Booking Error:", error);
        res.status(500).json({ error: 'Internal server error while confirming booking.' });
    }
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});