// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.19;

import "./AmbireAccount.sol";
import "./libs/SignatureValidator.sol";
import "../node_modules/@account-abstraction/contracts/interfaces/IAccount.sol";
import "../node_modules/@account-abstraction/contracts/interfaces/UserOperation.sol";


contract ERC4337Account is AmbireAccount, IAccount {
	address public immutable entryPoint;

	// return value in case of signature failure, with no time-range.
	// equivalent to packSigTimeRange(true,0,0);
	uint256 constant internal SIG_VALIDATION_FAILED = 1;

	constructor(address _entryPoint, address[] memory addrs) {
		entryPoint = _entryPoint;

        uint len = addrs.length;
		for (uint i=0; i<len; i++) {
			privileges[addrs[i]] = bytes32(uint(1));
			emit LogPrivilegeChanged(addrs[i], bytes32(uint(1)));
		}
	}

	// aggregator is unused, we don't use sig aggregation
	function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
	    external returns (uint256 validationData)
	{
		require(msg.sender == entryPoint, "account: not from entrypoint");

        address signer = SignatureValidator.recoverAddr(userOpHash, userOp.signature);
		if (privileges[signer] == bytes32(0)) {
			validationData = SIG_VALIDATION_FAILED;
		}

		if (userOp.initCode.length == 0) {
			require(nonce == userOp.nonce, "account: invalid nonce");
		}

		if (missingAccountFunds > 0) {
			(bool success,) = payable(msg.sender).call{value : missingAccountFunds}("");
			(success);
			// ignore failure (its EntryPoint's job to verify, not account.)
		}
	}
}