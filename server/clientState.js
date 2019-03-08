const PlayerCard = require('./playerCard.js');

// constants
const ROLE_STRINGS = [
    '',
    'Mafia',
    'Cop',
    'Doctor',
    'Town'
];
const ROLE_CLASSES = [
    'bannerDefault',
    'bannerMafia',
    'bannerCop',
    'bannerDoctor',
    'bannerTown'
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
const CLICK_FUNC = 'playerVote';
const DEAD_CLASS = 'bannerDead';
const VOTE_CLASS = 'bannerVotable';

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
            this.clearPlayerCard(curCard);
            // set background role color
            curCard.addDivClass(this.playerRoleVisible(curPlayer) ?
                ROLE_CLASSES[curPlayer.role] : ROLE_CLASSES[0]);
            // set alive opacity
            if (!curPlayer.alive) {
                curCard.addDivClass(DEAD_CLASS);
            }
            // set vote hover
            if (roomState.playerVoteLegal(this.clientPlayer, curPlayer)) {
                curCard.addOnClick(this.getClickFuncString(pName));
                curCard.addDivClass(VOTE_CLASS);
            }
            // TODO: check for host or people who are disconnected, also cop stuff
        }
        // set message and overwrite for special cases
        this.message = roomState.gameState === this.clientPlayer.role ||
                !this.clientPlayer.alive ||
                roomState.gameState >= 5 ?
            STATE_MESSAGES[roomState.gameState] : NIGHT_MESSAGE;
        // TODO: get rid of magic numbers
        this.message = roomState.gameState === 4 ? STATE_MESSAGES[4] : this.message;
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
    /*
    * clears the div classes of a player card to be set again according to room state
    */
    clearPlayerCard(card) {
        card.clearDivClasses();
        card.clearOnClick();
    }

    clearPlayerCards() {
        this.playerCards = {};
    }

    /*
    * generates the string of the to-be-evaluated function for on click
    */
    getClickFuncString(playerName) {
        return CLICK_FUNC + '(\'' + playerName + '\')';
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
