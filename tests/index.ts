import BN from "bn.js";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import type { Pumpdotfun } from "../target/types/pumpdotfun";
describe("Test", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Pumpdotfun as anchor.Program<Pumpdotfun>;
  
  const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const dex_config_pda = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("CurveConfiguration")],
    program.programId
  )[0];
  console.log("dex_config_pda", dex_config_pda.toBase58());

  const mintKeypair = web3.Keypair.generate();
  const mintAccount = mintKeypair.publicKey; //new web3.PublicKey("7uAjXWD6Jt5CTsJ3Huuh9abiXLd4gyNrJ8uwv98gshy7"); // 
  console.log("mintAccount", mintAccount.toBase58());

  const metadataAccount = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintAccount.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];
  console.log("metadataAccount", metadataAccount.toBase58());

  const tokenAccount = anchor.utils.token.associatedAddress({
    mint: mintAccount,
    owner: program.provider.publicKey,
  });
  console.log("tokenAccount", tokenAccount.toBase58());

  const pool = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("liquidity_pool"), mintAccount.toBuffer()],
    program.programId
  )[0];
  console.log("pool", pool.toBase58());

  const poolTokenAccount = anchor.utils.token.associatedAddress({
    mint: mintAccount,
    owner: pool,
  });
  console.log("poolTokenAccount", poolTokenAccount.toBase58());

  const poolSolVault = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("liquidity_sol_vault"), mintAccount.toBuffer()],
    program.programId
  )[0];
  console.log("poolSolVault", poolSolVault.toBase58());

  // it("Initialize", async () => {
  //   await program.methods
  //     .initialize(100)
  //     .accounts({
  //       dexConfigurationAccount: dex_config_pda,
  //       systemProgram: web3.SystemProgram.programId,
  //       admin: program.provider.publicKey,
  //       rent: web3.SYSVAR_RENT_PUBKEY,
  //     })
  //     .rpc()
  //     .catch((e) => console.log(e));
  // });

  it("Create Token", async () => {
    let name = "JIH";
    let symbol = "JIH";
    let uri = "https://arweave.net/CtrUELBQ9adDTwuCsTkka1pku0R_XLYzePm_lWiL0yA";
    let totalSupply = new BN("1000000000000000000");
    await program.methods
      .createToken(name, symbol, uri, totalSupply)
      .accounts({
        payer: program.provider.publicKey,
        mintAccount,
        metadataAccount,
        tokenAccount,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc()
      .catch((e) => console.log(e));
  });

  it("Create Pool", async () => {
    await program.methods
      .createPool()
      .accounts({
        pool,
        tokenMint: mintAccount,
        poolTokenAccount,
        payer: program.provider.publicKey,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()
      .catch((e) => console.log(e));
  });

  it("Add Liquidity", async () => {
    await program.methods
      .addLiquidity()
      .accounts({
        pool,
        tokenMint: mintAccount,
        poolTokenAccount,
        userTokenAccount: tokenAccount,
        poolSolVault,
        user: program.provider.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .rpc()
      .catch((e) => console.log(e));
  });

  it("Buy token first", async () => {
    let balance = await program.provider.connection.getBalance(program.provider.publicKey);
    console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
    let tokenAccountInfo = await program.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("Token Balance:", tokenAccountInfo.value.uiAmount);

    const solAmount = new BN(1e9);
    await program.methods
      .buy(solAmount)
      .accounts({
        dexConfigurationAccount: dex_config_pda,
        pool,
        tokenMint: mintAccount,
        poolTokenAccount,
        poolSolVault,
        userTokenAccount: tokenAccount,
        user: program.provider.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .rpc()
      .catch((e) => console.log(e));

    balance = await program.provider.connection.getBalance(program.provider.publicKey);
    console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
    tokenAccountInfo = await program.provider.connection.getTokenAccountBalance(tokenAccount);
    console.log("Token Balance:", tokenAccountInfo.value.uiAmount);
  });

  it("Buy token second", async () => {
    const solAmount = new BN(1e9);
    await program.methods
      .buy(solAmount)
      .accounts({
        dexConfigurationAccount: dex_config_pda,
        pool,
        tokenMint: mintAccount,
        poolTokenAccount,
        poolSolVault,
        userTokenAccount: tokenAccount,
        user: program.provider.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .rpc()
      .catch((e) => console.log(e));

    let balance = await program.provider.connection.getBalance(program.provider.publicKey);
    console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
    let tokenAccountInfo = await program.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("Token Balance:", tokenAccountInfo.value.uiAmount);
  });

  it("Sell token", async () => {
    const tokenAmount = new BN(1e15);
    await program.methods
      .sell(tokenAmount)
      .accounts({
        dexConfigurationAccount: dex_config_pda,
        pool,
        tokenMint: mintAccount,
        poolTokenAccount,
        poolSolVault,
        userTokenAccount: tokenAccount,
        user: program.provider.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .rpc()
      .catch((e) => console.log(e));

    let balance = await program.provider.connection.getBalance(program.provider.publicKey);
    console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
    let tokenAccountInfo = await program.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("Token Balance:", tokenAccountInfo.value.uiAmount);
  });

  it("withdraw", async () => {
    let balance = await program.provider.connection.getBalance(program.provider.publicKey);
    console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
    let dexConfigData = await program.account.curveConfiguration.fetch(
      dex_config_pda
    );
    console.log({
      fee: dexConfigData.fees.toLocaleString(),
      admin: dexConfigData.admin.toBase58(),
      shares: Number(dexConfigData.shares.toString()) / web3.LAMPORTS_PER_SOL,
    });

    await program.methods
      .withdraw()
      .accounts({
        dexConfigurationAccount: dex_config_pda,
        admin: program.provider.publicKey,
      })
      .rpc()
      .catch((e) => console.log(e));

    balance = await program.provider.connection.getBalance(program.provider.publicKey);
    console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
    dexConfigData = await program.account.curveConfiguration.fetch(
      dex_config_pda
    );
    console.log({
      fee: dexConfigData.fees.toLocaleString(),
      admin: dexConfigData.admin.toBase58(),
      shares: Number(dexConfigData.shares.toString()) / web3.LAMPORTS_PER_SOL,
    });
  });
});
