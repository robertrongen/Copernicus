This is the demonstration version of the project Copernicus project

[remix-button]: https://cdn.glitch.com/34e4af29-93e6-4569-90d9-5b60f8a326f5%2Fremix-button.svg?v=1611136449797
[wait-for-start]: https://cdn.glitch.com/34e4af29-93e6-4569-90d9-5b60f8a326f5%2Fstarted.png?v=1611134249761
[show-app]: https://cdn.glitch.com/34e4af29-93e6-4569-90d9-5b60f8a326f5%2Fopen-in-new-window.png?v=1611134136973
[tools-log]: https://cdn.glitch.com/34e4af29-93e6-4569-90d9-5b60f8a326f5%2Ftools-log.png?v=1611135230656
[server-settings]: https://cdn.glitch.com/34e4af29-93e6-4569-90d9-5b60f8a326f5%2Fserver-settings.png?v=1611158886492
[waiting-untrusted]: https://cdn.glitch.com/34e4af29-93e6-4569-90d9-5b60f8a326f5%2F8988a814-0f56-4c78-868f-e4097ea1d443.image.png?v=1611159500327
[error-opensea]: https://cdn.glitch.com/34e4af29-93e6-4569-90d9-5b60f8a326f5%2Fopensea-fail.png?v=1611160333325
[redo-opensea]: https://cdn.glitch.com/34e4af29-93e6-4569-90d9-5b60f8a326f5%2Fopensea-check-again.png?v=1611160190557
[again]: https://cdn.glitch.com/34e4af29-93e6-4569-90d9-5b60f8a326f5%2Fagain.png?v=1611161390066

# Creating your own copy of the project

First remix this project by clicking the button below: this will create your own copy of the project to work in 
[![Remix on Glitch][remix-button]](https://glitch.com/edit/#!/remix/copernicus-lets-go)

Once the project is remixed, Glitch creates a new VPS in the background. You have to wait until all tools are installed, servers 
are started and processes are running before you can start the deploy sequence 
 
# Get some testnet Ether

You need a wallet (including 12 word passphrase) with Rinkeby testnet Ether to run this demonstration. **Use a temporary wallet** because you will need to disclose the mnemonic to the app.

If you are in an organized Copernicus session, you will receive a paper wallet with test ether. 

Alternatively you can create a mnemonic using a [BIP39 passphrase generator](https://iancoleman.io/bip39/) and get some Ether from 
the [Rinkeby Faucet](https://faucet.rinkeby.io/). This will require you to do a temporary post containing your wallet address on 
Twitter or Facebook for verification. This post can be removed immediately after you have received the Ether.

# Change the token name and symbol

Open server/server.js and scroll to line #46

  ![server settings][server-settings]

Change the token name BANANA to something you like @ line #51 (don't change the suffixes)
Change the tokensymbol BN to something that matches the token name line #51

# Waiting for the project to be initialized

Open the log view by from the tools menu
![open log][tools-log]

Wait for both apps to start
![wait for start][wait-for-start]

Now open the project web page in the browser 
![open app in browser][show-app]

# Launch the deployment

Make sure that you have the log window in the glitch IDE visible while the deployment runs so you can watch what happens in the background.

When you see these lines, the server is ready:
![waiting for untrusted wallet to be set][waiting-untrusted]

Click on the "Set initiator wallet" and fill in the mnemonic from your wallet.

Lean back, relax and watch what happens.

!Note: in the demo project, the OpenSea deployment often fails. 

![opensea fails][error-opensea]

If this happens, you can restart manually with the "Check open Sea Orders Again" button

![redo opensea][redo-opensea]

# Yes: I want to go again!

Press the magic button to send all ether back to the untrusted wallet and start again. 

![again][again]




