const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // 1. Delete old admin to avoid "User already exists"
        await User.deleteOne({ email: "admin@smarthome.com" });

        // 2. Create the fresh hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("Admin12#", salt);

        // 3. Insert the Admin with the REQUIRED location field
        const admin = new User({
            fullName: "System Administrator",
            email: "admin@smarthome.com",
            password: hashedPassword,
            role: "admin",
            blynkToken: "ADMIN_BYPASS",
            location: "Pune, Maharashtra" // <--- ADDED THIS TO PASS VALIDATION
        });

        await admin.save();
        console.log("-----------------------------------------");
        console.log("✅ SUCCESS: Admin created successfully!");
        console.log("Email: admin@smarthome.com");
        console.log("Password: Admin12#");
        console.log("-----------------------------------------");
        
        process.exit();
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
        process.exit(1);
    }
};

seedAdmin();