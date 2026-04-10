const jwt = require("jsonwebtoken");
require('dotenv').config()

if (!process.env.SECRET_KEY) {
    throw new Error("SECRET_KEY environment variable is required");
}
const secret = process.env.SECRET_KEY;

function setUser(user){
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        address: user.address,
        contact: user.contact
    }
    return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function getUser(token) {
    if(!token){
        return null;
    }
    try {
        return jwt.verify(token, secret)
    } catch (error) {
        return null;
    }
}

module.exports = {
    getUser,
    setUser
}
