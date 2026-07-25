#[cfg(test)]
mod test {
    use soroban_sdk::{
        testutils::{Address as _, Env as _},
        Address, Env, String, vec,
    };
    use crate::{OrbitSwap, OrbitSwapClient};

    #[test]
    fn test_init() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let contract_id = env.register(OrbitSwap, ());

        let client = OrbitSwapClient::new(&env, &contract_id);
        client.init(&admin);

        let assets = client.get_assets();
        assert_eq!(assets.len(), 1);
        assert_eq!(assets.get(0).unwrap().code, String::from_str(&env, "XLM"));
    }

    #[test]
    fn test_get_swap_estimate() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let contract_id = env.register(OrbitSwap, ());

        let client = OrbitSwapClient::new(&env, &contract_id);
        client.init(&admin);

        let estimate = client.get_swap_estimate(
            &String::from_str(&env, "XLM"),
            &String::from_str(&env, "native"),
            &String::from_str(&env, "USDC"),
            &String::from_str(&env, "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
            &String::from_str(&env, "100"),
        );

        assert_eq!(estimate.fee, String::from_str(&env, "0.1000000"));
    }

    #[test]
    fn test_swap_success() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register(OrbitSwap, ());

        let client = OrbitSwapClient::new(&env, &contract_id);
        client.init(&admin);

        let output = client.swap(
            &user,
            &String::from_str(&env, "XLM"),
            &String::from_str(&env, "native"),
            &String::from_str(&env, "USDC"),
            &String::from_str(&env, "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
            &String::from_str(&env, "100"),
            &String::from_str(&env, "95"),
        );

        assert!(output.len() > 0);
    }

    #[test]
    fn test_pause_unpause() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let contract_id = env.register(OrbitSwap, ());

        let client = OrbitSwapClient::new(&env, &contract_id);
        client.init(&admin);

        assert!(!client.is_paused());

        client.pause(&admin);
        assert!(client.is_paused());

        client.unpause(&admin);
        assert!(!client.is_paused());
    }
}
