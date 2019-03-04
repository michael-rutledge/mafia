const Hasher = require('./hasher');
const RoomState = require('./roomState.js');
const Player = require('./player.js');

// management and constants
var roomStates = {};
const ROOM_CODE_LENGTH = 4;
const MAX_PLAYERS = 16;
const MIN_PLAYERS = 4;


// public functions
function reserveNewRoom() {
    var newRoom;
    do {
        newRoom = Hasher.genHash(ROOM_CODE_LENGTH);
    } while (getRoomState(newRoom));
    constructNewRoomState(newRoom);
    return newRoom;
}

function roomExists(room) {
    return roomStates.hasOwnProperty(room);
}

function addUserToRoom(socket, name, room) {
    return roomExists(room) ? getRoomState(room).addUser(socket, name) : false;
}

function changeRoomOption(id, value, room) {
    return roomExists(room) ? getRoomState(room).changeOption(id, value) : false;
}

function playerVote(votingSocket, votedName, room) {
    return roomExists(room) ? getRoomState(room).playerVote(votingSocket, votedName) : false;
    // TODO: put this stuff below in roomState.js
    if (roomExists(room)) {
        var roomState = getRoomState(room);
        var voting = roomState.players[roomState.socketNames[socket.id]];
        var voted = roomState.players[name];
        if (voteIsLegal(voting, voted, roomState)) {
            applyVote(voting, voted, roomState);
            checkRoomState(roomState);
            return true;
        }
    }
    return false;
}

function removeUserFromRoom(socket, room) {
    return roomExists(room) ? getRoomState(room).removeUser(socket) : false;
}

function getRoomState(room) {
    return roomStates[room];
}

function touchRoomState(room) {
    console.log('TOUCH ROOM STATE');
    return roomExists(room) ? getRoomState(room) : constructNewRoomState(room);
}

function removeRoom(room) {
    if (roomExists(room))
        delete roomStates[room];
    console.log('ROOMS LEFT: ' + Object.keys(roomStates).length);
}

function startGame(socket, room) {
    return roomExists(room) ? getRoomState(room).startGame(socket) : false;
}


// private utilities
function applyVote(voting, voted, roomState) {
    // clear past votes then apply vote
    var votesKey;
    switch (voting.role) {
        case MAFIA:
            doVoteOrCustomVote(voting, voted, roomState, MAFIA_TIME, 'mafiaVotes');
            break;
        case COP:
            doVoteOrCustomVote(voting, voted, roomState, COP_TIME, 'copVotes');
            break;
        case DOCTOR:
            doVoteOrCustomVote(voting, voted, roomState, DOCTOR_TIME, 'doctorVotes');
            break;
        case TOWN:
            doVoteOrCustomVote(voting, voted, roomState, -1, 'townVotes')
            break;
        default:
            break;
    }
}

function checkRoomState(roomState) {
    switch (roomState.gameState) {
        case MAFIA_TIME:
            if (stateTriggered(roomState, 'mafiaVotes', roomState.numMafia, 'mafiaTarget',
                    (player) => { return true; })) {
                roomState.gameState = COP_TIME;
                clearAllVotes(roomState);
                checkRoomState(roomState);
            }
            break;
        case COP_TIME:
            if (stateTriggered(roomState, 'copVotes', roomState.numCops, 'copResult',
                    (player) => { return player.role === MAFIA; })) {
                roomState.gameState = DOCTOR_TIME;
                clearAllVotes(roomState);
                checkRoomState(roomState);
            }
            break;
        case DOCTOR_TIME:
            if (stateTriggered(roomState, 'doctorVotes', roomState.numDoctors, 'doctorTarget',
                    (player) => { return true; })) {
                roomState.gameState = TOWN_TIME;
                clearAllVotes(roomState);
                transferToDaytime(roomState);
            }
            break;
        case TOWN_TIME:
            if (stateTriggered(roomState, 'townVotes', townQuota(roomState), 'alive',
                    (player) => { return false; })) {
                // TODO: deal with branching logic because not all games will end after first turn
                // also we need to have game over states for results screen
                // TODO: keep track of role count after death
                // TODO: determine if showdown is needed here
                if (isGameFinished(roomState)) {
                    roomState.gameState = LOBBY;
                    resetGame(roomState);
                }
                else {
                    roomState.gameState = MAFIA_TIME;
                }
            }
            break;
        default:
            // TODO: showdown checks will need to be here
            break;
    }
}

function clearAllVotes(roomState) {
    for (var name in roomState.players) {
        var player = roomState.players[name];
        for (vote in player.mafiaVotes) delete player.mafiaVotes[vote];
        for (vote in player.copVotes) delete player.copVotes[vote];
        for (vote in player.doctorVotes) delete player.doctorVotes[vote];
        for (vote in player.townVotes) delete player.townVotes[vote];
    }
}

function clearVotesFromPlayer(votingName, roomState, votesKey) {
    for (var name in roomState.players) {
        if (roomState.players[name][votesKey][votingName])
            delete roomState.players[name][votesKey][votingName];
    }
}

function constructNewRoomState(room) {
    roomStates[room] = new RoomState();
    return roomStates[room];
}

function doVoteOrCustomVote(voting, voted, roomState, customTime, customKey) {
    // clear past votes from voting
    var votingName = roomState.socketNames[voting.socketId];
    var votesKey = roomState.gameState === customTime ? customKey :
        'townVotes';
    clearVotesFromPlayer(votingName, roomState, votesKey);
    // then actually vote
    voted[votesKey][votingName] = 1;
}

function isGameFinished(roomState) {
    // TODO: return game finish states
    if (roomState.numMafia <= 0) {
        return true;
    }
    if (innocentCount(roomState) < 2) {
        return true;
    }
    return false;
}

function innocentCount(roomState) {
    return playerAliveCount(roomState) - roomState.numMafia;
}

function playerAliveCount(roomState) {
    return roomState.numMafia + roomState.numCops + roomState.numDoctors +
        roomState.numTown;
}

function playerCount(roomState) {
    return Object.keys(roomState.players).length;
}

function stateTriggered(roomState, voteKey, quota, targetKey, valFunc) {
    // check vote count for parameters
    // quota hit means state has been triggered
    for (var name in roomState.players) {
        if (Object.keys(roomState.players[name][voteKey]).length >= quota) {
            // only set targetKey if people actually voted
            if (quota > 0)
                roomState.players[name][targetKey] = valFunc(roomState.players[name]);
            return true;
        }
    }
    return false;
}

function townQuota(roomState) {
    return Math.ceil(playerAliveCount(roomState)/2);
}

function transferToDaytime(roomState) {
    // for anyone selected by mafia and not saved by the doctor, kill them
    for (var name in roomState.players) {
        var player = roomState.players[name];
        if (player.mafiaTarget && !player.doctorTarget) {
            player.alive = false;
        }
        player.mafiaTarget = false;
        player.doctorTarget = false;
    }
}


// node exports
module.exports.reserveNewRoom = reserveNewRoom;
module.exports.roomExists = roomExists;
module.exports.addUserToRoom = addUserToRoom;
module.exports.changeRoomOption = changeRoomOption;
module.exports.removeUserFromRoom = removeUserFromRoom;
module.exports.playerVote = playerVote;
module.exports.getRoomState = getRoomState;
module.exports.touchRoomState = touchRoomState;
module.exports.removeRoom = removeRoom;
module.exports.startGame = startGame;
