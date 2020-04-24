const Game = artifacts.require("Game");
require('chai')
.use(require('chai-as-promised'))
.should();

contract(Game,([deployer, player1, player2])=>{
    let system;
    before(async () =>{
        system = await Game.deployed()
    })
    describe('Deployment', async()=>{
        it('The deployment should be done successfully',async() =>{
            const address = await system.address
            assert.notEqual(address,0x0)
            assert.notEqual(address,'')
            assert.notEqual(address,null)
            assert.notEqual(address,undefined) 
        })

        it('The deployed smart contract has the correct exchange rate', async()=>{
			let result;
            result = await system.checkExchangeRate({from: player1});
			assert.equal(result, 1000);
        })
    })

    describe('Buying tokens', async()=>{
        let result;
		
		it('Buying tokens should fail without enough ethers', async () => {
            await system.buyTokens(10000000000, {from: player1, value: web3.utils.toWei('10000000', 'Ether')}).should.be.rejected;
		})
		
		it ('Buying 10000 tokens should be successful if all correct', async ()=>{
			let oldBalance, newBalance, result, data;
            oldBalance = await web3.eth.getBalance(player1);
			oldBalance = await new web3.utils.BN(oldBalance);
			await system.buyTokens(0, {from: player1, value: web3.utils.toWei('0', 'Ether')});
			data = await system.accounts(player1);
			assert.equal(data.isValid, true);
			assert.equal(data.isInGame, false);
			assert.equal(data.tokens.toNumber(), 0);
			result = await system.buyTokens(10000, {from: player1, value: web3.utils.toWei('10', 'Ether')});
			newBalance = await web3.eth.getBalance(player1);
			newBalance = await new web3.utils.BN(newBalance);
			data = await system.accounts(player1);
			assert.equal(data.isValid, true);
			assert.equal(data.isInGame, false, "4");
			assert.equal(data.tokens.toNumber(), 10000, "3");
			assert.equal(oldBalance - newBalance > web3.utils.toWei('10','Ether'), true, "5");
			assert.equal(oldBalance - newBalance < web3.utils.toWei('11','Ether'), true, "6");
        })
    })
	
	describe('Selling tokens', async()=>{		
		it('Selling tokens should fail without enough tokens', async () => {
            await system.sellTokens(1000, {from: player2}).should.be.rejected;
		})
		
		it ('Selling tokens should be successful if all correct', async ()=>{
			let oldBalance, newBalance, result, data;
            oldBalance = await web3.eth.getBalance(player1);
			oldBalance = await new web3.utils.BN(oldBalance);
			data = await system.accounts(player1);
			assert.equal(data.isValid, true);
			assert.equal(data.isInGame, false);
			assert.equal(data.tokens.toNumber(), 10000);
			await system.sellTokens(4000, {from: player1});
			newBalance = await web3.eth.getBalance(player1);
			newBalance = await new web3.utils.BN(newBalance);
			data = await system.accounts(player1);
			assert.equal(data.isInGame, false);
			assert.equal(data.isValid, true);
			assert.equal(data.tokens.toNumber(), 6000);
			assert.equal(newBalance - oldBalance > web3.utils.toWei('3','Ether'), true);
			assert.equal(newBalance - oldBalance < web3.utils.toWei('4','Ether'), true);
        })
    })
	
	describe("Selling all remaining tokens", async()=> {
		it('Selling all remaining tokens should be successful if all correct', async () => {
			let oldBalance, newBalance, result, data;
			oldBalance = await web3.eth.getBalance(player1);
			oldBalance = await new web3.utils.BN(oldBalance);
			await system.sellTokens(6000, {from: player1});
			newBalance = await web3.eth.getBalance(player1);
			newBalance = await new web3.utils.BN(newBalance);
			assert.equal(newBalance - oldBalance > web3.utils.toWei('5','Ether'), true);
			assert.equal(newBalance - oldBalance < web3.utils.toWei('6','Ether'), true);
			data = await system.accounts(player1);
			assert.equal(data.tokens.toNumber(), 0);
		})
	})
});
