import { Router } from "express";
import { listElders } from "../db.js";

export const eldersRouter = Router();

eldersRouter.get("/", (_req, res) => {
  res.json({ ok: true, elders: listElders() });
});
