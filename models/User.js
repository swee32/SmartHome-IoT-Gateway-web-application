const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: { type: String, select: false },
    blynkToken: String,
    location: String,
    role: { type: String, default: 'user' }
});

// The 3rd argument 'users' FORCES Mongoose to use that specific collection name
module.exports = mongoose.model('User', UserSchema, 'users');