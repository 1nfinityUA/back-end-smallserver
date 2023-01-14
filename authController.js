const User = require("./models/User.js");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { secret } = require("./config.js");

const generateAccestoken = (id, roles, subordinate, boss) => {
    const payload = {
        id,
        roles,
        subordinate,
        boss,
    };
    return jwt.sign(payload, secret, { expiresIn: "24h" });
};

class authController {
    async registration(req, res) {
        try {
            const errors = validationResult(req);
            // перевіряємо чи є помилка валідності при створенні
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: "Validation error" });
            }
            const { username, password, subordinate, roles, boss } = req.body;
            const candidate = await User.findOne({ username });
            const bossVerify = await User.findOne({ boss });
            // перевірка чи є такий юзер в базі данних (додавати як босса можемо тільки тих що є)
            if (!bossVerify) {
                return res.status(400).json({ message: "Boss not found" });
            }
            // перевірка щоб не було 2 однакових логіна
            if (candidate) {
                return res
                    .status(400)
                    .json({ message: "User name allready exist" });
            }
            // підлеглі додаються автоматично якшо хтось юзера вказав як боса
            // або додає адмін
            if (subordinate) {
                return res
                    .status(400)
                    .json({ message: "Only boss can add subordinants" });
            }
            // роль міняється автоматично якщо в тебе є хотяби 1 підлеглий
            // або міняє адмін
            if (roles) {
                return res
                    .status(400)
                    .json({ message: "Only boss can add roles" });
            }
            // ховаємо пароль задопомогою сторонььої бібліотеки
            const hashPassword = bcrypt.hashSync(password, 5);
            const user = new User({
                username,
                password: hashPassword,
                boss
            });
            // зберігаємо юзера та помідомляємо про це на фронт-енд
            await user.save();
            return res.json({ message: "registration complite" });
        } catch (error) {
            console.log(error);
            res.status(400).json({ message: "Registration error" });
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username });
            const allUsers = await User.find()
            // перевіряємо чи є такий юзер в базі данних
            if (!user) {
                return res.status(400).json({
                    message: `User with username: ${username}, not found`,
                });
            }
            // тут ми перевіряємо коректність пароля
            const validPassword = bcrypt.compareSync(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ message: "incorrect password" });
            }
            // ця функція перевіряє чи при реестрації хтось вказав тебе як боса
            // якщо так то добавляє юзера який так вказав в масив підлеглих
            async function chekAreYouBoss(allUsers, user){
                const subordinantsId =[]
                allUsers.forEach((value)=> {
                    if (value.boss === user.id){
                        return subordinantsId.push(value.id)
                    }
                })
                const filtredSUb = (subordinantsId.filter((a) => user.subordinate.indexOf(a)== -1));
                
                return User.updateOne(
                    {
                        _id: user._id
                    },
                    {
                        $set: {subordinate: [...filtredSUb, ...user.subordinate]}
                    }
                )
            }
             // ця функція перевіряє чи є в тебе підлеглий і якшо є то міняє роль на босса
            chekAreYouBoss(allUsers, user)
            async function updateRoles(user) {
                if (user.subordinate.length > 0){
                    return User.updateOne(
                        {
                            _id: user._id
                        },
                        {
                            $set: { roles: "boss"}
                        }
                    )
                }
            }
            updateRoles(user)
            // тут генеруємо токін
            const token = generateAccestoken(
                user._id,
                user.roles,
                user.subordinate,
                user.boss
            );
            return res.json({ token });
        } catch (error) {
            console.log(error);
            res.status(400).json({ message: "Login error" });
        }
    }

    async getUsers(req, res) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decodedData = jwt.verify(token, secret);
            req.data = decodedData;
            const user = req.data;
            // якщо ти адмін ти можеш дивитись всю базу данних
            if (user.roles === "admin") {
                const users = await User.find();
                return res.json(users);
            }
            // якщо босс тільки себе і своїх підлеглих
            if (user.roles === "boss") {
                const self = await User.findById(user.id);
                const response = []
                user.subordinate.forEach( async (value) => {
                    response.push(await User.findById(value))
                    return response
                })
                // вот цей момент мені не подобається бо якшо немає затримки то повертає пустий масив респонс
                // а з await не працювало або повертало теж порожній... 
                return setTimeout(() => {
                    res.json({ self, response});
                }, 600);
            }
            // тут якшо в тебе роль юзер то ти бачиш тільки себе
            const self = await User.findById(user.id);
            return res.json(self);
        } catch (error) {
            console.log(error);
            res.status(400).json({ message: "Get users error" });
        }
    }

    async changeBoss(req, res) {
        try {
            const bossId = req.body.id;
            // чого я тут зробив через find and update? просто щоб побачили що таке я тоже знаю))))
            User.findByIdAndUpdate(
                {
                    _id: bossId,
                },
                {
                    $set: { boss: req.body.boss, subordinate: req.body.subordinate }
                },
                {
                    returnDocument: "after",
                },
                (err, doc) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({
                            message: `User whit this ID: ${bossId} not found`,
                        });
                    }
                    if (!doc) {
                        return res.status(404).json({
                            message: `User whit this ID: ${bossId} not found`,
                        });
                    }
                    return res.json(doc);
                }
            );
        } catch (error) {
            console.log(error);
            res.status(400).json({ message: "Change boss error" });
        }
    }
}

module.exports = new authController();
