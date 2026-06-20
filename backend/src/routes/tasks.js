import { Router } from "express";
import { updateTask } from "../db.js";
import { taskPatchSchema } from "../validators.js";

export const tasksRouter = Router();

tasksRouter.patch("/:id", (req, res, next) => {
  try {
    const changes = taskPatchSchema.parse(req.body);
    const task = updateTask(req.params.id, changes);
    if (!task) {
      res.status(404).json({ ok: false, error: `找不到 task_id=${req.params.id}` });
      return;
    }

    res.json({ ok: true, task });
  } catch (error) {
    next(error);
  }
});
