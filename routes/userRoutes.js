const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.post("/register", userController.register);
router.post("/logon", userController.logon);
router.post("/logoff", userController.logoff);
router.get("/:id", authMiddleware, userController.show);

module.exports = router;
