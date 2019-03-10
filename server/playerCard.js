const ROLE_CLASSES = [
    'bannerDefault',
    'bannerMafia',
    'bannerCop',
    'bannerDoctor',
    'bannerTown'
];
const CLICK_FUNC = 'playerVote';
const DEAD_CLASS = 'bannerDead';
const VOTE_CLASS = 'bannerVotable';
const VOTED_CLASS = 'bannerVoted';

class PlayerCard {

    // CONSTRUCTOR
    constructor(name) {
        this.name = name;
        this.text = this.name;
        this.clearAppearance();
    }

    // PUBLIC FUNCTIONS
    clearAppearance() {
        this.clearDivClasses();
        this.clearOnClick();
    }

    setAliveAppearance(alive) {
        if (!alive) {
            this.addDivClass(DEAD_CLASS);
        }
    }

    setBackgroundColorForPlayer(curPlayer, visibleToClient) {
        this.addDivClass(visibleToClient ?
            ROLE_CLASSES[curPlayer.role] : ROLE_CLASSES[0]);
    }

    setClientPlayerAppearance(clientPlayer, curPlayer) {
        if (clientPlayer === curPlayer) {
            this.text = '<b>'+this.text+'</b>';
        }
    }

    setCopResult(clientPlayer, curPlayer) {
        // TODO: get rid of magic numbers
        if (clientPlayer.role === 2 && curPlayer.copResult !== null) {
            this.addDivClass(curPlayer.role === 1 ? ROLE_CLASSES[1] : ROLE_CLASSES[4]);
        }
    }

    setHostAppearance(curPlayer, roomState) {
        // TODO: get rid of magic numbers
        if (curPlayer.socketId === roomState.host && roomState.gameState === 0) {
            this.text = '<i>'+this.text+'</i>';
        }
    }

    setVoteCounter(clientPlayer, curPlayer, roomState) {
        var curVoteCount = curPlayer.voteCountInGameState(roomState.gameState);
        var voteQuota = roomState.getVoteQuotaForGameState(roomState.gameState);
        // TODO: get rid of magic numbers
        if (roomState.gameState !== 5 && curVoteCount > 0) {
            this.text += ' ' + curVoteCount + '/' + voteQuota + ' votes';
        }
        else if (roomState.gameState === 5) {
            if (curPlayer.votedFor(clientPlayer, roomState)) {
                this.text += ' <i>"Truce?"</i>';
            }
            else if (clientPlayer.votedFor(curPlayer, roomState)) {
                this.text += ' <i>"Hmm..."</i>'
            }
        }
    }

    setVoted(clientPlayer, curPlayer, roomState) {
        if (clientPlayer.votedFor(curPlayer, roomState)) {
            this.addDivClass(VOTED_CLASS);
        }
    }

    setVoteHover(playerName, voteLegal) {
        if (voteLegal) {
            this.addOnClick(this.getClickFuncString(playerName));
            this.addDivClass(VOTE_CLASS);
        }
    }


    // PRIVATE FUNCTIONS
    /*
    * sets player card to default css styling
    */
    clearDivClasses() {
        this.divClasses = [ 'bannerPlayer' ];
    }

    clearOnClick() {
        this.onClick = '';
    }

    /*
    * add class to player card div element (order matters)
    */
    addDivClass(cls) {
        this.divClasses.push(cls);
    }

    addOnClick(funcString) {
        this.onClick = funcString;
    }

    /*
    * generates the string of the to-be-evaluated function for on click
    */
    getClickFuncString(playerName) {
        return CLICK_FUNC + '(\'' + playerName + '\')';
    }
}

module.exports = PlayerCard;
