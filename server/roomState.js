const Shuffler = require('./shuffler.js');
const Player = require('./player.js');

// game states
const LOBBY         = 0;
const MAFIA_TIME    = 1;
const COP_TIME      = 2;
const DOCTOR_TIME   = 3;
const TOWN_TIME     = 4;
const SHOWDOWN      = 5;
const MAFIA_WIN     = 6;
const TOWN_WIN      = 7;
// modifiable options and their constraints
const OPTIONS = {
    numMafia: {
        min: 1,
        max: 3
    },
    numCops: {
        min: 0,
        max: 2
    },
    numDoctors: {
        min: 0,
        max: 1
    }
};
// game constants
const SHOWDOWN_NUM = 2;
const MIN_PLAYERS = 4;


class RoomState {

    // CONSTRUCTOR
    /*
    * Only a default constructor is used
    */
    constructor() {
        this.gameState = LOBBY;
        this.host = null;
        this.numMafia = 1;
        this.numCops = 0;
        this.numDoctors = 0;
        this.numTown = 0;
        this.players = {};
        this.socketNames = {};
    }

    // STATIC GETTERS
    static get LOBBY() { return LOBBY; }
    static get MAFIA_TIME() { return MAFIA_TIME; }
    static get COP_TIME() { return COP_TIME; }
    static get DOCTOR_TIME() { return DOCTOR_TIME; }
    static get TOWN_TIME() { return TOWN_TIME; }
    static get SHOWDOWN() { return SHOWDOWN; }
    static get MAFIA_WIN() { return MAFIA_WIN; }
    static get TOWN_WIN() { return TOWN_WIN; }

    // PUBLIC FUNCTIONS
    /*
    * add user to the room for the given socket and name
    * return: bool exitStatus
    */
    addUser(socket, name) {
        if (!this.playerExists(name) && this.gameState === LOBBY) {
            this.players[name] = new Player(socket.id);
            this.linkSocketToPlayer(socket, name);
            return this.clientsUpdate();
        }
        else if (this.playerExists(name) && this.gameState !== LOBBY &&
                this.playerIsEmpty(name)) {
            this.linkSocketToPlayer(socket, name);
            return this.clientsUpdate();
        }
        return false;
    }

    /*
    * change room option and check against constraints
    * return: bool exitStatus
    */
    changeOption(id, value) {
        if (OPTIONS[id]) {
            this[id] = Math.max(value, OPTIONS[id].min);
            this[id] = Math.min(value, OPTIONS[id].max);
            return this.clientsUpdate();
        }
        return false;
    }

    /*
    * attempt player vote
    */
    playerVote(votingSocket, votedName) {
        var votingPlayer = this.getPlayerFromSocket(votingSocket);
        var votedPlayer = this.getPlayerFromName(votedName);
        console.log('vote for: ' + votedName);
        if (this.playerVoteLegal(votingPlayer, votedPlayer)) {
            console.log('THATS A GOOD VOTE');
            this.tallyVote(votingPlayer, votedPlayer, this.gameState);
            // voting handling during normal rounds
            while (this.gameState <= SHOWDOWN &&
                    this.voteQuotaReached(votedPlayer, this.gameState)) {
                this.stepVotingState(votedPlayer, this.gameState);
            }
            // voting handling during showdown
            if (this.gameState === SHOWDOWN) {
                this.stepShowdown(votingPlayer, votedPlayer);
            }
            this.checkForWin();
            return this.clientsUpdate();
        }
        return false;
    }

    /*
    * remove user from room based on given socket
    * return: bool exitStatus
    */
    removeUser(socket) {
        var name = this.getNameFromSocket(socket);
        if (this.playerExists(name)) {
            delete this.socketNames[socket.id];
            this.players[name].socketId = null;
            if (this.gameState === LOBBY) {
                delete this.players[name];
            }
            this.repickHost();
            return this.clientsUpdate();
        }
        return false;
    }

    startGame(socket) {
        // safeguard that only the host can start the game and only from lobby
        if (this.socketIsHost(socket) && this.gameState === LOBBY &&
                this.rolesOkayForStart()) {
            this.prepAndStartNewGame();
            return this.clientsUpdate();
        }
        return false;
    }


