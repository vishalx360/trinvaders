var ClientSocket = io.connect("http://localhost:8081/");

function sendUpdate(x, y, rotation) {
  ClientSocket.emit("movement", {
    xPosition: x,
    yPosition: y,
    shipRotation: rotation
  });
}

ClientSocket.on("movement", function(newPosition) {
  console.log(
    newPosition.xPosition,
    newPosition.yPosition,
    newPosition.shipRotation
  );
});
