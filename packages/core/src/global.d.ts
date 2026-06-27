export {};

declare global {
  // Available in modern browsers, Workers, and React Native runtimes.
  var crypto: Crypto;
  function setTimeout(handler: () => void, timeout?: number): number;
}
