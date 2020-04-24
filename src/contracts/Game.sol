pragma solidity ^0.5.0;

import "./ExchangeCurrency.sol";

contract Game is ExchangeCurrency {
    mapping(string => uint) public ratings;
    
	uint nonce = 1;
	uint public numOfPlayers = 0;
	uint public sb = 100;
	uint public bb = 200;
	address[2] public addrOfPlayers;
	Players[2] public players;
	Referee public referee;
	
	struct Players {
		address addr;
		string position;
		string state;
		uint[2] hand;
		uint currBet;
	}
	
	struct Referee {
		uint pot;
		uint currBet;
		uint[5] deck;
		uint currPlayerIdx;
		address currPlayer;
		string phase;
		address winner;
		uint[5] winnerCard;
	}
	
	constructor() public {
	    ratings["highcard"] = 0;
	    ratings["pair"] = 1;
	    ratings["twopair"] = 2;
	    ratings["threeofakind"] = 3;
	    ratings["straight"] = 4;
	    ratings["flush"] = 5;
	    ratings["fullhouse"] = 6;
	    ratings["fourofakind"] = 7;
	    ratings["straightflush"] = 8;
	    ratings["royalflush"] = 9;
	}
	
	function join() public returns(bool) {
		// Allow a maximum of 2 players
		require(numOfPlayers < 2);
		require(accounts[msg.sender].tokens >= 500);
		require(accounts[msg.sender].isInGame == false);
		if(numOfPlayers == 1) {
			// Players should be unique and have a minimum amount of tokens
			accounts[msg.sender].isInGame = true;
			numOfPlayers += 1;
			addrOfPlayers[1] = msg.sender;
			_start();
		}
		else {
			accounts[msg.sender].isInGame = true;
			numOfPlayers += 1;
			addrOfPlayers[0] = msg.sender;
		}
	}
	
	function allin(uint amount) public {
	    raise(amount);
	    uint currPlayerIdx = referee.currPlayerIdx; 
	    players[currPlayerIdx].state = "allin";
	}
	
	function call() public {
		require(msg.sender == referee.currPlayer);
	    require(compareStringsbyBytes(referee.phase, "betting1") || compareStringsbyBytes(referee.phase, "betting2")
	            || compareStringsbyBytes(referee.phase, "betting3") || compareStringsbyBytes(referee.phase, "betting4"));
	    uint currPlayerIdx = referee.currPlayerIdx;        
	    uint bet = referee.currBet - players[currPlayerIdx].currBet;
	    require(accounts[msg.sender].tokens >= bet);
	    accounts[msg.sender].tokens -= bet;
	    players[currPlayerIdx].currBet += bet;
	    referee.pot += bet;
	    players[currPlayerIdx].state = "call";
	}
	
	function check() public {
		require(msg.sender == referee.currPlayer);
		require(compareStringsbyBytes(referee.phase, "betting1") || compareStringsbyBytes(referee.phase, "betting2")
	            || compareStringsbyBytes(referee.phase, "betting3") || compareStringsbyBytes(referee.phase, "betting4"));
	    uint currPlayerIdx = referee.currPlayerIdx;
	    require(referee.currBet == players[currPlayerIdx].currBet);
	    players[currPlayerIdx].state = "check";
	}
	
	function fold() public {
		require(msg.sender == referee.currPlayer);
	    require(compareStringsbyBytes(referee.phase, "betting1") || compareStringsbyBytes(referee.phase, "betting2")
	            || compareStringsbyBytes(referee.phase, "betting3") || compareStringsbyBytes(referee.phase, "betting4"));
	    uint currPlayerIdx = referee.currPlayerIdx;        
	    players[currPlayerIdx].currBet = 0;
	}
	
	function raise(uint amount) public {
	    require(msg.sender == referee.currPlayer);
	    require(compareStringsbyBytes(referee.phase, "betting1") || compareStringsbyBytes(referee.phase, "betting2")
	            || compareStringsbyBytes(referee.phase, "betting3") || compareStringsbyBytes(referee.phase, "betting4"));
	    uint currPlayerIdx = referee.currPlayerIdx;        
	    uint bet = referee.currBet - players[currPlayerIdx].currBet + amount;
	    require(accounts[msg.sender].tokens >= bet);
	    accounts[msg.sender].tokens -= bet;
	    players[currPlayerIdx].currBet += bet;
	    referee.pot += bet;
	    referee.currBet = players[currPlayerIdx].currBet;
	    players[currPlayerIdx].state = "raise";
	}
	
	function compareStringsbyBytes(string memory s1, string memory s2) public pure returns(bool){
		return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
	}
	
	function _start() public {
		require(numOfPlayers == 2);
		// Configure players
		uint player1Num = uint(keccak256(abi.encodePacked(now, msg.sender, nonce++)));
		uint player2Num = uint(keccak256(abi.encodePacked(now, msg.sender, nonce++)));
		uint sbidx = _generateRandNum(player1Num, player2Num, 2);
		uint[2] memory playerCard1;
		uint[2] memory playerCard2;
		for(uint i = 0; i < 2; i++) {
		    playerCard1[i] = _assignCards();
		    playerCard2[i] = _assignCards();
		}
		players[sbidx % 2] = Players(addrOfPlayers[sbidx % 2], "smallBlind", "start", playerCard1, sb);
		players[(sbidx + 1) % 2] = Players(addrOfPlayers[(sbidx + 1) % 2], "bigBlind", "start", playerCard1, bb);
		// Configure referee
		uint pot = sb + bb;
		uint[5] memory deck;
		for(uint i = 0; i <= 4; i++) {
			deck[i] = _assignCards();
		}
		uint currPlayerIdx = sbidx;
		address currPlayer = players[currPlayerIdx].addr;
		string memory phase = "betting1";
		uint[5] memory temp;
		referee = Referee(pot, bb, deck, currPlayerIdx, currPlayer, phase, address(0), temp);
		// Players put the blinds into the pot
		for(uint i = 0; i < 2; i++) {
			if(compareStringsbyBytes(players[i].position, "smallBlind"))  accounts[players[i].addr].tokens -= sb;
			else if(compareStringsbyBytes(players[i].position, "bigBlind"))  accounts[players[i].addr].tokens -= bb;
		}
		// update the status of the game
	}
	
	function _addToPot(uint amount) public {
		require(accounts[msg.sender].tokens >= amount);
		accounts[msg.sender].tokens -= amount;
		referee.pot += amount;
	}
	
	function _assignCards() public returns(uint) {
		uint maxIter = 100;
		uint card = 0;
		for(uint i = 0; i <= maxIter; i++) {
			uint player1Num = uint(keccak256(abi.encodePacked(now, msg.sender, nonce++)));
			uint player2Num = uint(keccak256(abi.encodePacked(now, msg.sender, nonce++)));
			card = _generateRandNum(player1Num, player2Num, 52) + 1;
			if(players[0].hand[0] == card) continue;
			if(players[0].hand[1] == card) continue;
			if(players[1].hand[0] == card) continue;
			if(players[1].hand[1] == card) continue;
			if(referee.deck[0] == card) continue;
			if(referee.deck[1] == card) continue;
			if(referee.deck[2] == card) continue;
			if(referee.deck[3] == card) continue;
			if(referee.deck[1] == card) continue;
			break;
		}
		return card;
	}
	
	function _generateRandNum(uint player1, uint player2, uint range) public pure returns(uint) {
		return uint(player1 + player2) % range;
	}
	
	function _result() private {
	    require(compareStringsbyBytes(referee.phase, "draw") || compareStringsbyBytes(referee.phase, "win"));
	    if(compareStringsbyBytes(referee.phase, "draw")) {
	        accounts[players[0].addr].tokens += referee.pot / 2;
	        accounts[players[1].addr].tokens += referee.pot / 2;
	    } else {
	        accounts[referee.currPlayer].tokens += referee.pot;
	    }
	    accounts[players[0].addr].isInGame = false;
	    accounts[players[1].addr].isInGame = false;
	    numOfPlayers = 0;
	}
	
	function _getNextPlayer() public {
		if(referee.currPlayerIdx == 0) {
			referee.currPlayerIdx = 1;
			referee.currPlayer = players[1].addr;
		} else {
			referee.currPlayerIdx = 0;
			referee.currPlayer = players[0].addr;
		}
	}
	
	function _revealDeck() public {
	    require(true == compareStringsbyBytes(referee.phase, "betting1")
	                  || compareStringsbyBytes(referee.phase, "betting2")
	                  || compareStringsbyBytes(referee.phase, "betting3"));
	    if(compareStringsbyBytes(referee.phase, "betting1")) {
	        for(uint i = 0; i < 3; i++) {
	            referee.deck[i] = _assignCards();
	        }
	    } else if(compareStringsbyBytes(referee.phase, "betting2")) {
	        referee.deck[3] = _assignCards();
	        
	    } else if(compareStringsbyBytes(referee.phase, "betting3")) {
	        referee.deck[4] = _assignCards();
	    }
	}
	
	function _compare(uint a, uint b) public pure returns(bool) {
	    // if a is strictly less than b
	    if(_getRank(a) < _getRank(b))  return true;
	    else  return false;
	}
	
	function _getSuit(uint card) public pure returns(uint) {
	    return (card - 1) / 13;
	}
	
	function _getRank(uint card) public pure returns(uint) {
	    return (card - 1) % 13 + 2;
	}
	
	function _getTypeScore(string memory tp) public view returns(uint) {
	    return ratings[tp];
	}
	
	function _applyMask(uint orig, uint val, uint shift) public pure returns(uint){
	    uint temp = val << shift;
	    return temp | orig;
	}
	
	// only for test
	function getHand(uint x, uint y) public view returns(uint) {
		return players[x].hand[y];
	}
	
	function getDeck(uint x) public view returns(uint) {
		return referee.deck[x];
	}
	
	function getWinnerCard() public view returns(uint[5] memory) {
		return referee.winnerCard;
	}
}