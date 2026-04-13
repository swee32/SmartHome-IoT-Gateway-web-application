const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
    temperature: { type: Number, default: 0 },
    humidity: { type: Number, default: 0 },
    current1: { type: Number, default: 0 },
    current2: { type: Number, default: 0 },
    current3: { type: Number, default: 0 },
    current4: { type: Number, default: 0 },
    voltage: { type: Number, default: 230 },
    motion: { type: Number, default: 0 },
    gasStatus: { type: String, default: "Safe" },
    lightState: { type: Number, default: 0 },
    automode: { type: Number, default: 1 },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', SensorDataSchema);

