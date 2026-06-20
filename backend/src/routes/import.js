import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import multer from "multer";
import { getElder, insertSnapshot } from "../db.js";
import { analyzeAppleHealthXmlFile } from "../importers/appleHealthXml.js";
import { parseDailySnapshotsCsv } from "../importers/csvImporter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");
const uploadRoot = path.join(backendRoot, "uploads", "apple-health");
fs.mkdirSync(uploadRoot, { recursive: true });

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const xmlUploadMaxBytes =
  Number(process.env.APPLE_HEALTH_XML_UPLOAD_MAX_MB ?? 150) * 1024 * 1024;

const xmlUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname || "export.xml") || ".xml";
      cb(null, `${Date.now()}-${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: xmlUploadMaxBytes },
});

export const importRouter = Router();

const importOptions = (req) => ({
  elderId: req.body.elder_id ?? req.query.elder_id ?? "TEST001",
  startDate: req.body.start_date ?? req.query.start_date,
  endDate: req.body.end_date ?? req.query.end_date,
  limitDays: req.body.limit_days ?? req.query.limit_days ?? 14,
  stepSourceStrategy:
    req.body.step_source_strategy ??
    req.query.step_source_strategy ??
    process.env.APPLE_HEALTH_STEP_SOURCE_STRATEGY ??
    "prefer_watch",
});

const withDeterministicAppleSnapshotId = (snapshot) =>
  snapshot.data_source === "Apple Health Export" && !snapshot.snapshot_id
    ? { ...snapshot, snapshot_id: `APPLE-${snapshot.elder_id}-${snapshot.date}` }
    : snapshot;

const cleanupUpload = async (file) => {
  if (!file?.path) return;
  try {
    await fsp.unlink(file.path);
  } catch {
    // Temp upload cleanup should not hide the import result.
  }
};

const xmlUploadSingle = (req, res, next) => {
  xmlUpload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        ok: false,
        error:
          "Apple Health XML upload is too large for direct HTTP import. Use npm run preview:apple-health and npm run derive:apple-health locally, then import the derived CSV.",
      });
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
};

importRouter.post("/daily-snapshots-csv", csvUpload.single("file"), (req, res, next) => {
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
importRouter.post("/apple-health-xml/preview", xmlUploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: "Please upload export.xml with multipart field name file." });
      return;
    }

    const { preview } = await analyzeAppleHealthXmlFile(req.file.path, importOptions(req));
    res.json({
      ok: true,
      preview,
    });
  } catch (error) {
    next(error);
  } finally {
    await cleanupUpload(req.file);
  }
});

importRouter.post("/apple-health-xml", xmlUploadSingle, async (req, res, next) => {
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

    const { snapshots, preview } = await analyzeAppleHealthXmlFile(req.file.path, options);
    const inserted = snapshots.map(insertSnapshot);

    res.status(201).json({
      ok: true,
      count: inserted.length,
      snapshots: inserted,
      preview: {
        ...preview,
        sample_daily_snapshots: preview.sample_daily_snapshots.slice(-3),
      },
    });
  } catch (error) {
    next(error);
  } finally {
    await cleanupUpload(req.file);
  }
});
