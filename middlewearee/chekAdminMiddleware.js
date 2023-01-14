const jwt = require("jsonwebtoken");
const {secret} = require('../config');
const User = require("../models/User.js");

module.exports = async function (req, res, next) {
    if (req.method === 'OPTIONS') {
        next()
    }
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decodedData = jwt.verify(token, secret);
        const subbordinateChek = await User.findById(req.body.id)
        req.data = decodedData;
        // якщо ти зайшов під логіном адміна ти має доступ
        if (req.data.roles === "admin") {
            return next()
        }
        // перевірка чи ти є босс
        // і чи свому підлеглому ти міняєш боса
        if (req.data.roles === "boss" && subbordinateChek.boss === req.data.id) {
            return next()
        }
        return res.status(400).json({ message: "It's not your subordinate or you are not a boss" })
    } catch (error) {
        console.log(error);
        return res.status(403).json({message: 'Verify admin error'})
    }
}

// ця перевірка створена для того щоб давати доступ до змін РОЛЕЙ або змін ПІДЛЕГЛИХ
