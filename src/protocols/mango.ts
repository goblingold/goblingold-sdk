import { BN, Idl, web3 } from "@project-serum/anchor";
import { IdlInstruction } from "@project-serum/anchor/dist/cjs/idl";
import { MethodsBuilder } from "@project-serum/anchor/dist/cjs/program/namespace/methods";
import { createHash } from "sha256-uint8array";
import { addressParser } from "../addressParser";
import { StrategyProgram } from "../program";
import { Protocols } from "../protocols";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token-v2";

const mangoKeysAll = addressParser({
  group: "protocols",
  name: "mango",
});

export async function initializeProtocol(
  program: StrategyProgram
): Promise<web3.Transaction | null> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const mangoKeys = mangoKeysAll[tokenInput];

  const accountNumber = new BN(1);
  const [vaultMangoAccount, _bump] = await web3.PublicKey.findProgramAddress(
    [
      mangoKeys.group.toBytes(),
      vaultKeys.vaultAccount.toBytes(),
      accountNumber.toBuffer("le", 8),
    ],
    mangoKeys.programId
  );

  vaultKeys.vaultMangoAccount = vaultMangoAccount;

  if (await program.connection.getAccountInfo(vaultMangoAccount)) {
    console.log("mango account already initialized");
    return null;
  } else {
    return program.methods
      .mangoInitialize()
      .accounts({
        userSigner: program.user,
        vaultAccount: vaultKeys.vaultAccount,
        vaultMangoAccount,
        mangoGroupAccount: mangoKeys.group,
        mangoProgramId: mangoKeys.programId,
        systemProgram: web3.SystemProgram.programId,
      })
      .transaction();
  }
}

export async function setHashes(
  program: StrategyProgram
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const mangoKeys = mangoKeysAll[tokenInput];

  const depositData = new Uint8Array([
    ...vaultKeys.vaultMangoAccount.toBytes(),
    ...mangoKeys.group.toBytes(),
    ...mangoKeys.cacheAccount.toBytes(),
    ...mangoKeys.rootBankAccount.toBytes(),
    ...mangoKeys.nodeBankAccount.toBytes(),
    ...mangoKeys.vaultAccount.toBytes(),
  ]);

  const withdrawData = new Uint8Array([
    ...vaultKeys.vaultMangoAccount.toBytes(),
    ...mangoKeys.cacheAccount.toBytes(),
    ...mangoKeys.group.toBytes(),
    ...mangoKeys.groupSignerAccount.toBytes(),
    ...mangoKeys.rootBankAccount.toBytes(),
    ...mangoKeys.nodeBankAccount.toBytes(),
    ...mangoKeys.vaultAccount.toBytes(),
  ]);

  const tvlData = new Uint8Array([
    ...vaultKeys.vaultMangoAccount.toBytes(),
    ...mangoKeys.group.toBytes(),
    ...mangoKeys.cacheAccount.toBytes(),
    ...mangoKeys.rootBankAccount.toBytes(),
  ]);

  const HASH_LEN = 16;
  const hashes = [
    createHash().update(depositData).digest().slice(0, HASH_LEN),
    createHash().update(withdrawData).digest().slice(0, HASH_LEN),
    createHash().update(tvlData).digest().slice(0, HASH_LEN),
  ];

  return program.methods
    .setHashes(Protocols.Mango, hashes)
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
  const mangoKeys = mangoKeysAll[tokenInput];

  return program.methods
    .mangoDeposit()
    .accounts({
      genericAccs: genericAcccounts,
      mangoProgramId: mangoKeys.programId,
      vaultMangoAccount: vaultKeys.vaultMangoAccount,
      mangoGroupAccount: mangoKeys.group,
      mangoCacheAccount: mangoKeys.cacheAccount,
      mangoRootBankAccount: mangoKeys.rootBankAccount,
      mangoNodeBankAccount: mangoKeys.nodeBankAccount,
      mangoVaultAccount: mangoKeys.vaultAccount,
    })
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
  const mangoKeys = mangoKeysAll[tokenInput];

  return program.methods.mangoWithdraw().accounts({
    genericAccs: genericAcccounts,
    mangoProgramId: mangoKeys.programId,
    vaultMangoAccount: vaultKeys.vaultMangoAccount,
    mangoGroupAccount: mangoKeys.group,
    mangoCacheAccount: mangoKeys.cacheAccount,
    mangoGroupSignerAccount: mangoKeys.groupSignerAccount,
    mangoRootBankAccount: mangoKeys.rootBankAccount,
    mangoNodeBankAccount: mangoKeys.nodeBankAccount,
    mangoVaultAccount: mangoKeys.vaultAccount,
    systemProgram: web3.SystemProgram.programId,
  });
}

export async function tvl(
  program: StrategyProgram,
  genericAcccounts: Record<string, web3.PublicKey>
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const mangoKeys = mangoKeysAll[tokenInput];

  return program.methods
    .mangoTvl()
    .accounts({
      genericAccs: genericAcccounts,
      vaultMangoAccount: vaultKeys.vaultMangoAccount,
      mangoGroupAccount: mangoKeys.group,
      mangoCacheAccount: mangoKeys.cacheAccount,
      mangoRootBankAccount: mangoKeys.rootBankAccount,
      defaultPubkey: web3.PublicKey.default,
    })
    .transaction();
}

export async function mangoReimbursement(
  program: StrategyProgram,
  tokenMint: web3.PublicKey,
  tokenIndex: number,
  indexIntoTable: BN
): Promise<web3.Transaction> {
  const tokenInput = program.tokenInput;
  const vaultKeys = program.vaultKeys[tokenInput];
  const mangoKeys = mangoKeysAll[tokenInput];

  const group = new web3.PublicKey(
    "Hy4ZsZkVa1ZTVa2ghkKY3TsThYEK9MgaL8VPF569jsHP"
  );
  const [reimbursementAccount, _bump] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("ReimbursementAccount"),
      group.toBuffer(),
      vaultKeys.vaultAccount.toBuffer(),
    ],
    mangoKeys.reimbursementProgram
  );

  const associated = await getAssociatedTokenAddress(
    mangoKeys.claimMint,
    mangoKeys.reimbursementGroup,
    true
  );

  const tx = new web3.Transaction()
    .add(
      createAssociatedTokenAccountInstruction(
        program.user,
        associated,
        mangoKeys.reimbursementGroup,
        mangoKeys.claimMint
      )
    )
    .add(
      await program.methods
        .mangoReimbursement(new BN(tokenIndex), indexIntoTable)
        .accounts({
          userSigner: program.user,
          group,
          claimMint: mangoKeys.claimMint,
          vaultTokenAccount: mangoKeys.reimbursementVault,
          tokenAccount: vaultKeys.vaultInputTokenAccount,
          reimbursementAccount,
          mangoAccountOwner: vaultKeys.vaultAccount,
          claimMintTokenAccount: associated,
          table: mangoKeys.table,
          vaultAccount: vaultKeys.vaultAccount,

          mangoV3Reimbursement: mangoKeys.reimbursementProgram,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .transaction()
    );

  return tx;
}
