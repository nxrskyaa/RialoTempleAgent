// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RialoTemple} from "../src/RialoTemple.sol";

interface Vm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

contract DeployRialoTemple {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (RialoTemple temple) {
        vm.startBroadcast();
        temple = new RialoTemple();
        vm.stopBroadcast();
    }
}
