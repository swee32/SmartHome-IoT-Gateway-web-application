const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Fix: Use process.env for security consistency
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "smart_secret_2026");
        req.user = decoded;
        next(); 
    } catch (err) {
        console.error("Token verification failed:", err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};