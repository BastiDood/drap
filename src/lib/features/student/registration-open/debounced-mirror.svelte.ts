import { createSubscriber } from 'svelte/reactivity';
import * as v from 'valibot';

type Timeout = ReturnType<typeof setTimeout> | null;
type MirrorValue<Schema extends v.GenericSchema> = v.InferOutput<Schema> | null;

export interface DebouncedMirrorOptions<Schema extends v.GenericSchema> {
  key: string;
  schema: Schema;
  debounceMs: number;
}

export class DebouncedMirror<Schema extends v.GenericSchema> {
  key: string;
  #schema: Schema;
  #debounceMs: number;
  #timeout: Timeout = null;
  #current: MirrorValue<Schema> = null;
  #subscribe: () => void;

  constructor({ key, schema, debounceMs }: DebouncedMirrorOptions<Schema>) {
    this.key = key;
    this.#schema = schema;
    this.#debounceMs = debounceMs;

    this.#subscribe = createSubscriber(update => {
      // eslint-disable-next-line no-restricted-globals
      $effect(() => {
        this.cancel();
        const raw = localStorage.getItem(this.key);
        this.#current = raw === null ? null : v.parse(this.#schema, JSON.parse(raw));
        update();
        return this.cancel.bind(this);
      });

      const controller = new AbortController();
      globalThis.addEventListener(
        'storage',
        event => {
          if (event.key !== this.key) return;
          this.cancel();
          this.#current =
            event.newValue === null ? null : v.parse(this.#schema, JSON.parse(event.newValue));
          update();
        },
        { signal: controller.signal },
      );

      return controller.abort.bind(controller);
    });
  }

  get current() {
    this.#subscribe();
    return this.#current;
  }

  set current(next: MirrorValue<Schema>) {
    this.#current = next;
    this.scheduleWrite(this.#current);
  }

  flush() {
    this.cancel();
    this.write(this.#current);
  }

  cancel() {
    if (this.#timeout === null) return;
    clearTimeout(this.#timeout);
    this.#timeout = null;
  }

  clear() {
    this.cancel();
    this.#current = null;
    localStorage.removeItem(this.key);
  }

  read() {
    const raw = localStorage.getItem(this.key);
    return raw === null ? null : v.parse(this.#schema, JSON.parse(raw));
  }

  write(value: MirrorValue<Schema>) {
    if (value === null) localStorage.removeItem(this.key);
    else localStorage.setItem(this.key, JSON.stringify(value));
  }

  scheduleWrite(value: MirrorValue<Schema>) {
    this.cancel();
    this.#timeout = setTimeout(
      value => {
        this.#timeout = null;
        this.write(value);
      },
      this.#debounceMs,
      value,
    );
  }
}
