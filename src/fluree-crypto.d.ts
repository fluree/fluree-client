declare module '@fluree/crypto' {
  export function createJWS(payload: string, privateKey: string): string;
  export function verifyJWS(
    jws: string,
  ): { pubkey: string; payload: string } | null;
  export function pubKeyFromPrivate(privateKey: string): string;
  export function accountIdFromPublic(publicKey: string): string;
  export function generateKeyPair(): {
    private: string;
    public: string;
  };
}
