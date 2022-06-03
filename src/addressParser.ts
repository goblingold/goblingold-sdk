import { web3 } from "@project-serum/anchor";
import * as fs from "fs";
import keys from "./address.json";
import { TOKENS } from "./data/tokens";

type Addresses = Record<string, web3.PublicKey>;
type TokenAddresses = Record<string, Addresses>;

type AddressParserParams = {
  group: string;
  name: string;
};

export function addressParser(params: AddressParserParams): TokenAddresses {
  const tokenList = Object.keys(TOKENS);
  const x: TokenAddresses = {};
  for (const token of tokenList) {
    x[token] = {};
  }

  const json = keys[params.group][params.name];
  Object.keys(json).forEach(function (key) {
    const value = json[key];
    if (typeof value === "object") {
      for (const token of tokenList) {
        if (value[token]) {
          x[token][key] = new web3.PublicKey(value[token]);
        }
      }
    } else {
      for (const token of tokenList) {
        x[token][key] = new web3.PublicKey(value);
      }
    }
  });

  return x;
}

export function updateVaultKeys(
  vaultKeys: TokenAddresses,
  name: string,
  tokenInput: string
) {
  const params = groupNameToAddressParserParams(name);
  const json = keys[params.group][params.name];
  Object.keys(json).forEach(function (key) {
    const targetPubkey = vaultKeys[tokenInput][key];
    if (targetPubkey) {
      if (typeof json[key] === "object") {
        json[key][tokenInput] = targetPubkey.toString();
      } else {
        json[key] = targetPubkey.toString();
      }
    }
  });

  const addressFile = __dirname + "/address.json";
  fs.writeFile(addressFile, JSON.stringify(keys, null, 2), (error) => {
    if (error) throw new Error("Error wile saving keys file;" + error);
  });
  console.log("Updated address file");
}

function groupNameToAddressParserParams(name: string): AddressParserParams {
  switch (name) {
    case "bestApy":
      return { group: "strategies", name: "bestApy" };
    default:
      throw new Error("Non-valid idl name: " + name);
  }
}
