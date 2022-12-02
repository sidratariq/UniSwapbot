const ethers = require('ethers');
const provider = new ethers.providers.WebSocketProvider('wss://eth-goerli.g.alchemy.com/v2/PmsU75Ad9KLTYa-UVfe2inBHo3yXbJSX');

//Address for Router,Factory and WEth
//We need WETH because pairs
const addresses = {
  WETH:      '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
  factory:   '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',  //used to create new pairs and we are listening to that event
  router:    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  recipient: '0x518E3a4fe18A6aD1708e6a5efAD533C235FcC783'   // address receive token bought
}

// We buy for 0.1 ETH of the new token 
const ethAmount = '0.001';
const amountIn = ethers.utils.parseUnits(ethAmount, 'ether');

const keys=[
'0x320ea7f1eef68251b4d8fa118d3412a1972c113f2a203e4660b606668d61779c', //Google sidra48
'0x41beb7422a11a30c4a60399c21e3984b1b4089dffd115d997cb90d371dbd30b7', //Firefox lenovo
'0x7b5d9f3d57c4ca9dda2b2519532b37f30749c48503168d7e06bd2cf73b854043', //Geeks
'0xb15773022ebe1a1f40db803e6aa9afa4da8a1c76a0a0eb2344b21c2f98269e6f', //Googlechrome mac
'0xb4f17b38aacf6f4f529e20195438cbdcf360823b9322475ed023e26206fc49f6'  //Firefox mac
];

const wallets=[];
const accounts=[];
const factories=[];
const routers=[];
const recipients=[
    '0x62EECB79D285790F3578C3b27f10FAffbFe338D3', //Google sidra48
    '0x7d3B079d4d633DcA822E249b86A6c87F3b78E499', //Firefox lenovo
    '0x7bf6916f1cd3390358F420E4404255982748f1Dd', //geeks
    '0x609fb9637F0Aa09e6180A1c45E2942d49c4A88c0', //Googlechrome mac
    '0x518E3a4fe18A6aD1708e6a5efAD533C235FcC783'  ////Firefox mac
  
  ];

for(var i=0; i<keys.length; i++){
  wallets[i] = new ethers.Wallet(keys[i], provider);
}

for(var i=0; i<keys.length; i++){
  accounts[i] = wallets[i].connect(provider);
}

for(var i=0; i<keys.length; i++){
  factories[i] = new ethers.Contract(
    addresses.factory,
    ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
    accounts[i]
  );
}

for(var i=0; i<keys.length; i++){
  routers[i] = new ethers.Contract(
    addresses.router,
    [
      'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
    ],
    accounts[i]
  );
}

async function getReserves(pairAddress,account){
   // Ideally you'll probably want to take a closer look at reserves, and price from the pair address
   const uPair = new ethers.Contract(
    pairAddress,
    ['function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
    account);

  const reserves = await uPair.getReserves();
  return reserves;
}

async function getSlippage(tokenIn, tokenOut){

  const amounts = await routers[0].getAmountsOut(amountIn, [tokenIn, tokenOut]); //tell you how many tokens you will have as output 

   //Our execution price will be a bit different, we need some flexbility
   const amountOutMin = amounts[1].sub(amounts[1].div(10));

   console.log(`
    Buying new token
    =================
    tokenIn: ${amountIn.toString()} ${tokenIn} (WETH)
    tokenOut: ${amountOutMin.toString()} ${tokenOut}
  `);

    return amountOutMin;

}

factories[0].on('PairCreated', async (token0, token1, pairAddress) => {
  console.log(`
    New pair detected
    =================
    token0: ${token0}
    token1: ${token1}
    pairAddress: ${pairAddress}
  `);

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

for(var i=0; i<keys.length; i++){
  const reserves = await getReserves(pairAddress,accounts[i]);

  // if insufficient liquidity move on
  if (reserves[0] == 0 && reserves[1] == 0) {
    console.log(`Token has no liquidity...`);
    return
  }

  const amountOutMin =  getSlippage(tokenIn,tokenOut);

  const estimation = await routers[0].estimateGas.swapExactTokensForTokens(
    amountIn, //as input wrap eth
    amountOutMin, // min amount of token you will accept as output 
    [tokenIn, tokenOut],  // address to specify your trading path WEth <==> Zogi 
    addresses.recipient, // person who will receive the token
    Date.now() + 1000 * 60 * 10 //10 minutes upto when the transaction is valid
  );

    console.log("Value of estimation",estimation.toString());

    //   add token address check if our token else don't work
    //   determine if you want to snipe this particular token...

  if (tokenIn == '0x400049C5C923f3d8D179bba0349443231D5C115e' || tokenOut =='0x400049C5C923f3d8D179bba0349443231D5C115e' )
  { const tx = await routers[0].swapExactTokensForTokens(
     amountIn, //as input wrap eth
     amountOutMin, // min amount of token you will accept as output 
     [tokenIn, tokenOut],  // address to specify your trading path WEth <==> Zogi 
     recipients[i], // person who will receive the token
     Date.now() + 1000 * 60 * 10 //10 minutes upto when the transaction is valid
   , {
     gasLimit: 1000000
   });
   const receipt = await tx.wait(); 
   console.log('Transaction receipt');
   console.log(receipt);
 }
}

});
