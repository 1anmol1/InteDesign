const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // If optional (for save route), we won't strictly enforce it unless required
    // But since the save route is public and we want to optionally attach user, 
    // we'll make this middleware non-blocking if token is missing. Wait, I should make an optional one or just extract manually.
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'inteDesignSecretKey2026');
        req.user = decoded.user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};
