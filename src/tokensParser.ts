import { web3 } from "@project-serum/anchor";
import { TOKENS } from "./data/tokens";

export function getMintAddress(token: string): web3.PublicKey {
  const match = Object.entries(TOKENS).find(
    ([tkn, _tokenInfo]) => tkn === token
  );

  if (!match) {
    throw new Error("Token" + token + "not found:");
  }

  const [_tkn, tokenInfo] = match;
  return new web3.PublicKey(tokenInfo.mintAddress);
}

export function findTokenByMint(mint: web3.PublicKey): string {
  const match = Object.entries(TOKENS).find(
    ([_tkn, tokenInfo]) => tokenInfo.mintAddress === mint.toString()
  );

  if (!match) {
    throw new Error("Error finding token by mint " + mint.toString());
  }

  const [tkn, _tokenInfo] = match;
  return tkn;
}
