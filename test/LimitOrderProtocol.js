const Wallet = require('ethereumjs-wallet').default;
const { TypedDataUtils } = require('@metamask/eth-sig-util');
const { expect, toBN, time, constants, profileEVM, trim0x, TypedDataVersion } = require('@1inch/solidity-utils');
const { bufferToHex } = require('ethereumjs-util');
const { buildOrder, buildOrderData, signOrder } = require('./helpers/orderUtils');
const { getPermit, withTarget } = require('./helpers/eip712');
const { addr0Wallet, addr1Wallet, joinStaticCalls } = require('./helpers/utils');

const TokenMock = artifacts.require('TokenMock');
const WrappedTokenMock = artifacts.require('WrappedTokenMock');
const LimitOrderProtocol = artifacts.require('LimitOrderProtocol');
const NFTCollection = artifacts.require('NFTCollection');



describe('LimitOrderProtocol', async () => {
    const [addr0, addr1] = [addr0Wallet.getAddressString(), addr1Wallet.getAddressString()];

    before(async () => {
        this.chainId = await web3.eth.getChainId();
    });
    
    it('mint bits', async function () {
        this.dai = await TokenMock.new('DAI', 'DAI');
        this.weth = await WrappedTokenMock.new('WETH', 'WETH');

        this.swap = await LimitOrderProtocol.new(this.weth.address);

        
        await this.dai.mint(addr0, '1000000');
        await this.dai.mint(addr1, '1000000');
        await this.weth.deposit({ from: addr0, value: '1000000' });
        await this.weth.deposit({ from: addr1, value: '1000000' });

        await this.dai.approve(this.swap.address, '1000000');
        await this.weth.approve(this.swap.address, '1000000');
        await this.dai.approve(this.swap.address, '1000000', { from: addr1 });
        await this.weth.approve(this.swap.address, '1000000', { from: addr1 });
    });
    
    
    it('generate NFT collection', async function () {
        NFTCollection = await NFTCollection.deploy();
        this.collection = await NFTCollection.mintNFT("Test NFT", "test.uri.domain.io");
        console.log(this.collection);
    })
    
    
});


