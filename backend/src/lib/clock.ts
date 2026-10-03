/** Injected so OTP and token expiry can be driven by a fixed time in tests. */
export type Clock = { now: () => Date };

export const systemClock: Clock = { now: () => new Date() };
