
/////////// DECK OBJECT //////////////////
/* Represents a deck of 52 standard playing cards */

/* METHODS, PROPERTIES AND ATTRIBUTES */
var deck_proto_desc = {
    dealt: {
        writable: true,
        value: 0,
    },
    hasNext: {
        get: function () {
            return (this.dealt < this.length);
        },
    },
    Sort: {
        value: function () {
            var cardSorter = function (card1, card2) {
                return card1.Compare(card2, true);
            };
            this.dealt = 0;
            this.discardPile = []; 
            this.sort(cardSorter);
        },
    },
    Shuffle: {
        value: function () {
            var i, j, tempi, tempj;
            
            this.dealt = 0;
            this.discardPile = [];
            
            for (i = 0; i < this.length; i++) {
                j = Math.floor(Math.random() * (i + 1));
                tempi = this[i];
                tempj = this[j];
                this[i] = tempj;
                this[j] = tempi;
            } 
        },
    },
    Swap: {
        value: function (hand, index1, index2) {
            var temp = hand[index1];
            hand[index1] = hand[index2];
            hand[index2] = temp;
        },
    },
    Deal: {
        value: function () {
            return this[this.dealt++];
        },
    },
    discardPile: {
        writable: true,
        value: [],
    },
    Discard: {
        value: function (card) {
            this.discardPile.push(card);
        },
    },
};

/* CONSTRUCTOR */
var Deck = function () {
    /* need to base off of Array to maintain array [[Class]]
     * and its unique length property: length >= largest
     * numeric index on the object
     */
    var deckArray = [], suits, ranks;
    Object.defineProperties(deckArray, deck_proto_desc);
    
    // build deck
    suits = Object.keys(Suits);
    ranks = Object.keys(Ranks);
    for (var s in suits) {
        for (var r in ranks) {
            deckArray[deckArray.length] = new Card(suits[s], ranks[r]);
        }
    }

    return deckArray;
};

