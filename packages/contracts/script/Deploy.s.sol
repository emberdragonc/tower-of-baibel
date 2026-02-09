// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BaibelRegistry} from "../src/BaibelRegistry.sol";
import {BaibelStaking} from "../src/BaibelStaking.sol";

/**
 * @title DeployScript
 * @notice Deployment script for BaibelRegistry and BaibelStaking on Base Sepolia
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast
 */
contract DeployScript is Script {
    // EMBER token on Base Sepolia (if deployed)
    // For testnet, we'll use a placeholder or deploy a mock if needed
    address public constant EMBER_TOKEN_BASE_SEPOLIA = address(0); // Update with actual address if available
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy BaibelRegistry
        BaibelRegistry registry = new BaibelRegistry();
        console.log("BaibelRegistry deployed at:", address(registry));
        
        // For testnet, if no EMBER token exists, we could deploy a mock here
        // For now, we'll use the Base mainnet address for reference
        // On Base Sepolia, you'll need to either:
        // 1. Deploy a mock EMBER token
        // 2. Use the real EMBER token if it's deployed on Sepolia
        
        // Deploy BaibelStaking
        // Note: Update EMBER_TOKEN_BASE_SEPOLIA with actual token address
        address emberToken = EMBER_TOKEN_BASE_SEPOLIA;
        require(emberToken != address(0), "EMBER token address not set");
        
        BaibelStaking staking = new BaibelStaking(emberToken, address(registry));
        console.log("BaibelStaking deployed at:", address(staking));
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Base Sepolia");
        console.log("BaibelRegistry:", address(registry));
        console.log("BaibelStaking:", address(staking));
        console.log("EMBER Token:", emberToken);
        console.log("==========================\n");
    }
}