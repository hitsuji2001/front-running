// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./Wallet.sol";

contract FactoryContract {
  mapping(address => address) public walletOwner;

  function deployWallet(bytes32 salt)
  internal
  returns (address instance)
  {
    bool frontRunningEnable = false;

    require(walletOwner[msg.sender] == address(0), "You already have a wallet");
    // https://ethereum.stackexchange.com/questions/138243/solidity-assembly-code-create2-function
    bytes memory bytecode = type(Wallet).creationCode;
    if (frontRunningEnable) {
      assembly {
        instance := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
      }
    } else {
      bytes32 bytecodeHash = keccak256(bytecode);
      bytes32 newSalt = keccak256(abi.encodePacked(msg.sender, salt, bytecodeHash));
      assembly {
        instance := create2(0, add(bytecode, 0x20), mload(bytecode), newSalt)
      }
    }

    require(instance != address(0), "ERC1167: create2 failed");
    walletOwner[msg.sender] = instance;
  }

  function createWallet(
    bytes32 _salt
  )
  external
  returns (address walletAddress)
  {
    walletAddress = deployWallet(_salt);
    Wallet(walletAddress).initialize(msg.sender);
  }
}
