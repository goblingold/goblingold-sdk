import { BN, Idl, web3 } from "@project-serum/anchor";
import { IdlInstruction } from "@project-serum/anchor/dist/cjs/idl";
import { MethodsBuilder } from "@project-serum/anchor/dist/cjs/program/namespace/methods";
import { createHash } from "sha256-uint8array";
import { addressParser } from "../addressParser";
import { StrategyProgram } from "../program";
import { Protocols } from "../protocols";

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
