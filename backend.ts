import type { Backend } from "./lock.ts";

export class LocalFileBackend implements Backend {
  async read(path: string): Promise<string> {
    return await Deno.readTextFile(path);
  }
  async write(path: string, content: string): Promise<void> {
    return await Deno.writeTextFile(path, content);
  }
}
