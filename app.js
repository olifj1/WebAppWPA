const countEl = document.getElementById("count");
const addButton = document.getElementById("add");
const resetButton = document.getElementById("reset");

let count = Number(localStorage.getItem("count") || 0);

function render() {
  countEl.textContent = count;
  localStorage.setItem("count", count);
}

addButton.addEventListener("click", () => {
  count++;
  render();
});

resetButton.addEventListener("click", () => {
  count = 0;
  render();
});

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(console.error);
}
