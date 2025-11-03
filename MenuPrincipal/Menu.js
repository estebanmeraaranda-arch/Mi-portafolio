var characters_up = [
  "A","B","C","D","E","F","G","H","I","J",
  "K","L","M","N","O","P","Q","R","S","T",
  "U","V","W","X","Y","Z"
];
var characters_low = [
  "a","b","c","d","e","f","g","h","i","j",
  "k","l","m","n","o","p","q","r","s","t",
  "u","v","w","x","y","z"
];
var title = ["*","*","*","*","*","*","*","*","*","*"];

var complete = 0;

function update_txt(title) {
  let string = "";
  title.forEach((element) => string += element);
  document.getElementById("title").innerHTML = string;
}

// genera texto aleatorio
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

  // 🔹 PRIMERO: mostrar letras aleatorias
  randomIntro();

  // 🔹 LUEGO: 1 segundo después, animar “BIENVENIDO”
  setTimeout(function () {
    complete = 2;
    console.log("start");
    // B I E N V E N I D O
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

document.onload = intro();

function start() {
  if (complete == 3) {
    document.getElementById("align").style.top = "40%";
    document.getElementById("align").style.opacity = "0%";
    setTimeout(function () {
      // Aquí puedes cambiar de pantalla, si quieres:
      // window.dispatchEvent(new CustomEvent("changeScreen", { detail: 2 }));
    }, 1200);
  }
}

document.getElementById("body").addEventListener("click", start);
