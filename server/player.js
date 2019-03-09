const ClientState = require('./clientState.js');

// roles
const DEFAULT   = 0;
const MAFIA     = 1;
const COP       = 2;
const DOCTOR    = 3;
const TOWN      = 4;
//indexers
const VOTE_KEYS = [ 'mafiaVotes', 'copVotes', 'doctorVotes', 'townVotes', 'showdownVotes' ];
const TARGET_KEYS = [ 'mafiaTarget', 'copResult', 'doctorTarget', 'alive' ];
const TARGET_VAL_FUNCS = [
    (player) => { return true },
    (player) => { return player.role === MAFIA },
    (player) => { return true },
    (player) => { return false }
    /* showdown doesn't have value to set */
];

class Player {

    // CONSTRUCTOR
    /*
    * Just takes a socket id and makes a player with it.
    */
    constructor(socketId) {
        this.socketId = socketId;
        this.clientState = new ClientState(this);
        this.toDefault();
    }

    // STATIC GETTERS
    static get DEFAULT() { return DEFAULT; }
    static get MAFIA() { return MAFIA; }
    static get COP() { return COP; }
    static get DOCTOR() { return DOCTOR; }
    static get TOWN() { return TOWN; }


    // PUBLIC FUNCTIONS
    /*
    * resets the player to their default state
    */
    toDefault() {
        this.role = DEFAULT;
        this.alive = true;
        this.mafiaTarget = false;
        this.mafiaVotes = {};;
        this.copResult = null;
        this.copVotes = {};
        this.doctorTarget = false;
        this.doctorVotes = {};
        this.townVotes = {};
        this.showdownVotes = {};
    }

    /*
    * clears call votes assigned to the player
    */
    clearAllVotes() {
        this.mafiaVotes = {};
        this.copVotes = {};
        this.doctorVotes = {};
        this.townVotes = {};
        this.showdownVotes = {};
    }

    /*
    * finalize a vote on this player by setting the appropriate values
    */
    finalizeVoted(gameState) {
        this[TARGET_KEYS[gameState-1]] = TARGET_VAL_FUNCS[gameState-1](this);
    }

    /*
    * get the set of votes on a player for the given gameState
    */
    getVotesInGameState(gameState) {
        return this[VOTE_KEYS[gameState-1]];
    }

    /*
    * to be called after transition to TOWN_TIME
    */
    resetTargets() {
        this.mafiaTarget = false;
        this.doctorTarget = false;
    }

    /*
    * tally vote against this player from voting player name
    * clicking again removes vote
    */
    tallyVoteFromPlayer(votingName, gameState, votingAgain) {
        var votes = this.getVotesInGameState(gameState);
        if (votingAgain) {
            delete votes[votingName];
        }
        else {
            votes[votingName] = 1;
        }
    }

    /*
    * updates what state players see from the current room state depending on role
    */
    updateClientStateFromRoomState(roomState) {
        this.clientState.updateFromRoomState(roomState);
    }

    /*
    * get count of votes assigned to this player in current gamestate
    */
    voteCountInGameState(gameState) {
        var votes = this.getVotesInGameState(gameState);
        return votes ? Object.keys(votes).length : 0;
    }

    /*
    * determine whether this player has voted for given player in given roomState
    */
    votedFor(player, roomState) {
        var votes = player.getVotesInGameState(roomState.gameState);
        return votes && votes[roomState.getNameFromPlayer(this)] !== undefined;
    }
}

module.exports = Player;
