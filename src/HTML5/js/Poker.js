
/////////////// CONSTANTS ///////////////////

/* All available game phases */
var Phases = {
    "betting1" : 7,
    "discard"  : 6,
    "betting2" : 5,
    "won"      : 4,
};
Object.freeze(Phases);

/* All available poker hands */
var Hands = {
    "highcard"      : 0,
    "pair"          : 1,
    "twopair"       : 2,
    "threeofakind"  : 3,
    "straight"      : 4,
    "flush"         : 5,
    "fullhouse"     : 6,
    "fourofakind"   : 7,
    "straightflush" : 8,
    "royalflush"    : 9,
};
Object.freeze(Hands);


/////////// POKER OBJECT //////////////////
/* 
 * Represents a straight game of poker, but provides most
 * of the necessary functionality for all games of Poker
 *
 * GamePlay flow (1 round):
 * - randomly choose dealer, then start with player to his 'left'
 * - initial buy-in
 * - each player is dealt a five card hand
 * - 1 round of betting
 *   - call, raise, or fold
 * - once all have called or folded:
 *   - discard phase, deal phase
 * - 1 round of betting
 *   - call, raise, or fold
 * - once all have called or folded:
 *   - determine winner
 */

    /* METHODS, PROPERTIES AND ATTRIBUTES */
