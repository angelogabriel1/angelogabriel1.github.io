var naoButton = document.getElementById("nao");
var simButton = document.getElementById("sim");

// Função para centralizar o botão na tela
function centralizeButton(button) {
  var screenWidth = window.innerWidth;
  var screenHeight = window.innerHeight;
  var buttonWidth = button.offsetWidth;
  var buttonHeight = button.offsetHeight;

  var centerX = (screenWidth - buttonWidth) / 2;
  var centerY = (screenHeight - buttonHeight) / 2;

  button.style.position = "absolute";
  button.style.left = centerX + "px";
  button.style.top = centerY + "px";
}

// Centralizar o botão "nao" ao carregar a página
window.onload = function() {
  centralizeButton(naoButton);
};

naoButton.addEventListener("mouseover", function() {
  var screenWidth = window.innerWidth;
  var screenHeight = window.innerHeight;
  var buttonWidth = naoButton.offsetWidth;
  var buttonHeight = naoButton.offsetHeight;

  var newX = Math.floor(Math.random() * (screenWidth - buttonWidth));
  var newY = Math.floor(Math.random() * (screenHeight - buttonHeight));

  naoButton.style.left = newX + "px";
  naoButton.style.top = newY + "px";
});

simButton.addEventListener("click", function() {
  window.location.href = "https://www.youtube.com/watch?v=sUbIEoAFGoQ";
});