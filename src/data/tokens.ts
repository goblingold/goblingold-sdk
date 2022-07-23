import { LPTokens, TokenInfo, Tokens } from "./types";

export const NATIVE_SOL: TokenInfo = {
  symbol: "SOL",
  name: "Native Solana",
  mintAddress: "11111111111111111111111111111111",
  decimals: 9,
  decimalsE: 1e9,
};

export const TOKENS: Tokens = {
  SOL: {
    symbol: "SOL",
    name: "Native Solana",
    mintAddress: "11111111111111111111111111111111",
    decimals: 9,
    decimalsE: 1e9,
  },
  WSOL: {
    symbol: "WSOL",
    name: "Wrapped Solana",
    mintAddress: "So11111111111111111111111111111111111111112",
    decimals: 9,
    decimalsE: 1e9,
  },
  USDC: {
    symbol: "USDC",
    name: "USDC",
    mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    decimalsE: 1e6,
    referrer: "92vdtNjEg6Zth3UU1MgPgTVFjSEzTHx66aCdqWdcRkrg",
  },
  mSOL: {
    symbol: "mSOL",
    name: "Marinade staked SOL",
    mintAddress: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    decimals: 9,
    decimalsE: 1e9,
  },
  USDT: {
    symbol: "USDT",
    name: "USDT",
    mintAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    decimalsE: 1e6,
  },
  BTC: {
    symbol: "BTC",
    name: "BTC",
    mintAddress: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
    decimals: 6,
    decimalsE: 1e6,
  },
  soETH: {
    symbol: "soETH",
    name: "soETH",
    mintAddress: "2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk",
    decimals: 6,
    decimalsE: 1e6,
  },
  MNGO: {
    symbol: "MNGO",
    name: "Mango",
    mintAddress: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
    decimals: 6,
    decimalsE: 1e6,
  },
  ORCA: {
    symbol: "ORCA",
    name: "Orca",
    mintAddress: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    decimals: 6,
    decimalsE: 1e6,
  },
  RAY: {
    symbol: "RAY",
    name: "Raydium",
    mintAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,
    decimalsE: 1e6,
  },
  SAMO: {
    symbol: "SAMO",
    name: "Samoyed Coin",
    mintAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    decimals: 9,
    decimalsE: 1e9,
  },
  SRM: {
    symbol: "SRM",
    name: "Serum",
    mintAddress: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
    decimals: 6,
    decimalsE: 1e6,
  },
  soFTT: {
    symbol: "soFTT",
    name: "Wrapped FTT (Sollet)",
    mintAddress: "AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3",
    decimals: 6,
    decimalsE: 1e6,
  },
  scnSOL: {
    symbol: "scnSOL",
    name: "Socean Solana",
    mintAddress: "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
    decimals: 9,
    decimalsE: 1e9,
  },
  stSOL: {
    symbol: "stSOL",
    name: "Lido Staked Solana",
    mintAddress: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
    decimals: 9,
    decimalsE: 1e9,
  },
  ggSOL: {
    symbol: "ggSOL",
    name: "ggSOL",
    mintAddress: "5NRMCHoJtq5vNgxmNgDzAqroKxDWM6mmE8HQnt7p4yLM",
    decimals: 9,
    decimalsE: 1e9,
  },
  ggBTC: {
    symbol: "ggBTC",
    name: "ggBTC",
    mintAddress: "Er1sCVW55YH6gMTc8HdvZwZ9YrWksLAso6HtA3knXBKU",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggsoETH: {
    symbol: "ggsoETH",
    name: "ggsoETH",
    mintAddress: "AEag8CEYbzNRE1cLkNmQdBzF5dNpWrhv5zfZMR5xWhpA",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggUSDC: {
    symbol: "ggUSDC",
    name: "ggUSDC",
    mintAddress: "HAYwz6cHGuGAvLNifqGypH4mzv8fF5wv9SvcYLRGd18Q",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggUSDT: {
    symbol: "ggUSDT",
    name: "ggUSDT",
    mintAddress: "9oLbMFr1AedcbXjqNge4QkrQMw5Jeae3eTbPQ94Zp1aD",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggmSOL: {
    symbol: "ggmSOL",
    name: "ggmSOL",
    mintAddress: "7V3hgNMhVHwLPsyD5ujG248PV1hwnsvpBrAMeWXWboRZ",
    decimals: 9,
    decimalsE: 1e9,
  },
  ggstSOL: {
    symbol: "ggstSOL",
    name: "ggstSOL",
    mintAddress: "Fn4Nz4G6fbK7556XUJQxovYgRjEXgWQYTVj5yCLx2pyv",
    decimals: 9,
    decimalsE: 1e9,
  },
  ggscnSOL: {
    symbol: "ggscnSOL",
    name: "ggscnSOL",
    mintAddress: "82NfNroRav4h4ecRwcTz46oufQBLRhtvWMJNx9WrzuKd",
    decimals: 9,
    decimalsE: 1e9,
  },
  ggSRM: {
    symbol: "ggSRM",
    name: "ggSRM",
    mintAddress: "CA3oB8EiByQ4yrcexSJDbfGvk1CJrPRcZf2UE14ZRvtx",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggsoFTT: {
    symbol: "ggsoFTT",
    name: "ggsoFTT",
    mintAddress: "AJd15mm73d86ny8worSc8aoLLF6EM1DGPSvi4GscaoQt",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggMNGO: {
    symbol: "ggMNGO",
    name: "ggMNGO",
    mintAddress: "GfSggsLj9ZcYcHxanX85d7nas7s1GJPMuDgMCWDhoi7Z",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggORCA: {
    symbol: "ggORCA",
    name: "ggORCA",
    mintAddress: "898Vy3qq3pMRbAXpznFkYSDv5tK4hrN8ufAUuKkZHMXa",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggRAY: {
    symbol: "ggRAY",
    name: "ggRAY",
    mintAddress: "GAsp3xeG4LQLjyJnT7ochh9gKaF17c7ssTjjPS8B1mQv",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggSBR: {
    symbol: "ggSBR",
    name: "ggSBR",
    mintAddress: "CJh7k9GqRkZvNPEueRBuirWVekr8e2SSeCHNWGZui2SJ",
    decimals: 6,
    decimalsE: 1e6,
  },
  ggSAMO: {
    symbol: "ggSAMO",
    name: "ggSAMO",
    mintAddress: "3B3JE2wSp1oV98tLTmZZDZXJzc2J4qSZmSXC4ZvHqhT4",
    decimals: 9,
    decimalsE: 1e9,
  },
};

export const LP_TOKENS: LPTokens = {
  TEST1: {
    symbol: "TEST1",
    name: "TEST1 LP",
    coin: TOKENS.TEST1,
    pc: TOKENS.TEST2,
    mintAddress: "Cq6NT9khnedFuikXUqo2EjHAG4UkyeLGDyWp8fVhFHe6",
    decimals: 6,
  },
  TEST_LPTOKEN: {
    symbol: "RAY-SOL",
    name: "RAY-SOL LP",
    coin: TOKENS.WSOL,
    pc: TOKENS.TEST2,
    mintAddress: "So11111111111111111111111111111111111111112",
    decimals: 6,
  },
  TEST_LPTOKEN2: {
    symbol: "RAY-SOL",
    name: "RAY-SOL LP",
    coin: TOKENS.USDC,
    pc: TOKENS.TEST2,
    mintAddress: "Cq6NT9khnedFuikXUqo2EjHAG4UkyeLGDyWp8fVhFHe6",
    decimals: 6,
  },
};
