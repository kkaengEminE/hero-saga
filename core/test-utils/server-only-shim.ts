// No-op replacement for the `server-only` module in test environments.
// In production Next.js builds, the real `server-only` module throws if
// imported by client code; in vitest's node env, that throw is spurious.
export {};
