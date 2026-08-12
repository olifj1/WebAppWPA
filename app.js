const countEl = document.getElementById("count");
const changeButtons = document.querySelectorAll("[data-change]");
const resetButton = document.getElementById("reset");

let count = Number(localStorage.getItem("count") || 0);

function render() {
  countEl.textContent = count;
  localStorage.setItem("count", count);
}

changeButtons.forEach(button => {
  button.addEventListener("click", () => {
    count += Number(button.dataset.change);
    render();
  });
});

resetButton.addEventListener("click", () => {
  count = 0;
  render();
});

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(console.error);
}
