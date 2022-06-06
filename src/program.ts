import {
  Address,
  AnchorProvider,
  BN,
  BorshEventCoder,
  Idl,
  Program,
  web3,
} from "@project-serum/anchor";
import { IdlInstruction } from "@project-serum/anchor/dist/cjs/idl";
import { MethodsBuilder } from "@project-serum/anchor/dist/cjs/program/namespace/methods";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { addressParser } from "./addressParser";
import { DAO_TREASURY_OWNER } from "./client";
import { TOKENS } from "./data/tokens";
import {
  DecodeMultipleAccountsParams,
  decodeMultipleAccounts,
} from "./decoder";
import { getPrice, getPrices } from "./prices";
import { Protocols } from "./protocols";
import * as francium from "./protocols/francium";
import * as mango from "./protocols/mango";
import * as port from "./protocols/port";
import * as solend from "./protocols/solend";
import * as solendStablePool from "./protocols/solendStablePool";
import * as tulip from "./protocols/tulip";
import { getMintAddress } from "./tokensParser";

function sortedIndices(list) {
  const len = list.length;
  const indices = new Array(len);
  for (let i = 0; i < len; ++i) indices[i] = i;
  indices.sort(function (a, b) {
    return list[a].lt(list[b]) ? -1 : 1;
  });
  return indices;
}

// TODO read this const from idl
const WEIGHTS_SCALE = 10_000;

type DepositVaultParams = {
  userInputTokenAccount: web3.PublicKey;
  userLpTokenAccount: web3.PublicKey;
  amount: BN;
};

type DepositFromNativeParams = {
  userWrappedAccount: web3.PublicKey;
  userLpTokenAccount: web3.PublicKey;
  amount: BN;
};

type WithdrawVaultParams = {
  userInputTokenAccount: web3.PublicKey;
  userLpTokenAccount: web3.PublicKey;
  lpAmount: BN;
};

type CreateVaultUserTicketParams = {
  userSigner: web3.PublicKey;
  userTicketAccountOwner: web3.PublicKey;
};

type OpenWithdrawTicketParams = {
  userLpTokenAccount: web3.PublicKey;
  lpAmount: BN;
};

type CloseWithdrawTicketParams = {
  userInputTokenAccount: web3.PublicKey;
  lpAmount: BN;
};

// TODO should be exported in client and used here
export class TokenProgram extends Program {
  tokenInput = "WSOL";
  connection: web3.Connection;
  user: web3.PublicKey;

  public constructor(
    idl: Idl,
    programId: Address,
    provider: AnchorProvider,
    user?: PublicKey
  ) {
    super(idl, programId, provider);
    this.connection = provider?.connection;
    this.user = user ?? provider?.wallet?.publicKey;
  }

  public setToken(token: string) {
    if (Object.entries(TOKENS).some(([tkn, _tokenInfo]) => tkn === token)) {
      this.tokenInput = token;
    } else {
      throw "Token " + token + " does not exist :";
    }
  }

  public decodeEvent(rawEvent: string): object {
    const dec = new BorshEventCoder(this.idl);
    const event = dec.decode(rawEvent);
    if (!event) {
      throw "Cannot decode event " + rawEvent;
    }
    return event;
  }
}

