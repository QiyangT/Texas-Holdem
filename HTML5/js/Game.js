
var game = undefined;
var callTimeOut, raiseTimeOut, foldTimeOut, winTimeOut, reset = false;

/////// VARIOUS GAME TIMERS ////////

function CPUCall2() {
    document.getElementById("playerCommentContentCenter").children[0].innerHTML = "";
    document.getElementById("playerCommentContentCenter").children[2].innerHTML = "";
    game.Call(game.curPlayer);
}
function CPUTimeoutCall() {
    document.getElementById("playerCommentContentCenter").children[0].innerHTML = "Call";
    document.getElementById("playerCommentContentCenter").children[2].innerHTML = "";
	// 2000 timeout
    callTimeOut = setTimeout(CPUCall2, 2000);
}
function CPUCall(timeout) {
    document.getElementById("playerCommentContentCenter").children[0].innerHTML = "Hmmmm...";
    document.getElementById("playerCommentContentCenter").children[2].innerHTML = "";
    callTimeOut = setTimeout(CPUTimeoutCall, 5 * Math.random() * 1000);
}

function CPURaise2() {
    document.getElementById("playerCommentContentCenter").children[0].innerHTML = "";
    document.getElementById("playerCommentContentCenter").children[2].innerHTML = "";
    game.Raise(game.curPlayer, 100);
}
function CPUTimeoutRaise() {
    document.getElementById("playerCommentContentCenter").children[0].innerHTML = "Raise";
    document.getElementById("playerCommentContentCenter").children[2].innerHTML = "$100";
    raiseTimeOut = setTimeout(CPURaise2, 2000);
}
function CPURaise(timeout) {
    document.getElementById("playerCommentContentCenter").children[0].innerHTML = "Hmmmm...";
    document.getElementById("playerCommentContentCenter").children[2].innerHTML = "";
    raiseTimeOut = setTimeout(CPUTimeoutRaise, 5 * Math.random() * 1000);
}

function CPUFold2() {
    document.getElementById("playerCommentContentCenter").children[0].innerHTML = "";
    document.getElementById("playerCommentContentCenter").children[2].innerHTML = "";
    game.Fold(game.curPlayer);
}
function CPUTimeoutFold() {
    document.getElementById("playerCommentContentCenter").children[0].innerHTML = "Fold";
    document.getElementById("playerCommentContentCenter").children[2].innerHTML = "";
    foldTimeOut = setTimeout(CPUFold2, 2000);
}
function CPUFold(timeout) {
    document.getElementById("playerCommentContentCenter").children[0].innerHTML = "Hmmmm...";
    document.getElementById("playerCommentContentCenter").children[2].innerHTML = "";
    foldTimeOut = setTimeout(CPUTimeoutFold, 5 * Math.random() * 1000);
}

function WinWait2() {
    var activePlayers = [];
    for (var p in game.players) {
        if (game.players[p].chips > 0) {
            activePlayers.push(game.players[p]);
        }
    }

    if (activePlayers.length < 2) {
        document.getElementById('gameAlert').children[0].innerHTML = '<a href="javascript:Start();">Start Again?</a>';
    } else {
        document.getElementById('gameAlert').children[0].innerHTML = '<a href="javascript:Cont();">Next Round</a>';
    }
}
function WinWait() {
    winTimeOut = setTimeout(WinWait2, 3000);
}

///// PRIMARY DISPLAY UPDATE /////

