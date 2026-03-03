export const DARKPOOL_ADDRESS = process.env.NEXT_PUBLIC_DARKPOOL_ADDRESS || "0x0";
export const BTC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_BTC_TOKEN_ADDRESS || "0x0";
export const USDC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS || "0x0";

export const SIDE_BUY = 0;
export const SIDE_SELL = 1;

export const STATUS_OPEN = 0;
export const STATUS_REVEALED = 1;
export const STATUS_FILLED = 2;
export const STATUS_CANCELLED = 3;

export const STATUS_LABELS: Record<number, string> = {
  [STATUS_OPEN]: "Committed",
  [STATUS_REVEALED]: "Revealed",
  [STATUS_FILLED]: "Filled",
  [STATUS_CANCELLED]: "Cancelled",
};

export const DARKPOOL_ABI = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "commit_order",
    inputs: [{ name: "order_hash", type: "core::felt252" }],
    outputs: [{ type: "core::integer::u64" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "reveal_order",
    inputs: [
      { name: "order_id", type: "core::integer::u64" },
      { name: "base_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "quote_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "side", type: "core::integer::u8" },
      { name: "price", type: "core::integer::u256" },
      { name: "amount", type: "core::integer::u256" },
      { name: "nonce", type: "core::felt252" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "match_orders",
    inputs: [
      { name: "buy_order_id", type: "core::integer::u64" },
      { name: "sell_order_id", type: "core::integer::u64" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "cancel_order",
    inputs: [{ name: "order_id", type: "core::integer::u64" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "get_balance",
    inputs: [
      { name: "user", type: "core::starknet::contract_address::ContractAddress" },
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_order_commitment",
    inputs: [{ name: "order_id", type: "core::integer::u64" }],
    outputs: [
      {
        type: "(core::starknet::contract_address::ContractAddress, core::felt252, core::integer::u8, core::integer::u64)",
      },
    ],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_order_count",
    inputs: [],
    outputs: [{ type: "core::integer::u64" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_locked_amount",
    inputs: [{ name: "order_id", type: "core::integer::u64" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "compute_order_hash",
    inputs: [
      { name: "base_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "quote_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "side", type: "core::integer::u8" },
      { name: "price", type: "core::integer::u256" },
      { name: "amount", type: "core::integer::u256" },
      { name: "nonce", type: "core::felt252" },
    ],
    outputs: [{ type: "core::felt252" }],
    state_mutability: "view",
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "balance_of",
    inputs: [{ name: "account", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
      { name: "spender", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [],
    state_mutability: "external",
  },
] as const;
