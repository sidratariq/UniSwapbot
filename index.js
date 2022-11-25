const ethers = require('ethers');

const provider = new ethers.providers.WebSocketProvider('wss://eth-goerli.g.alchemy.com/v2/PmsU75Ad9KLTYa-UVfe2inBHo3yXbJSX');


// mnemonic = "announce room limb pattern dry unit scale effort smooth jazz weasel alcohol"
// walletMnemonic = Wallet.fromMnemonic(mnemonic)
const wallet = new ethers.Wallet('0xb15773022ebe1a1f40db803e6aa9afa4da8a1c76a0a0eb2344b21c2f98269e6f',provider); //signing purpose

// ...or from a private key
// walletPrivateKey = new Wallet(walletMnemonic.privateKey)

console.log("Value of priavte key",wallet)
