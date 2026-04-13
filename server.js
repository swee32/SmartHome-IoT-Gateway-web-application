const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Models and Middleware
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const SensorData = require('./models/SensorData'); 
const auth = require('./middleware/auth');

const app = express();

// --- CONFIGURATION ---
const BLYNK_AUTH_TOKEN = process.env.BLYNK_AUTH_TOKEN || "Cn6_jZpgfeHRcW1Z8W1uYQI3qDmg4JPz";
const JWT_SECRET = process.env.JWT_SECRET || "smart_secret_2026";

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors()); 
app.use(express.static('public')); 

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, { 
    dbName: 'test',
    serverSelectionTimeoutMS: 5000 
})
.then(() => console.log("✅ Successfully connected to MongoDB Atlas!"))
.catch((err) => console.error("❌ MongoDB connection error:", err.message));

// --- NODEMAILER SETUP ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'smarthome.systems026@gmail.com',
        pass: 'higc xwmg xsop uaoj' 
    }
});

if (!global.otpStore) global.otpStore = {};

// --- USER & PROFILE ROUTES ---

app.get('/api/user/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) { res.status(500).json({ msg: "Profile Error" }); }
});

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/request-signup-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ msg: "User already exists!" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        global.otpStore[email] = { otp, expires: Date.now() + 600000 };

        const mailOptions = {
            from: '"SmartHome Admin" <smarthome.systems026@gmail.com>',
            to: email,
            subject: 'SmartHome Registration OTP',
            text: `Your verification code is: ${otp}. It will expire in 10 minutes.`
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) return res.status(500).json({ msg: "Failed to send email." });
            res.json({ msg: "OTP sent to your email!" });
        });
    } catch (err) { res.status(500).json({ msg: "OTP Server Error" }); }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password, blynkToken, location, otp } = req.body;
        const storedData = global.otpStore[email];
        if (!storedData || storedData.otp !== otp || storedData.expires < Date.now()) {
            return res.status(400).json({ msg: "Invalid or expired OTP." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ fullName, email, password: hashedPassword, blynkToken, location, role: 'user' });
        await user.save();
        delete global.otpStore[email]; 
        res.status(201).json({ msg: "User registered successfully!" });
    } catch (err) { res.status(500).json({ msg: "Registration Server Error" }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }
        const token = jwt.sign({ id: user._id, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '2h' });
        user.lastLogin = new Date();
        await user.save();
        res.json({ token, user: { fullName: user.fullName, role: user.role, email: user.email, blynkToken: user.blynkToken, lastLogin: user.lastLogin } });
    } catch (err) { res.status(500).json({ msg: "Login Server Error" }); }
});

// --- IOT & SENSOR DATA ---

app.get('/api/sensors/data', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const hardwareToken = user.blynkToken || BLYNK_AUTH_TOKEN;
        const blynk_url = `https://blynk.cloud/external/api/getAll?token=${hardwareToken}`;
        const response = await axios.get(`${blynk_url}&V10&V11&V14&V5&V6&V7&V8&V12&V13&V0&V9`, { timeout: 5000 }); 
        const blynk = response.data;

        const liveData = {
            temperature: blynk.V10 || 0,
            humidity: blynk.V11 || 0,
            current1: blynk.V5 || 0,
            current2: blynk.V6 || 0,
            current3: blynk.V7 || 0,
            current4: blynk.V8 || 0,
            voltage: blynk.V9 || 230,
            motion: blynk.V13 || 0,
            gasStatus: blynk.V14 == 0 ? "LEAKAGE!" : "Safe", 
            lightState: blynk.V12 || 0,
            automode: blynk.V0 || 0,
            timestamp: new Date()
        };

        await SensorData.create(liveData);
        await User.findByIdAndUpdate(req.user.id, { lastDeviceConnect: new Date() });
        res.json(liveData);
    } catch (err) {
        console.error("Blynk Fetch Failed. Using fallback...");
        const lastKnownData = await SensorData.findOne().sort({ timestamp: -1 });
        if (lastKnownData) res.json({ ...lastKnownData._doc, isOffline: true });
        else res.status(500).json({ msg: "No data available" });
    }
});

