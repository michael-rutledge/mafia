const PlayerCard = require('./playerCard.js');

// constants
const ROLE_STRINGS = [
    '',
    'Mafia',
    'Cop',
    'Doctor',
    'Town'
];
const STATE_MESSAGES= [
    'Welcome to the lobby. Once enough players join, the host can start the game.',
    'Mafia, please choose your victim.',
    'Detective, please choose your suspect to investigate.',
    'Doctor, please choose who you would like to save.',
    'It is now daytime. Everyone, please deliberate and vote who to kill off.',
    'There are only two innocents left. We need a handshake to settle this...',
    'THE MAFIA WIN!',
    'THE TOWN WIN!',
    'Game over. Vote on whether to play again or go to the lobby.'
];
const NIGHT_MESSAGE = 'You are currently asleep. But there are others out and about...';

/*
* ClientState: represents need-to-know information per player on the clientside
*/
class ClientState {

    // CONSTRUCTOR
    constructor(clientPlayer) {
        this.clientPlayer = clientPlayer;
        this.message = STATE_MESSAGES[0];
        this.clearPlayerCards();
    }


    // PUBLIC FUNCTIONS
    /*
    * updates clientState and player cards depending on room state
    */
    updateFromRoomState(roomState) {
        this.clearPlayerCards();
        for (var pName in roomState.players) {
            // get player and make fresh player cards
            var curPlayer = roomState.getPlayerFromName(pName);
            this.playerCards[pName] = new PlayerCard(pName);
            var curCard = this.playerCards[pName];
            curCard.clearAppearance();
            curCard.setBackgroundColorForPlayer(curPlayer, this.playerRoleVisible(curPlayer));
            curCard.setAliveAppearance(curPlayer.alive);
            curCard.setVoteHover(pName, roomState.playerVoteLegal(this.clientPlayer, curPlayer));
            curCard.setCopResult(this.clientPlayer, curPlayer);
            curCard.setClientPlayerAppearance(this.clientPlayer, curPlayer);
            curCard.setHostAppearance(curPlayer, roomState);
            // TODO: check for host or people who are disconnected, also cop stuff
        }
        // set message and overwrite for special cases
        this.message = roomState.gameState === this.clientPlayer.role ||
                !this.clientPlayer.alive ||
                roomState.gameState >= 4 ?
            STATE_MESSAGES[roomState.gameState] : NIGHT_MESSAGE;
    }

    /*
    * to avoid buffer overflow and circular references, only return necessary info
    * back to client
    */
    getCompressed() {
        return {
            alive: this.clientPlayer.alive,
            message: this.message,
            role: ROLE_STRINGS[this.clientPlayer.role],
            players: this.playerCards
        };
    }


    // PRIVATE FUNCTIONS
    clearPlayerCards() {
        this.playerCards = {};
    }

    /*
    * returns whether the given player's role can be seen by the client player
    */
    playerRoleVisible(player) {
        // TODO: we need methods from player declaring booleans for roles
        return !this.clientPlayer.alive || this.clientPlayer === player ||
            (this.clientPlayer.role === player.role && this.clientPlayer.role !== 4);
    }
}

module.exports = ClientState;
