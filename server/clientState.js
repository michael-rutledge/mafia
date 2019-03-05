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
const CLICK_FUNC = 'playerVote';
const DEAD_CLASS = 'bannerDead';

/*
* ClientState: represents need-to-know information per player on the clientside
*/
class ClientState {

    // CONSTRUCTOR
    constructor(clientPlayer) {
        this.clientPlayer = clientPlayer;
        this.playerCards = {};
    }


    // PUBLIC FUNCTIONS
    updateFromRoomState(roomState) {
        for (var pName in roomState.players) {
            var curPlayer = roomState.getPlayerFromName(pName);
            var curCard;
            if (!this.playerCards[pName]) this.playerCards[pName] = new PlayerCard(pName);
            curCard = this.playerCards[pName];
            this.clearCard(curCard);
            curCard.addDivClass(this.playerRoleVisible(curPlayer) ?
                ROLE_CLASSES[curPlayer.role] : ROLE_CLASSES[0]);
            if (!curPlayer.alive) {
                curCard.addDivClass(DEAD_CLASS);
            }
            if (roomState.playerVoteLegal(this.clientPlayer, curPlayer)) {
                curCard.addOnClick(this.getClickFuncString(curPlayer));
            }
            // TODO: check for host or people who are disconnected, also cop stuff
        }
    }

    getCompressed() {
        return {
            alive: this.clientPlayer.alive
            role: ROLE_STRINGS[this.clientPlayer.role],
            players: this.playerCards
        };
    }


    // PRIVATE FUNCTIONS
    /*
    * clears the div classes of a player card to be set again according to room state
    */
    clearCard(card) {
        card.clearDivClasses();
        card.clearOnClick();
    }

    /*
    * generates the string of the to-be-evaluated function for on click
    */
    getClickFuncString(player) {
        return CLICK_FUNC + '(' + player.name + ')';
    }

    /*
    * returns whether the given player's role can be seen by the client player
    */
    playerRoleVisible(player) {
        return !this.clientPlayer.alive || this.clientPlayer.role === player.role;
    }
}

module.exports = ClientState;