// --- RELAY CONTROL ---

app.post('/api/relays/control', auth, async (req, res) => {
    try {
        const { pin, value } = req.query; 
        const user = await User.findById(req.user.id);
        const hardwareToken = user.blynkToken || BLYNK_AUTH_TOKEN;
        
        console.log(`🚀 Command: Pin ${pin} -> ${value}`);
        const url = `https://blynk.cloud/external/api/update?token=${hardwareToken}&${pin}=${value}`;
        
        await axios.get(url, { timeout: 5000 });
        res.json({ msg: "Hardware Updated", success: true });
    } catch (err) {
        console.error("❌ Blynk Control Error:", err.message);
        res.status(500).json({ msg: "Hardware Communication Failed", error: err.message });
    }
});

// --- ADMIN & COMPLAINT ROUTES ---

app.get('/api/admin/complaints', auth, async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { userEmail: (await User.findById(req.user.id)).email };
        const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) { res.status(500).json([]); }
});

app.post('/api/user/complaint', auth, async (req, res) => {
    try {
        const { subject, message } = req.body;
        const user = await User.findById(req.user.id);
        const newComplaint = new Complaint({
            userEmail: user.email, 
            userName: user.fullName,
            blynkToken: user.blynkToken, 
            subject, message, 
            createdAt: new Date()
        });
        await newComplaint.save();
        res.json({ msg: "Complaint sent!", success: true });
    } catch (err) { res.status(500).json({ msg: "Failed to send complaint" }); }
});

app.get('/api/admin/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: "Forbidden" });
        const users = await User.find().select('-password'); 
        res.json(users);
    } catch (err) { res.status(500).json([]); }
});

// Replace the existing weekly-history route with this to support Decomposition
app.get('/api/sensors/weekly-history', auth, async (req, res) => {
    try {
        const startOfHistory = new Date();
        startOfHistory.setDate(startOfHistory.getDate() - 6);
        startOfHistory.setHours(0, 0, 0, 0);

        const history = await SensorData.aggregate([
            { $match: { timestamp: { $gte: startOfHistory } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    // Calculate averages for each device individually
                    v1: { $avg: "$current1" },
                    v2: { $avg: "$current2" },
                    v3: { $avg: "$current3" },
                    v4: { $avg: "$current4" },
                    totalLoad: { $avg: { $add: ["$current1", "$current2", "$current3", "$current4"] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const formattedData = history.map(item => ({
            day: days[new Date(item._id).getDay()],
            value: (item.totalLoad * 230 * 24 / 1000).toFixed(2), // For the Line Chart
            value1: item.v1 || 0, // For the Decomposition Bar Chart
            value2: item.v2 || 0,
            value3: item.v3 || 0,
            value4: item.v4 || 0
        }));
        res.json(formattedData);
    } catch (err) { res.status(500).json({ msg: "Aggregation failed" }); }
});

// Route to mark a ticket as resolved
app.post('/api/admin/resolve-ticket/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: "Forbidden" });
        
        await Complaint.findByIdAndUpdate(req.params.id, { status: 'resolved' });
        res.json({ msg: "Ticket resolved successfully!" });
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
});

// 1. Get ONLY resolved complaints for the History table
app.get('/api/admin/resolved', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: "Forbidden" });
        const history = await Complaint.find({ status: 'resolved' }).sort({ resolvedDate: -1 });
        res.json(history);
    } catch (err) { res.status(500).json([]); }
});

// 2. Update existing complaint fetch to show ONLY active tickets
app.get('/api/admin/complaints', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const filter = req.user.role === 'admin' ? { status: 'active' } : { userEmail: user.email };
        const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) { res.status(500).json([]); }
});

// 3. Logic to move a ticket from Active to Resolved
app.post('/api/admin/resolve-ticket/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: "Admin access required" });
        await Complaint.findByIdAndUpdate(req.params.id, { 
            status: 'resolved', 
            resolvedDate: new Date() 
        });
        res.json({ msg: "Ticket resolved and archived" });
    } catch (err) { res.status(500).json({ msg: "Update failed" }); }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SmartHome Server live on Port ${PORT}`);
});