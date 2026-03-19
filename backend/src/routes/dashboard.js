const express = require("express");
const router = express.Router();

const { getMetrics, getMonthly } = require("../controllers/dashboard");
const { authenticateToken } = require("../middlewares/auth");

router.get("/metrics", authenticateToken, getMetrics);
router.get("/monthly", authenticateToken, getMonthly);

module.exports = router;