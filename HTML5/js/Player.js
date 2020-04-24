
/////////////// CONSTANTS ///////////////////

/* All available player states */
var States = {
    "receiving" : 4,
    "discard"   : 3,
    "allin"     : 2,
    "raise"     : 1,
    "start"     : 0,
    "call"      : -1,
    "fold"      : -2,
    "win"       : -3,
    "out"       : -4,
};
Object.freeze(States);

/* All available player positions */
var Positions = {
    "starter"    : 4,
    "dealer"     : 3,
    "bigBlind"   : 1,
    "smallBlind" : 0,
};
Object.freeze(Positions);

/////////// PLAYER OBJECT //////////////////
/*
 * Represents a single poker player
 * - name:  unique identifier
 * - state: current player state
 * - position: current player position
 * - hand:  current hand
 * - chips: current chip count
 * - currentBet: total personal bet for the current round
 * - cpu: if true will be 'played' by the computer
 */

var PlayerPrototype = {};

/* CONSTRUCTOR */
var Player = function (name, pos, chips, cpu) {
    // Descriptor for unique values for unique instance
    var new_player_desc = {
        name: {
            enumerable: true,
            writable: true,
            value: name, 
        },
        state: {
            enumerable: true,
            writable: true,
            value: "start",
        },
        position: {
            enumerable: true,
            writable: true,
            value: pos,
        },
        hand: {
            enumerable: true,
            writable: true,
            value: [],
        },
        chips: {
            enumerable: true,
            writable: true,
            value: chips,
        },
        currentBet: {
            enumerable: true,
            writable: true,
            value: 0,
        },
        computer: {
            enumerable: true,
            writable: false,
            value: cpu,
        },
    };
    
    // Return unique instance extending Player object
    return Object.create(PlayerPrototype, new_player_desc);
};
