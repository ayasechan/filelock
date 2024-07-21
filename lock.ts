export interface Backend {
  write(path: string, content: string): Promise<void>;
  read(path: string): Promise<string>;
}

export class Locker {
  #lockId: string = "";
  constructor(public path: string, readonly backend: Backend) {
  }

  async tryLock(): Promise<boolean> {
    if (this.#lockId) {
      return false;
    }
    const content = await this.backend.read(this.path);
    if (content) {
      return false;
    }

    const id = randomeId(10);
    await this.backend.write(this.path, id);
    this.#lockId = id;

    return true;
  }

  async lock(opts: {
    timeout?: AbortSignal;
    delay?: number;
  }): Promise<void> {
    while (true) {
      if (await this.tryLock()) {
        return;
      }
      opts?.timeout?.throwIfAborted();
      await new Promise((ok) => setTimeout(ok, opts?.delay ?? 1e3));
    }
  }

  async unlock() {
    if (this.#lockId) {
      return;
    }
    const content = await this.backend.read(this.path);
    if (content !== this.#lockId) {
      throw new Error("Lock file has locked by other programe");
    }
    await this.backend.write(this.path, "");
    this.#lockId = "";
  }
}

const randomeId = (size: number): string => {
  const buf = new Uint8Array(size).map(() =>
    Math.floor(Math.random() * (1 << 8))
  );
  return Array.from(buf).map((i) => i.toString(16).padStart(2, "0")).join("");
};
