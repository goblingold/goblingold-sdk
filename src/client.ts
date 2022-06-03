import {
  AnchorProvider,
  BN,
  Idl,
  Wallet,
  setProvider,
  web3,
} from "@project-serum/anchor";
import { addressParser } from "./addressParser";
import { STRATEGY_VAULTS, StrategyVault } from "./data";
import { decodeMultipleAccounts } from "./decoder";
import idlStrategy from "./idls/best_apy.json";
import { StrategyProgram } from "./program";

export const DAO_TREASURY_OWNER = new web3.PublicKey(
  "8XhNoDjjNoLP5Rys1pBJKGdE8acEC1HJsWGkfkMt6JP1"
);

type GoblinGoldSDKOpts = {
  connection: web3.Connection;
  wallet: Wallet;
  provider?: AnchorProvider;
  user?: web3.PublicKey;
};

export class GoblinGold {
  connection: web3.Connection;
  provider?: AnchorProvider;
  BestApy: StrategyProgram;
  strategyVaults?: StrategyVault[];

  constructor(opts: GoblinGoldSDKOpts) {
    this.connection = opts.connection;
    this.provider = opts.provider;

    const programId = addressParser({
      group: "strategies",
      name: "bestApy",
    })["WSOL"].programId;

    if (opts.provider) {
      setProvider(opts.provider);
      this.BestApy = new StrategyProgram(
        idlStrategy as Idl,
        programId,
        opts.provider,
        opts.user
      );
    } else {
      this.BestApy = new StrategyProgram(
        idlStrategy as Idl,
        programId,
        new AnchorProvider(
          this.connection,
          opts.wallet,
          AnchorProvider.defaultOptions()
        ),
        opts.user
      );
    }
  }

  async getVaultsInfo() {
    if (this.strategyVaults) return this.strategyVaults;

    const program = this.BestApy;

    const accKeys: { accountType; publicKey }[] = [];

    STRATEGY_VAULTS.forEach((sVault) => {
      const vaultKey = program.vaultKeys[sVault.input.symbol];

      accKeys.push({ accountType: "Vault", publicKey: vaultKey.vaultAccount });
      accKeys.push({
        accountType: "Mint",
        publicKey: vaultKey.vaultLpTokenMintAddress,
      });
    });

    const accounts = await decodeMultipleAccounts(program, accKeys);

    this.strategyVaults = await Promise.all(
      STRATEGY_VAULTS.map((sVault, indx) => {
        // Returned in the same order than the request
        const vault = accounts[indx * 2];
        const mint = accounts[indx * 2 + 1];

        return {
          ...sVault,
          id: sVault.lp.mintAddress,
          vaultAccount: program.vaultKeys[sVault.input.symbol].vaultAccount,
          tvl: vault.currentTvl,
          supply: new BN(mint.supply),
        };
      })
    );

    return this.strategyVaults;
  }

  async getVaultById(id: string) {
    await this.getVaultsInfo();

    return this.strategyVaults?.find((vault) => vault.id === id);
  }
}
