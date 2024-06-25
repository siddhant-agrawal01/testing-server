import { Router } from "express";
import { searchVideo } from "../controllers/search.controller.js";

const router = Router();

router.route("/videos").post(searchVideo);

export default router;