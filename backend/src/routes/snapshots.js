import { Router } from "express";
import { getElder, insertSnapshot } from "../db.js";
import { snapshotSchema } from "../validators.js";

export const snapshotsRouter = Router();

snapshotsRouter.post("/", (req, res, next) => {
  try {
    const snapshot = snapshotSchema.parse(req.body);
    const elder = getElder(snapshot.elder_id);
    if (!elder) {
      res.status(404).json({ ok: false, error: `找不到 elder_id=${snapshot.elder_id}` });
      return;
    }

    res.status(201).json({
      ok: true,
      snapshot: insertSnapshot(snapshot),
    });
  } catch (error) {
    next(error);
  }
});
