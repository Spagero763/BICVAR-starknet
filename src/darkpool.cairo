#[starknet::contract]
pub mod DarkPool {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address};
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use core::poseidon::poseidon_hash_span;
    use bicvar::interfaces::{IDarkPool, IERC20Dispatcher, IERC20DispatcherTrait};

    const STATUS_OPEN: u8 = 0;
    const STATUS_REVEALED: u8 = 1;
    const STATUS_FILLED: u8 = 2;
    const STATUS_CANCELLED: u8 = 3;

    const SIDE_BUY: u8 = 0;
    const SIDE_SELL: u8 = 1;

    #[storage]
    struct Storage {
        balances: Map<ContractAddress, Map<ContractAddress, u256>>,
        order_trader: Map<u64, ContractAddress>,
        order_hash: Map<u64, felt252>,
        order_status: Map<u64, u8>,
        order_timestamp: Map<u64, u64>,
        order_base_token: Map<u64, ContractAddress>,
        order_quote_token: Map<u64, ContractAddress>,
        order_side: Map<u64, u8>,
        order_price: Map<u64, u256>,
        order_amount: Map<u64, u256>,
        order_nonce: Map<u64, felt252>,
        locked_amounts: Map<u64, u256>,
        next_order_id: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Deposited: Deposited,
        Withdrawn: Withdrawn,
        OrderCommitted: OrderCommitted,
        OrderRevealed: OrderRevealed,
        OrdersMatched: OrdersMatched,
        OrderCancelled: OrderCancelled,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Deposited {
        #[key]
        pub user: ContractAddress,
        pub token: ContractAddress,
        pub amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Withdrawn {
        #[key]
        pub user: ContractAddress,
        pub token: ContractAddress,
        pub amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OrderCommitted {
        #[key]
        pub order_id: u64,
        pub trader: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OrderRevealed {
        #[key]
        pub order_id: u64,
        pub base_token: ContractAddress,
        pub quote_token: ContractAddress,
        pub side: u8,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OrdersMatched {
        #[key]
        pub buy_order_id: u64,
        #[key]
        pub sell_order_id: u64,
        pub base_token: ContractAddress,
        pub quote_token: ContractAddress,
        pub fill_price: u256,
        pub fill_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OrderCancelled {
        #[key]
        pub order_id: u64,
    }

    fn _compute_order_hash(
        base_token: ContractAddress,
        quote_token: ContractAddress,
        side: u8,
        price: u256,
        amount: u256,
        nonce: felt252,
    ) -> felt252 {
        let base_felt: felt252 = base_token.into();
        let quote_felt: felt252 = quote_token.into();
        let side_felt: felt252 = side.into();
        let price_low: felt252 = price.low.into();
        let price_high: felt252 = price.high.into();
        let amount_low: felt252 = amount.low.into();
        let amount_high: felt252 = amount.high.into();

        poseidon_hash_span(
            array![base_felt, quote_felt, side_felt, price_low, price_high, amount_low, amount_high, nonce]
                .span(),
        )
    }

    #[abi(embed_v0)]
    impl DarkPoolImpl of IDarkPool<ContractState> {
        fn deposit(ref self: ContractState, token: ContractAddress, amount: u256) {
            assert(amount > 0, 'Amount must be > 0');
            let caller = get_caller_address();

            let erc20 = IERC20Dispatcher { contract_address: token };
            erc20.transfer_from(caller, get_contract_address(), amount);

            let current = self.balances.entry(caller).entry(token).read();
            self.balances.entry(caller).entry(token).write(current + amount);

            self.emit(Deposited { user: caller, token, amount });
        }

        fn withdraw(ref self: ContractState, token: ContractAddress, amount: u256) {
            assert(amount > 0, 'Amount must be > 0');
            let caller = get_caller_address();
            let current = self.balances.entry(caller).entry(token).read();
            assert(current >= amount, 'Insufficient balance');

            self.balances.entry(caller).entry(token).write(current - amount);

            let erc20 = IERC20Dispatcher { contract_address: token };
            erc20.transfer(caller, amount);

            self.emit(Withdrawn { user: caller, token, amount });
        }

        fn commit_order(ref self: ContractState, order_hash: felt252) -> u64 {
            let caller = get_caller_address();
            let order_id = self.next_order_id.read();
            let timestamp = get_block_timestamp();

            self.order_trader.entry(order_id).write(caller);
            self.order_hash.entry(order_id).write(order_hash);
            self.order_status.entry(order_id).write(STATUS_OPEN);
            self.order_timestamp.entry(order_id).write(timestamp);
            self.next_order_id.write(order_id + 1);

            self.emit(OrderCommitted { order_id, trader: caller, timestamp });
            order_id
        }


        fn reveal_order(
            ref self: ContractState,
            order_id: u64,
            base_token: ContractAddress,
            quote_token: ContractAddress,
            side: u8,
            price: u256,
            amount: u256,
            nonce: felt252,
        ) {
            let caller = get_caller_address();
            assert(self.order_trader.entry(order_id).read() == caller, 'Not order owner');
            assert(self.order_status.entry(order_id).read() == STATUS_OPEN, 'Order not open');
            assert(side == SIDE_BUY || side == SIDE_SELL, 'Invalid side');
            assert(amount > 0, 'Amount must be > 0');
            assert(price > 0, 'Price must be > 0');

            let computed = _compute_order_hash(base_token, quote_token, side, price, amount, nonce);
            assert(computed == self.order_hash.entry(order_id).read(), 'Hash mismatch');

            if side == SIDE_BUY {
                let required = price * amount;
                let bal = self.balances.entry(caller).entry(quote_token).read();
                assert(bal >= required, 'Insufficient quote balance');
                self.balances.entry(caller).entry(quote_token).write(bal - required);
                self.locked_amounts.entry(order_id).write(required);
            } else {
                let bal = self.balances.entry(caller).entry(base_token).read();
                assert(bal >= amount, 'Insufficient base balance');
                self.balances.entry(caller).entry(base_token).write(bal - amount);
                self.locked_amounts.entry(order_id).write(amount);
            }

            self.order_base_token.entry(order_id).write(base_token);
            self.order_quote_token.entry(order_id).write(quote_token);
            self.order_side.entry(order_id).write(side);
            self.order_price.entry(order_id).write(price);
            self.order_amount.entry(order_id).write(amount);
            self.order_nonce.entry(order_id).write(nonce);
            self.order_status.entry(order_id).write(STATUS_REVEALED);

            self.emit(OrderRevealed { order_id, base_token, quote_token, side });
        }

        fn match_orders(ref self: ContractState, buy_order_id: u64, sell_order_id: u64) {
            assert(
                self.order_status.entry(buy_order_id).read() == STATUS_REVEALED, 'Buy not revealed',
            );
            assert(
                self.order_status.entry(sell_order_id).read() == STATUS_REVEALED,
                'Sell not revealed',
            );
            assert(self.order_side.entry(buy_order_id).read() == SIDE_BUY, 'Not a buy order');
            assert(self.order_side.entry(sell_order_id).read() == SIDE_SELL, 'Not a sell order');

            let base_token = self.order_base_token.entry(buy_order_id).read();
            let quote_token = self.order_quote_token.entry(buy_order_id).read();
            assert(
                base_token == self.order_base_token.entry(sell_order_id).read(),
                'Base token mismatch',
            );
            assert(
                quote_token == self.order_quote_token.entry(sell_order_id).read(),
                'Quote token mismatch',
            );

            // Price check
            let buy_price = self.order_price.entry(buy_order_id).read();
            let sell_price = self.order_price.entry(sell_order_id).read();
            assert(buy_price >= sell_price, 'No price overlap');

            let buy_amount = self.order_amount.entry(buy_order_id).read();
            let sell_amount = self.order_amount.entry(sell_order_id).read();
            let fill_amount = if buy_amount <= sell_amount {
                buy_amount
            } else {
                sell_amount
            };
            let fill_price = (buy_price + sell_price) / 2;
            let quote_cost = fill_price * fill_amount;

            let buyer = self.order_trader.entry(buy_order_id).read();
            let seller = self.order_trader.entry(sell_order_id).read();

            let buy_locked = self.locked_amounts.entry(buy_order_id).read();
            let buy_remaining = buy_amount - fill_amount;

            if buy_remaining == 0 {
                let refund = buy_locked - quote_cost;
                if refund > 0 {
                    let cur = self.balances.entry(buyer).entry(quote_token).read();
                    self.balances.entry(buyer).entry(quote_token).write(cur + refund);
                }
                self.locked_amounts.entry(buy_order_id).write(0);
                self.order_status.entry(buy_order_id).write(STATUS_FILLED);
            } else {
                let new_locked = buy_price * buy_remaining;
                let refund = buy_locked - quote_cost - new_locked;
                if refund > 0 {
                    let cur = self.balances.entry(buyer).entry(quote_token).read();
                    self.balances.entry(buyer).entry(quote_token).write(cur + refund);
                }
                self.locked_amounts.entry(buy_order_id).write(new_locked);
                self.order_amount.entry(buy_order_id).write(buy_remaining);
            }
            let buyer_base = self.balances.entry(buyer).entry(base_token).read();
            self.balances.entry(buyer).entry(base_token).write(buyer_base + fill_amount);

            let sell_remaining = sell_amount - fill_amount;

            if sell_remaining == 0 {
                self.locked_amounts.entry(sell_order_id).write(0);
                self.order_status.entry(sell_order_id).write(STATUS_FILLED);
            } else {
                self.locked_amounts.entry(sell_order_id).write(sell_remaining);
                self.order_amount.entry(sell_order_id).write(sell_remaining);
            }
            let seller_quote = self.balances.entry(seller).entry(quote_token).read();
            self.balances.entry(seller).entry(quote_token).write(seller_quote + quote_cost);

            self.emit(
                OrdersMatched {
                    buy_order_id, sell_order_id, base_token, quote_token, fill_price, fill_amount,
                },
            );
        }

        fn cancel_order(ref self: ContractState, order_id: u64) {
            let caller = get_caller_address();
            let trader = self.order_trader.entry(order_id).read();
            assert(trader == caller, 'Not order owner');
            let status = self.order_status.entry(order_id).read();
            assert(status == STATUS_OPEN || status == STATUS_REVEALED, 'Cannot cancel');

            if status == STATUS_REVEALED {
                let locked = self.locked_amounts.entry(order_id).read();
                if locked > 0 {
                    let side = self.order_side.entry(order_id).read();
                    let token = if side == SIDE_BUY {
                        self.order_quote_token.entry(order_id).read()
                    } else {
                        self.order_base_token.entry(order_id).read()
                    };
                    let current = self.balances.entry(caller).entry(token).read();
                    self.balances.entry(caller).entry(token).write(current + locked);
                    self.locked_amounts.entry(order_id).write(0);
                }
            }

            self.order_status.entry(order_id).write(STATUS_CANCELLED);
            self.emit(OrderCancelled { order_id });
        }


        fn get_balance(
            self: @ContractState, user: ContractAddress, token: ContractAddress,
        ) -> u256 {
            self.balances.entry(user).entry(token).read()
        }

        fn get_order_commitment(
            self: @ContractState, order_id: u64,
        ) -> (ContractAddress, felt252, u8, u64) {
            (
                self.order_trader.entry(order_id).read(),
                self.order_hash.entry(order_id).read(),
                self.order_status.entry(order_id).read(),
                self.order_timestamp.entry(order_id).read(),
            )
        }

        fn get_order_count(self: @ContractState) -> u64 {
            self.next_order_id.read()
        }

        fn get_locked_amount(self: @ContractState, order_id: u64) -> u256 {
            self.locked_amounts.entry(order_id).read()
        }

        fn compute_order_hash(
            self: @ContractState,
            base_token: ContractAddress,
            quote_token: ContractAddress,
            side: u8,
            price: u256,
            amount: u256,
            nonce: felt252,
        ) -> felt252 {
            _compute_order_hash(base_token, quote_token, side, price, amount, nonce)
        }
    }
}
