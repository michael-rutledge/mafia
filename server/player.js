const ClientState = require('./clientState.js');

// roles
const DEFAULT   = 0;
const MAFIA     = 1;
const COP       = 2;
const DOCTOR    = 3;
const TOWN      = 4;

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
    * TO IMPLEMENT
    */
    clearPlayerVotes(name) {
        
    }

    /*
    * updates what state players see from the current room state depending on role
    */
    updateClientStateFromRoomState(roomState) {
        this.clientState.updateFromRoomState(roomState);
    }
}

module.exports = Player;
