import express from "express";
import { renderDashboard } from "../controllers/dashboard.controller";
import { localOnly } from "../middlewares/localOnly";

const router = express.Router();
router.get("/", localOnly, renderDashboard);

export default router;
