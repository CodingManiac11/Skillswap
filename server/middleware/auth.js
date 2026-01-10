const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies the Authorization header contains a valid Bearer token
 * Attaches decoded user info to req.user
 */
const authMiddleware = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');

        // Attach user info to request
        req.user = {
            id: decoded.id,
            ...decoded
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please login again.' });
        }

        return res.status(401).json({ message: 'Invalid token.' });
    }
};

/**
 * Optional: Validates that the userId in params matches the authenticated user
 * Use after authMiddleware to prevent users from accessing other users' data
 */
const validateUserAccess = (req, res, next) => {
    const paramUserId = req.params.userId;
    const authUserId = req.user?.id;

    if (paramUserId && authUserId && paramUserId !== authUserId) {
        return res.status(403).json({ message: 'Access denied. You can only access your own data.' });
    }

    next();
};

module.exports = { authMiddleware, validateUserAccess };
