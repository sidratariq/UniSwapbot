const ethers = require('ethers');

const addresses = {
  WETH: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
  factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',  //used to create new pairs and we are listening to that event
  router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  recipient: '0x3013403BbE2952e3c8Bf07bbfD13Bb71E8590532' // address receive token bought
}

const provider = new ethers.providers.WebSocketProvider('wss://eth-goerli.g.alchemy.com/v2/PmsU75Ad9KLTYa-UVfe2inBHo3yXbJSX');
// const wallet = ethers.Wallet.fromMnemonic(mnemonic); //signing purpose
const wallet = new ethers.Wallet('b4f17b38aacf6f4f529e20195438cbdcf360823b9322475ed023e26206fc49f6',provider); //signing purpose

console.log("Wallet created::")

const account = wallet.connect(provider); 

const factory = new ethers.Contract(
  addresses.factory,
  ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
  account
);

const router = new ethers.Contract(
  addresses.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

factory.on('PairCreated', async (token0, token1, pairAddress) => {
  console.log(`
    New pair detected
    =================
    token0: ${token0}
    token1: ${token1}
    pairAddress: ${pairAddress}
  `);

  console.log("Value of pair created",pairAddress)

  //The quote currency needs to be WETH (we will pay with WETH)
  //token0 is guaranteed to be strictly less than token1 by sort order.

  let tokenIn, tokenOut;
  if(token0 === addresses.WETH) {
    tokenIn = token0; 
    tokenOut = token1;
  }

  if(token1 == addresses.WETH) {
    tokenIn = token1; 
    tokenOut = token0;
  }

  //The quote currency is not WETH
  if(typeof tokenIn === 'undefined') {
    return;
  }

//   //We buy for 0.1 ETH of the new token 
  const amountIn = ethers.utils.parseUnits('0.001', 'ether');
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]); //tell you how many tokens you will have as output 

//   //Our execution price will be a bit different, we need some flexbility
  const amountOutMin = amounts[1].sub(amounts[1].div(10));
  console.log(`
    Buying new token
    =================
    tokenIn: ${amountIn.toString()} ${tokenIn} (WETH)
    tokenOut: ${amountOutMin.toString()} ${tokenOut}
  `);

    // Ideally you'll probably want to take a closer look at reserves, and price from the pair address

        // const uPair = new ethers.Contract(
        //     pairAddress,
        //     ['function getReserves(address factory, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB)'],
        //     account
        //   );
        // const reserves = await uPair.getReserves()
        // // if insufficient liquidity move on
        
        // if (reserves[0] == 0 && reserves[1] == 0) {
        //     console.log(`Token has no liquidity...`)
        //     return
        // }

//   add token address check if our token else don't work
//   determine if you want to snipe this particular token...

if (tokenIn == '0x4f6EFD219d1DD3578B620E7052fDBf0f4A965984' || tokenOut =='0x4f6EFD219d1DD3578B620E7052fDBf0f4A965984' )
 { const tx = await router.swapExactTokensForTokens(
    amountIn, //as input wrap eth
    amountOutMin, // min amount of token you will accept as output 
    [tokenIn, tokenOut],  // address to specify your trading path WEth <==> Zogi 
    addresses.recipient, // person who will receive the token
    Date.now() + 1000 * 60 * 10 //10 minutes upto when the transaction is valid
  , {
    gasLimit: 1000000
  });
  const receipt = await tx.wait(); 
  console.log(receipt);

  const tx1 = await router.swapExactTokensForTokens(
    amountIn, //as input wrap eth
    amountOutMin, // min amount of token you will accept as output 
    [tokenIn, tokenOut],  // address to specify your trading path WEth <==> Zogi 
    addresses.recipient, // person who will receive the token
    Date.now() + 1000 * 60 * 10 //10 minutes upto when the transaction is valid
  , {
    gasLimit: 1000000
  });
  const receipt1 = await tx1.wait(); 
  console.log('Transaction receipt');
  console.log(receipt1);
}
});
