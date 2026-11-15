/** One opaque identity per Ask conversation, independent of sockets and retries. */
export const createResearchSession = () => {
  let id: string | undefined;
  return {
    getId: () => {
      if (!id) {
        // getRandomValues also works on HTTP LAN deployments without randomUUID.
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
        id = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
      }
      return id;
    },
    reset: () => { id = undefined; },
  };
};