export class StrategyProgram extends TokenProgram {
  vaultKeys = addressParser({
    group: "strategies",
    name: "bestApy",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async decodeVault(token: string = this.tokenInput): Promise<any> {
    const vaultAccountInfo = await this.connection.getAccountInfo(
      this.vaultKeys[token].vaultAccount
    );
    if (!vaultAccountInfo) {
      throw new Error("Vault account does not exist");
    }
    return this.coder.accounts.decode("VaultAccount", vaultAccountInfo.data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async decodeVaults(): Promise<any> {
    const accounts: DecodeMultipleAccountsParams[] = [];
    for (const token of Object.keys(TOKENS)) {
      const publicKey = this.vaultKeys[token].vaultAccount;
      if (publicKey) {
        accounts.push({
          accountType: "Vault",
          publicKey,
        });
      }
    }
    return decodeMultipleAccounts(this, accounts);
  }

  async lpToAmount(lpAmount: BN): Promise<BN> {
    const vaultKeys = this.vaultKeys[this.tokenInput];
    const accounts = [
      { accountType: "Vault", publicKey: vaultKeys.vaultAccount },
      { accountType: "Mint", publicKey: vaultKeys.vaultLpTokenMintAddress },
    ];
    const [vault, mint] = await decodeMultipleAccounts(this, accounts);
    // spl-token uses bigint
    mint.supply = new BN(mint.supply);
    return this.lpToAmountDecoded(lpAmount, vault.currentTvl, mint.supply);
  }

  lpToAmountDecoded(lpAmount: BN, currentTvl: BN, supply: BN): BN {
    return lpAmount.mul(currentTvl).div(supply);
  }

  async amountToLp(amount: BN): Promise<BN> {
    const vaultKeys = this.vaultKeys[this.tokenInput];
    const accounts = [
      { accountType: "Vault", publicKey: vaultKeys.vaultAccount },
      { accountType: "Mint", publicKey: vaultKeys.vaultLpTokenMintAddress },
    ];
    const [vault, mint] = await decodeMultipleAccounts(this, accounts);
    // spl-token uses bigint
    mint.supply = new BN(mint.supply);
    return this.amountToLpDecoded(amount, vault.currentTvl, mint.supply);
  }

  amountToLpDecoded(amount: BN, currentTvl: BN, supply: BN): BN {
    return amount.mul(supply).div(currentTvl);
  }

  async initializeVault(accountNumber: BN): Promise<web3.Transaction | null> {
    const tokenMint = getMintAddress(this.tokenInput);

    const [vaultAccount, _bump] = await web3.PublicKey.findProgramAddress(
      [
        Buffer.from("vault"),
        accountNumber.toBuffer("le", 1),
        tokenMint.toBuffer(),
      ],
      this.programId
    );

    const [vaultLpTokenMintAddress, _bump2] =
      await web3.PublicKey.findProgramAddress(
        [Buffer.from("mint"), vaultAccount.toBuffer()],
        this.programId
      );

    const vaultInputTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      vaultAccount,
      true
    );

    // DAO treasury associated with deployer authority
    const daoTreasuryLpTokenAccount = await getAssociatedTokenAddress(
      vaultLpTokenMintAddress,
      DAO_TREASURY_OWNER,
      false
    );

    this.vaultKeys[this.tokenInput].vaultAccount = vaultAccount;
    this.vaultKeys[this.tokenInput].vaultLpTokenMintAddress =
      vaultLpTokenMintAddress;
    this.vaultKeys[this.tokenInput].vaultInputTokenAccount =
      vaultInputTokenAccount;
    this.vaultKeys[this.tokenInput].daoTreasuryLpTokenAccount =
      daoTreasuryLpTokenAccount;

    if (await this.connection.getAccountInfo(vaultAccount)) {
      console.log("vault accounts already initialized");
      return null;
    } else {
      return this.methods
        .initializeVault(accountNumber)
        .accounts({
          userSigner: this.user,
          inputTokenMintAddress: tokenMint,
          vaultAccount,
          vaultLpTokenMintPubkey: vaultLpTokenMintAddress,
          vaultInputTokenAccount,
          daoTreasuryLpTokenAccount,
          daoTreasuryOwner: DAO_TREASURY_OWNER,
          systemProgram: web3.SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .transaction();
    }
  }

  async initializeTicketMint(): Promise<web3.Transaction | null> {
    const vaultKeys = this.vaultKeys[this.tokenInput];

    const vaultLpTokenAccount = await getAssociatedTokenAddress(
      vaultKeys.vaultLpTokenMintAddress,
      vaultKeys.vaultAccount,
      true
    );

    const [vaultTicketMintPubkey, _bump] =
      await web3.PublicKey.findProgramAddress(
        [Buffer.from("ticket_mint"), vaultKeys.vaultAccount.toBuffer()],
        this.programId
      );

    this.vaultKeys[this.tokenInput].vaultLpTokenAccount = vaultLpTokenAccount;
    this.vaultKeys[this.tokenInput].vaultTicketMintPubkey =
      vaultTicketMintPubkey;

    if (await this.connection.getAccountInfo(vaultTicketMintPubkey)) {
      console.log("ticket_mint account already initialized");
      return null;
    } else {
      const tx = new web3.Transaction()
        .add(
          createAssociatedTokenAccountInstruction(
            this.user,
            vaultLpTokenAccount,
            vaultKeys.vaultAccount,
            vaultKeys.vaultLpTokenMintAddress
          )
        )
        .add(
          await this.methods
            .initializeTicketMint()
            .accounts({
              userSigner: this.user,
              vaultAccount: vaultKeys.vaultAccount,
              vaultLpTokenMintPubkey: vaultKeys.vaultLpTokenMintAddress,
              vaultTicketMintPubkey,
              systemProgram: web3.SystemProgram.programId,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .transaction()
        );
      return tx;
    }
  }

  async createVaultUserTicketAccount(
    params: CreateVaultUserTicketParams
  ): Promise<web3.TransactionInstruction | null> {
    const vaultKeys = this.vaultKeys[this.tokenInput];

    const [vaultUserTicketAccount, _bump] =
      web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("ticket_mint"),
          vaultKeys.vaultTicketMintPubkey.toBuffer(),
          this.user.toBuffer(),
        ],
        this.programId
      );

    return this.methods
      .createVaultUserTicketAccount()
      .accounts({
        userSigner: params.userSigner,
        userTicketAccountOwner: params.userTicketAccountOwner,
        vaultUserTicketAccount,
        vaultAccount: vaultKeys.vaultAccount,
        vaultTicketMintPubkey: vaultKeys.vaultTicketMintPubkey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  }

  async setProtocolWeights(weights: number[]): Promise<web3.Transaction> {
    const sum = weights.reduce((acc, x) => acc + x, 0);
    if (sum != 0 && sum != WEIGHTS_SCALE) {
      throw new Error("Invalid protocol weights values");
    }

    const vaultKeys = this.vaultKeys[this.tokenInput];
    return this.methods
      .setProtocolWeights(weights)
      .accounts({
        userSigner: this.user,
        vaultAccount: vaultKeys.vaultAccount,
      })
      .transaction();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setRefreshParams(refreshParams: any): Promise<web3.Transaction> {
    return this.methods
      .setRefreshParams(refreshParams)
      .accounts({
        userSigner: this.user,
        vaultAccount: this.vaultKeys[this.tokenInput].vaultAccount,
      })
      .transaction();
  }

  async initializeProtocolAccounts(): Promise<Array<web3.Transaction | null>> {
    const vaultData = await this.decodeVault();
    const txs: Array<web3.Transaction | null> = [];
    for (const data of vaultData.protocols) {
      if (data.weight != 0) {
        switch (data.protocolId) {
          case Protocols.Mango:
            txs.push(await mango.initializeProtocol(this));
            break;
          case Protocols.Port:
            txs.push(await port.initializeProtocol(this));
            break;
          case Protocols.Solend:
            txs.push(await solend.initializeProtocol(this));
            break;
          case Protocols.Tulip:
            txs.push(await tulip.initializeProtocol(this));
            break;
          case Protocols.Francium:
            txs.push(await francium.initializeProtocol(this));
            break;
          case Protocols.SolendStablePool:
            txs.push(await solendStablePool.initializeProtocol(this));
            break;
        }
      }
    }
    return txs;
  }

  async setHashes(): Promise<web3.Transaction[]> {
    const vaultData = await this.decodeVault();
    const txs: web3.Transaction[] = [];
    for (const data of vaultData.protocols) {
      if (data.weight != 0) {
        switch (data.protocolId) {
          case Protocols.Mango:
            txs.push(await mango.setHashes(this));
            break;
          case Protocols.Port:
            txs.push(await port.setHashes(this));
            break;
          case Protocols.Solend:
            txs.push(await solend.setHashes(this));
            break;
          case Protocols.Tulip:
            txs.push(await tulip.setHashes(this));
            break;
          case Protocols.Francium:
            txs.push(await francium.setHashes(this));
            break;
          case Protocols.SolendStablePool:
            txs.push(await solendStablePool.setHashes(this));
            break;
        }
      }
    }
    return txs;
  }

  async deposit(params: DepositVaultParams): Promise<web3.Transaction> {
    return this.depositBuilder(params).transaction();
  }

  async getDepositIx(
    params: DepositVaultParams
  ): Promise<web3.TransactionInstruction> {
    return this.depositBuilder(params).instruction();
  }

  depositBuilder(
    params: DepositVaultParams
  ): MethodsBuilder<Idl, IdlInstruction> {
    const vaultKeys = this.vaultKeys[this.tokenInput];

    return this.methods.deposit(params.amount).accounts({
      userSigner: this.user,
      userInputTokenAccount: params.userInputTokenAccount,
      userLpTokenAccount: params.userLpTokenAccount,
      vaultAccount: vaultKeys.vaultAccount,
      vaultLpTokenMintPubkey: vaultKeys.vaultLpTokenMintAddress,
      vaultInputTokenAccount: vaultKeys.vaultInputTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    });
  }

  async depositFromNative(
    params: DepositFromNativeParams
  ): Promise<web3.Transaction> {
    return this.depositFromNativeBuilder(params).transaction();
  }

  async getDepositFromNativeIx(
    params: DepositFromNativeParams
  ): Promise<web3.TransactionInstruction> {
    return this.depositFromNativeBuilder(params).instruction();
  }

  depositFromNativeBuilder(
    params: DepositFromNativeParams
  ): MethodsBuilder<Idl, IdlInstruction> {
    const vaultKeys = this.vaultKeys[this.tokenInput];

    return this.methods.depositFromNative(params.amount).accounts({
      userSigner: this.user,
      userWrappedAccount: params.userWrappedAccount,
      userLpTokenAccount: params.userLpTokenAccount,
      vaultAccount: vaultKeys.vaultAccount,
      vaultLpTokenMintPubkey: vaultKeys.vaultLpTokenMintAddress,
      vaultInputTokenAccount: vaultKeys.vaultInputTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    });
  }

  async rebalance(): Promise<[web3.Transaction[], web3.Transaction[]]> {
    enum RebalanceActions {
      Deposit,
      Withdraw,
    }

    const vaultData = await this.decodeVault();
    const amount = vaultData.currentTvl;

    const protocolActions: [Protocols, RebalanceActions][] = [];
    vaultData.protocols.forEach((data) => {
      const protocolId = data.protocolId;
      const weight = new BN(data.weight);
      const currentDeposit = data.amount;
      const targetDeposit = amount.mul(weight).div(new BN(WEIGHTS_SCALE));

      if (currentDeposit.gt(targetDeposit)) {
        protocolActions.push([protocolId, RebalanceActions.Withdraw]);
      } else if (currentDeposit.lt(targetDeposit)) {
        protocolActions.push([protocolId, RebalanceActions.Deposit]);
      }
    });

    const vaultKeys = this.vaultKeys[this.tokenInput];
    const genericDepositAccounts = {
      vaultAccount: vaultKeys.vaultAccount,
      vaultInputTokenAccount: vaultKeys.vaultInputTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      clock: web3.SYSVAR_CLOCK_PUBKEY,
    };

    const genericWithdrawAccounts = {
      vaultAccount: vaultKeys.vaultAccount,
      vaultInputTokenAccount: vaultKeys.vaultInputTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      clock: web3.SYSVAR_CLOCK_PUBKEY,
      instructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
    };

    // Make withdraws first
    const txsW: web3.Transaction[] = [];
    for (const [protocolId, action] of protocolActions) {
      if (action === RebalanceActions.Withdraw) {
        switch (protocolId) {
          case Protocols.Mango:
            txsW.push(await mango.withdraw(this, genericWithdrawAccounts));
            break;
          case Protocols.Solend:
            txsW.push(await solend.withdraw(this, genericWithdrawAccounts));
            break;
          case Protocols.Port:
            txsW.push(await port.withdraw(this, genericWithdrawAccounts));
            break;
          case Protocols.Tulip:
            txsW.push(await tulip.withdraw(this, genericWithdrawAccounts));
            break;
          case Protocols.Francium:
            txsW.push(await francium.withdraw(this, genericWithdrawAccounts));
            break;
          case Protocols.SolendStablePool:
            txsW.push(
              await solendStablePool.withdraw(this, genericWithdrawAccounts)
            );
            break;
        }
      }
    }

    const txsD: web3.Transaction[] = [];
    for (const [protocolId, action] of protocolActions) {
      if (action === RebalanceActions.Deposit) {
        switch (protocolId) {
          case Protocols.Mango:
            txsD.push(await mango.deposit(this, genericDepositAccounts));
            break;
          case Protocols.Solend:
            txsD.push(await solend.deposit(this, genericDepositAccounts));
            break;
          case Protocols.Port:
            txsD.push(await port.deposit(this, genericDepositAccounts));
            break;
          case Protocols.Tulip:
            txsD.push(await tulip.deposit(this, genericDepositAccounts));
            break;
          case Protocols.Francium:
            txsD.push(await francium.deposit(this, genericDepositAccounts));
            break;
          case Protocols.SolendStablePool:
            txsD.push(
              await solendStablePool.deposit(this, genericDepositAccounts)
            );
            break;
        }
      }
    }

    return [txsW, txsD];
  }

  async openWithdrawTicket(
    params: OpenWithdrawTicketParams
  ): Promise<web3.Transaction> {
    return this.openWithdrawTicketBuilder(params).transaction();
  }

  async getOpenWithdrawTicketIx(
    params: OpenWithdrawTicketParams
  ): Promise<web3.TransactionInstruction> {
    return this.openWithdrawTicketBuilder(params).instruction();
  }

  openWithdrawTicketBuilder(
    params: OpenWithdrawTicketParams
  ): MethodsBuilder<Idl, IdlInstruction> {
    const vaultKeys = this.vaultKeys[this.tokenInput];

    const [vaultUserTicketAccount, bump] =
      web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("ticket_mint"),
          vaultKeys.vaultTicketMintPubkey.toBuffer(),
          this.user.toBuffer(),
        ],
        this.programId
      );

    return this.methods.openWithdrawTicket(bump, params.lpAmount).accounts({
      userSigner: this.user,
      userLpTokenAccount: params.userLpTokenAccount,
      vaultUserTicketAccount,
      vaultAccount: vaultKeys.vaultAccount,
      vaultLpTokenMintPubkey: vaultKeys.vaultLpTokenMintAddress,
      vaultTicketMintPubkey: vaultKeys.vaultTicketMintPubkey,
      vaultLpTokenAccount: vaultKeys.vaultLpTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    });
  }

  async withdrawFromProtocolsAmountsAndTxs(
    lpAmount
  ): Promise<[BN, web3.Transaction][]> {
    const vaultKeys = this.vaultKeys[this.tokenInput];
    const accounts = [
      { accountType: "Vault", publicKey: vaultKeys.vaultAccount },
      { accountType: "Mint", publicKey: vaultKeys.vaultLpTokenMintAddress },
      { accountType: "Account", publicKey: vaultKeys.vaultInputTokenAccount },
    ];
    const [vault, mint, token] = await decodeMultipleAccounts(this, accounts);
    // spl-token uses bigint
    mint.supply = new BN(mint.supply);
    token.amount = new BN(token.amount);

    // Internally, the previous lp-price is used but this is more conservative
    const vaultInputTokenAmount = token.amount;
    const amount = this.lpToAmountDecoded(
      lpAmount,
      vault.currentTvl,
      mint.supply
    );

    const amountsAndTxs: [BN, web3.Transaction][] = [];
    if (amount.gt(vaultInputTokenAmount)) {
      const genericAccounts = {
        vaultAccount: vaultKeys.vaultAccount,
        vaultInputTokenAccount: vaultKeys.vaultInputTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
        instructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      };

      const protocolIds = vault.protocols.map((p) => p.protocolId);
      const deposited = vault.protocols.map((p) => p.amount);

      // Sort from higher to lower
      const reverseIndx = sortedIndices(deposited).reverse();

      let withdrawn = new BN(0);
      for (let i = 0; i < reverseIndx.length; ++i) {
        const protocolIdx = reverseIndx[i];

        let depositedAmount = deposited[protocolIdx];
        if (depositedAmount.eq(new BN(0))) continue;
        if (i == 0) {
          depositedAmount = depositedAmount.add(vaultInputTokenAmount);
        }

        const maxLpDeposited = this.amountToLpDecoded(
          depositedAmount,
          vault.currentTvl,
          mint.supply
        );

        let toWithdraw = lpAmount.sub(withdrawn);
        if (toWithdraw.gt(maxLpDeposited)) toWithdraw = maxLpDeposited;

        let tx: web3.Transaction = new web3.Transaction();
        switch (protocolIds[protocolIdx]) {
          case Protocols.Mango:
            tx = await mango.withdraw(this, genericAccounts);
            break;
          case Protocols.Solend:
            tx = await solend.withdraw(this, genericAccounts);
            break;
          case Protocols.Port:
            tx = await port.withdraw(this, genericAccounts);
            break;
          case Protocols.Tulip:
            tx = await tulip.withdraw(this, genericAccounts);
            break;
          case Protocols.Francium:
            tx = await francium.withdraw(this, genericAccounts);
            break;
          case Protocols.SolendStablePool:
            tx = await solendStablePool.withdraw(this, genericAccounts);
            break;
        }

        amountsAndTxs.push([toWithdraw, tx]);

        withdrawn = withdrawn.add(toWithdraw);
        if (lpAmount.lte(withdrawn)) {
          break;
        }
      }
    }

    return amountsAndTxs;
  }

  async closeWithdrawTicket(
    params: CloseWithdrawTicketParams
  ): Promise<web3.Transaction[]> {
    const vaultKeys = this.vaultKeys[this.tokenInput];

    const [vaultUserTicketAccount, bump] =
      web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("ticket_mint"),
          vaultKeys.vaultTicketMintPubkey.toBuffer(),
          this.user.toBuffer(),
        ],
        this.programId
      );

    const closeWithdrawTicketAccounts = {
      userSigner: this.user,
      userInputTokenAccount: params.userInputTokenAccount,
      vaultUserTicketAccount,
      vaultAccount: vaultKeys.vaultAccount,
      vaultLpTokenMintPubkey: vaultKeys.vaultLpTokenMintAddress,
      vaultTicketMintPubkey: vaultKeys.vaultTicketMintPubkey,
      vaultInputTokenAccount: vaultKeys.vaultInputTokenAccount,
      vaultLpTokenAccount: vaultKeys.vaultLpTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    };

    const amountsAndTxs = await this.withdrawFromProtocolsAmountsAndTxs(
      params.lpAmount
    );

    const txs: web3.Transaction[] = [];

    if (amountsAndTxs.length === 0) {
      txs.push(
        await this.methods
          .closeWithdrawTicket(bump, params.lpAmount)
          .accounts(closeWithdrawTicketAccounts)
          .transaction()
      );
    } else {
      for (const [lpAmount, txProtocol] of amountsAndTxs) {
        // Append the withdraw (from vault) tx
        txs.push(
          txProtocol.add(
            await this.methods
              .closeWithdrawTicket(bump, lpAmount)
              .accounts(closeWithdrawTicketAccounts)
              .transaction()
          )
        );
      }
    }

    return txs;
  }

  async withdraw(params: WithdrawVaultParams): Promise<web3.Transaction[]> {
    const vaultKeys = this.vaultKeys[this.tokenInput];

    const withdrawAccounts = {
      userSigner: this.user,
      userLpTokenAccount: params.userLpTokenAccount,
      userInputTokenAccount: params.userInputTokenAccount,
      vaultAccount: vaultKeys.vaultAccount,
      vaultInputTokenAccount: vaultKeys.vaultInputTokenAccount,
      vaultLpTokenMintPubkey: vaultKeys.vaultLpTokenMintAddress,
      tokenProgram: TOKEN_PROGRAM_ID,
    };

    const amountsAndTxs = await this.withdrawFromProtocolsAmountsAndTxs(
      params.lpAmount
    );

    const txs: web3.Transaction[] = [];

    if (amountsAndTxs.length === 0) {
      txs.push(
        await this.methods
          .withdraw(params.lpAmount)
          .accounts(withdrawAccounts)
          .transaction()
      );
    } else {
      for (const [lpAmount, txProtocol] of amountsAndTxs) {
        // Append the withdraw (from vault) tx
        txs.push(
          txProtocol.add(
            await this.methods
              .withdraw(lpAmount)
              .accounts(withdrawAccounts)
              .transaction()
          )
        );
      }
    }

    return txs;
  }

  async refreshWeights(): Promise<web3.Transaction> {
    const vaultKeys = this.vaultKeys[this.tokenInput];
    const genericAccounts = {
      vaultAccount: vaultKeys.vaultAccount,
    };

    const vaultData = await this.decodeVault();
    const txs: web3.Transaction[] = [];
    for (const data of vaultData.protocols) {
      if (data.weight != 0) {
        switch (data.protocolId) {
          case Protocols.Mango:
            txs.push(await mango.tvl(this, genericAccounts));
            break;
          case Protocols.Port:
            txs.push(await port.tvl(this, genericAccounts));
            break;
          case Protocols.Solend:
            txs.push(await solend.tvl(this, genericAccounts));
            break;
          case Protocols.Tulip:
            txs.push(await tulip.tvl(this, genericAccounts));
            break;
          case Protocols.Francium:
            txs.push(await francium.tvl(this, genericAccounts));
            break;
          case Protocols.SolendStablePool:
            txs.push(await solendStablePool.tvl(this, genericAccounts));
            break;
        }
      }
    }

    const refreshIx = await this.methods
      .refreshWeights()
      .accounts({
        vaultAccount: vaultKeys.vaultAccount,
        vaultLpTokenMintPubkey: vaultKeys.vaultLpTokenMintAddress,
        daoTreasuryLpTokenAccount: vaultKeys.daoTreasuryLpTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    return new web3.Transaction().add(...txs, refreshIx);
  }

  async closeAccount(): Promise<web3.Transaction> {
    return this.methods
      .closeAccount()
      .accounts({
        vaultAccount: this.vaultKeys[this.tokenInput].vaultAccount,
      })
      .transaction();
  }

  async tvl(token: string = this.tokenInput): Promise<BN> {
    const vaultAccount = await this.decodeVault(token);
    return vaultAccount.currentTvl;
  }

  async tvlUSD(token: string = this.tokenInput): Promise<BN> {
    const tvl = await this.tvl(token);
    const scale = new BN(Math.pow(10, TOKENS[token].decimals));
    const tokenPrice = await getPrice(token);
    return tvl.div(scale).mul(new BN(tokenPrice));
  }

  async tvlUSDAllTokens(): Promise<BN> {
    const vaultAccounts = await this.decodeVaults();
    const prices: Record<string, number> = await getPrices();

    let i = 0;
    let totalTvl = new BN(0);
    // decoded in the same order than TOKENS keys (if pubkey exists)
    for (const token of Object.keys(TOKENS)) {
      if (this.vaultKeys[token].vaultAccount) {
        const tvl = vaultAccounts[i++].currentTvl;
        const scale = new BN(Math.pow(10, TOKENS[token].decimals));
        const tokenPrice = prices[token] ?? 0;
        totalTvl = totalTvl.add(tvl.div(scale).mul(new BN(tokenPrice)));
      }
    }
    return totalTvl;
  }
}
