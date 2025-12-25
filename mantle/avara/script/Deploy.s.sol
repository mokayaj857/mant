// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AvaraCore} from "../contracts/avara.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        address deployer = tx.origin;

        // Get Mantle signer or use deployer as fallback
        address mantleSigner;
        try vm.envAddress("MANTLE_SIGNER") returns (address signer) {
            mantleSigner = signer;
        } catch {
            try vm.envAddress("KRNL_SIGNER") returns (address signer) { // Backward compatibility
                mantleSigner = signer;
            } catch {
                mantleSigner = deployer;
                console.log("MANTLE_SIGNER not set, using deployer address");
            }
        }

        console.log("Deploying AvaraCore...");
        console.log("Deployer:", deployer);
        console.log("Mantle Signer:", mantleSigner);
        
        AvaraCore avaraCore = new AvaraCore(mantleSigner);
        
        address poapNFT = address(avaraCore.poaps());
        address ticketNFT = address(avaraCore.tickets());
        
        console.log("\n=== Deployment Complete ===");
        console.log("AvaraCore:", address(avaraCore));
        console.log("POAPNFT:", poapNFT);
        console.log("TicketNFT:", ticketNFT);
        console.log("Mantle Signer:", mantleSigner);
        
        vm.stopBroadcast();
    }
}

