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



contract('LOP', async function (accounts) {
    
    const [addr0, addr1] = [addr0Wallet.getAddressString(), addr1Wallet.getAddressString()];
    
    before(async () => {
        this.chainId = await web3.eth.getChainId();
        console.log(this.chainId)
    });
    
    
    it('mint bits', async function (){
        this.dai = await TokenMock.new('DAI', 'DAI');
        this.weth = await WrappedTokenMock.new('WETH', 'WETH');

        this.swap = await LimitOrderProtocol.new(this.weth.address);

        await this.dai.mint(addr0, '1000000');
        await this.dai.mint(addr1, '1000000');
        await this.weth.deposit({ from: addr0, value: '1000000' });
        await this.weth.deposit({ from: addr1, value: '1000000' });

        await this.dai.approve(this.swap.address, '1000000', { from: addr0 });
        await this.weth.approve(this.swap.address, '1000000', { from: addr0 });

        await this.dai.approve(this.swap.address, '1000000', { from: addr1 });
        await this.weth.approve(this.swap.address, '1000000', { from: addr1 });

        

    });
    
    it('NFT test - no swap', async function(){
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

        this.collection = await NFTCollection.new();
        this.firstNFT = await this.collection.mintNFT("Test NFT", "test.uri.domain.io", { from: addr1 });


        console.log('create NFT limit sell order  ');
        console.log(addr0,'weth balance (pre-trade):',  Number(await this.weth.balanceOf(addr0)))
        console.log(addr1,'weth balance (pre-trade):', Number(await this.weth.balanceOf(addr1)))
        console.log(addr0,'NFT balance (pre-trade):', Number(await this.collection.balanceOf(addr0)))
        console.log(addr1,'NFT balance (pre-trade):', Number(await this.collection.balanceOf(addr1)))

        await this.collection.approve(this.swap.address, 0, { from: addr1 })

        
            const sentOrder1 = buildOrder(
                {
                    makerAsset: this.collection.address,
                    takerAsset: this.weth.address,
                    NFTID: 0,
                    takingAmount: 2,
                    from: addr1,
                },
            );
            const signature1 = signOrder(sentOrder1, Number(this.chainId), this.swap.address, addr1Wallet.getPrivateKey());

            await this.swap.fillOrderNFTnoSwap(false, sentOrder1, signature1, '0x',{ from: addr0 });
            
            console.log(addr0,'weth balance (post-trade1):',  Number(await this.weth.balanceOf(addr0)))
            console.log(addr1,'weth balance (post-trade1):', Number(await this.weth.balanceOf(addr1)))

            console.log(addr0,'NFT balance (post-trade1):', Number(await this.collection.balanceOf(addr0)))
            console.log(addr1,'NFT balance (post-trade1):', Number(await this.collection.balanceOf(addr1)))


            console.log('create NFT limit buy order. Buy it back for a loss ');


            

        /* approve NFT, again*/
        await this.collection.approve(this.swap.address, 0, { from: addr0 })
            const sentOrder2 = buildOrder(
                {
                    makerAsset: this.weth.address,
                    takerAsset: this.collection.address,
                    NFTID: 0,
                    takingAmount: 3,
                    from: addr1,
                },
            );
            const signature2 = signOrder(sentOrder2, Number(this.chainId), this.swap.address, addr1Wallet.getPrivateKey());

            console.log('create NFT limit buy order. Buy it back for a loss ');
            await this.swap.fillOrderNFTnoSwap(true, sentOrder2, signature2, '0x',{ from: addr0 });


            console.log(addr0,'weth balance (post-trade2):',  Number(await this.weth.balanceOf(addr0)))
            console.log(addr1,'weth balance (post-trade2):', Number(await this.weth.balanceOf(addr1)))

            console.log(addr0,'NFT balance (post-trade2):', Number(await this.collection.balanceOf(addr0)))
            console.log(addr1,'NFT balance (post-trade2):', Number(await this.collection.balanceOf(addr1)))
        });


    it('NFT test - with swap', async function(){
        this.dai = await TokenMock.new('DAI', 'DAI');
        this.weth = await WrappedTokenMock.new('WETH', 'WETH');

        this.swap = await LimitOrderProtocol.new(this.weth.address);

        await this.dai.mint(addr0, '1000000');
        await this.dai.mint(addr1, '1000000');
        await this.weth.deposit({ from: addr1, value: '1000000' });

        await this.dai.approve(this.swap.address, '1000000');
        await this.weth.approve(this.swap.address, '1000000');
        await this.dai.approve(this.swap.address, '1000000', { from: addr1 });
        await this.weth.approve(this.swap.address, '1000000', { from: addr1 });

        this.collection = await NFTCollection.new();
        this.firstNFT = await this.collection.mintNFT("Test NFT", "test.uri.domain.io", { from: addr1 });

        console.log('create NFT limit sell order  ');
        console.log(addr0,'weth balance (pre-trade):',  Number(await this.weth.balanceOf(addr0)))
        console.log(addr1,'weth balance (pre-trade):', Number(await this.weth.balanceOf(addr1)))
        console.log(addr0,'NFT balance (pre-trade):', Number(await this.collection.balanceOf(addr0)))
        console.log(addr1,'NFT balance (pre-trade):', Number(await this.collection.balanceOf(addr1)))
        
        /* approve NFT */
        await this.collection.approve(this.swap.address, 0, { from: addr1 })

        
            const sentOrder1 = buildOrder(
                {
                    makerAsset: this.collection.address,
                    takerAsset: this.weth.address,
                    NFTID: 0,
                    takingAmount: 2,
                    from: addr1,
                },
            );
            const signature1 = signOrder(sentOrder1, Number(this.chainId), this.swap.address, addr1Wallet.getPrivateKey());

            if (Number(await this.weth.balanceOf(addr0)== 0 )){
                console.log("NFT buying token is not available to the user!")
                console.log("Get the WETH i.e. NFT asking currency, swap DAI for ETH, using 1inch swap")
                // mimicking the swap behavior
                await this.weth.deposit({ from: addr0, value: '1000000' });
            }

            await this.swap.fillOrderNFTnoSwap(false,sentOrder1, signature1, '0x',{ from: addr0 });
            
            console.log(addr0,'weth balance (post-trade1):',  Number(await this.weth.balanceOf(addr0)))
            console.log(addr1,'weth balance (post-trade1):', Number(await this.weth.balanceOf(addr1)))

            console.log(addr0,'NFT balance (post-trade1):', Number(await this.collection.balanceOf(addr0)))
            console.log(addr1,'NFT balance (post-trade1):', Number(await this.collection.balanceOf(addr1)))


            console.log('create NFT limit buy order. Buy it back for a loss ');

        /* approve NFT, again*/
        await this.collection.approve(this.swap.address, 0, { from: addr0 })
            const sentOrder2 = buildOrder(
                {
                    makerAsset: this.weth.address,
                    takerAsset: this.collection.address,
                    NFTID: 0,
                    takingAmount: 3,
                    from: addr1,
                },
            );
        });

    
    
});


