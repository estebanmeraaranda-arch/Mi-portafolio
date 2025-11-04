var characters_up = [
  "A","B","C","D","E","F","G","H","I","J",
  "K","L","M","N","O","P","Q","R","S","T",
  "U","V","W","X","Y","Z"
];
var title = ["*","*","*","*","*","*","*","*","*","*"];

var complete = 0;

function update_txt(title) {
  let string = "";
  title.forEach((element) => string += element);
  document.getElementById("title").innerHTML = string;
}

function randomIntro() {
  for (let i = 0; i < title.length; i++) {
    title[i] = characters_up[Math.floor(Math.random() * characters_up.length)];
  }
  update_txt(title);
}

var myFuncUpper = function (char_num, num) {
  var i = 0;
  var character0 = 0;
  while (i < char_num) {
    (function (i) {
      setTimeout(function () {
        character0 = characters_up[i];
        title[num] = character0;
        update_txt(title);
      }, 100 * i);
    })(i++);
  }
  return true;
};

function intro() {
  complete = 1;

  // 🔹 Mostrar letras aleatorias
  randomIntro();

  // 🔹 Animar “BIENVENIDO” después de 1s
  setTimeout(function () {
    complete = 2;
    console.log("start");
    myFuncUpper(2, 0);  // B
    myFuncUpper(9, 1);  // I
    myFuncUpper(5, 2);  // E
    myFuncUpper(14, 3); // N
    myFuncUpper(22, 4); // V
    myFuncUpper(5, 5);  // E
    myFuncUpper(14, 6); // N
    myFuncUpper(9, 7);  // I
    myFuncUpper(4, 8);  // D
    myFuncUpper(15, 9); // O
  }, 1000);

  setTimeout(function () {
    complete = 3;
    console.log("done");
    document.getElementById("title").style.border = "solid 5px white";
    document.getElementById("start").style.top = "10%";
  }, 3400);
}

// DOM listo
document.addEventListener('DOMContentLoaded', () => {
  intro();

  const startButton = document.getElementById("start");
  if (startButton) {
    startButton.addEventListener("click", start);
    console.log("✅ Event listener agregado al botón start");
  }

  console.log("✅ Menu.js inicializado correctamente");
});

function start(event) {
  if (complete !== 3) {
    console.log("⏳ Esperando a que la animación termine... (complete =", complete, ")");
    return;
  }

  console.log("🎮 Iniciando transición...");

  const alignElement = document.getElementById("align");
  if (alignElement) {
    alignElement.style.top = "40%";
    alignElement.style.opacity = "0";
  }

  setTimeout(function () {
    console.log("🔄 Disparando cambio de pantalla a 2...");
    const changeEvent = new CustomEvent("changeScreen", { 
      detail: 2,
      bubbles: true,
      cancelable: true 
    });
    window.dispatchEvent(changeEvent);
  }, 800);
}