    // PRIVATE FUNCTIONS
    /*
    * to be called during transition to TOWN_TIME; applies Mafia vote according to rules
    */
    applyMafiaVote() {
        for (var name in this.players) {
            var player = this.players[name];
            if (player.mafiaTarget) {
                player.alive = player.doctorTarget;
            }
        }
    }

    /*
    * given the amount of each role, assign to players randomly
    */
    assignRoles(nm, nc, nd) {
        var names = Object.keys(this.players);
        names = Shuffler.shuffle(names);
        var curIndex = 0;
        while (nm-- > 0 && curIndex < names.length) {
            this.players[names[curIndex++]].role = Player.MAFIA;
        }
        while (nc-- > 0 && curIndex < names.length) {
            this.players[names[curIndex++]].role = Player.COP;
        }
        while (nd-- > 0 && curIndex < names.length) {
            this.players[names[curIndex++]].role = Player.DOCTOR;
        }
    }

    /*
    * do a simple check of who's alive to declare win state if necessary
    */
    checkForWin() {
        if (this.numMafia <= 0) { this.gameState = TOWN_WIN; }
        if (this.getInnocentPlayerCount() <= 0) { this.gameState = MAFIA_WIN; }
    }

    /*
    * clears all votes in game and does away with target values; cop result stays
    */
    clearAllVotesAndResetTargets() {
        for (var name in this.players[name]) {
            var player = this.players[name];
            player.clearAllVotes();
            player.resetTargets();
        }
    }

    /*
    * clear past votes from the given player
    */
    clearVotesFromPlayer(votingPlayer) {
        var votingName = this.getNameFromPlayer(votingPlayer);
        for (var name in this.players) {
            var player = this.players[name];
            delete player.mafiaVotes[votingName];
            delete player.copVotes[votingName];
            delete player.doctorVotes[votingName];
            delete player.townVotes[votingName];
        }
    }

    /*
    * Updates client state for each player.
    * To be used on each public function used by mafiaManager as the final touch
    * in a state update.
    */
    clientsUpdate() {
        for (var name in this.players) {
            this.getPlayerFromName(name).updateClientStateFromRoomState(this);
        }
        return true;
    }

    /*
    * get amount of innocent players left
    */
    getInnocentPlayerCount() {
        return this.numCops + this.numDoctors + this.numTown;
    }

    /*
    * get name linked to player object
    */
    getNameFromPlayer(player) {
        return this.socketNames[player.socketId];
    }

    /*
    * get the player name linked to given socket
    */
    getNameFromSocket(socket) {
        return this.socketNames[socket.id];
    }

    getPlayerFromName(name) {
        return this.players[name];
    }

    /*
    * get the player object linked to given socket
    */
    getPlayerFromSocket(socket) {
        return this.players[this.getNameFromSocket(socket)];
    }

    /*
    * get the quota necessary to advance a voting gameState
    */
    getVoteQuotaForGameState(gs) {
        var quotas = [ 0, this.numMafia, this.numCops, this.numDoctors,
            Math.ceil((this.numTown+1)/2), this.playerCount()+1 ];
        return quotas[gs];
    }

    /*
    * link socket to player name; and if there is no host, make it the host
    */
    linkSocketToPlayer(socket, name) {
        this.players[name].socketId = socket.id;
        this.socketNames[socket.id] = name;
        this.host = this.host === null ? socket.id : this.host;
    }

    playerCount() { return Object.keys(this.players).length; }
    playerIsEmpty(name) { return this.players[name].socketId === null; }
    playerExists(name) { return this.players.hasOwnProperty(name); }

    /*
    * checks if a proposed player vote is possible within rules of game
    */
    playerVoteLegal(voting, voted) {
        if (!voting.alive || !voted.alive) return false;
        switch (this.gameState) {
            // mafia can vote for anyone, even themselves (unless they are the only one left)
            case MAFIA_TIME:
                return voting.role === Player.MAFIA && (this.numMafia > 1 ? true
                    : voting !== voted);
                break;
            // cops can only investigate non-cops who haven't been investigated
            case COP_TIME:
                return voting.role === Player.COP && voted.role !== Player.COP &&
                    voted.copResult === null;
                break;
            // doctors can only save non-doctors
            case DOCTOR_TIME:
                return voting.role === Player.DOCTOR && voted.role !== Player.DOCTOR;
                break;
            // during deliberation, everyone can vote on anyone
            case TOWN_TIME:
                return true;
                break;
            // during showdown, you cannot shake with yourself
            case SHOWDOWN:
                return voting !== voted && (voting.role !== Player.MAFIA ||
                    voted.role !== Player.MAFIA);
                break;
            default:
                return false;
                break;
        }
        return false;
    }

