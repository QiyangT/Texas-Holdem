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
	    _update();
	}
	
	function check() public {
		require(msg.sender == referee.currPlayer);
		require(compareStringsbyBytes(referee.phase, "betting1") || compareStringsbyBytes(referee.phase, "betting2")
	            || compareStringsbyBytes(referee.phase, "betting3") || compareStringsbyBytes(referee.phase, "betting4"));
	    uint currPlayerIdx = referee.currPlayerIdx;
	    require(referee.currBet == players[currPlayerIdx].currBet);
	    players[currPlayerIdx].state = "check";
	    _update();
	}
	
	function fold() public {
		require(msg.sender == referee.currPlayer);
	    require(compareStringsbyBytes(referee.phase, "betting1") || compareStringsbyBytes(referee.phase, "betting2")
	            || compareStringsbyBytes(referee.phase, "betting3") || compareStringsbyBytes(referee.phase, "betting4"));
	    uint currPlayerIdx = referee.currPlayerIdx;        
	    players[currPlayerIdx].currBet = 0;
	    players[currPlayerIdx].state = "fold";
	    _update();
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
	    _update();
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
		_update();
	}
	
	function _update() public {
		uint[2] memory notFolded;
		uint numNotFolded;
		uint notDone;
		for(uint i = 0; i < 2; i++) {
		    if(!compareStringsbyBytes(players[i].state, "fold")) {
		        notFolded[numNotFolded++] = i;
		    }
		    if((!compareStringsbyBytes(players[i].state, "fold"))
		        && (!compareStringsbyBytes(players[i].state, "call"))
		        && (!compareStringsbyBytes(players[i].state, "allin"))
		        && (!compareStringsbyBytes(players[i].state, "check")))
		        notDone++;
		}
		// only one remaining player
		if(numNotFolded == 1) {
		    uint[5] memory winnerCard;
		    referee.phase = "win";
		    referee.currPlayerIdx = notFolded[0];
		    referee.currPlayer = players[referee.currPlayerIdx].addr;
		    referee.winnerCard = winnerCard;
		    _result();
			return;
		}
		// first round completes, move to second round
		if(notDone == 0 && compareStringsbyBytes(referee.phase, "betting1")) {
		     _getNextPlayer();
		    _revealDeck();
		    referee.phase = "betting2";
		    // reset players' state as start
		    players[0].state = "start";
		    players[1].state = "start";
			return;
		}
		// second round completes, move to third round
		if(notDone == 0 && compareStringsbyBytes(referee.phase, "betting2")) {
		     _getNextPlayer();
		    _revealDeck();
		    referee.phase = "betting2";
		    // reset players' state as start
		    players[0].state = "start";
		    players[1].state = "start";
			return;
		}
		// third round completes, move to fourth round
		if(notDone == 0 && compareStringsbyBytes(referee.phase, "betting3")) {
		     _getNextPlayer();
		    _revealDeck();
		    referee.phase = "betting2";
		    // reset players' state as start
		    players[0].state = "start";
		    players[1].state = "start";
			return;
		}
		// fourth round completes, check for winner
		if(notDone == 0 && compareStringsbyBytes(referee.phase, "betting4")) {
		    uint bestScore;
		    uint winner;
		    uint[5] memory winnerCard;
		    for(uint i = 0; i < 2; i++) {
		        uint[6] memory tempBest = _evaluateHand(players[i].hand);
		        if(bestScore < tempBest[0]) {
		            bestScore = tempBest[0];
		            winner = i;
		            winnerCard = [tempBest[1], tempBest[2], tempBest[3], tempBest[4], tempBest[5]];
		        }
		    }
		    referee.phase = "win";
		    referee.currPlayerIdx = winner;
		    referee.currPlayer = players[winner].addr;
		    referee.winner = players[winner].addr;
		    referee.winnerCard = winnerCard;
			_result();
		}
		
		_getNextPlayer();
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
	
	function _evaluateHand(uint[2] memory hand) public returns(uint[6] memory) {
	    uint[5] memory deck = referee.deck;
	    uint[7] memory allCards = [hand[0], hand[1], deck[0], deck[1], deck[2], deck[3], deck[4]];
	    uint[5] memory bestCard;
	    uint bestScore;
	    for(uint i1 = 0; i1 < allCards.length - 4; i1++) {
	        for(uint i2 = i1 + 1; i2 < allCards.length - 3; i2++) {
	            for(uint i3 = i2 + 1; i3 < allCards.length - 2; i3++) {
	                for(uint i4 = i3 + 1; i4 < allCards.length - 1; i4++) {
	                    for(uint i5 = i4 + 1; i5 < allCards.length; i5++) {
	                        uint[5] memory tempHand = [allCards[i1], allCards[i2], allCards[i3], allCards[i4], allCards[i5]];
	                        uint score = _evaluateHandFull(tempHand);
	                        if(score > bestScore) {
	                            bestCard = [i1, i2, i3, i4, i5];
	                            bestScore = score;
	                        }
	                    }
	                }
	            }
	        }
	    }
	    uint[6] memory res = [bestScore, bestCard[0], bestCard[1], bestCard[2], bestCard[3], bestCard[4]];
	    return res;
	}
	
	function _evaluateHandFull(uint[5] memory hand) public returns(uint) {
	    uint[5] memory ranks;
	    for(uint i = 0; i < 5; i++) {
	        ranks[i] = _getRank(hand[i]);
	    }
	    _sort(hand, 0, hand.length - 1);
	    uint[15] memory cVals;
	    for(uint i = 0; i < 5; i++) {
	        cVals[_getRank(hand[i])]++;
	    }
	    uint handType;
	    uint handValue;
	    if (_isRoyalFlush(hand)) {
                handType = ratings["royalflush"];
                handValue = _getHandValue(hand, handType);
            } else if (_isStraightFlush(hand)) {
                handType = ratings["straightflush"];
                handValue = _getHandValue(hand, handType);
            } else if (_isFourOfAKind(hand, cVals)) {
                handType = ratings["fourofakind"];
                handValue = _getHandValue(hand, handType);
            } else if (_isFullHouse(hand, cVals)) {
                handType = ratings["fullhouse"];
                handValue = _getHandValue(hand, handType);
            } else if (_isFlush(hand)) {
                handType = ratings["flush"];
                handValue = _getHandValue(hand, handType);
            } else if (_isStraight(hand)) {
                handType = ratings["straight"];
                handValue = _getHandValue(hand, handType);
            } else if (_isThreeOfAKind(hand, cVals)) {
                handType = ratings["threeofakind"];
                handValue = _getHandValue(hand, handType);
            } else if (_isTwoPair(hand, cVals)) {
                handType = ratings["twopair"];
                handValue = _getHandValue(hand, handType);
            } else if (_isPair(hand, cVals)) {
                handType = ratings["pair"];
                handValue = _getHandValue(hand, handType);
            } else {
                handType = ratings["highcard"];
                handValue = _getHandValue(hand, handType);
            }
            //FIXME - ought to store hand type somewhere
            //and display it to the winner
            return handValue;
	}
	
	function _isRoyalFlush(uint[5] memory hand) public pure returns(bool) {
	    if(_isStraightFlush(hand) && hand[0] == 14) {
	        return true;
	    }
	    return false;
	}
	
	function _isStraightFlush(uint[5] memory hand) public pure returns(bool) {
	    if(_isFlush(hand) && _isStraight(hand)) {
	        return true;
	    }
	    return false;
	}
	
	function _isFourOfAKind(uint[5] memory hand, uint[15] memory cVals) public pure returns(bool) {
	    uint[5] memory newOrder;
	    uint four = 0;
	    uint idx = 0;
	    // find the rank owned by four cards if it exists
	    for(uint i = 2; i < 15; i++) {
	        if(cVals[i] == 4) {
	            four = i;
	        }
	    }
	    if(four != 0) {
	        for(uint i = 0; i < 5; i++) {
	            if(_getRank(hand[i]) == four) {
	                newOrder[idx++] = hand[i];
	            } else {
	                newOrder[4] = hand[i];
	            }
	        }
	        // update card order
	        for(uint i = 0; i < 5; i++) {
	            hand[i] = newOrder[i];
	        }
	        return true;
	    }
	    return false;
	}
	
	function _isFullHouse(uint[5] memory hand, uint[15] memory cVals) public pure returns(bool) {
	    uint[5] memory newOrder;
	    uint three = 0;
	    uint two = 0;
	    uint midx = 0;
	    uint lidx = 3;
	    // find the ranks with three cards and two cards if exist
	    for(uint i = 2; i < 15; i++) {
	        if(cVals[i] == 3) {
	            three = i;
	        }
	        if(cVals[i] == 2) {
	            two = i;
	        }
	    }
	    if(three != 0 && two != 0) {
	        for(uint i = 0; i < 5; i++) {
	            if(_getRank(hand[i]) == two) {
	                newOrder[lidx++] = hand[i];
	            } else if(_getRank(hand[i]) == three) {
	                newOrder[midx++] = hand[i];
	            }
	        }
	        // update card order
	        for(uint i = 0; i < 5; i++) {
	            hand[i] = newOrder[i];
	        }
	        return true;
	    }
	    return false;
	}
	
	function _isFlush(uint[5] memory hand) public pure returns(bool) {
	    if(_getSuit(hand[0]) == _getSuit(hand[1])
	        && _getSuit(hand[1]) == _getSuit(hand[2])
	        && _getSuit(hand[2]) == _getSuit(hand[3]))
	        return true;
	    return false;
	}
	
	function _isStraight(uint[5] memory hand) public pure returns(bool) {
	    // check corner case of "A5432"
	    if(_getRank(hand[0]) == 14 && _getRank(hand[1]) == 5 && _getRank(hand[2]) == 4
	        && _getRank(hand[3]) == 3 && _getRank(hand[4]) == 2) {
	            uint temp = hand[0];
	            hand[0] = hand[4];
	            hand[4] = temp;
	            return true;
	    }
	    for(uint i = 0; i < 4; i++) {
	        if(_getRank(hand[i]) - _getRank(hand[i + 1]) != 1) {
	            return false;
	        }
	    }
	    return true;
	}
	
	function _isThreeOfAKind(uint[5] memory hand, uint[15] memory cVals) public pure returns(bool) {
	    uint[5] memory newOrder;
	    uint three = 0;
	    uint midx = 0;
	    uint lidx = 3;
	    // find the ranks with three cards if exists
	    for(uint i = 2; i < 15; i++) {
	        if(cVals[i] == 3) {
	            three = i;
	        }
	    }
	    if(three != 0) {
	        for(uint i = 0; i < 5; i++) {
	            if(_getRank(hand[i]) == three) {
	                newOrder[midx++] = hand[i];
	            } else {
	                newOrder[lidx++] = hand[i];
	            }
	        }
	        // update card order
	        for(uint i = 0; i < 5; i++) {
	            hand[i] = newOrder[i];
	        }
	    }
	    return false;
	}
	
	function _isTwoPair(uint[5] memory hand, uint[15] memory cVals) public pure returns(bool) {
	    uint[5] memory newOrder;
	    uint two1 = 0;
	    uint two2 = 0;
	    uint m1idx = 0;
	    uint m2idx = 2;
	    uint lidx = 4;
	    // find the pair rank from large to small
	    for(uint i = 14; i >= 2; i--) {
	        if(cVals[i] == 2) {
	            if(two1 == 0) {
	                two1 = i;
	            } else {
	                two2 = i;
	            }
	        }
	    }
	    if(two1 != 0 && two2 != 0) {
	        for(uint i = 0; i < 5; i++) {
	            if(_getRank(hand[i]) == two1) {
	                newOrder[m1idx++] = hand[i];
	            } else if(_getRank(hand[i]) == two2) {
	                newOrder[m2idx++] = hand[i];
	            } else {
	                newOrder[lidx++] = hand[i];
	            }
	        }
	    }
	    return false;
	}
	
	function _isPair(uint[5] memory hand, uint[15] memory cVals) public pure returns(bool) {
	    uint[5] memory newOrder;
	    uint two = 0;
	    uint midx = 0;
	    uint lidx = 2;
	    // find the rank owned by two cards if exists
	    for(uint i = 2; i < 15; i++) {
	        if(cVals[i] == 2) {
	            two = i;
	        }
	    }
	    if(two != 0) {
	        for(uint i = 0; i < 5; i++) {
	            if(_getRank(hand[i]) == two) {
	                newOrder[midx++] = hand[i];
	            } else {
	                newOrder[lidx++] = hand[i];
	            }
	        }
	        // update the card order
	        for(uint i = 0; i < 5; i++) {
	            hand[i] = newOrder[i];
	        }
	        return true;
	    }
	    return false;
	}
	
	function _getHandValue(uint[5] memory hand, uint handType) public pure returns(uint) {
	    uint hVal = 0;
	    hVal = _applyMask(hVal, handType, 20);
        hVal = _applyMask(hVal, _getRank(hand[0]), 16);
        hVal = _applyMask(hVal, _getRank(hand[1]), 12);
        hVal = _applyMask(hVal, _getRank(hand[2]), 8);
        hVal = _applyMask(hVal, _getRank(hand[3]), 4);
        hVal = _applyMask(hVal, _getRank(hand[4]), 0);
        return hVal;
	}
	
	function _sort(uint[5] memory hand, uint left, uint right) public {
	    if(left >= right)  return;
	    uint l = left + 1;
	    uint r = right;
	    uint pivot = left;
	    while(l <= r) {
	        while(l <= r && _compare(hand[pivot], hand[l]))  l++;
	        while(l <= r && _compare(hand[r], hand[pivot]))  r--;
	        if(l <= r) {
	            uint temp = hand[r];
	            hand[r] = hand[l];
	            hand[l] = temp;
	            r--;
	            l++;
	        }
	    }
	    uint temp = hand[pivot];
	    hand[pivot] = hand[r];
	    hand[r] = temp;
	    if(r > 0)  _sort(hand, left, r - 1);
	    _sort(hand, r + 1, right);
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