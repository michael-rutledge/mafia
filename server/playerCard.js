class PlayerCard {

    // CONSTRUCTOR
    constructor(name) {
        this.name = name;
        this.clearDivClasses();
        this.clearOnClick();
    }

    // PUBLIC FUNCTIONS
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
}

module.exports = PlayerCard;
