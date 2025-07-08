
const layout = [
  ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
  ['W', 'X', 'C', 'V', 'B', 'N', 'É', 'È', 'À', 'Ç'],
  ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  ['ESPACE', 'TAB', 'ENTRÉE', 'MAJ', 'SUPPR', '←']
];

let selectedRow = 0, selectedCol = 0;
const keyboard = document.getElementById("keyboard");
const keySound = document.getElementById("keySound");

function render() {
  keyboard.innerHTML = "";
  layout.forEach((row, r) => {
    row.forEach((key, c) => {
      const div = document.createElement("div");
      div.className = "key" + (r === selectedRow && c === selectedCol ? " selected" : "");
      div.innerText = key;
      keyboard.appendChild(div);
    });
  });
}

function getSelectedKey() {
  return layout[selectedRow][selectedCol];
}

function pressKey() {
  const key = getSelectedKey();
  keySound.currentTime = 0;
  keySound.play();
  fetch("http://localhost:3000/key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key })
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") selectedCol = (selectedCol + 1) % layout[selectedRow].length;
  if (e.key === "ArrowLeft") selectedCol = (selectedCol - 1 + layout[selectedRow].length) % layout[selectedRow].length;
  if (e.key === "ArrowDown") selectedRow = (selectedRow + 1) % layout.length;
  if (e.key === "ArrowUp") selectedRow = (selectedRow - 1 + layout.length) % layout.length;
  if (e.key === "Enter" || e.key === " ") pressKey();
  render();
});

render();
