const router = require('express').Router();
const authController = require("../controllers/authController");
const { verifyTokenAndAuthorization} = require('../middleware/verifyToken');

router.post("/register", authController.createUser);

router.post("/login", authController.loginUser);

// 👇 Add this route
router.put("/change-password", verifyTokenAndAuthorization, authController.changePassword);

module.exports = router;