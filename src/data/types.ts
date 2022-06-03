import * as anchor from "@project-serum/anchor";
import BigNumber from "bignumber.js";

export class TokenAmount {
  public wei: BigNumber;

  public decimals: number;
  public _decimals: BigNumber;

  constructor(wei: number | string | BigNumber, decimals = 0, isWei = true) {
    this.decimals = decimals;
    this._decimals = new BigNumber(10).exponentiatedBy(decimals);

    if (isWei) {
      this.wei = new BigNumber(wei);
    } else {
      this.wei = new BigNumber(wei).multipliedBy(this._decimals);
    }
  }

  toEther() {
    return this.wei.dividedBy(this._decimals);
  }

  toWei() {
    return this.wei;
  }

  format() {
    const vaule = this.wei.dividedBy(this._decimals);
    return vaule.toFormat(vaule.isInteger() ? 0 : this.decimals);
  }

  fixed() {
    return this.wei.dividedBy(this._decimals).toFixed(4);
  }

  isNullOrZero() {
    return this.wei.isNaN() || this.wei.isZero();
  }
  // + plus
  // - minus
  // × multipliedBy
  // ÷ dividedBy
}

export interface TokenInfo {
  symbol: string;
  name: string;
  mintAddress: string;
  decimals: number;
  decimalsE: number;
  totalSupply?: TokenAmount;
  referrer?: string;
}

export interface Tokens {
  [key: string]: TokenInfo;
}

export interface LPTokenInfo {
  symbol: string;
  name: string;
  coin: TokenInfo;
  pc: TokenInfo;
  mintAddress: string;
  decimals: number;
  // Shouldn't be here but needed for utils/farm
  balance?: TokenAmount;
}

export interface LPTokens {
  [key: string]: LPTokenInfo;
}

export type StakeVault = {
  name: string;
  lp: LPTokenInfo;
  reward: TokenInfo;
  rewardB?: TokenInfo;
  tokenInput: string;
  risk: string;
  tvl: string;
  dailyApy: string;
  yearlyApy: string;

  programId: anchor.web3.PublicKey;

  poolId: anchor.web3.PublicKey;
  poolAuthority: anchor.web3.PublicKey;

  poolLpTokenAccount: anchor.web3.PublicKey;
  poolRewardTokenAccount: anchor.web3.PublicKey;
  poolRewardTokenAccountB?: anchor.web3.PublicKey;

  vaultAccount: anchor.web3.PublicKey;
  vaultSigner: anchor.web3.PublicKey;
  vaultLpTokenMintAddress: anchor.web3.PublicKey;
  vaultInputTokenAccount: anchor.web3.PublicKey;
  vaultUserInfoAccount: anchor.web3.PublicKey;
  vaultLpTokenAccount: anchor.web3.PublicKey;

  risksTxt: string;
  protocolsTxt: string;
};
export type StrategyVault = {
  type: string;
  name: string;
  input: TokenInfo;
  lp: TokenInfo;
  tvl: anchor.BN;
  supply: anchor.BN;
  apy: string;
  apr: string;

  id?: string;
  vaultAccount: anchor.web3.PublicKey;

  aboutTxt: string;
  protocolsTxt: string;
  risksTxt: string;
};
