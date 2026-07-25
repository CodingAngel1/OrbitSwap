#![no_std]

#[cfg(test)]
mod test;

use core::fmt::Write;

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, String, Vec,
};

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct AssetInfo {
    pub code: String,
    pub issuer: String,
    pub active: bool,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct SwapEstimate {
    pub output: String,
    pub fee: String,
    pub rate: String,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct SwapExecutedEvent {
    pub user: Address,
    pub input_asset: String,
    pub output_asset: String,
    pub input_amount: String,
    pub output_amount: String,
    pub timestamp: u64,
}

#[contract]
pub struct OrbitSwap;

struct StackString<'a> {
    buf: &'a mut [u8],
    len: usize,
}

impl<'a> Write for StackString<'a> {
    fn write_str(&mut self, s: &str) -> core::fmt::Result {
        let bytes = s.as_bytes();
        if self.len + bytes.len() > self.buf.len() {
            return Err(core::fmt::Error);
        }
        self.buf[self.len..self.len + bytes.len()].copy_from_slice(bytes);
        self.len += bytes.len();
        Ok(())
    }
}

#[contractimpl]
impl OrbitSwap {
    pub fn init(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&symbol_short!("admin"), &admin);
        env.storage().instance().set(&symbol_short!("paused"), &false);

        let default_assets: Vec<AssetInfo> = vec![
            &env,
            AssetInfo {
                code: String::from_str(&env, "XLM"),
                issuer: String::from_str(&env, "native"),
                active: true,
            },
        ];
        env.storage().instance().set(&symbol_short!("assets"), &default_assets);

        env.events().publish(
            (symbol_short!("init"),),
            admin,
        );
    }

    pub fn add_asset(env: Env, admin: Address, code: String, issuer: String) {
        admin.require_auth();
        Self::require_admin(&env, &admin);

        let mut assets: Vec<AssetInfo> = env
            .storage()
            .instance()
            .get(&symbol_short!("assets"))
            .unwrap_or(vec![&env]);

        assets.push_back(AssetInfo {
            code,
            issuer,
            active: true,
        });

        env.storage().instance().set(&symbol_short!("assets"), &assets);
    }

    pub fn get_assets(env: Env) -> Vec<AssetInfo> {
        env.storage()
            .instance()
            .get(&symbol_short!("assets"))
            .unwrap_or(vec![&env])
    }

    pub fn get_swap_estimate(
        env: Env,
        _input_code: String,
        _input_issuer: String,
        _output_code: String,
        _output_issuer: String,
        amount: String,
    ) -> SwapEstimate {
        let amount_i: i128 = Self::parse_amount(&amount);

        // 1.0 rate in 7-decimal fixed-point = 10_000_000
        let rate: i128 = 10_000_000;
        let output = (amount_i * rate) / 10_000_000;
        // 0.001 fee = 10_000 in 7-decimal fixed-point
        let fee = (amount_i * 10_000) / 10_000_000;

        SwapEstimate {
            output: Self::format_amount(&env, output),
            fee: Self::format_amount(&env, fee),
            rate: Self::format_amount(&env, rate),
        }
    }

    pub fn swap(
        env: Env,
        user: Address,
        input_code: String,
        _input_issuer: String,
        output_code: String,
        _output_issuer: String,
        input_amount: String,
        min_output: String,
    ) -> String {
        user.require_auth();
        Self::require_not_paused(&env);

        let estimate = Self::get_swap_estimate(
            env.clone(),
            input_code.clone(),
            String::from_str(&env, ""),
            output_code.clone(),
            String::from_str(&env, ""),
            input_amount.clone(),
        );

        let min_output_i: i128 = Self::parse_amount(&min_output);
        let estimated_output_i: i128 = Self::parse_amount(&estimate.output);

        if estimated_output_i < min_output_i {
            panic!("Slippage exceeded");
        }

        let output_amount = estimate.output.clone();

        env.events().publish(
            (
                symbol_short!("swap"),
                SwapExecutedEvent {
                    user,
                    input_asset: input_code,
                    output_asset: output_code,
                    input_amount,
                    output_amount: output_amount.clone(),
                    timestamp: env.ledger().timestamp(),
                },
            ),
            symbol_short!("swap"),
        );

        output_amount
    }

    pub fn get_balance(env: Env, _asset_code: String) -> String {
        let balance: i128 = 0;
        Self::format_amount(&env, balance)
    }

    pub fn pause(env: Env, admin: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        env.storage().instance().set(&symbol_short!("paused"), &true);
    }

    pub fn unpause(env: Env, admin: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        env.storage().instance().set(&symbol_short!("paused"), &false);
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&symbol_short!("paused"))
            .unwrap_or(false)
    }

    fn require_admin(env: &Env, caller: &Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("admin"))
            .unwrap();
        if *caller != admin {
            panic!("Caller is not the admin");
        }
    }

    fn require_not_paused(env: &Env) {
        let paused: bool = env
            .storage()
            .instance()
            .get(&symbol_short!("paused"))
            .unwrap_or(false);
        if paused {
            panic!("Contract is paused");
        }
    }

    fn parse_amount(amount: &String) -> i128 {
        let mut bytes = [0u8; 64];
        let len = (amount.len() as usize).min(bytes.len());
        amount.copy_into_slice(&mut bytes[..len]);

        let mut val: i128 = 0;
        let mut decimals = 0;
        let mut past_decimal = false;

        for i in 0..len {
            let b = bytes[i];
            if b == b'.' {
                past_decimal = true;
                continue;
            }
            if b >= b'0' && b <= b'9' {
                let digit = (b - b'0') as i128;
                if past_decimal {
                    if decimals < 7 {
                        val = val * 10 + digit;
                        decimals += 1;
                    }
                } else {
                    val = val * 10 + digit;
                }
            }
        }

        // Pad out to 7 fractional digits
        while decimals < 7 {
            val *= 10;
            decimals += 1;
        }
        val
    }

    fn format_amount(env: &Env, amount: i128) -> String {
        let mut buf = [0u8; 64];
        let mut stack_str = StackString {
            buf: &mut buf,
            len: 0,
        };

        let int_part = amount / 10_000_000;
        let frac_part = (amount % 10_000_000).abs();

        write!(&mut stack_str, "{}.{:07}", int_part, frac_part).unwrap();
        let s = core::str::from_utf8(&stack_str.buf[..stack_str.len]).unwrap();
        String::from_str(env, s)
    }
}