function DisplayNormal(cpu) {

    // update pot amount
    document.getElementById('pot').innerHTML = "$" + game.pot;

    // display proper buttons
    if (cpu) {
        document.getElementById('PlayersOptionsFoldCallRaise').style.display = "none";
        document.getElementById('PlayersOptionsGlow').style.display = "none";
    } else {
        document.getElementById('PlayersOptionsFoldCallRaise').style.display = "";
        document.getElementById('PlayersOptionsGlow').style.display = "";
        document.getElementById("playerComment").style.display = "none";
    }
    document.getElementById('gameAlert').style.display = "none";

    // update flop cards
    for (var i = 0; i < 5; i++) {
        if (game.flop[i] !== undefined) {
            name = game.flop[i].image;
            alt = "Flop - " + game.flop[i].image.split(".")[0];
        } else {
            name = "Back.png";
            alt = "Flop - Unknown Card";
        }
        document.getElementById('flopCard' + i).parentNode.style.background = "";
        document.getElementById('flopCard' + i).src = "images/cards/" + name;
        document.getElementById('flopCard' + i).alt = alt;
    }

    // updated player cards
    // update players
    for (var j = 0; j < game.players.length; j++) {
            
        var cardloc = undefined, moneyloc = undefined, player = undefined, commentClass = undefined;
        if (j === 0) {
            commentClass = "";
            moneyloc = "PlayerMoney";
            cardloc = "playerCard";
            playerPos = "PlayerPos";
            player = "Your";
        } else if (j === 1) {
            commentClass = "leftPlayerComment";
            moneyloc = "LeftPlayerMoney";
            cardloc = "leftPlayerCard";
            playerPos = "LeftPlayerPos";
            player = game.players[j].name;
        } else if (j === 2) {
            commentClass = "topPlayerComment";
            moneyloc = "TopPlayerMoney";
            cardloc = "topPlayerCard";
            playerPos = "TopPlayerPos";
            player = game.players[j].name;
        } else if (j === 3) {
            commentClass = "rightPlayerComment";
            moneyloc = "RightPlayerMoney";
            cardloc = "rightPlayerCard";
            playerPos = "RightPlayerPos";
            player = game.players[j].name;
        } else console.log("LOGIC FAIL");
            
        // update money
        document.getElementById(moneyloc).innerHTML = "$" + game.players[j].chips;
        if (!cpu) {
            document.getElementById('PlayersMoneyLarge').innerHTML = "$" + game.players[j].chips;
        }

        // update player position indicator
        var joiner = " is ";
        if (j === 0) joiner = " are ";

        if (game.players[j].position === "dealer") {
            document.getElementById(playerPos).style.display = "";
            document.getElementById(playerPos).children[0].src = "images/playerDB.png";
            document.getElementById(playerPos).children[0].alt = game.players[j].name + joiner + "Dealer";
        } else if (game.players[j].position === "smallBlind") {
            document.getElementById(playerPos).style.display = "";
            document.getElementById(playerPos).children[0].src = "images/playerSB.png";
            document.getElementById(playerPos).children[0].alt = game.players[j].name + joiner + "Small Blind";
        } else if (game.players[j].position === "bigBlind") {
            document.getElementById(playerPos).style.display = "";
            document.getElementById(playerPos).children[0].src = "images/playerBB.png";
            document.getElementById(playerPos).children[0].alt = game.players[j].name + joiner + "Big Blind";
        } else {
            document.getElementById(playerPos).style.display = "none";
        }

        // update current player indicator
        if (game.curPlayer === game.players[j]) {
            if (cpu) {
                document.getElementById("playerComment").className = commentClass;
                document.getElementById("playerComment").style.display = "";
            } else {
                document.getElementById("playerComment").style.display = "none";
            }
            document.getElementById(moneyloc).style.background = "url(images/otherPlayerPlayingMoneyBackground.png)";
        } else {
            document.getElementById(moneyloc).style.background = "url(images/otherPlayerMoneyBackground.png)";
        }
                
        // update cards
        for (var i = 0; i < 2; i++) {
            if (game.players[j].hand[i] !== undefined && game.players[j].computer) {
                document.getElementById(cardloc + i).src = "images/cards/Back.png";
                document.getElementById(cardloc + i).alt = player + " Hand - Unknown Card";
                document.getElementById(cardloc + i).style.background = "";
                document.getElementById(cardloc + i).style.display = "";
            } else if (game.players[j].hand[i] !== undefined && !game.players[j].computer) {
                var name = game.players[j].hand[i].image;
                document.getElementById(cardloc + i).src = "images/cards/" + name;
                document.getElementById(cardloc + i).alt = player + " Hand - " + name.split(".")[0];
                document.getElementById(cardloc + i).style.background = "";
                document.getElementById(cardloc + i).style.display = "";
            } else {
                document.getElementById(cardloc + i).style.background = "";
                document.getElementById(cardloc + i).style.display = "none";
            }
        }
    }

    // cpu logic
    if (cpu) {
        // get current hand score
        var curscore = game.EvaluateHand(game.curPlayer.hand);
        if (curscore < 1000000) {
            // if its 'bad', fold
            CPUFold();
        } else if (curscore > 4999999) {
            // if its 'great', raise
            CPURaise();
        } else {
            // randomly call or fold
            var rand = Math.random();
            if (rand > 0.25) {
                CPUCall();
            } else {
                CPUFold();
            }
        }
    }
}

