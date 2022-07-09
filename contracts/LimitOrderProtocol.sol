// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@1inch/solidity-utils/contracts/OnlyWethReceiver.sol";
import "./OrderMixinNFTs.sol";
import "./OrderRFQMixin.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


/**
 * @title ##1inch Limit Order Protocol v3
 * @notice Limit order protocol provides two different order types
 * - Regular Limit Order
 * - RFQ Order
 *
 * Both types provide similar order-fulfilling functionality. The difference is that regular order offers more customization options and features, while RFQ order is extremely gas efficient but without ability to customize.
 *
 * Regular limit order additionally supports
 * - Execution predicates. Conditions for order execution are set with predicates. For example, expiration timestamp or block number, price for stop loss or take profit strategies.
 * - Callbacks to notify maker on order execution
 *
 * See [OrderMixin](OrderMixin.md) for more details.
 *
 * RFQ orders supports
 * - Expiration time
 * - Cancelation by order id
 * - Partial Fill (only once)
 *
 * See [OrderRFQMixin](OrderRFQMixin.sol) for more details.
 */
contract LimitOrderProtocol is
    EIP712("1inch Limit Order Protocol", "3"),
    OrderMixinNFTs,
    OnlyWethReceiver
{
    // solhint-disable-next-line no-empty-blocks
    constructor(IWETH _weth) OrderMixinNFTs(_weth) OnlyWethReceiver(_weth) {}

    /// @dev Returns the domain separator for the current chain (EIP-712)
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns(bytes32) {
        return _domainSeparatorV4();
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4){}

}
