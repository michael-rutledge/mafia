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

class PlayerCard {

    // CONSTRUCTOR
    constructor(name) {
        this.name = name;
        this.clearDivClasses();
        this.clearOnClick();
    }

    // PUBLIC FUNCTIONS
    setAliveAppearance(alive) {
        if (!alive) {
            this.addDivClass(DEAD_CLASS);
        }
    }

    setBackgroundColorForPlayer(curPlayer, visibleToClient) {
        this.addDivClass(visibleToClient ?
            ROLE_CLASSES[curPlayer.role] : ROLE_CLASSES[0]);
    }

    setCopResult(clientPlayer, curPlayer) {
        // TODO: get rid of magic numbers
        if (clientPlayer.role === 2 && curPlayer.copResult !== null) {
            this.addDivClass(curPlayer.role === 1 ? ROLE_CLASSES[1] : ROLE_CLASSES[4]);
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
