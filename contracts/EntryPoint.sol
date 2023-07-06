// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;
import 'hardhat/console.sol';
import './SenderCreator.sol';
import './libs/Exec.sol';

/**
 * helper contract for EntryPoint, to call userOp.initCode from a "neutral" address,
 * which is explicitly not the entryPoint itself.
 */
contract EntryPoint {

    error FailedOp(uint256 opIndex, string reason);

    // create the sender's contract if needed.
    function createSenderIfNeeded(address sender, uint256 verificationGasLimit, bytes calldata initCode) public {
        if (initCode.length != 0) {
            // if (sender.code.length != 0) revert FailedOp(0, "AA10 sender already constructed");
            SenderCreator senderCreator = new SenderCreator();
            address sender1 = senderCreator.createSender{gas : verificationGasLimit}(initCode);
            if (sender1 == address(0)) revert FailedOp(0, "AA13 initCode failed or OOG");
            if (sender1 != sender) revert FailedOp(0, "AA14 initCode must return sender");
            if (sender1.code.length == 0) revert FailedOp(0, "AA15 initCode must create sender");
        }
    }

    function sendTxnOutside(address sender, bytes calldata callData, uint256 callGasLimit) public {
        this.sendTxn(sender, callData, callGasLimit);
    }


    function sendTxn(address sender, bytes calldata callData, uint256 callGasLimit) external {
        Exec.call(sender, 0, callData, callGasLimit);
    }
}
