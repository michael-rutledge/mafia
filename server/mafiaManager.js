const Hasher = require('./hasher');
const Shuffler = require('./shuffler.js');


// management and constants
var roomStates = {};
const ROOM_CODE_LENGTH = 4;
const MAX_PLAYERS = 16;
const MIN_PLAYERS = 4;
// roles
const DEFAULT   = 0;
const MAFIA     = 1;
const COP       = 2;
const DOCTOR    = 3;
const TOWN      = 4;
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
        min: 0,
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
    if (roomExists(room)) {
        var roomState = getRoomState(room);
        // if player name doesn't exist and we are in lobby, go for add user
        if (!roomState.players[name] && roomState.gameState === LOBBY) {
            roomState.players[name] = constructNewPlayer(socket.id);
            roomState.socketNames[socket.id] = name;
            tryForHost(socket, roomState);
            return true;
        }
        // if name exists but we are in game, make sure the requested name has an open socket spot
        // then populate the open socket spot
        else if (roomState.players[name] && roomState.gameState !== LOBBY &&
                roomState.players[name].socketId === null) {
            roomState.players[name].socketId = socket.id;
            roomState.socketNames[socket.id] = name;
            tryForHost(socket, roomState);
            return true;
        }
    }
    // all other conditions should lead to a no-go on add user
    return false;
}

function changeRoomOption(id, value, room) {
    // return true if option was successfully modified
    if (roomExists(room)) {
        var roomState = getRoomState(room);
        if (OPTIONS[id]) {
            roomState[id] = Math.max(value, OPTIONS[id].min);
            roomState[id] = Math.min(value, OPTIONS[id].max);
            return true;
        }
    }
    return false;
}

function playerVote(socket, name, room) {
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
    if (roomExists(room)) {
        var roomState = getRoomState(room);
        var name = roomState.socketNames[socket.id];
        if (name && roomState.players[name]) {
            delete roomState.socketNames[socket.id];
            roomState.players[name].socketId = null;
            if (roomState.gameState === LOBBY) {
                delete roomState.players[name];
            }
            repickHost(roomState);
            return true;
        }
    }
    return false;
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
    if (roomExists(room)) {
        var roomState = getRoomState(room);
        // safeguard that only the host can start the game and only from lobby
        if (socket.id === roomState.host && roomState.gameState === LOBBY &&
                playerCount(roomState) >= MIN_PLAYERS &&
                checkRoles(roomState)) {
            prepNewGame(roomState);
            return true;
        }
    }
    console.log('GAME START FAIL');
    return false;
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

function assignRoles(numMafia, numCops, numDoctors, players) {
    var names = Object.keys(players);
    names = Shuffler.shuffle(names);
    var curIndex = 0;
    while (numMafia-- > 0 && curIndex < names.length) {
        players[names[curIndex++]].role = MAFIA;
    }
    while (numCops-- > 0 && curIndex < names.length) {
        players[names[curIndex++]].role = COP;
    }
    while (numDoctors-- > 0 && curIndex < names.length) {
        players[names[curIndex++]].role = DOCTOR;
    }
}

function checkRoles(roomState) {
    // there needs to be at least 3 innocents
    // because 2 results in showdown after 1 dies from mafia
    return (playerCount(roomState) - roomState.numMafia) >= 3;
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

function constructNewPlayer(socketId) {
    return {
        socketId: socketId,
        role: DEFAULT,
        alive: true,
        mafiaTarget: false,
        mafiaVotes: {},
        copResult: null,
        copVotes: {},
        doctorTarget: false,
        doctorVotes: {},
        townVotes: {}
    };
}

function constructNewRoomState(room) {
    roomStates[room] = {
        gameState: LOBBY,
        host: null,
        numMafia: 1,
        numCops: 0,
        numDoctors: 0,
        numTown: 0,
        players: {},
        socketNames: {}
    }
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

function prepNewGame(roomState) {
    // set everyone to alive and innocent as defaults
    resetGame(roomState);
    for (var name in roomState.players) {
        roomState.players[name].role = TOWN;
        roomState.players[name].alive = true;
    }
    // assign real roles
    assignRoles(roomState.numMafia, roomState.numCops, roomState.numDoctors, roomState.players);
    roomState.numTown = playerCount(roomState) - roomState.numMafia -
        roomState.numCops - roomState.numDoctors;
    // set game state out of lobby
    roomState.gameState = MAFIA_TIME;
}

function repickHost(roomState) {
    roomState.host = null;
    newHostId = Object.keys(roomState.socketNames)[0];
    roomState.host = newHostId ? newHostId : null;
}

function resetGame(roomState) {
    clearAllVotes(roomState);
    for (var name in roomState.players) {
        var player = roomState.players[name];
        player.role = DEFAULT;
        player.alive = true;
        player.mafiaTarget = false;
        player.copResult = null;
        player.doctorTarget = false;
    }
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

function tryForHost(socket, roomState) {
    if (roomState.host === null) {
        roomState.host = socket.id;
    }
}

function voteIsLegal(voting, voted, roomState) {
    // this check is mostly to prevent cheating from client
    // the logic is repeated after being done in client to prevent voting calls
    if (!voting.alive || !voted.alive) return false;
    switch (roomState.gameState) {
        // mafia can vote for anyone, even themselves
        case MAFIA_TIME:
            return voting.role === MAFIA;
            break;
        // cops can only investigate non-cops who haven't been investigated
        case COP_TIME:
            return voting.role === COP && voted.role !== COP &&
                voted.copResult === null;
            break;
        // doctors can only save non-doctors
        case DOCTOR_TIME:
            return voting.role === DOCTOR && voted.role !== DOCTOR;
            break;
        // during deliberation, everyone can vote on anyone
        case TOWN_TIME:
            return true;
            break;
        default:
            return false;
            break;
    }
    return false;
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
