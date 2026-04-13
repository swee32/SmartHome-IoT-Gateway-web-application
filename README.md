# SmartHome IoT Energy Gateway 🏠⚡

A full-stack IoT solution for real-time home automation, energy monitoring, and safety diagnostics. This project integrates hardware sensing with a professional web dashboard to optimize power consumption and ensure resident safety.

## 🚀 Overview
This system utilizes an **ESP32** microcontroller to monitor environmental data and electrical loads. Data is pushed to a **Node.js/Express** backend and stored in **MongoDB Atlas**, with a real-time analytics dashboard built for the end-user.

### Key Features
* **Energy Analytics:** Real-time and historical power decomposition ($P = V \times I$) with anomaly detection.
* **Safety Protocols:** Automated "AI Protocols" for gas leakage detection (MQ-2) and overcurrent protection.
* **Diagnostic Tools:** System heartbeat and sensor health checks to ensure 24/7 reliability.
* **Support System:** Integrated ticket management for resident complaints and technical assistance.

## 🛠️ Tech Stack
* **Hardware:** ESP32, DHT11 (Temp/Humid), MQ-2 (Gas), PIR (Motion), Current Sensors (CT).
* **Frontend:** HTML5, CSS3 (Modern Teal Theme), JavaScript (ES6+), Chart.js.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB Atlas (MERN Stack).
* **Communication:** REST API / Blynk IoT Integration.

## 📊 Energy Monitoring Logic
The system calculates power consumption using a cumulative sum (CumSum) logic over a 7-day rolling window. 

> **Formula:** $Power (W) = Voltage (230V) \times \sum_{i=1}^{n} Current_i$

The dashboard categorizes load status as:
* **OK:** < 2500W
* **MODERATE:** 2500W - 4500W
* **HIGH:** > 4500W (Triggers System Alert)

## 🛡️ Safety Protocols
1.  **Gas Leakage:** If the MQ-2 sensor detects LPG/Smoke levels above the threshold, the system automatically triggers an "AI Protocol" forcing all high-voltage relays OFF.
2.  **Overcurrent:** The system monitors total amperage and alerts the user if the hardware load exceeds 3.0A to prevent circuit failure.


## 📂 Project Structure
```text
├── models/            # Mongoose schemas (User, SensorData, Complaint)
├── public/            # Frontend assets (HTML, CSS, JS)
│   ├── energy.html    # Analytics dashboard
│   ├── alerts.html    # Safety & Diagnostics
│   └── dashboard.html # Main control hub
├── server.js         # Express server & MongoDB connection
├── .env              # Environment variables (Hidden)
└── package.json      # Node dependencies


