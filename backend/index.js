// index.js
const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(cors({ 
  origin: [
    "http://localhost:3000", 
    "https://bengal-transit.vercel.app" // ⚠️ MUST exactly match your browser URL!
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Explicitly allows the preflight
  allowedHeaders: ["Content-Type", "Authorization"]
}));
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bengal-transit-super-secret-key';
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
 // Allows your Next.js frontend to make requests
app.use(express.json()); // Parses incoming JSON payloads
// ── REGISTER ENDPOINT ──
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role, secretAnswer } = req.body;

    try {
        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Email already in use.' });

        // 2. Validate Admin Secret
        if (role === 'ADMIN') {
            if (!secretAnswer || secretAnswer.trim().toUpperCase() !== 'KNI') {
                return res.status(403).json({ error: 'Incorrect security answer for Admin creation.' });
            }
        }

        // 3. Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Save to database
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role === 'ADMIN' ? 'ADMIN' : 'TRAVEL_AGENT'
            }
        });

        // 5. Generate Token
        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
        res.status(201).json({ message: 'Account created successfully', token, user: { id: user.id, name: user.name, role: user.role } });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Internal server error during registration.' });
    }
});

// ── LOGIN ENDPOINT ──
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // 2. Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' });

        // 3. Generate Token
        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ message: 'Logged in successfully', token, user: { id: user.id, name: user.name, role: user.role } });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
});
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
    // 1. Grab the REAL userId sent from the frontend
    const { userId, scheduleId, seatNumbers, passengerName, passengerAge, passengerMobile, passengerEmail } = req.body;

    if (!scheduleId || !seatNumbers || !seatNumbers.length) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
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
                    userId: userId, // 👈 THE FIX: Now using the actual logged-in user's ID!
                    scheduleId,
                    seatNumbers,
                    status: 'Pending',
                    lockedUntil: lockExpiration,
                    passengerName,
                    passengerAge,
                    passengerMobile,
                    passengerEmail
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
app.get('/api/admin/bookings', async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                user: { 
                    select: { name: true, email: true, role: true } 
                },
                schedule: { 
                    include: { bus: true } 
                }
            },
            orderBy: { 
                createdAt: 'desc' // Newest bookings first
            }
        });
        
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Admin Bookings Error:", error);
        res.status(500).json({ error: 'Internal server error while fetching data.' });
    }
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});