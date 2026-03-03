#[starknet::contract]
pub mod MockToken {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use bicvar::interfaces::IERC20;

    #[storage]
    struct Storage {
        token_name: felt252,
        token_symbol: felt252,
        token_decimals: u8,
        total_supply: u256,
        balances: Map<ContractAddress, u256>,
        allowances: Map<ContractAddress, Map<ContractAddress, u256>>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Transfer: Transfer,
        Approval: Approval,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Transfer {
        #[key]
        pub from: ContractAddress,
        #[key]
        pub to: ContractAddress,
        pub value: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Approval {
        #[key]
        pub owner: ContractAddress,
        #[key]
        pub spender: ContractAddress,
        pub value: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: felt252,
        symbol: felt252,
        decimals: u8,
        initial_supply: u256,
        recipient: ContractAddress,
    ) {
        self.token_name.write(name);
        self.token_symbol.write(symbol);
        self.token_decimals.write(decimals);
        self.total_supply.write(initial_supply);
        self.balances.entry(recipient).write(initial_supply);
    }

    #[abi(embed_v0)]
    impl ERC20Impl of IERC20<ContractState> {
        fn name(self: @ContractState) -> felt252 {
            self.token_name.read()
        }

        fn symbol(self: @ContractState) -> felt252 {
            self.token_symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.token_decimals.read()
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.entry(account).read()
        }

        fn allowance(
            self: @ContractState, owner: ContractAddress, spender: ContractAddress,
        ) -> u256 {
            self.allowances.entry(owner).entry(spender).read()
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            let sender = get_caller_address();
            _transfer(ref self, sender, recipient, amount);
            true
        }

        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            let caller = get_caller_address();
            let current_allowance = self.allowances.entry(sender).entry(caller).read();
            assert(current_allowance >= amount, 'Insufficient allowance');
            self.allowances.entry(sender).entry(caller).write(current_allowance - amount);
            _transfer(ref self, sender, recipient, amount);
            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            self.allowances.entry(caller).entry(spender).write(amount);
            self.emit(Approval { owner: caller, spender, value: amount });
            true
        }
    }

    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        let supply = self.total_supply.read();
        self.total_supply.write(supply + amount);
        let bal = self.balances.entry(recipient).read();
        self.balances.entry(recipient).write(bal + amount);
        let zero: ContractAddress = 0.try_into().unwrap();
        self.emit(Transfer { from: zero, to: recipient, value: amount });
    }

    fn _transfer(
        ref self: ContractState,
        sender: ContractAddress,
        recipient: ContractAddress,
        amount: u256,
    ) {
        let sender_bal = self.balances.entry(sender).read();
        assert(sender_bal >= amount, 'Insufficient balance');
        self.balances.entry(sender).write(sender_bal - amount);
        let recipient_bal = self.balances.entry(recipient).read();
        self.balances.entry(recipient).write(recipient_bal + amount);
        self.emit(Transfer { from: sender, to: recipient, value: amount });
    }
}
