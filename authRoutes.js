const Router = require("express");
const router = new Router();
const controller = require("./authController.js");
const { check } = require("express-validator");
const authMiddleware = require("./middlewearee/authMiddleware.js");
const chekAdminMiddleware = require("./middlewearee/chekAdminMiddleware.js");

router.post(
    "/registration",
    [
        check("username", "User name can't be empty").notEmpty(),
        check("boss", "User name can't be empty").notEmpty(),
        check("password", "Password must be more then 3 symbols").isLength({
            min: 3,
        }),
    ],
    controller.registration
);
router.post("/login", controller.login);
router.patch(
    "/changeboss",
    authMiddleware,
    chekAdminMiddleware,
    controller.changeBoss
);
router.get("/users", authMiddleware, controller.getUsers);

module.exports = router;

// 4 REST API які були в завданні
// регістрація
// Вхід в систему
// Отримання масиву юзерів з певними обмежаннями по ролях
// зміна ролей з певними обмежаннями
