import { Protocols } from "../protocols";

export const PROTOCOLS_BY_ASSET: Record<string, Protocols[]> = {
  WSOL: [
    Protocols.Mango,
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  mSOL: [
    Protocols.Mango,
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
    Protocols.SolendStablePool,
  ],

  USDC: [
    Protocols.Mango,
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
    Protocols.SolendStablePool,
  ],

  USDT: [
    Protocols.Mango,
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
    Protocols.SolendStablePool,
  ],

  BTC: [
    Protocols.Mango,
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  soETH: [
    Protocols.Mango,
    Protocols.Solend,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  SRM: [
    Protocols.Mango,
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  MNGO: [Protocols.Mango],

  stSOL: [
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  RAY: [Protocols.Mango, Protocols.Solend, Protocols.Tulip, Protocols.Francium],

  ORCA: [Protocols.Solend, Protocols.Tulip, Protocols.Francium],

  SAMO: [Protocols.Tulip, Protocols.Francium],
};
