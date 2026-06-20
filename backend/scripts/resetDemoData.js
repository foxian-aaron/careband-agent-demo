import { resetDemoData } from "../src/db.js";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_RESET !== "true") {
  console.error("Refusing to reset demo data in production. Set ALLOW_DEMO_RESET=true only for a controlled demo reset.");
  process.exit(1);
}

const result = resetDemoData();
console.log(JSON.stringify({ ok: true, ...result }, null, 2));
