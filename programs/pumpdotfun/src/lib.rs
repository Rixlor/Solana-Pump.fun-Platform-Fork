use anchor_lang::prelude::*;

pub mod errors;
pub mod utils;
pub mod instructions;
pub mod state;
pub mod consts;

use crate::instructions::*;

declare_id!("YOUR CONTRACT ADDRESS");

#[program]
pub mod pumpdotfun {
    use super::*;

    pub fn initialize(ctx: Context<InitializeCurveConfiguration>, fee: f64) -> Result<()> {
        instructions::initialize(ctx, fee)
    }

    pub fn create_token(ctx: Context<CreateToken>, name: String, symbol: String, uri: String, total_supply: u64) -> Result<()> {
        instructions::create_token(ctx, name, symbol, uri, total_supply)
    }

    pub fn create_pool(ctx: Context<CreateLiquidityPool>) -> Result<()> {
        instructions::create_pool(ctx)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
    ) -> Result<()> {
        instructions::add_liquidity(ctx)
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, bump: u8) -> Result<()> {
        instructions::remove_liquidity(ctx, bump)
    }

    pub fn buy(ctx: Context<Buy>, amount: u64) -> Result<()> {
        instructions::buy(ctx, amount)
    }

    pub fn sell(ctx: Context<Sell>, amount: u64) -> Result<()> {
        instructions::sell(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        instructions::withdraw(ctx)
    }

    // pub fn add_raydium_liquidity(ctx: Context<AddRaydiumLiquidity>, nonce: u8, open_time: u64) -> Result<()> {
    //     instructions::add_raydium_liquidity(ctx, nonce, open_time)
    // }
    
}

