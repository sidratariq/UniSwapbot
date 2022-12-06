const ethers = require('ethers');
const provider = new ethers.providers.WebSocketProvider('ws://127.0.0.1:7545');

//Address for Router,Factory and WEth
//We need WETH because pairs
const addresses = {
  WETH:      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  factory:   '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',  //used to create new pairs and we are listening to that event
  router:    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  recipient: '0x518E3a4fe18A6aD1708e6a5efAD533C235FcC783'   // address receive token bought
}

// We buy for 0.1 ETH of the new token 
const ethAmount = '1';
const ethAmount2 = '2';

const amountIn1 = ethers.utils.parseUnits(ethAmount, 'ether');
const amountIn2 = ethers.utils.parseUnits(ethAmount2, 'ether');
const ethAmounts = [amountIn1,amountIn1,amountIn1,amountIn1,amountIn1,amountIn2,amountIn2,amountIn2,amountIn2,amountIn2]; 

const keys=[
  // '0xae3f4d6af27567a1fb96606296f0e6444df95eea981c7b4b1510f4644fc74d9a',
  '0x4417be568a88df11d2ef1cb5e707a9d7d7261e8a00cb6275cfa435447b8de7e0',
  '0x527c0eefd2de46f2390d481d6f4c3c3bda01742456e9cfb1018d016861c56929',
  '0x1564743c5a2a48e3d67b9bff2488d8330ad8125618564f1223fe6f43bb39ba0e',
  '0x236baa1d0cf52910dcd472d162189bcaec4063a028d77864f227452f800e8e28',
  '0xb9c4c5ded0705aa831205d50b69477fce787aed739b8b4a1d56181874a235e91',
  '0xd440d42d2247e1990beb1f5c2c7ea13d23719fc3261a181466e5d376f8559f52',
  '0xf75058a918d19a288788141f28d8d0512bf312eb9b88ce885004a55da14a1e17',
  '0x0f10b61a5a6e12caf7b8198fa4de61770c08b42817699a74cbe66940cec76cf0',
  '0x04c446cf06de230ced7857024e7623f1d680fe8112f38f926595f97bc3924cd0'
  ];

const wallets=[];
const accounts=[];
const factories=[];
const routers=[];

const recipients=[
'0x87D0BF10B8551A7f86e69c7de12e430bBDb96F3A', 
'0xA1361336896dab50a7Aff4AC3B46AaE331238Ee4', 
'0x0f7c858e555673638fBEC4b579764ABbcC177674', 
'0x74677F637F2Fa48cdc130916cd320042f6DbBcB6', 
'0x15aD4B0caA2b211188D59f4D4a05082e46fF4528', 
'0xEc9c19a8Cd4E0A19B19509296B75c20e604bAd58', 
'0xc5b12093b7aF93F344e32DEdA70A04eA067448F8', 
'0x5A53E3025e9261C113C3f7def78fD9b13509BDa0', 
'0xA112ac1BD0d1205445ef34360AeF7ff52b103a79', 
'0x24f772E3145000e8d8c38f742E380CffC6a2Ad2D' 
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

// 15 eth from 10 accounts
// give them random eth 
// buy sequentially 2 2 for loops

async function getReserves(pairAddress,account){
   // Ideally you'll probably want to take a closer look at reserves, and price from the pair address
   const uPair = new ethers.Contract(
    pairAddress,
    ['function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
    account);

  const reserves = await uPair.getReserves();
  console.log("Value of reserves",reserves.toString());
  return reserves;
}

async function getSlippage(amountIn,tokenIn, tokenOut){
  console.log("Get slippage issues");
  const amounts = await routers[0].getAmountsOut(amountIn, [tokenIn, tokenOut],); //tell you how many tokens you will have as output 

  console.log("Get slippage issues",amounts.toString());
   //Our execution price will be a bit different, we need some flexbility
   const amountOutMin = amounts[1].sub(amounts[1].div(2));

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

  if(i%2 ==0){
    console.log("mod calculated",i)
    await new Promise(r => setTimeout(r, 2000));
  }

  const reserves = await getReserves(pairAddress,accounts[i]);
  console.log("Value of i:::",i)
  // if insufficient liquidity move on
  if (reserves[0] == 0 && reserves[1] == 0) {
    console.log(`Token has no liquidity...`);
    return
  }

  const amountOutMin =  getSlippage(ethAmounts[i],tokenIn,tokenOut);

  const estimation = await routers[0].estimateGas.swapExactTokensForTokens(
    ethAmounts[0], //as input wrap eth
    amountOutMin, // min amount of token you will accept as output 
    [tokenIn, tokenOut],  // address to specify your trading path WEth <==> Zogi 
    addresses.recipient, // person who will receive the token
    Date.now() + 1000 * 60 * 10 //10 minutes upto when the transaction is valid
  );

    const gasEstimation = estimation.toString();
    console.log("Value of gasEstimation",gasEstimation);
  //   add token address check if our token else don't work
  //   determine if you want to snipe this particular token...

  // if (tokenIn == '0x400049C5C923f3d8D179bba0349443231D5C115e' || tokenOut =='0x400049C5C923f3d8D179bba0349443231D5C115e' )
  // {
    try{
      const tx = await routers[0].swapExactTokensForTokens(
        ethAmounts[i], //as input wrap eth
        amountOutMin, // min amount of token you will accept as output 
        [tokenIn, tokenOut],  // address to specify your trading path WEth <==> Zogi 
        recipients[i], // person who will receive the token
        Date.now() + 1000 * 60 * 10 //10 minutes upto when the transaction is valid
      , {
        gasLimit: 300000,
        gasPrice: gasEstimation*2
      }
     );
      const receipt = await tx.wait(); 
      console.log('Transaction receipt',receipt.status,receipt.logs[0].blockNumber,amountOutMin.toString());
    }catch(ex){
      console.log("An error occured:::",ex)
    }
 
//  }
}
});
