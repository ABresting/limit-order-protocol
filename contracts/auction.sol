pragma solidity 0.8.15;

import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@1inch/solidity-utils/contracts/interfaces/IWETH.sol";
import "@1inch/solidity-utils/contracts/libraries/SafeERC20.sol";
import "@1inch/solidity-utils/contracts/libraries/ECDSA.sol";

import "./NFTCollection.sol";

import "./helpers/AmountCalculator.sol";
import "./helpers/NonceManager.sol";
import "./helpers/PredicateHelper.sol";
import "./interfaces/NotificationReceiver.sol";
import "./libraries/ArgumentsDecoder.sol";
import "./libraries/Callib.sol";
import "./libraries/Errors.sol";
import "./OrderLib.sol";
import "./OrderMixinNFTs.sol";


abstract contract auction is OrderMixinNFTs {
    uint256 public index = 0;
    address OneInchAddress;
    uint256 collateral;

    struct Auction {
        uint256 index; // Auction Index
        address addressNFTCollection; // Address of the ERC721 NFT Collection contract
        address addressPaymentToken; // Address of the ERC20 Payment Token contract
        uint256 nftId; // NFT Id
        address creator; // Creator of the Auction
        uint256 endAuction; // Timestamp for the end day&time of the auction
        uint256 byzantineEndingTime; // Challenging time
        bool executed;
    }



    Auction[] public allAuctions;

    constructor (address _OneIinch,uint256 _collateral){
        OneInchAddress = _OneIinch;
        collateral =_collateral;
    }
    function _isContract(address _addr) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_addr)
        }
        return size > 0;
    }


     function createAuction(
        address _addressNFTCollection,
        address _addressPaymentToken,
        uint256 _nftId,
        uint256 _initialBid,
        uint256 _endAuction,
        uint256 _byzantineEndingTime
    ) external returns (uint256) {
        require(
            _isContract(_addressNFTCollection),
            "Invalid NFT Collection contract address"
        );
        require(
            _isContract(_addressPaymentToken),
            "Invalid Payment Token address"
        );
         // Check if the endAuction time is valid
        require(_endAuction > block.timestamp, "Invalid end date for auction");
        // Check if the initial bid price is > 0
        require(_initialBid > 0, "Invalid initial bid price");
         // Get NFT collection contract
        NFTCollection nftCollection = NFTCollection(_addressNFTCollection);
        IERC20 OneInch = IERC20(OneInchAddress);

        require(nftCollection.ownerOf(_nftId) == msg.sender,"Caller is not the owner of the NFT");
          // Lock NFT in Marketplace contract
        require(nftCollection.transferNFTFrom(msg.sender, address(this), _nftId));
        require(OneInch.transferFrom(msg.sender,address(this),collateral));
        Auction memory newAuction = Auction({
            index: index,
            addressNFTCollection: _addressNFTCollection,
            addressPaymentToken: _addressPaymentToken,
            nftId: _nftId,
            creator: msg.sender,
            endAuction: _endAuction,
            byzantineEndingTime: _byzantineEndingTime,
            executed:false
        });
         //update list
        allAuctions.push(newAuction);
        // increment auction sequence
        index++;
        return index;
    }


    function endAuction(
        uint256 indexAuction,
        OrderLib.NFTOrderGeneric calldata order_,
        bytes calldata signature,
        bytes calldata interaction,
        address target
    ) public {
        // checks the auction creator is the seller of the NFT
        require(allAuctions[indexAuction].creator == msg.sender,"U are not the seller dog");
        require(allAuctions[indexAuction].endAuction <= block.timestamp);
        require(allAuctions[indexAuction].byzantineEndingTime > block.timestamp);
        require(!allAuctions[indexAuction].executed,"already executed");

        fillNFTOrderTo(
            order_,
            signature,
            interaction,
            target
        );
        allAuctions[indexAuction].executed = true;
        IERC20(OneInchAddress).transfer(msg.sender,collateral);
    }

    function challenge(
        uint256 indexAuction
    ) public {
        require(allAuctions[indexAuction].byzantineEndingTime < block.timestamp);
        require(!allAuctions[indexAuction].executed,"The auction has been executed");

        NFTCollection nftCollection = NFTCollection(
            allAuctions[indexAuction].addressNFTCollection
            );
        IERC20 OneInch = IERC20(OneInchAddress);

        OneInch.transfer(msg.sender,collateral);
        nftCollection.transferNFTFrom(msg.sender, address(this), allAuctions[indexAuction].nftId);
        allAuctions[indexAuction].executed = true;
    }

}