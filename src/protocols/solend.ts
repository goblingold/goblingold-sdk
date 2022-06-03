import { Idl, web3 } from "@project-serum/anchor";
import { IdlInstruction } from "@project-serum/anchor/dist/cjs/idl";
import { MethodsBuilder } from "@project-serum/anchor/dist/cjs/program/namespace/methods";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import BufferLayout from "buffer-layout";
import { createHash } from "sha256-uint8array";
import { addressParser } from "../addressParser";
import { StrategyProgram } from "../program";
import { Protocols } from "../protocols";

const solendKeysAll = addressParser({
  group: "protocols",
  name: "solend",
});

const refreshReserve = 3;

export async function initializeProtocol(
  program: StrategyProgram
): Promise<web3.Transaction | null> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const solendKeys = solendKeysAll[tokenInput];

  const vaultSolendCollateralTokenAccount = await getAssociatedTokenAddress(
    solendKeys.reserveCollateralSplTokenMint,
    vaultKeys.vaultAccount,
    true
  );

  vaultKeys.vaultSolendCollateralTokenAccount =
    vaultSolendCollateralTokenAccount;

  if (
    await program.connection.getAccountInfo(
      vaultSolendCollateralTokenAccount
    )
  ) {
    console.log("solend accounts already initialized");
    return null;
  } else {
    const tx = new web3.Transaction();
    tx.add(
      createAssociatedTokenAccountInstruction(
        program.user,
        vaultSolendCollateralTokenAccount,
        vaultKeys.vaultAccount,
        solendKeys.reserveCollateralSplTokenMint
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
  const solendKeys = solendKeysAll[tokenInput];

  const depositData = new Uint8Array([
    ...vaultKeys.vaultSolendCollateralTokenAccount.toBytes(),
    ...solendKeys.reserveAccount.toBytes(),
    ...solendKeys.reserveLiquiditySupplySplTokenAccount.toBytes(),
    ...solendKeys.reserveCollateralSplTokenMint.toBytes(),
    ...solendKeys.lendingMarketAccount.toBytes(),
    ...solendKeys.derivedLendingMarketAuthority.toBytes(),
  ]);

  const withdrawData = new Uint8Array([
    ...vaultKeys.vaultSolendCollateralTokenAccount.toBytes(),
    ...solendKeys.reserveAccount.toBytes(),
    ...solendKeys.lendingMarketAccount.toBytes(),
    ...solendKeys.derivedLendingMarketAuthority.toBytes(),
    ...solendKeys.reserveCollateralSplTokenMint.toBytes(),
    ...solendKeys.reserveLiquiditySupplySplTokenAccount.toBytes(),
  ]);

  const tvlData = new Uint8Array([
    ...solendKeys.reserveAccount.toBytes(),
    ...vaultKeys.vaultSolendCollateralTokenAccount.toBytes(),
  ]);

  const HASH_LEN = 16;
  const hashes = [
    createHash().update(depositData).digest().slice(0, HASH_LEN),
    createHash().update(withdrawData).digest().slice(0, HASH_LEN),
    createHash().update(tvlData).digest().slice(0, HASH_LEN),
  ];

  return program.methods
    .setHashes(Protocols.Solend, hashes)
    .accounts({
      userSigner: program.user,
      vaultAccount: vaultKeys.vaultAccount,
    })
    .transaction();
}

export const refreshReserveIx = (
  tokenInput: string
): web3.TransactionInstruction => {
  const solendKeys = solendKeysAll[tokenInput];
  return refreshReserveInstruction(
    solendKeys.programId,
    solendKeys.reserveAccount,
    solendKeys.pythPriceOracleAccount,
    solendKeys.switchboardPriceFeedOracleAccount
  );
};

// https://github.com/solendprotocol/liquidator/blob/main/src/models/instructions/refreshReserve.ts
/// Accrue interest and update market price of liquidity on a reserve.
/// Accounts expected by this instruction:
///   0. `[writable]` Reserve account.
///   1. `[]` Clock sysvar.
///   2. `[optional]` Reserve liquidity oracle account.
///                     Required if the reserve currency is not the lending market quote
///                     currency.
const refreshReserveInstruction = (
  programId: web3.PublicKey,
  reserve: web3.PublicKey,
  oracle?: web3.PublicKey,
  switchboardFeedAddress?: web3.PublicKey
): web3.TransactionInstruction => {
  const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode({ instruction: refreshReserve }, data);

  const keys = [{ pubkey: reserve, isSigner: false, isWritable: true }];

  if (oracle) {
    keys.push({ pubkey: oracle, isSigner: false, isWritable: false });
  }

  if (switchboardFeedAddress) {
    keys.push({
      pubkey: switchboardFeedAddress,
      isSigner: false,
      isWritable: false,
    });
  }

  keys.push({
    pubkey: web3.SYSVAR_CLOCK_PUBKEY,
    isSigner: false,
    isWritable: false,
  });

  return new web3.TransactionInstruction({
    keys,
    programId,
    data,
  });
};

export function deposit(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const solendKeys = solendKeysAll[tokenInput];

  return program.methods
    .solendDeposit()
    .accounts({
      genericAccs: genericAcccounts,
      solendProgramId: solendKeys.programId,
      vaultSolendCollateralTokenAccount:
        vaultKeys.vaultSolendCollateralTokenAccount,
      solendReserveAccount: solendKeys.reserveAccount,
      solendReserveLiquiditySupplySplTokenAccount:
        solendKeys.reserveLiquiditySupplySplTokenAccount,
      solendReserveCollateralSplTokenMint:
        solendKeys.reserveCollateralSplTokenMint,
      solendLendingMarketAccount: solendKeys.lendingMarketAccount,
      solendDerivedLendingMarketAuthority:
        solendKeys.derivedLendingMarketAuthority,
    })
    .preInstructions([refreshReserveIx(tokenInput)])
    .transaction();
}

export async function withdraw(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  return withdrawBuilder(program, genericAcccounts).transaction();
}

export function withdrawBuilder(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): MethodsBuilder<Idl, IdlInstruction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const solendKeys = solendKeysAll[tokenInput];

  return program.methods
    .solendWithdraw()
    .accounts({
      genericAccs: genericAcccounts,
      solendProgramId: solendKeys.programId,
      vaultSolendCollateralTokenAccount:
        vaultKeys.vaultSolendCollateralTokenAccount,
      solendReserveAccount: solendKeys.reserveAccount,
      solendLendingMarketAccount: solendKeys.lendingMarketAccount,
      solendDerivedLendingMarketAuthority:
        solendKeys.derivedLendingMarketAuthority,
      solendReserveCollateralSplTokenMint:
        solendKeys.reserveCollateralSplTokenMint,
      solendReserveLiquiditySupplySplTokenAccount:
        solendKeys.reserveLiquiditySupplySplTokenAccount,
    })
    .preInstructions([refreshReserveIx(tokenInput)]);
}

export function tvl(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const solendKeys = solendKeysAll[tokenInput];
  const vaultKeys = program.vaultKeys[tokenInput];

  return program.methods
    .solendTvl()
    .accounts({
      genericAccs: genericAcccounts,
      reserve: solendKeys.reserveAccount,
      vaultSolendCollateralTokenAccount:
        vaultKeys.vaultSolendCollateralTokenAccount,
    })
    .preInstructions([refreshReserveIx(tokenInput)])
    .transaction();
}
