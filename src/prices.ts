import fetch from "isomorphic-unfetch";
import { TOKENS } from "./data";

export type TokenPrice = {
  asset: string;
  price: number;
  time: string;
};

export async function getPrices(): Promise<Record<string, number>> {
  const response = await fetch("https://data.goblin.gold:7766/price");
  const data = await response.json();

  return data.reduce(
    (previous, current) => ({ ...previous, [current.asset]: current.price }),
    {}
  );
}

export async function getPrice(token: string): Promise<number> {
  const prices = await getPrices();

  token = token === TOKENS.WSOL.symbol ? TOKENS.SOL.symbol : token;
  const match = prices[token];

  return match ?? 0;
}
