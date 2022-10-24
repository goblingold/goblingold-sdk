import { Protocols } from "../protocols";

export const PROTOCOLS_BY_ASSET: Record<string, Protocols[]> = {
  WSOL: [
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  mSOL: [
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
    Protocols.SolendStablePool,
  ],

  USDC: [
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
    Protocols.SolendStablePool,
  ],

  USDT: [
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
    Protocols.SolendStablePool,
  ],

  BTC: [
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  soETH: [
    Protocols.Solend,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  SRM: [
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  stSOL: [
    Protocols.Solend,
    Protocols.Port,
    Protocols.Tulip,
    Protocols.Francium,
  ],

  RAY: [Protocols.Mango, Protocols.Solend, Protocols.Tulip, Protocols.Francium],

  ORCA: [Protocols.Solend, Protocols.Tulip, Protocols.Francium],

  SAMO: [Protocols.Tulip, Protocols.Francium],

  ETH: [Protocols.Solend, Protocols.Port, Protocols.Tulip, Protocols.Francium],
};
