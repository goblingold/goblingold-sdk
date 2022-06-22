import { Idl, web3 } from "@project-serum/anchor";
import { IdlInstruction } from "@project-serum/anchor/dist/cjs/idl";
import { MethodsBuilder } from "@project-serum/anchor/dist/cjs/program/namespace/methods";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token-v2";
import BufferLayout from "buffer-layout";
import { createHash } from "sha256-uint8array";
import { addressParser } from "../addressParser";
import { StrategyProgram } from "../program";
import { Protocols } from "../protocols";

const refreshReserve = 3;

const tulipKeysAll = addressParser({
  group: "protocols",
  name: "tulip",
});

export async function initializeProtocol(
  program: StrategyProgram
): Promise<web3.Transaction | null> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const tulipKeys = tulipKeysAll[tokenInput];

  const vaultTulipCollateralTokenAccount = await getAssociatedTokenAddress(
    tulipKeys.collateralTokenMint,
    vaultKeys.vaultAccount,
    true
  );

  vaultKeys.vaultTulipCollateralTokenAccount = vaultTulipCollateralTokenAccount;

  if (
    await program.connection.getAccountInfo(vaultTulipCollateralTokenAccount)
  ) {
    console.log("tulip accounts already initialized");
    return null;
  } else {
    const tx = new web3.Transaction();
    tx.add(
      createAssociatedTokenAccountInstruction(
        program.user,
        vaultTulipCollateralTokenAccount,
        vaultKeys.vaultAccount,
        tulipKeys.collateralTokenMint
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
  const tulipKeys = tulipKeysAll[tokenInput];

  const depositData = new Uint8Array([
    ...vaultKeys.vaultTulipCollateralTokenAccount.toBytes(),
    ...tulipKeys.reserveAccount.toBytes(),
    ...tulipKeys.liquiditySupplyTokenAccount.toBytes(),
    ...tulipKeys.collateralTokenMint.toBytes(),
    ...tulipKeys.lendingMarketAccount.toBytes(),
    ...tulipKeys.reserveAuthority.toBytes(),
  ]);

  const withdrawData = new Uint8Array([
    ...vaultKeys.vaultTulipCollateralTokenAccount.toBytes(),
    ...tulipKeys.reserveAccount.toBytes(),
    ...tulipKeys.liquiditySupplyTokenAccount.toBytes(),
    ...tulipKeys.collateralTokenMint.toBytes(),
    ...tulipKeys.lendingMarketAccount.toBytes(),
    ...tulipKeys.reserveAuthority.toBytes(),
  ]);

  const tvlData = new Uint8Array([
    ...tulipKeys.reserveAccount.toBytes(),
    ...vaultKeys.vaultTulipCollateralTokenAccount.toBytes(),
  ]);

  const HASH_LEN = 16;
  const hashes = [
    createHash().update(depositData).digest().slice(0, HASH_LEN),
    createHash().update(withdrawData).digest().slice(0, HASH_LEN),
    createHash().update(tvlData).digest().slice(0, HASH_LEN),
  ];

  return program.methods
    .setHashes(Protocols.Tulip, hashes)
    .accounts({
      userSigner: program.user,
      vaultAccount: vaultKeys.vaultAccount,
    })
    .transaction();
}

export const refreshReserveIx = (
  tokenInput: string
): web3.TransactionInstruction => {
  const tulipKeys = tulipKeysAll[tokenInput];

  const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode({ instruction: refreshReserve }, data);

  const keys = [
    {
      isSigner: false,
      isWritable: true,
      pubkey: tulipKeys.reserveAccount,
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: tulipKeys.priceAccount,
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: web3.SYSVAR_CLOCK_PUBKEY,
    },
  ];

  return new web3.TransactionInstruction({
    keys,
    programId: tulipKeys.lendingProgram,
    data,
  });
};

export function deposit(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const tulipKeys = tulipKeysAll[tokenInput];

  return program.methods
    .tulipDeposit()
    .accounts({
      genericAccs: genericAcccounts,
      tulipProgramId: tulipKeys.lendingProgram,
      vaultTulipCollateralTokenAccount:
        vaultKeys.vaultTulipCollateralTokenAccount,
      tulipReserveAccount: tulipKeys.reserveAccount,
      tulipReserveLiquiditySupplyTokenAccount:
        tulipKeys.liquiditySupplyTokenAccount,
      tulipReserveCollateralTokenMint: tulipKeys.collateralTokenMint,
      tulipLendingMarketAccount: tulipKeys.lendingMarketAccount,
      tulipReserveAuthority: tulipKeys.reserveAuthority,
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

function withdrawBuilder(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): MethodsBuilder<Idl, IdlInstruction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const tulipKeys = tulipKeysAll[tokenInput];

  return program.methods
    .tulipWithdraw()
    .accounts({
      genericAccs: genericAcccounts,
      tulipProgramId: tulipKeys.lendingProgram,
      vaultTulipCollateralTokenAccount:
        vaultKeys.vaultTulipCollateralTokenAccount,
      tulipReserveAccount: tulipKeys.reserveAccount,
      tulipReserveLiquiditySupplyTokenAccount:
        tulipKeys.liquiditySupplyTokenAccount,
      tulipReserveCollateralTokenMint: tulipKeys.collateralTokenMint,
      tulipLendingMarketAccount: tulipKeys.lendingMarketAccount,
      tulipReserveAuthority: tulipKeys.reserveAuthority,
    })
    .preInstructions([refreshReserveIx(tokenInput)]);
}

export function tvl(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const tulipKeys = tulipKeysAll[tokenInput];
  const vaultKeys = program.vaultKeys[tokenInput];

  return program.methods
    .tulipTvl()
    .accounts({
      genericAccs: genericAcccounts,
      reserve: tulipKeys.reserveAccount,
      vaultTulipCollateralTokenAccount:
        vaultKeys.vaultTulipCollateralTokenAccount,
    })
    .preInstructions([refreshReserveIx(tokenInput)])
    .transaction();
}
