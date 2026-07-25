#![no_std]

#[cfg(test)]
mod test;

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, Map, String, Vec, IntoVal, BytesN
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
        let amount_f: f64 = Self::parse_amount(&amount);

        let rate: f64 = 1.0;
        let output = amount_f * rate;
        let fee = amount_f * 0.001;

        SwapEstimate {
            output: Self::format_amount(output),
            fee: Self::format_amount(fee),
            rate: Self::format_amount(rate),
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

        let min_output_f: f64 = Self::parse_amount(&min_output);
        let estimated_output_f: f64 = Self::parse_amount(&estimate.output);

        if estimated_output_f < min_output_f {
            panic!("Slippage exceeded: expected at least {} but got {}", min_output, estimate.output);
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
        Self::format_amount(balance as f64)
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

    fn parse_amount(amount: &String) -> f64 {
        let mut s = String::new(amount.env());
        s.append(amount);
        let bytes = s.into_bytes();
        let mut val: f64 = 0.0;
        let mut decimal: f64 = 0.1;
        let mut past_decimal = false;

        for i in 0..bytes.len() {
            let b = bytes.get(i).unwrap();
            if b == 46 {
                past_decimal = true;
                continue;
            }
            let digit = (b - 48) as f64;
            if past_decimal {
                val += digit * decimal;
                decimal *= 0.1;
            } else {
                val = val * 10.0 + digit;
            }
        }
        val
    }

    fn format_amount(amount: f64) -> String {
        let as_string: String = String::from_str(
            &String::new(&Env::default()),
            &format!("{:.7}", amount),
        );
        as_string
    }
}
