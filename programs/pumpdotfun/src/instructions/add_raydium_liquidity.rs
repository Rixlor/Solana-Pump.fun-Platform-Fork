use amm_anchor::Initialize2;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Token, TokenAccount},
};
use crate::state::{LiquidityPool};
use crate::errors::CustomError;

pub fn add_raydium_liquidity(ctx: Context<AddRaydiumLiquidity>, nonce: u8, open_time: u64) -> Result<()> {
    let init_coin_amount = ctx.accounts.pool.reserve_sol;
    let init_pc_amount = ctx.accounts.pool.reserve_token;

    if init_coin_amount < 80000000000 {
        return err!(CustomError::NotEnoughSolInVault);
    }

    **ctx.accounts.pool_sol_vault.try_borrow_mut_lamports()? -= init_coin_amount;
    **ctx.accounts.user_token_pc.try_borrow_mut_lamports()? += init_coin_amount;

    token::sync_native(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::SyncNative {
                account: ctx.accounts.user_token_pc.to_account_info()
            }
        ))?;


    let binding = ctx.accounts.pool_token_account.mint.key();
    let seeds = &[LiquidityPool::POOL_SEED_PREFIX.as_bytes(), binding.as_ref(), &[ctx.bumps.pool]];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.user_token_coin.to_account_info(),
            authority: ctx.accounts.pool_token_account.to_account_info()
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, init_pc_amount)?;

    let _ = amm_anchor::initialize(
        ctx.accounts.into(),
        nonce,
        open_time,
        init_pc_amount,
        init_coin_amount,
    );

    ctx.accounts.pool.reserve_sol = 0;
    ctx.accounts.pool.reserve_token = 0;

    Ok(())
}

#[derive(Accounts, Clone)]
pub struct AddRaydiumLiquidity<'info> {
    /// CHECK: Safe
    pub amm_program: UncheckedAccount<'info>,
    /// CHECK: Safe. The new amm Account to be create, a PDA create with seed = [program_id, openbook_market_id, b"amm_associated_seed"]
    #[account(mut)]
    pub amm: UncheckedAccount<'info>,
    /// CHECK: Safe. Amm authority, a PDA create with seed = [b"amm authority"]
    #[account()]
    pub amm_authority: UncheckedAccount<'info>,
    /// CHECK: Safe. Amm open_orders Account, a PDA create with seed = [program_id, openbook_market_id, b"open_order_associated_seed"]
    #[account(mut)]
    pub amm_open_orders: UncheckedAccount<'info>,
    /// CHECK: Safe. Pool lp mint account. Must be empty, owned by $authority.
    #[account(mut)]
    pub amm_lp_mint: UncheckedAccount<'info>,
    /// CHECK: Safe. Coin mint account
    #[account(
        owner = token_program.key()
    )]
    pub amm_coin_mint: UncheckedAccount<'info>,
    /// CHECK: Safe. Pc mint account
    #[account(
        owner = token_program.key()
    )]
    pub amm_pc_mint: UncheckedAccount<'info>,
    /// CHECK: Safe. amm_coin_vault Account. Must be non zero, owned by $authority
    #[account(mut)]
    pub amm_coin_vault: UncheckedAccount<'info>,
    /// CHECK: Safe. amm_pc_vault Account. Must be non zero, owned by $authority.
    #[account(mut)]
    pub amm_pc_vault: UncheckedAccount<'info>,
    /// CHECK: Safe. amm_target_orders Account. Must be non zero, owned by $authority.
    #[account(mut)]
    pub amm_target_orders: UncheckedAccount<'info>,
    /// CHECK: Safe. Amm Config.
    #[account()]
    pub amm_config: UncheckedAccount<'info>,
    /// CHECK: Safe. Amm create_fee_destination.
    #[account(mut)]
    pub create_fee_destination: UncheckedAccount<'info>,
    /// CHECK: Safe. OpenBook program.
    #[account(
        address = amm_anchor::openbook_program_id::id(),
    )]
    pub market_program: UncheckedAccount<'info>,
    /// CHECK: Safe. OpenBook market. OpenBook program is the owner.
    #[account(
        owner = market_program.key(),
    )]
    pub market: UncheckedAccount<'info>,
    /// CHECK: Safe. The user coin token
    #[account(
        mut,
        owner = token_program.key(),
    )]
    pub user_token_coin: UncheckedAccount<'info>,
    /// CHECK: Safe. The user pc token
    #[account(
        mut,
        owner = token_program.key(),
    )]
    pub user_token_pc: UncheckedAccount<'info>,
    /// CHECK: Safe. The user lp token
    #[account(mut)]
    pub user_token_lp: UncheckedAccount<'info>,
    
    #[account(
        mut,
        seeds = [LiquidityPool::POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub pool: Box<Account<'info, LiquidityPool>>,

    #[account(
        mut,
    )]
    pub pool_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
    )]
    pub pool_sol_vault: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub sysvar_rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}