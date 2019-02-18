function shuffle(arr) {
    var curIndex = arr.length;
    var tempVal, randIndex;

    // while there are elements left to shuffle
    while (curIndex !== 0) {

        // pick a random remaining element
        randIndex = Math.floor(Math.random()*curIndex--);

        // and swap it with the current element
        tempVal = arr[curIndex];
        arr[curIndex] = arr[randIndex];
        arr[randIndex] = tempVal;
    }

    return arr;
}

module.exports.shuffle = shuffle;
