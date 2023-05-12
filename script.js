var naoButton = document.getElementById("nao");
var simButton = document.getElementById("sim")

naoButton.addEventListener("mouseover", function() {
  var screenWidth = window.innerWidth;
  var screenHeight = window.innerHeight;
  var newX = Math.floor(Math.random() * screenWidth);
  var newY = Math.floor(Math.random() * screenHeight);
  naoButton.style.left = newX + "px";
  naoButton.style.top = newY + "px";
});
simButton.addEventListener("click", function() {
    window.location.href = "https://www.youtube.com/watch?v=sUbIEoAFGoQ"

})