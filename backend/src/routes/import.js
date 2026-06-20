import { Router } from "express";
import multer from "multer";
import { getElder, insertSnapshot } from "../db.js";
import {
  parseAppleHealthXml,
  previewAppleHealthXml,
} from "../importers/appleHealthXml.js";
import { parseDailySnapshotsCsv } from "../importers/csvImporter.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 },
});

export const importRouter = Router();

const importOptions = (req) => ({
  elderId: req.body.elder_id ?? req.query.elder_id ?? "TEST001",
  startDate: req.body.start_date ?? req.query.start_date,
  endDate: req.body.end_date ?? req.query.end_date,
  limitDays: req.body.limit_days ?? req.query.limit_days ?? 14,
});

const withDeterministicAppleSnapshotId = (snapshot) =>
  snapshot.data_source === "Apple Health Export" && !snapshot.snapshot_id
    ? { ...snapshot, snapshot_id: `APPLE-${snapshot.elder_id}-${snapshot.date}` }
    : snapshot;

importRouter.post("/daily-snapshots-csv", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: "Please upload a CSV file with multipart field name file." });
      return;
    }

    const snapshots = parseDailySnapshotsCsv(req.file.buffer.toString("utf8")).map(
      withDeterministicAppleSnapshotId,
    );
    const inserted = snapshots.map(insertSnapshot);

    res.status(201).json({
      ok: true,
      count: inserted.length,
      snapshots: inserted,
    });
  } catch (error) {
    next(error);
  }
});

importRouter.post("/apple-health-xml/preview", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: "Please upload export.xml with multipart field name file." });
      return;
    }

    const preview = previewAppleHealthXml(req.file.buffer.toString("utf8"), importOptions(req));
    res.json({
      ok: true,
      preview,
    });
  } catch (error) {
    next(error);
  }
});

importRouter.post("/apple-health-xml", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: "Please upload export.xml with multipart field name file." });
      return;
    }

    const options = importOptions(req);
    if (!options.elderId || !getElder(options.elderId)) {
      res.status(404).json({ ok: false, error: "Please provide a valid elder_id." });
      return;
    }

    const snapshots = parseAppleHealthXml(req.file.buffer.toString("utf8"), options);
    const inserted = snapshots.map(insertSnapshot);

    res.status(201).json({
      ok: true,
      count: inserted.length,
      snapshots: inserted,
    });
  } catch (error) {
    next(error);
  }
});
