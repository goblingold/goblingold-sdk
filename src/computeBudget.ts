import { BN, web3 } from "@project-serum/anchor";

export function computeBudgetIx(units: number): web3.TransactionInstruction {
  return new web3.TransactionInstruction({
    programId: new web3.PublicKey(
      "ComputeBudget111111111111111111111111111111"
    ),
    keys: [],
    data: Buffer.from(Uint8Array.of(0, ...new BN(units).toArray("le", 8))),
  });
}