var poker_proto_desc = {
    pot: {
        enumerable: true,
        writable: true,
        value: 0,
    },
    phase: {
        //dealing, betting, discard, won
        enumerable: true,
        writable: true,
        value: "betting1",
    },
    round: {
        enumerable: true,
        writable: true,
        value: 0,
    },
    currentBet: {
        enumerable: true,
        writable: true,
        value: 0,
    },
    curPlayerIndex: {
        writable: true,
        value: 0,
    },
    curPlayer: {
        writable: true,
        value: undefined,
    },
    deck: {
        enumerable: true,
        writable: true,
        value: new Deck(),
    },
    flop: {
        enumerable: true,
        writable: true,
        value: [],
    },
    winner: {
        writable: true,
        value: undefined,
    },
    winningHand: {
        writable: true,
        value: undefined,
    },
    winningScore: {
        writable: true,
        value: 0,
    },
    players: {
        enumerable: true,
        writable: true,
        value: [],
    },
    straightComp: {
        writable: true,
        value: false,
    },
    isStraight: {
        writable: true,
        value: false,
    },
    flushComp: {
        writable: true,
        value: false,
    },
    isFlush: {
        writable: true,
        value: false,
    },
    cVals: {
        writable: true,
        value: [],
    },
    Raise: {
        enumerable: true,
        value: function (player, amount) {
            amount = parseInt(amount, 10);
            var totalbet = this.currentBet - player.currentBet + amount;
            if (totalbet < 0) {
                throw "Invalid Bet Amount";
            } else if (totalbet > player.chips) {
                //FIXME - indicate that player cannot raise somehow
                this.Update();
            }
            
            // update game state
            this.pot = this.pot + totalbet;
            this.currentBet += totalbet;
            
            // update player state
            player.chips = player.chips - totalbet;
            player.currentBet += totalbet;
            player.state = "raise";

            // return control to game
            this.Update();
        },
    },
    Call: {
        enumerable: true,
        value: function (player) {
            var totalbet = this.currentBet - player.currentBet;
            if (totalbet < 0) {
                throw "Invalid Bet Amount";
            } else if (totalbet >= player.chips) {
                this.AllIn(player);
                return;
            }

            // update game state
            this.pot = this.pot + totalbet;
            
            // update player state
            player.chips = player.chips - totalbet;
            player.currentBet += totalbet;
            player.state = "call";
            
            // return control to game
            this.Update();
        },
    },
    Fold: {
        enumerable: true,
        value: function (player) {
            // update player state
            player.currentBet = 0;
            player.state = "fold";
           
            // discard hand
            for (var c in this.hand) {
                this.deck.Discard(player.hand[c]);
            }
            player.hand = [];
            
            // return control to game
            this.Update();
        },
    },
    AllIn: {
        enumerable: true,
        value: function (player) {
            var totalbet = player.chips;
            
            // update game state
            this.pot = this.pot + totalbet;
            if (totalbet > this.currentBet) {
                this.currentBet = totalbet;
            }
                        
            // update player state
            player.chips = 0;
            player.currentBet = totalbet;
            player.state = "allin";
            
            // return control to game
            this.Update();
        },
    },
    Discard: {
        enumerable: true,
        value: function (player, cards) {
            var temp;

            // update player state
            player.currentBet = 0;
            player.state = "receiving";
            
            // discard hand
            for (var c in cards) {
                player.deck.Discard(cards[c]);

                temp = player.hand.indexOf(cards[c]);
                if (temp !== -1) {
                    player.hand.splice(temp, 1);
                }
            }
            
            // return control to game
            this.Update();
        },
    },
    EvaluateHand: {
        enumerable: true,
        value: function (hand) {

            if (hand.length !== 2) {
                throw "Invalid Hand at Evalution";
            }

            var best = {}, allCards = {}, i, j, k, r, s, tempHand, tempScore;
            best.hand = undefined;
            best.score = 0;

            allCards = this.flop.concat(hand);

            // every possible five card combination of
            // the player hand and the current flop
            for (i = 0; i < allCards.length - 4; i++) {
                for (j = i + 1; j < allCards.length - 3; j++) {
                    for (k = j + 1; k < allCards.length - 2; k++) {
                        for (r = k + 1; r < allCards.length - 1; r++) {
                            for (s = r + 1; s < allCards.length; s++) {

                                tempHand = new Array(
                                    allCards[i],
                                    allCards[j],
                                    allCards[k],
                                    allCards[r],
                                    allCards[s]);

                                tempScore = this.EvaluateHandFull(tempHand);
                                if (tempScore > best.score) {
                                    best.score = tempScore;
                                    best.hand = tempHand;
                                }
                            }
                        }
                    }
                }
            }
    
            return best;
        },
    },
    EvaluateHandFull: {
        enumerable: true,
        value: function (hand) {

            var index, handType, handValue;

            if (hand.length !== 5) {
                throw "Invalid Hand at EvalutionFull";
            }

            // sort by rank, ignoring suit
            var evalSorter = function (card1, card2) {
                var temp = card1.Compare(card2, false);
                return temp;
            };
            hand.sort(evalSorter);

            this.straightComp = false;
            this.isStraight = false;
            this.flushComp = false;
            this.isFlush = false;

            this.cVals = [];

            for (var c in hand) {
                index = Ranks[hand[c].rank];
                if (this.cVals[index] === undefined) {
                    this.cVals[index] = 0;
                }
                this.cVals[index]++;
            }

            handType = 0;
            handValue = 0;
            if (this.IsRoyalFlush(hand)) {
                handType = Hands["royalflush"];
                handValue = this.GetHandValue(hand, handType);
            } else if (this.IsStraightFlush(hand)) {
                handType = Hands["straightflush"];
                handValue = this.GetHandValue(hand, handType);
            } else if (this.IsFourOfAKind(hand)) {
                handType = Hands["fourofakind"];
                handValue = this.GetHandValue(hand, handType);
            } else if (this.IsFullHouse(hand)) {
                handType = Hands["fullhouse"];
                handValue = this.GetHandValue(hand, handType);
            } else if (this.IsFlush(hand)) {
                handType = Hands["flush"];
                handValue = this.GetHandValue(hand, handType);
            } else if (this.IsStraight(hand)) {
                handType = Hands["straight"];
                handValue = this.GetHandValue(hand, handType);
            } else if (this.IsThreeOfAKind(hand)) {
                handType = Hands["threeofakind"];
                handValue = this.GetHandValue(hand, handType);
            } else if (this.IsTwoPair(hand)) {
                handType = Hands["twopair"];
                handValue = this.GetHandValue(hand, handType);
            } else if (this.IsPair(hand)) {
                handType = Hands["pair"];
                handValue = this.GetHandValue(hand, handType);
            } else {
                handType = Hands["highcard"];
                handValue = this.GetHandValue(hand, handType);
            }
            //FIXME - ought to store hand type somewhere
            //and display it to the winner
            return handValue;
        },
    },
    IsRoyalFlush: {
        value: function (hand) {
            if (this.IsStraightFlush(hand) && hand[0].suit === "A") {
                return true;
            }
            return false;
        },
    },
    IsStraightFlush: {
        value: function (hand) {
            if (this.IsFlush(hand) && this.IsStraight(hand)) {
                return true;
            }
            return false;
        },
    },
    IsFourOfAKind: {
        value: function (hand) {
            var four, newOrder, index;

            four = this.cVals.indexOf(4);
            if (four !== -1) {
                newOrder = [];
                index = 0;

                for (var c in hand) {
                    if (Ranks[hand[c].rank] === four) {
                        newOrder[index++] = hand[c];
                    } else {
                        newOrder[4] = hand[c];
                    }
                }
                hand = newOrder;
                return true;
            }
            return false;
        },
    },
    IsFullHouse: {
        value: function (hand) {
            var three, two, newOrder, mIndex, sIndex;
            
            three = this.cVals.indexOf(3);
            two = this.cVals.indexOf(2);
            if (three !== -1 && two !== -1) {
                newOrder = [];
                mIndex = 0;
                sIndex = 3;

                for (var c in hand) {
                    if (Ranks[hand[c].rank] === three) {
                        newOrder[mIndex++] = hand[c];
                    } else {
                        newOrder[sIndex++] = hand[c];
                    }
                }
                hand = newOrder;
                return true;
            }
            return false;
        },
    },
    IsFlush: {
        value: function (hand) {
            if (!this.flushComp) {
                if (hand[0].suit === hand[1].suit &&
                        hand[1].suit === hand[2].suit &&
                        hand[2].suit === hand[3].suit &&
                        hand[3].suit === hand[4].suit) {
                    this.isFlush = true;
                } else {
                    this.isFlush = false;
                }
                this.flushComp = true;
            }
            return this.isFlush;
        },
    },
    IsStraight: {
        value: function (hand) {
            var i, mem1, mem2;

            if (!this.straightComp) {
                //check wheel case
                if (hand[0].rank === "A" && hand[4].rank === "2") {
                    if (hand[3].rank === "3" &&
                            hand[2].rank === "4" &&
                            hand[1].rank === "5") {
                        this.isStraight = true;
                        this.deck.Swap(hand, 0, 4);
                        this.deck.Swap(hand, 0, 3);
                        this.deck.Swap(hand, 0, 2);
                        this.deck.Swap(hand, 0, 1);
                    }
                } else {
                    for (i = 0; i < 4; i++) {
                        mem1 = Ranks[hand[i].rank];
                        mem2 = Ranks[hand[i + 1].rank];
                        if (--mem1 !== mem2) {
                            this.straightComp = true;
                            return this.isStraight;
                        }
                    }
                    this.isStraight = true;
                }
                this.straightComp = true;
            }
            return this.isStraight;
        },
    },
    IsThreeOfAKind: {
        value: function (hand) {
            var three, newOrder, mIndex, sIndex;

            three = this.cVals.indexOf(3);
            if (three !== -1) {
                newOrder = [];
                mIndex = 0;
                sIndex = 3;

                for (var c in hand) {
                    if (Ranks[hand[c].rank] === three) {
                        newOrder[mIndex++] = hand[c];
                    } else {
                        newOrder[sIndex++] = hand[c];
                    }
                }
                hand = newOrder;
                return true;
            }
            return false;
        },
    },
    IsTwoPair: {
        value: function (hand) {
            var two1, two2, newOrder, mIndex, sIndex;

            two1 = this.cVals.indexOf(2);
            two2 = this.cVals.lastIndexOf(2);
            if (two1 !== -1 && two1 !== two2) {
                newOrder = [];
                mIndex = 0;
                sIndex = 2;

                for (var c in hand) {
                    if (Ranks[hand[c].rank] === two2) {
                        newOrder[mIndex++] = hand[c];
                    } else if (Ranks[hand[c].rank] === two1) {
                        newOrder[sIndex++] = hand[c];
                    } else {
                        newOrder[4] = c;
                    }
                }
                hand = newOrder;
                return true;
            }
            return false;
        },
    },
    IsPair: {
        value: function (hand) {
            var two, newOrder, mIndex, sIndex;

            two = this.cVals.indexOf(2);
            if (two !== -1) {
                newOrder = [];
                mIndex = 0;
                sIndex = 2;
            
                for (var c in hand) {
                    if (Ranks[hand[c].rank] === two) {
                        newOrder[mIndex++] = hand[c];
                    } else {
                        newOrder[sIndex++] = hand[c];
                    }
                }
                hand = newOrder;
                return true;
            }
            return false;
        },
    },
    GetHandValue: {
        value: function (hand, type) {
            var hVal = 0;
            hVal = this.ApplyMask(hVal, type, 20);
            hVal = this.ApplyMask(hVal, Ranks[hand[0].rank], 16);
            hVal = this.ApplyMask(hVal, Ranks[hand[1].rank], 12);
            hVal = this.ApplyMask(hVal, Ranks[hand[2].rank], 8);
            hVal = this.ApplyMask(hVal, Ranks[hand[3].rank], 4);
            hVal = this.ApplyMask(hVal, Ranks[hand[4].rank], 0);
            return hVal;
        },
    },
    ApplyMask: {
        value: function (orig, val, shift) {
            var temp = val << shift;
            return orig | temp;
        },
    },
    GetNextPlayer: {
        enumerable: true,
        value: function () {
            var cur = this.curPlayerIndex;
            cur++;

            while (cur !== this.curPlayerIndex) {
                if (cur >= this.players.length) {
                    cur = 0;
                }
                if (this.players[cur].state !== "fold" &&
                        this.players[cur].state !== "out") {
                    this.curPlayer = this.players[cur];
                    this.curPlayerIndex = cur;
                    break;
                }
                cur++;
            }
        },
    },
    NextPlayer: {
        enumerable: true,
        value: function (player) {
            var cur = this.players.indexOf(player);
            cur++;

            while (cur !== this.players.indexOf(player)) {
                if (cur > this.players.length - 1) cur = 0;
                if (this.players[cur].state !== "fold" &&
                        this.players[cur].state !== "out") {
                    return this.players[cur];
                }
                cur++;
            }
        },
    },
    PrevPlayer: {
        enumerable: true,
        value: function (player) {
            var cur = this.players.indexOf(player);
            cur--;

            while (cur !== this.players.indexOf(player)) {
                if (cur < 0) cur = this.players.length - 1;
                if (this.players[cur].state !== "fold" &&
                        this.players[cur].state !== "out") {
                    return this.players[cur];
                }
                cur--;
            }
        },
    },
    Update: {
        enumerable: true,
        writable: true,
        value: function (player) {
            var notDone = [], notFolded = [], temp;
            for (var p in this.players) {
                if (this.players[p].state !== "fold" && 
                        this.players[p].state !== "out") {
                    notFolded.push(this.players[p]);
                }
                if (this.players[p].state !== "fold" && 
                        this.players[p].state !== "call" &&
                        this.players[p].state !== "allin" &&
                        this.players[p].state !== "out") {
                    notDone.push(this.players[p]);
                }
            }

            // everyone else has folded, remaining player wins
            if (notFolded.length === 1) {
                notFolded[0].chips = notFolded[0].chips + this.pot;
                this.pot = 0;
                this.curPlayer = notFolded[0];
                this.winningHand = undefined;
                this.phase = 'win';
                this.Display();
                return;
            }
            
            // first betting round complete, show flop, move to betting2
            if (notDone.length === 0 && this.phase === "betting1") {
                var i;

                this.GetNextPlayer();
                this.phase = 'betting2';
                
                for (var p in this.players) {
                    if (this.players[p].state !== "fold" &&
                            this.players[p].state !== "out") {
                        this.players[p].state = "start";
                    }
                }

                for (i = 0; i < 3; i++) {
                    this.flop.push(this.deck.Deal());
                }

                this.Display();
                return;
            }
            
            // second betting round complete, add turn, move to betting3
            if (notDone.length === 0 && this.phase === "betting2") {
                this.GetNextPlayer();
                this.phase = 'betting3';
                
                for (var p in this.players) {
                    if (this.players[p].state !== "fold" &&
                            this.players[p].state !== "out") {
                        this.players[p].state = "start";
                    }
                }
                
                this.flop.push(this.deck.Deal());

                this.Display();
                return;
            }
            
            // third betting round complete, add river, move to betting4
            if (notDone.length === 0 && this.phase === "betting3") {
                this.GetNextPlayer();
                this.phase = 'betting4';
                
                for (var p in this.players) {
                    if (this.players[p].state !== "fold" &&
                            this.players[p].state !== "out") {
                        this.players[p].state = "start";
                    }
                }
                
                this.flop.push(this.deck.Deal());

                this.Display();
                return;
            }

            // fourth betting round complete, check for winner
            if (notDone.length === 0 && this.phase === "betting4") {
                this.winner = undefined;
                this.winningHand = undefined;
                this.winningScore = 0;
                
                for (var p in this.players) {
                    if (this.players[p].state === "fold" ||
                           this.players[p].state === "out") { continue; }
                    temp = this.EvaluateHand(this.players[p].hand);
                    if (temp.score > this.winningScore) {
                        this.winner = this.players[p];
                        this.winningHand = temp.hand;
                        this.winningScore = temp.score;
                    }
                }
                this.winner.chips = this.winner.chips + this.pot;
                this.pot = 0;
                this.curPlayer = this.winner;
                this.phase = 'win';
                
                this.Display();
                return;
            }
            
            this.GetNextPlayer();
            this.Display();
        },
    },
    Start: {
        enumerable: true,
        value: function () {
            var starter;
            
            // shuffle the deck (also resets deck)
            this.deck.Shuffle();
            
            // setup game
            this.pot = 0;
            this.flop = [];
            this.phase = "betting1";
            this.currentBet = 200;
            
            // deal to valid players
            for (var p in this.players) {
                var tempPlayer = this.players[p];
                if (tempPlayer.state === "start") {
                    while (tempPlayer.hand.length < 2) {
                        tempPlayer.hand.push(this.deck.Deal());
                    }

                    if (tempPlayer.position === "smallBlind") {
                        // setup smallblind
                        tempPlayer.chips -= 100;
                        tempPlayer.currentBet = 100;
                        this.pot += 100;
                    } else if (tempPlayer.position === "bigBlind") {
                        // setup bigblind
                        tempPlayer.chips -= 200;
                        tempPlayer.currentBet = 200;
                        this.pot += 200;
                        starter = p;
                    }
                }
            }
            
            // start game 
            this.curPlayer = this.players[starter];
            this.curPlayerIndex = starter;
            this.Update();
        },
    },
    Next: {
        enumerable: true,
        value: function () {

            var dl = 0, sb = 0, bb = 0, activePlayers = [];

            this.round++;
            
            // reset game
            this.pot = 0;
            this.flop = [];
            this.phase = "betting1";
            
            // reset players
            for (var p in this.players) {
                var tempPlayer = this.players[p];

                // zero out current bet and empty hand
                tempPlayer.currentBet = 0;
                tempPlayer.hand = [];
                
                // if player has run out of chips, they're out
                if (tempPlayer.chips < 1) {
                    tempPlayer.chips = 0;
                    tempPlayer.state = "out";
                } else {
                    tempPlayer.state = "start";
                    activePlayers.push(tempPlayer);
                }

                if (tempPlayer.position === "dealer") dl = p;
                else if (tempPlayer.position === "smallBlind") sb = p;
                else if (tempPlayer.position === "bigBlind") bb = p;

                tempPlayer.position = "starter";
            }
            
            if (activePlayers.length === 1) {
                // FIXME - let player reset game
            } else if (activePlayers.length === 2) {
                if (this.players.indexOf(activePlayers[0]) === sb) {
                    activePlayers[1].position = "smallBlind";
                    activePlayers[0].position = "bigBlind";
                } else {
                    activePlayers[1].position = "smallBlind";
                    activePlayers[0].position = "bigBlind";
                }
            } else {
                this.NextPlayer(this.players[dl]).position = "dealer";
                this.NextPlayer(this.players[sb]).position = "smallBlind";
                this.NextPlayer(this.players[bb]).position = "bigBlind";
            }

            this.Start();
        },
    },
    Finish: {
        enumerable: true,
        writable: true,
        value: function () {
            Output("unused in this game");
        },
    },
    Display: {
        enumerable: true,
        value: function () {
            if (this.phase != "win") {
                DisplayNormal(this.curPlayer.computer);
            } else {
                DisplayWin(this.curPlayer.computer);
            }
        },
    },
};
    
var PokerPrototype = {};
Object.defineProperties(PokerPrototype, poker_proto_desc);

/* CONSTRUCTOR */
var Game = function (startingchips, startingbet) {
    var newgame = Object.create(PokerPrototype);

    newgame.players[0] = new Player("You", "starter", startingchips, false);
    newgame.players[1] = new Player("West", "dealer", startingchips, true);
    newgame.players[2] = new Player("North", "smallBlind", startingchips, true);
    newgame.players[3] = new Player("East", "bigBlind", startingchips, true);
    
    return newgame;
};

