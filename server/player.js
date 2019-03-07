const ClientState = require('./clientState.js');

// roles
const DEFAULT   = 0;
const MAFIA     = 1;
const COP       = 2;
const DOCTOR    = 3;
const TOWN      = 4;
//indexers
const VOTE_KEYS = [ 'mafiaVotes', 'copVotes', 'doctorVotes', 'townVotes' ];
const TARGET_KEYS = [ 'mafiaTarget', 'copResult', 'doctorTarget', 'alive' ];
const TARGET_VAL_FUNCS = [
    (player) => { return true },
    (player) => { return player.role === MAFIA },
    (player) => { return true },
    (player) => { return false }
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
    }

    /*
    * clears call votes assigned to the player
    */
    clearAllVotes() {
        this.mafiaVotes = {};
        this.copVotes = {};
        this.doctorVotes = {};
        this.townVotes = {};
    }

    /*
    * finalize a vote on this player by setting the appropriate values
    */
    finalizeVoted(gameState) {
        this[TARGET_KEYS[gameState-1]] = TARGET_VAL_FUNCS[gameState-1](this);
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
    */
    tallyVoteFromPlayer(votingName, gameState) {
        this[VOTE_KEYS[gameState-1]][votingName] = 1;
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
        return Object.keys(this[VOTE_KEYS[gameState-1]]).length;
    }
}

module.exports = Player;
