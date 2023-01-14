
module.exports = function (req, res, next) {
    if (req.method === 'OPTIONS') {
        next()
    }
    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            return res.status(403).json({message: 'Please login before'})
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({message: 'Please login before'})
    }
}

// перевірка чи є користувач в базі данних