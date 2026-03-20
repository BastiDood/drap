import {
  createTable,
  type RowData,
  type TableOptions,
  type TableOptionsResolved,
  type TableState,
  type Updater,
} from '@tanstack/table-core';

/**
 * Creates a reactive TanStack table object for Svelte.
 * @param options Table options to create the table with.
 * @returns A reactive table object.
 * @example
 * ```svelte
 * <script>
 *   const table = createSvelteTable({ ... })
 * </script>
 *
 * <table>
 *   <thead>
 *     {#each table.getHeaderGroups() as headerGroup}
 *       <tr>
 *         {#each headerGroup.headers as header}
 *           <th colspan={header.colSpan}>
 *         	   <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
 *         	 </th>
 *         {/each}
 *       </tr>
 *     {/each}
 *   </thead>
 * 	 <!-- ... -->
 * </table>
 * ```
 */
export function createSvelteTable<TData extends RowData>(options: TableOptions<TData>) {
  const resolvedOptions: TableOptionsResolved<TData> = mergeObjects(
    {
      state: {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function -- this placeholder function is part of a placeholder object to avoid undefined attributes.
      onStateChange() {},
      renderFallbackValue: null,
      mergeOptions(defaultOptions: TableOptions<TData>, options: Partial<TableOptions<TData>>) {
        return mergeObjects(defaultOptions, options);
      },
    },
    options,
  );

  const table = createTable(resolvedOptions);
  let state = $state<TableState>(table.initialState);

  function updateOptions() {
    table.setOptions(() => {
      return mergeObjects(resolvedOptions, options, {
        state: mergeObjects(state, options.state || {}),

        onStateChange(updater: Updater<TableState>) {
          if (updater instanceof Function) state = updater(state);
          else state = mergeObjects(state, updater);

          options.onStateChange?.(updater);
        },
      });
    });
  }

  updateOptions();

  /* eslint-disable no-restricted-globals
    --
    This createSvelteTable implementation might break if this is removed. */
  $effect.pre(() => {
    updateOptions();
  });
  /* eslint-enable no-restricted-globals */
  return table;
}

type MaybeThunk<T extends object> = T | (() => T | null | undefined);
type Intersection<T extends readonly unknown[]> = (T extends [infer H, ...infer R]
  ? H & Intersection<R>
  : unknown) & {};

/**
 * Lazily merges several objects (or thunks) while preserving
 * getter semantics from every source.
 *
 * Proxy-based to avoid known WebKit recursion issue.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeObjects<Sources extends readonly MaybeThunk<any>[]>(
  ...sources: Sources
): Intersection<{ [K in keyof Sources]: Sources[K] }> {
  function resolve<T extends object>(src: MaybeThunk<T>): T | null {
    // from the parent function return, I think it's ok lang if T | null is returned
    return typeof src === 'function' ? (src() ?? null) : src;
  }

  function findSourceWithKey(key: PropertyKey) {
    for (let i = sources.length - 1; i >= 0; i--) {
      const obj = resolve(sources[i]);
      if (obj && key in obj) return obj;
    }

    // from the parent function return, I think it's ok lang if T | null is returned
    return null;
  }

  return new Proxy(Object.create(null), {
    get(_, key) {
      const src = findSourceWithKey(key);
      return src?.[key as never];
    },

    has(_, key) {
      return Boolean(findSourceWithKey(key));
    },

    ownKeys(): (string | symbol)[] {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const all = new Set<string | symbol>();
      for (const s of sources) {
        const obj = resolve(s);
        if (obj !== null) for (const k of Reflect.ownKeys(obj) as (string | symbol)[]) all.add(k);
      }
      return [...all];
    },

    getOwnPropertyDescriptor(_, key) {
      const src = findSourceWithKey(key);
      if (!src) return undefined; // eslint-disable-line no-undefined -- abiding this rule might break something.
      return {
        configurable: true,
        enumerable: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: (src as any)[key],
        writable: true,
      };
    },
  }) as Intersection<{ [K in keyof Sources]: Sources[K] }>;
}
