// Create div element that represents player in game.
// User will know who they are by bolded name.
function genPlayerBanner(name, playerState, curSocket) {
    name = playerState.socketId === curSocket.id ? '<b>'+name+'</b>' : name;
    return '<div class="playerBanner">' + name + '</div>';
}
