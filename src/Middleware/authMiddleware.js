import jwt from "jsonwebtoken";
import User from "../../Model/UserModel.js";

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                message: "No token provided, authorization denied" 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from token
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                message: "Token is not valid - user not found" 
            });
        }

        // Add user to request object
        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: "Token is not valid" 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: "Token has expired" 
            });
        }
        
        res.status(500).json({ 
            message: "Server error in authentication",
            error: error.message 
        });
    }
};

export default authMiddleware;
