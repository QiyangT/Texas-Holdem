const Game = artifacts.require("Game");
require('chai')
.use(require('chai-as-promised'))
.should();

contract(Game,([deployer, player1, player2, player3, player4)=>{
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
		
		it ('Buying 10000 tokens should be successful if all correct', async ()=>{
			let oldBalance, newBalance, result, data;
            oldBalance = await web3.eth.getBalance(player2);
			oldBalance = await new web3.utils.BN(oldBalance);
			await system.buyTokens(0, {from: player2, value: web3.utils.toWei('0', 'Ether')});
			data = await system.accounts(player2);
			assert.equal(data.isValid, true);
			assert.equal(data.isInGame, false);
			assert.equal(data.tokens.toNumber(), 0);
			result = await system.buyTokens(10000, {from: player2, value: web3.utils.toWei('10', 'Ether')});
			newBalance = await web3.eth.getBalance(player2);
			newBalance = await new web3.utils.BN(newBalance);
			data = await system.accounts(player2);
			assert.equal(data.isValid, true);
			assert.equal(data.isInGame, false, "4");
			assert.equal(data.tokens.toNumber(), 10000, "3");
			assert.equal(oldBalance - newBalance > web3.utils.toWei('10','Ether'), true, "5");
			assert.equal(oldBalance - newBalance < web3.utils.toWei('11','Ether'), true, "6");
        })
    })
	
	describe('Joinining games', async()=>{
		let result;
		
		it("The player without the minimum amount of tokens should be excluded from joining the game", async()=>{
			await system.join({from: player3}).should.be.rejected;
		})
		
		it("The player1 who has the minimum amount of tokens should be able to join the game", async()=>{
			await system.join({from: player1});
			result = await system.numOfPlayers();
			assert.equal(result, 1);
			result = await system.addrOfPlayers(0);
			assert.equal(result, player1);
			result = await system.accounts(player1);
			assert.equal(result.isInGame, true);
		})
		
		it("The player2 who has the minimum amount of tokens should be able to join the game", async()=>{
			await system.join({from: player2});
			result = await system.numOfPlayers();
			assert.equal(result, 2);
			result = await system.addrOfPlayers(1);
			assert.equal(result, player2);
			result = await system.accounts(player2);
			assert.equal(result.isInGame, true);
		})
	})
	
	describe("Game starts", async()=>{
		let result;
		
		it("The game should start correctly after two players join in it", async()=>{
			// check referee configuration
			result = await system.referee();
			assert.equal(result.pot, 300);
			assert.notEqual(system.getDeck(0), 0);
			assert.notEqual(system.getDeck(1), 0);
			assert.notEqual(system.getDeck(2), 0);
			assert.notEqual(system.getDeck(3), 0);
			assert.notEqual(system.getDeck(4), 0);
			assert.equal(result.currPlayerIdx >= 0 && result.currPlayerIdx <= 1, true);
			assert.equal(result.phase, "betting1");
			// check player[0] configuration
			result = await system.players(0);
			assert.equal(result.addr, player1);
			assert.notEqual(result.position, "");
			assert.equal(result.state, "start");
			assert.notEqual(system.getHand(0,0), undefined);
			assert.notEqual(system.getHand(0,0), 0);
			assert.notEqual(system.getHand(0,1), undefined);
			assert.notEqual(system.getHand(0,1), 0);
			assert.equal(result.currBet == 100 || result.currBet == 200, true);
			// check player[1] configuration
			result = await system.players(1);
			assert.equal(result.addr, player2);
			assert.notEqual(result.position, "");
			assert.equal(result.state, "start");
			assert.notEqual(system.getHand(1,0), undefined);
			assert.notEqual(system.getHand(1,0), 0);
			assert.notEqual(system.getHand(1,1), undefined);
			assert.notEqual(system.getHand(1,1), 0);
			assert.equal(result.currBet == 100 || result.currBet == 200, true);
		})
		
		it("Selling tokens should fail after joining the game", async()=>{
			result = await(system.accounts(player1));
			assert.equal(result.isInGame, true);
			await(system.sellTokens(100, {from: player1})).should.be.rejected;
		})
	})
	
});
