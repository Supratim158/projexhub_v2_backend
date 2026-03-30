const router = require('express').Router();
const userController = require("../controllers/userController");
const {verifyTokenAndAuthorization, verifyAdmin} = require('../middleware/verifyToken');

router.get("/", verifyTokenAndAuthorization, userController.getUser);

router.get("/all/users", verifyAdmin, userController.getAllUsers);

router.delete("/", verifyTokenAndAuthorization, userController.deleteUser);

router.get("/verify/:otp", verifyTokenAndAuthorization, userController.verifyAccount);

router.get("/verify_phone/:phone", verifyTokenAndAuthorization, userController.verifyPhone);

router.delete("/", verifyTokenAndAuthorization, userController.deleteUser);

router.put("/", verifyTokenAndAuthorization, userController.updateProfile);

module.exports = router;