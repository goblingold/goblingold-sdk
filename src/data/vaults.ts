import * as anchor from "@project-serum/anchor";
import { LP_TOKENS, TOKENS } from "./tokens";
import { StakeVault, StrategyVault } from "./types";

const nullAddr = anchor.web3.SYSVAR_RENT_PUBKEY;

const testingInProdStakingVault: StakeVault = {
  name: "TESTING",
  lp: LP_TOKENS["TEST_LPTOKEN2"],
  tokenInput: "TESTING",
  reward: TOKENS.TEST1,
  rewardB: TOKENS.TEST2,
  tvl: "0.00",
  risk: "Low",
  dailyApy: "0.00",
  yearlyApy: "0.00",

  programId: nullAddr,

  poolId: nullAddr,
  poolAuthority: nullAddr,
  poolLpTokenAccount: nullAddr, // lp vault
  poolRewardTokenAccount: nullAddr, // reward vault B
  poolRewardTokenAccountB: nullAddr,

  vaultAccount: nullAddr,
  vaultSigner: nullAddr,
  vaultLpTokenMintAddress: nullAddr,
  vaultUserInfoAccount: nullAddr,
  vaultLpTokenAccount: nullAddr,

  vaultInputTokenAccount: nullAddr,

  protocolsTxt: "",
  risksTxt: "- This project is not audited",
};

export const STAKE_VAULTS: StakeVault[] = [testingInProdStakingVault];

// Invest Vaults

const solanaStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.WSOL,
  lp: TOKENS.ggSOL,
  vaultAccount: new anchor.web3.PublicKey(
    "CNJrJumoPRxvCaQZ2MJTEUUitwwen955JsxiUvoJa7Wp"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Mango, Port, Tulip, Solend and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const usdcStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.USDC,
  lp: TOKENS.ggUSDC,
  vaultAccount: new anchor.web3.PublicKey(
    "ATJpBsXbhio5c5kqgMHmAfFDdjsS3ncZmZyZzNY87XqZ"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Mango, Port, Tulip, Solend and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const msolStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.mSOL,
  lp: TOKENS.ggmSOL,
  vaultAccount: new anchor.web3.PublicKey(
    "7reMieMkh3MCJXQqmnv9xhCBcy3B5qaGbhf6HC8kZFyc"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Mango, Port, Tulip, Solend and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const usdtStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.USDT,
  lp: TOKENS.ggUSDT,
  vaultAccount: new anchor.web3.PublicKey(
    "ATpgW6RzUvEt13rU9NMj1HsmEeW2zC9a1k5AQbako8md"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Mango, Port, Tulip, Solend and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const btcStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.BTC,
  lp: TOKENS.ggBTC,
  vaultAccount: new anchor.web3.PublicKey(
    "FvqYV2Cg7s7iWKUBTWkyybKuz1m85ny6ijDqDXEXVyNv"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Mango, Port, Tulip, Solend and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const stSOLStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.stSOL,
  lp: TOKENS.ggstSOL,
  vaultAccount: new anchor.web3.PublicKey(
    "47hnvWxWo4PpPNqPF78cJ4abjpT45qY9of8hokeLzEUX"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Port, Tulip, Solend and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const srmStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.SRM,
  lp: TOKENS.ggSRM,
  vaultAccount: new anchor.web3.PublicKey(
    "3MvY3Tk3PmQhEeHqyfJA9gDBq83MUM92rgbhLeY27JLv"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Port, Tulip, Solend and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const mngoStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.MNGO,
  lp: TOKENS.ggMNGO,
  vaultAccount: new anchor.web3.PublicKey(
    "E5znWeT1pEiMXpko8JUNvGfs1X6cuupHZB2PeDhx5mt8"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Mango",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const rayStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.RAY,
  lp: TOKENS.ggRAY,
  vaultAccount: new anchor.web3.PublicKey(
    "6w6NRsDUnBieNiVBHoixEqqfGnr2wXdoSWWZRn7S36db"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Mango, Tulip, Solend and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const orcaStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.ORCA,
  lp: TOKENS.ggORCA,
  vaultAccount: new anchor.web3.PublicKey(
    "9b2J1JjsvnkLc9ZQmARDbq7EMhCDzr4QG4fAR6TfZkTK"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Tulip, Solend and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const samoStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.SAMO,
  lp: TOKENS.ggSAMO,
  vaultAccount: new anchor.web3.PublicKey(
    "g5S5WcsYn9CJE6VSwaCoaESZq3Da9Mn7gvt1MB2MFmU"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Tulip and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

const ethStrategyBestAPY: StrategyVault = {
  type: "bestApy",
  name: "Best APY",
  input: TOKENS.ETH,
  lp: TOKENS.ggETH,
  vaultAccount: new anchor.web3.PublicKey(
    "u11s7BKVbYncjcMJX2HjKeahfRuzNovQWtcpJhCTP1x"
  ),
  tvl: new anchor.BN(0),
  supply: new anchor.BN(0),
  apy: "0",
  apr: "0",
  aboutTxt:
    "This strategy automatically rebalances between different lending protocols in order to get the maximum yield in each period.",
  protocolsTxt: "Tulip, Solend, Port and Francium",
  risksTxt:
    "The protocols being used underneath (although being audited) present some risks. No audit has been done for the current strategy. Use it at your own risk.",
};

export const STRATEGY_VAULTS: StrategyVault[] = [
  solanaStrategyBestAPY,
  usdcStrategyBestAPY,
  msolStrategyBestAPY,
  usdtStrategyBestAPY,
  btcStrategyBestAPY,
  stSOLStrategyBestAPY,
  srmStrategyBestAPY,
  mngoStrategyBestAPY,
  rayStrategyBestAPY,
  orcaStrategyBestAPY,
  samoStrategyBestAPY,
  ethStrategyBestAPY,
];
