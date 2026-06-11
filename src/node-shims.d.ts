declare module "node:fs" {
  export function readFileSync(path: string | URL, encoding: BufferEncoding): string;
}

type BufferEncoding = "utf8" | "utf-8";
