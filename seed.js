const mongoose = require('mongoose');
const SensorData = require('./models/SensorData'); // Ensure path is correct
require('dotenv').config();

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear old dummy data if you want a fresh start
        // await SensorData.deleteMany({}); 

        const dummyEntries = [];
        const now = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            
            // Generate random currents between 0.1A and 1.5A for variety
            dummyEntries.push({
                temperature: 24 + Math.random() * 5,
                humidity: 40 + Math.random() * 20,
                current1: Math.random() * 1.2,
                current2: Math.random() * 0.8,
                current3: Math.random() * 0.5,
                current4: Math.random() * 1.5,
                voltage: 230,
                gasStatus: "Safe",
                motion: Math.round(Math.random()),
                timestamp: date
            });
        }

        await SensorData.insertMany(dummyEntries);
        console.log("✅ Successfully seeded 7 days of dummy data!");
        process.exit();
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seedData();