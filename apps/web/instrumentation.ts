export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Node.js 25 exposes localStorage as a global but without proper
    // file-backed storage. Polyfill it for SSR compatibility.
    const store = new Map<string, string>()
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        get length() {
          return store.size
        },
      },
      writable: true,
      configurable: true,
    })
  }
}
