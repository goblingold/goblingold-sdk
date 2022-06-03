import { utils, web3 } from "@project-serum/anchor";
import {
  AccountLayout,
  MintLayout,
  RawAccount,
  RawMint,
} from "@solana/spl-token";
import { StrategyProgram } from "./program";

export type DecodeMultipleAccountsParams = {
  publicKey: web3.PublicKey;
  accountType: string;
};

export async function decodeMultipleAccounts(
  program: StrategyProgram,
  params: DecodeMultipleAccountsParams[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const accountKeys: web3.PublicKey[] = [];
  const accountTypes: string[] = [];
  for (const x of params) {
    accountKeys.push(x.publicKey);
    accountTypes.push(x.accountType);
  }

  const accountInfos = await utils.rpc.getMultipleAccounts(
    program.connection,
    accountKeys
  );

  return accountInfos.map((accountInfo, i) => {
    if (!accountInfo) {
      throw new Error("Account " + accountKeys[i] + " does not exist");
    }

    const data = accountInfo.account.data;
    switch (accountTypes[i]) {
      case "Vault":
        return decodeVault(program, data);

      case "Account":
        return decodeAccount(data);

      case "Mint":
        return decodeMint(data);

      default:
        console.log(accountInfo);
        throw new Error("Non-valid account type " + accountTypes[i]);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeVault(program, data: Buffer): any {
  return program.coder.accounts.decode("VaultAccount", data);
}

export function decodeMint(data: Buffer): RawMint {
  return MintLayout.decode(data);
}

export function decodeAccount(data: Buffer): RawAccount {
  return AccountLayout.decode(data);
}