    /*
    * prep a new game and start it by setting the state to MAFIA_TIME
    */
    prepAndStartNewGame() {
        this.resetPlayers(Player.TOWN);
        this.assignRoles(this.numMafia, this.numCops, this.numDoctors);
        this.updateRoleCounts();
        this.gameState = MAFIA_TIME;
    }

    /*
    * reset all players to default values
    */
    resetPlayers(role = Player.DEFAULT) {
        for (var name in this.players) {
            var player = this.getPlayerFromName(name);
            player.toDefault();
            player.role = role;
        }
    }

    /*
    * check that the number of players and their roles are complicit with the 
    * rules of the game
    */
    rolesOkayForStart() {
        var pc = this.playerCount();
        return pc >= MIN_PLAYERS && (pc - this.numMafia) > SHOWDOWN_NUM;
    }

    /*
    * pick a new host from the remaining players
    */
    repickHost() {
        this.host = null;
        var newHostId = Object.keys(this.socketNames)[0];
        this.host = newHostId ? newHostId : null;
    }

    socketIsHost(socket) { return socket.id === this.host; }

    /*
    * handles voting during the showdown state
    */
    stepShowdown(votingPlayer, votedPlayer) {
        // check for handshake completion
        if (votingPlayer.showdownVotes[this.getNameFromPlayer(votedPlayer)]) {
            if (votingPlayer.role === Player.MAFIA || votedPlayer.role === Player.MAFIA) {
                this.gameState = MAFIA_WIN;
            }
            else {
                this.gameState = TOWN_WIN;
            }
        }
    }

    /*
    * steps the gameState after voting; must also skip unnecessary states gracefully
    */
    stepVotingState(votedPlayer, gs) {
        // only apply vote effect if there are actually votes (ie the round was not skipped)
        if (votedPlayer.voteCountInGameState(gs) > 0) {
            votedPlayer.finalizeVoted(gs);
            votedPlayer.clearAllVotes();
        }
        // votes should only pass game through voting stages, MAFIA is first, TOWN is last
        this.gameState = (gs % TOWN_TIME) + MAFIA_TIME;
        // transition to TOWN_TIME should should apply mafia votes
        if (this.gameState === TOWN_TIME) {
            this.applyMafiaVote();
            this.clearAllVotesAndResetTargets();
        }
        this.updateRoleCounts();
        // if two innocents left, it's time for a showdown
        if (this.getInnocentPlayerCount() <= 2) {
            this.gameState = SHOWDOWN;
        }
    }

    /*
    * physically tally a vote against votedPlayer from votingPlayer during the
    * given gameState
    */
    tallyVote(votingPlayer, votedPlayer, gs) {
        this.clearVotesFromPlayer(votingPlayer);
        votedPlayer.tallyVoteFromPlayer(this.getNameFromPlayer(votingPlayer), gs);
    }

    /*
    * updates this room state's alive population variables
    */
    updateRoleCounts() {
        this.numMafia = this.numCops = this.numDoctors = this.numTown = 0;
        var roleCounts = [ 0, 0, 0, 0 ];
        for (var name in this.players) {
            var player = this.players[name];
            roleCounts[player.role-1] += player.alive ? 1 : 0;
        }
        this.numMafia = roleCounts[Player.MAFIA-1];
        this.numCops = roleCounts[Player.COP-1];
        this.numDoctors = roleCounts[Player.DOCTOR-1];
        this.numTown = roleCounts[Player.TOWN-1];
    }

    /*
    * determine if for the given gameState, enough votes have been received
    * by given player to step game
    */
    voteQuotaReached(votedPlayer, gs) {
        return votedPlayer.voteCountInGameState(gs) >= this.getVoteQuotaForGameState(gs);
    }

}

module.exports = RoomState;
