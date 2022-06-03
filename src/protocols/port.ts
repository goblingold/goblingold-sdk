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

const portKeysAll = addressParser({
  group: "protocols",
  name: "port",
});

export async function initializeProtocol(
  program: StrategyProgram
): Promise<web3.Transaction | null> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const portKeys = portKeysAll[tokenInput];

  const vaultPortCollateralTokenAccount = await getAssociatedTokenAddress(
    portKeys.reserveCollateralMintAccount,
    vaultKeys.vaultAccount,
    true
  );

  vaultKeys.vaultPortCollateralTokenAccount = vaultPortCollateralTokenAccount;
  if (
    await program.connection.getAccountInfo(
      vaultPortCollateralTokenAccount
    )
  ) {
    console.log("port accounts already initialized");
    return null;
  } else {
    const tx = new web3.Transaction();
    tx.add(
      createAssociatedTokenAccountInstruction(
        program.user,
        vaultPortCollateralTokenAccount,
        vaultKeys.vaultAccount,
        portKeys.reserveCollateralMintAccount
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
  const portKeys = portKeysAll[tokenInput];

  const depositData = new Uint8Array([
    ...vaultKeys.vaultPortCollateralTokenAccount.toBytes(),
    ...portKeys.reserveAccount.toBytes(),
    ...portKeys.reserveLiquiditySupplyAccount.toBytes(),
    ...portKeys.reserveCollateralMintAccount.toBytes(),
    ...portKeys.lendingMarketAccount.toBytes(),
    ...portKeys.lendingMarketAuthorityAccount.toBytes(),
  ]);

  const withdrawData = new Uint8Array([
    ...vaultKeys.vaultPortCollateralTokenAccount.toBytes(),
    ...portKeys.reserveAccount.toBytes(),
    ...portKeys.reserveLiquiditySupplyAccount.toBytes(),
    ...portKeys.reserveCollateralMintAccount.toBytes(),
    ...portKeys.lendingMarketAccount.toBytes(),
    ...portKeys.lendingMarketAuthorityAccount.toBytes(),
  ]);

  const tvlData = new Uint8Array([
    ...portKeys.reserveAccount.toBytes(),
    ...vaultKeys.vaultPortCollateralTokenAccount.toBytes(),
  ]);

  const HASH_LEN = 16;
  const hashes = [
    createHash().update(depositData).digest().slice(0, HASH_LEN),
    createHash().update(withdrawData).digest().slice(0, HASH_LEN),
    createHash().update(tvlData).digest().slice(0, HASH_LEN),
  ];

  return program.methods
    .setHashes(Protocols.Port, hashes)
    .accounts({
      userSigner: program.user,
      vaultAccount: vaultKeys.vaultAccount,
    })
    .transaction();
}

export const refreshReserveIx = (
  tokenInput: string
): web3.TransactionInstruction => {
  const portKeys = portKeysAll[tokenInput];

  let oracle: web3.PublicKey | string = "";
  if (tokenInput !== "USDC") {
    oracle = portKeys.oracleAccount;
  }

  return refreshReserveInstruction({
    programId: portKeys.lendingProgramId,
    reserve: portKeys.reserveAccount,
    oracle,
  });
};

const refreshReserve = 3;

// https://docs.rs/port-variable-rate-lending-instructions/0.2.4/src/port_variable_rate_lending_instructions/instruction.rs.html#411
function refreshReserveInstruction({ programId, reserve, oracle }) {
  const DataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);
  const data = Buffer.alloc(DataLayout.span);
  DataLayout.encode({ instruction: refreshReserve }, data);

  const keys = [
    { pubkey: reserve, isSigner: false, isWritable: true },
    {
      pubkey: web3.SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  if (oracle.length != "") {
    keys.push({ pubkey: oracle, isSigner: false, isWritable: false });
  }

  return new web3.TransactionInstruction({
    keys,
    programId,
    data,
  });
}

export function deposit(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const portKeys = portKeysAll[tokenInput];

  return program.methods
    .portDeposit()
    .accounts({
      genericAccs: genericAcccounts,
      portLendingProgramId: portKeys.lendingProgramId,
      vaultPortCollateralTokenAccount:
        vaultKeys.vaultPortCollateralTokenAccount,
      portReserveAccount: portKeys.reserveAccount,
      portReserveLiquiditySupplyAccount: portKeys.reserveLiquiditySupplyAccount,
      portReserveCollateralMintAccount: portKeys.reserveCollateralMintAccount,
      portLendingMarketAccount: portKeys.lendingMarketAccount,
      portLendingMarketAuthorityAccount: portKeys.lendingMarketAuthorityAccount,
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
  const portKeys = portKeysAll[tokenInput];

  return program.methods
    .portWithdraw()
    .accounts({
      genericAccs: genericAcccounts,
      portLendingProgramId: portKeys.lendingProgramId,
      vaultPortCollateralTokenAccount:
        vaultKeys.vaultPortCollateralTokenAccount,
      portReserveAccount: portKeys.reserveAccount,
      portReserveLiquiditySupplyAccount: portKeys.reserveLiquiditySupplyAccount,
      portReserveCollateralMintAccount: portKeys.reserveCollateralMintAccount,
      portLendingMarketAccount: portKeys.lendingMarketAccount,
      portLendingMarketAuthorityAccount: portKeys.lendingMarketAuthorityAccount,
    })
    .preInstructions([refreshReserveIx(tokenInput)]);
}

export function tvl(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const portKeys = portKeysAll[tokenInput];
  const vaultKeys = program.vaultKeys[tokenInput];

  return program.methods
    .portTvl()
    .accounts({
      genericAccs: genericAcccounts,
      reserve: portKeys.reserveAccount,
      vaultPortCollateralTokenAccount:
        vaultKeys.vaultPortCollateralTokenAccount,
    })
    .preInstructions([refreshReserveIx(tokenInput)])
    .transaction();
}
