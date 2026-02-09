// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BaibelRegistry} from "../src/BaibelRegistry.sol";
import {BaibelStaking} from "../src/BaibelStaking.sol";
import {MockEmberToken} from "../src/mocks/MockEmberToken.sol";

/**
 * @title DeployTestnetScript
 * @notice Deployment script for testnet with mock EMBER token
 * @dev Run with: forge script script/DeployTestnet.s.sol --rpc-url base-sepolia --broadcast
 */
contract DeployTestnetScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Mock EMBER token
        MockEmberToken emberToken = new MockEmberToken();
        console.log("MockEMBER deployed at:", address(emberToken));
        
        // Deploy BaibelRegistry
        BaibelRegistry registry = new BaibelRegistry();
        console.log("BaibelRegistry deployed at:", address(registry));
        
        // Deploy BaibelStaking
        BaibelStaking staking = new BaibelStaking(address(emberToken), address(registry));
        console.log("BaibelStaking deployed at:", address(staking));
        
        // Fund the deployer with some mock tokens for testing
        // Token already minted to deployer in constructor
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== Deployment Summary (Testnet) ===");
        console.log("Network: Base Sepolia");
        console.log("MockEMBER Token:", address(emberToken));
        console.log("BaibelRegistry:", address(registry));
        console.log("BaibelStaking:", address(staking));
        console.log("=====================================\n");
        
        console.log("To verify contracts:");
        console.log("forge verify-contract --chain-id 84532 --etherscan-api-key $ETHERSCAN_API_KEY <address> <contract>");
    }
}