function DisplayWin(cpu) {

    // update pot amount 
    document.getElementById('pot').innerHTML = "$" + game.pot;
    
    // display proper buttons
    document.getElementById('PlayersOptionsFoldCallRaise').style.display = "none";
    document.getElementById('PlayersOptionsGlow').style.display = "none";
    document.getElementById("playerComment").style.display = "none";
    document.getElementById('gameAlert').style.display = "";

    // update flop cards
    for (var i = 0; i < 5; i++) {
        if (game.flop[i] !== undefined) {
            name = game.flop[i].image;
        } else {
            name = "Back.png";
        }
        document.getElementById('flopCard' + i).src = "images/cards/" + name;
        document.getElementById('flopCard' + i).alt = "Flop - " + name.split(".")[0];
                
        try {
            if (game.winningHand.indexOf(game.flop[i]) != -1) {
                document.getElementById('flopCard' + i).parentNode.style.background = "#00A3EF";
                document.getElementById('flopCard' + i).alt += " - part of Winning Hand";
            }
        } catch (ex) { console.log(ex); }
    }
   
    // update players
    for (var j = 0; j < game.players.length; j++) {
            
        var cardloc = undefined, moneyloc = undefined, player = undefined;
        if (j === 0) {
            moneyloc = "PlayerMoney";
            cardloc = "playerCard";
            player = "Your";
        } else if (j === 1) {
            moneyloc = "LeftPlayerMoney";
            cardloc = "leftPlayerCard";
            player = game.players[j].name;
        } else if (j === 2) {
            moneyloc = "TopPlayerMoney";
            cardloc = "topPlayerCard";
            player = game.players[j].name;
        } else if (j === 3) {
            moneyloc = "RightPlayerMoney";
            cardloc = "rightPlayerCard";
            player = game.players[j].name;
        } else console.log("LOGIC FAIL");
            
        // update money
        document.getElementById(moneyloc).innerHTML = "$" + game.players[j].chips;

        // update win indicators
        if (game.winner === game.players[j]) {
            document.getElementById(moneyloc).style.background = "url(images/otherPlayerPlayingMoneyBackground.png)";
            if (j === 0) {
                document.getElementById('gameAlert').children[0].innerHTML = game.players[j].name + " Win!";
            } else {
                document.getElementById('gameAlert').children[0].innerHTML = game.players[j].name + " Wins!";
            }
        } else {
            document.getElementById(moneyloc).style.background = "url(images/otherPlayerMoneyBackground.png)";
        }
                
        // update cards
        for (var i = 0; i < 2; i++) {
            if (game.players[j].hand[i] !== undefined) {
                var name = game.players[j].hand[i].image;
                document.getElementById(cardloc + i).src = "images/cards/" + name;
                document.getElementById(cardloc + i).alt = player + " Hand - " + name.split(".")[0];
                document.getElementById(cardloc + i).style.display = "";

                try {
                    if (game.winningHand.indexOf(game.players[j].hand[i]) != -1) {
                        document.getElementById(cardloc + i).style.background = "#00A3EF";
                        document.getElementById(cardloc + i).alt += " - part of Winning Hand";
                    }
                } catch (ex) { console.log(ex); }
            } else {
                document.getElementById(cardloc + i).style.display = "none";
            }
        }
    }
    
    WinWait();
}

////// GAME START AND CONTINUE //////

/*
 * Start the primary game
 */
var Start = function () {
    /* prevent players from spamming the reset button */
    if (!reset) {
        reset = true;

        // clear timers
        if (callTimeOut) clearTimeout(callTimeOut);
        if (raiseTimeOut) clearTimeout(raiseTimeOut);
        if (foldTimeOut) clearTimeout(foldTimeOut);
        if (winTimeOut) clearTimeout(winTimeOut);

        // change to reset button
        document.getElementById("actionButton").children[0].value = "RESET";

        /* # of players,
         * per-player starting chips,
         * per-round starting bet,
         */
        game = new Game(2500, 200);
        game.Start();

        reset = false;
    }
}

/*
 * Continue the game after a round has completed
 */
var Cont = function () {
    // clear alert message
    document.getElementById('gameAlert').style.display = "none";
    game.Next();
}

/* var BuyChips = async() => {
	await contract.methods.buy().send({from: '0xDE50CEcFb2B88264Ac69bD418A63adbB1F013d2B', value: web3.utils.toWei('2.5','Ether')});
	document.getElementById("PlayerMoney").innerHTML = "$" + 2500;
}

var SellChips = async() => {
	await contract.methods.sell().send({from: '0xDE50CEcFb2B88264Ac69bD418A63adbB1F013d2B', value: web3.utils.toWei('1','Ether')});
	game.players[0].chips = game.players[0].chips - 1000;
	document.getElementById("PlayerMoney").innerHTML = "$" + game.players[0].chips;
}

var getWeb3Provider = async() => {
    if (window.ethereum) {
	  window.alert('Using ethereum');
      window.web3 = new Web3(window.ethereum);
	  window.alert("version");
	  window.alert(window.web3.version);
      await window.ethereum.enable();
    }
    else if (window.web3) {
	  window.alert('Using web3');
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
        window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

var connectToBlockchain = async() => {
    // const web3 = window.web3;
	window.alert("version");
	window.alert(window.web3.version);
}

var componentDidMount = async() => {
    await this.getWeb3Provider();
    await this.connectToBlockchain();
}

componentDidMount(); */