# Solana pump.fun Smart Contract fork

## Introduction

This repository contains the Anchor-based smart contract for a pump.fun-style decentralized application (dApp) on the Solana blockchain.  This contract enables the creation and trading of token pairs within a liquidity pool.

**Warning:**  This is example code and comes with absolutely no warranty.  Use at your own risk.  Audits are highly recommended before deploying to mainnet.

## Features

*   **Token Creation:**  Create new SPL tokens with specified metadata.
*   **Liquidity Pool Creation:**  Establish liquidity pools for token pairs.
*   **Add Liquidity:**  Provide liquidity to existing pools.
*   **Remove Liquidity:**  Withdraw liquidity from pools.
*   **Swap:**  Swap tokens within a liquidity pool.
*   **Buy:** Purchase tokens.
*   **Sell:** Sell tokens.
*   **Withdraw:** Withdraw tokens from accounts.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Solana CLI:**  [https://docs.solanalabs.com/cli/install](https://docs.solanalabs.com/cli/install)
*   **Anchor CLI:**  [https://www.anchor-lang.com/docs/installation](https://www.anchor-lang.com/docs/installation)
*   **Node.js and npm:**  [https://nodejs.org/](https://nodejs.org/)
*   **Git:** [https://git-scm.com/downloads](https://git-scm.com/downloads)

## Installation

1.  **Install Anchor dependencies:**

    ```
    npm install
    ```

2.  **Install Rust dependencies**
    ```
    cargo install --locked anchor-cli
    ```

## Configuration

### Solana Environment

Set your Solana environment to `devnet`, `testnet`, or `mainnet-beta` as appropriate:

    ```
    solana config set --url devnet # or testnet, mainnet-beta
    ```

Ensure you have a Solana keypair configured. If not, generate one:

    ```
    solana-keygen new
    ```


Set the keypair to use:

    ```
    solana config set --keypair ~/.config/solana/id.json # Replace with your keypair path
    ```


### Anchor Environment

Configure Anchor to use the same cluster as your Solana CLI:

    ```
    anchor config -c <cluster> # cluster name as devnet, testnet, or mainnet
    ```


## Building the Program

Compile the Anchor program:

    ```
    anchor build
    ```


This command compiles the smart contract and generates the necessary IDL (Interface Description Language) file in the `target/idl` directory.

## Deployment

1.  **Deploy the program:**

    ```
    anchor deploy
    ```

    This command deploys the compiled program to the configured Solana cluster.  It will output the program ID.  **Save this Program ID; you'll need it later.**

## Running Tests

Execute the tests to verify the program's functionality:

    ```
    anchor test
    ```


This command runs the tests defined in the `tests` directory.  Ensure all tests pass before proceeding.

## Interacting with the Program

### Setting up the Client

You'll need a client-side application (e.g., JavaScript, Python) to interact with the deployed program. Here's a basic example using JavaScript:

1.  **Install `@coral-xyz/anchor`:**

    ```
    npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
    ```

2.  **Example Interaction (JavaScript):**

    ```
    import * as anchor from "@coral-xyz/anchor";
    import { Program } from "@coral-xyz/anchor";
    import { Keypair, PublicKey } from "@solana/web3.js";
    import {
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
        getOrCreateAssociatedTokenAccount,
        mintTo,
    } from "@solana/spl-token";

    // Replace with your program ID
    const programId = new PublicKey("<YOUR_PROGRAM_ID>");

    // Replace with your cluster endpoint
    const clusterUrl = "https://api.devnet.solana.com";

    // Connect to Solana
    const connection = new anchor.web3.Connection(clusterUrl, "confirmed");

    // Load your wallet
    const wallet = anchor.Wallet.local(); // or use your preferred wallet setup
    anchor.setProvider(new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions()));

    const program = new Program(idl, programId, anchor.getProvider());


    // Example: Call the create_pool instruction
    async function createPool(tokenMint: PublicKey) {
        const [poolAccount, poolBump] = await PublicKey.findProgramAddressSync(
            [anchor.utils.bytes.utf8.encode("liquidity_pool"), tokenMint.toBuffer()],
            programId
        );

        const [poolTokenAccount, poolTokenBump] = await PublicKey.findProgramAddressSync(
            [anchor.utils.bytes.utf8.encode("pool_token_account"), tokenMint.toBuffer()],
            programId
        );
        try {
            const tx = await program.methods
                .createPool()
                .accounts({
                    pool: poolAccount,
                    tokenMint: tokenMint,
                    poolTokenAccount: poolTokenAccount,
                    payer: wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([wallet.payer])
                .rpc();

            console.log("create_pool transaction signature", tx);
        } catch (err) {
            console.log("Transaction error: ", err);
        }
    }
    ```

    **Important:**

    *   Replace `<YOUR_PROGRAM_ID>` with the actual program ID you obtained during deployment.
    *   Adapt the code to call other instructions in your program (e.g., `add_liquidity`, `swap`).
    *   Handle errors and user input appropriately.
    *   This is a simplified example; a real-world application would require more robust error handling, UI elements, and wallet integration.

### Example Transactions

Here's how you can use the Solana CLI to inspect transactions related to your program:

1.  **Get Transaction Details:**

    ```
    solana transaction <transaction_signature>
    ```

    Replace `<transaction_signature>` with the signature of a transaction you want to examine.  This will show you the instructions executed within the transaction and the accounts involved.

2.  **Monitor Program Activity:**

    You can use the Solana Explorer or other block explorers to monitor transactions involving your program ID.  This can be helpful for debugging and understanding how users are interacting with your contract.

## Program Accounts

Describe the key program accounts and their purposes:

*   **Liquidity Pool Account:** Stores information about the pool, including token balances, fees, and other configuration parameters.  (Seed: `["liquidity_pool", token_mint]`)
*   **Pool Token Account:**  The associated token account for the liquidity pool's LP tokens. (Seed: `["pool_token_account", token_mint]`)
*   **Configuration Account:** Holds global configuration settings for the DEX. (Seed: `["configuration"]`)

## Security Considerations

*   **Audits:**  Before deploying to a production environment, engage a reputable security audit firm to review your code.
*   **Input Validation:**  Thoroughly validate all user inputs to prevent vulnerabilities such as integer overflows or underflows.
*   **Access Control:**  Implement strict access control mechanisms to prevent unauthorized modification of critical program state.
*   **Reentrancy:**  Be mindful of potential reentrancy vulnerabilities, especially when dealing with external program calls.
*   **Denial of Service:**  Consider potential denial-of-service (DoS) attacks and implement appropriate mitigations.
*   **Upgradability:** Design your program with upgradability in mind (using proxy patterns or other techniques) to address potential bugs or add new features in the future.
*   **Testing:**  Write comprehensive unit and integration tests to cover all aspects of your program's functionality.

## Contributing

Contributions are welcome!  Please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Write tests for your changes.
4.  Submit a pull request.

## Contact Info

Telegram: [@Rixlor](https://t.me/Rixlor)
