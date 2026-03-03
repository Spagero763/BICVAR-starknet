use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(
        self: @TContractState, owner: ContractAddress, spender: ContractAddress,
    ) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState,
        sender: ContractAddress,
        recipient: ContractAddress,
        amount: u256,
    ) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
pub trait IDarkPool<TContractState> {
    fn deposit(ref self: TContractState, token: ContractAddress, amount: u256);
    fn withdraw(ref self: TContractState, token: ContractAddress, amount: u256);
    fn commit_order(ref self: TContractState, order_hash: felt252) -> u64;
    fn reveal_order(
        ref self: TContractState,
        order_id: u64,
        base_token: ContractAddress,
        quote_token: ContractAddress,
        side: u8,
        price: u256,
        amount: u256,
        nonce: felt252,
    );
    fn match_orders(ref self: TContractState, buy_order_id: u64, sell_order_id: u64);
    fn cancel_order(ref self: TContractState, order_id: u64);
    fn get_balance(self: @TContractState, user: ContractAddress, token: ContractAddress) -> u256;
    fn get_order_commitment(
        self: @TContractState, order_id: u64,
    ) -> (ContractAddress, felt252, u8, u64);
    fn get_order_count(self: @TContractState) -> u64;
    fn get_locked_amount(self: @TContractState, order_id: u64) -> u256;
    fn compute_order_hash(
        self: @TContractState,
        base_token: ContractAddress,
        quote_token: ContractAddress,
        side: u8,
        price: u256,
        amount: u256,
        nonce: felt252,
    ) -> felt252;
}
