import { Idl, web3 } from "@project-serum/anchor";
import { IdlInstruction } from "@project-serum/anchor/dist/cjs/idl";
import { MethodsBuilder } from "@project-serum/anchor/dist/cjs/program/namespace/methods";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { createHash } from "sha256-uint8array";
import { addressParser } from "../addressParser";
import { StrategyProgram } from "../program";
import { Protocols } from "../protocols";

const franciumKeysAll = addressParser({
  group: "protocols",
  name: "francium",
});

export const refreshLendingIx = (
  tokenInput: string
): web3.TransactionInstruction => {
  const franciumKeys = franciumKeysAll[tokenInput];

  const keys = [
    {
      pubkey: franciumKeys.marketInfoAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: franciumKeys.lendingPoolInfoAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: web3.SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];

  return new web3.TransactionInstruction({
    keys,
    programId: franciumKeys.lendingProgram,
    data: Buffer.alloc(1, 12),
  });
};

export async function initializeProtocol(
  program: StrategyProgram
): Promise<web3.Transaction | null> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const franciumKeys = franciumKeysAll[tokenInput];
  const vaultAccount = vaultKeys.vaultAccount;

  const vaultFranciumCollateralTokenAccount = await getAssociatedTokenAddress(
    franciumKeys.farmingPoolStakeTknMint,
    vaultAccount,
    true
  );

  vaultKeys.vaultFranciumCollateralTokenAccount =
    vaultFranciumCollateralTokenAccount;

  if (
    await program.connection.getAccountInfo(
      vaultFranciumCollateralTokenAccount
    )
  ) {
    console.log("francium accounts already initialized");
    return null;
  } else {
    const tx = new web3.Transaction();
    tx.add(
      createAssociatedTokenAccountInstruction(
        program.user,
        vaultFranciumCollateralTokenAccount,
        vaultAccount,
        franciumKeys.farmingPoolStakeTknMint
      )
    );

    return tx;
  }
}

export async function setHashes(
  program: StrategyProgram
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const franciumKeys = franciumKeysAll[tokenInput];

  const depositData = new Uint8Array([
    ...vaultKeys.vaultFranciumCollateralTokenAccount.toBytes(),
    ...franciumKeys.lendingPoolInfoAccount.toBytes(),
    ...franciumKeys.lendingPoolTknAccount.toBytes(),
    ...franciumKeys.farmingPoolStakeTknMint.toBytes(),
    ...franciumKeys.marketInfoAccount.toBytes(),
    ...franciumKeys.lendingMarketAuthority.toBytes(),
  ]);

  const withdrawData = new Uint8Array([
    ...vaultKeys.vaultFranciumCollateralTokenAccount.toBytes(),
    ...franciumKeys.lendingPoolInfoAccount.toBytes(),
    ...franciumKeys.lendingPoolTknAccount.toBytes(),
    ...franciumKeys.farmingPoolStakeTknMint.toBytes(),
    ...franciumKeys.marketInfoAccount.toBytes(),
    ...franciumKeys.lendingMarketAuthority.toBytes(),
  ]);

  const tvlData = new Uint8Array([
    ...franciumKeys.lendingPoolInfoAccount.toBytes(),
    ...vaultKeys.vaultFranciumCollateralTokenAccount.toBytes(),
  ]);

  const HASH_LEN = 16;
  const hashes = [
    createHash().update(depositData).digest().slice(0, HASH_LEN),
    createHash().update(withdrawData).digest().slice(0, HASH_LEN),
    createHash().update(tvlData).digest().slice(0, HASH_LEN),
  ];

  return program.methods
    .setHashes(Protocols.Francium, hashes)
    .accounts({
      userSigner: program.user,
      vaultAccount: vaultKeys.vaultAccount,
    })
    .transaction();
}

export async function deposit(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const franciumKeys = franciumKeysAll[tokenInput];

  return program.methods
    .franciumDeposit()
    .accounts({
      genericAccs: genericAcccounts,
      instructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      franciumLendingProgramId: franciumKeys.lendingProgram,
      vaultFranciumCollateralTokenAccount:
        vaultKeys.vaultFranciumCollateralTokenAccount,
      franciumLendingPoolInfoAccount: franciumKeys.lendingPoolInfoAccount,
      franciumLendingPoolTokenAccount: franciumKeys.lendingPoolTknAccount,
      franciumFarmingPoolStakeTokenMint: franciumKeys.farmingPoolStakeTknMint,
      franciumMarketInfoAccount: franciumKeys.marketInfoAccount,
      franciumLendingMarketAuthority: franciumKeys.lendingMarketAuthority,
    })
    .preInstructions([refreshLendingIx(tokenInput)])
    .transaction();
}

export async function withdraw(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  return withdrawBuilder(program, genericAcccounts).transaction();
}

function withdrawBuilder(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): MethodsBuilder<Idl, IdlInstruction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const franciumKeys = franciumKeysAll[tokenInput];

  return program.methods
    .franciumWithdraw()
    .accounts({
      genericAccs: genericAcccounts,
      franciumLendingProgramId: franciumKeys.lendingProgram,
      vaultFranciumCollateralTokenAccount:
        vaultKeys.vaultFranciumCollateralTokenAccount,
      franciumLendingPoolInfoAccount: franciumKeys.lendingPoolInfoAccount,
      franciumLendingPoolTokenAccount: franciumKeys.lendingPoolTknAccount,
      franciumFarmingPoolStakeTokenMint: franciumKeys.farmingPoolStakeTknMint,
      franciumMarketInfoAccount: franciumKeys.marketInfoAccount,
      franciumLendingMarketAuthority: franciumKeys.lendingMarketAuthority,
    })
    .preInstructions([refreshLendingIx(tokenInput)]);
}

export function tvl(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const franciumKeys = franciumKeysAll[tokenInput];
  const vaultKeys = program.vaultKeys[tokenInput];

  return program.methods
    .franciumTvl()
    .accounts({
      genericAccs: genericAcccounts,
      lendingPool: franciumKeys.lendingPoolInfoAccount,
      vaultFranciumCollateralTokenAccount:
        vaultKeys.vaultFranciumCollateralTokenAccount,
    })
    .preInstructions([refreshLendingIx(tokenInput)])
    .transaction();
}
