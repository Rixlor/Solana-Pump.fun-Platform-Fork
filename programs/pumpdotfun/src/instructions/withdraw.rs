use anchor_lang::prelude::*;
use crate::{errors::CustomError, state::*};

pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {

    // Check if the signer is the admin
    if ctx.accounts.admin.key() != ctx.accounts.dex_configuration_account.admin {
        return err!(CustomError::InvalidAdmin);
    }

    // Ensure that the dex_configuration_account contains enough lamports
    let amount_to_transfer = ctx.accounts.dex_configuration_account.shares;

    if ctx.accounts.dex_configuration_account.to_account_info().lamports() < amount_to_transfer {
        return err!(CustomError::InsufficientFunds);
    }

    // Transfer lamports from the dex_configuration_account to the admin

    // Decrease lamports in the escrow account
    **ctx.accounts.dex_configuration_account.to_account_info().try_borrow_mut_lamports()? -= amount_to_transfer;

    // Increase lamports in the authority account
    **ctx.accounts.admin.try_borrow_mut_lamports()? += amount_to_transfer;

    // After transfer, set the shares to 0
    ctx.accounts.dex_configuration_account.shares = 0;

    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [CurveConfiguration::SEED.as_bytes()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    #[account(mut)]
    pub admin: Signer<'info>,
}
