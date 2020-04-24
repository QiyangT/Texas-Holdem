
/////////////// CONSTANTS ///////////////////

/* All available card suits */
var Suits = {
    "S" : 3, //spade
    "H" : 2, //heart
    "D" : 1, //diamond
    "C" : 0, //club
};
Object.freeze(Suits);

/* All available card ranks */
var Ranks = {
    "2" : 2,
    "3" : 3,
    "4" : 4,
    "5" : 5,
    "6" : 6,
    "7" : 7,
    "8" : 8,
    "9" : 9,
    "T" : 10, //ten
    "J" : 11, //jack
    "Q" : 12, //queen
    "K" : 13, //king
    "A" : 14, //ace
};
Object.freeze(Ranks);

/////////// CARD OBJECT //////////////////
/* Represents a single standard playing card */

/* METHODS, PROPERTIES AND ATTRIBUTES */
var card_proto_desc = { 
    suit: {
        enumerable: true,
        get: function () {
            if (this.value === undefined || !Suits.hasOwnProperty(this.value[0])) {
                throw "Invalid card: " + this.value;
            } else {
                return this.value[0];
            }
        },
    },
    rank: {
        enumerable: true,
        get: function () {
            if (this.value === undefined || !Ranks.hasOwnProperty(this.value[1])) {
                throw "Invalid card: " + this.value;
            } else {
                return this.value[1];
            }
        },
    },
    image: {
        enumerable: true,
        get: function () {

            var iSuite, iRank;

            switch (this.suit) {
            case "S": iSuite = "Spades"; break;
            case "H": iSuite = "Hearts"; break;
            case "D": iSuite = "Diamonds"; break;
            case "C": iSuite = "Clubs"; break;
            default: throw "No such suit: " + this.suit;
            }

            if (isNaN(parseInt(this.rank, 10))) {
                switch (this.rank) {
                case "T": iRank = "10"; break;
                case "J": iRank = "Jack"; break;
                case "Q": iRank = "Queen"; break;
                case "K": iRank = "King"; break;
                case "A": iRank = "Ace"; break;
                default: throw "No such rank: " + this.rank;
                }
            } else {
                iRank = this.rank;
            }

            return iSuite + "_" + iRank + ".png";
        },
    },
    Compare: {
        enumerable: true,
        configurable: false, 
        writable: false,
        value: function (card, useSuite) {
            if (!useSuite) {
                return (Ranks[card.rank] - Ranks[this.rank]);
            }
            return (card.binval - this.binval);
        },
    },
};

var CardPrototype = {}; 
Object.defineProperties(CardPrototype, card_proto_desc);

/* CONSTRUCTOR */
var Card = function (suit, rank) {
    // Setup unique values for unique instance
    var value, binval, new_card_desc;
    
    value = suit.concat(rank);
    binval = Suits[suit];

    binval = binval << 4;
    binval = binval + Ranks[rank];

    new_card_desc = {
        value: {
            value: value,
        },
        binval: {
            value: binval,
        },
    };
        
    // Return unique instance extending Card object
    return Object.create(CardPrototype, new_card_desc);
};

