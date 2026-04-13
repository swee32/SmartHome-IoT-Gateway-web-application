const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    userName: String,
    userEmail: String,
    blynkToken: String, 
    subject: String,
    message: String,
    status: { type: String, default: 'active' }, // Add this
    resolvedDate: Date, // Add this
    // ADD THIS FIELD:
    status: { 
        type: String, 
        default: 'pending', 
        enum: ['pending', 'resolved'] 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', ComplaintSchema, 'complaints');