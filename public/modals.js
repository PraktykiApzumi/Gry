document.addEventListener("DOMContentLoaded", () => {

  function openModal(id) { document.getElementById(id).style.display = "flex"; }
  function closeModal(id) {
    const m = document.getElementById(id);
    m.style.display = "none";
    m.querySelectorAll("input, select").forEach(el => { el.value = ""; el.style.borderColor = ""; });
  }

  // Zamknij po kliknięciu w tło
  document.querySelectorAll(".modal-overlay").forEach(o => {
    o.addEventListener("click", e => { if (e.target === o) closeModal(o.id); });
  });

  // Modal gry
  document.getElementById("openGameModal").onclick = () => openModal("gameModal");
  document.getElementById("closeGameModal").onclick = () => closeModal("gameModal");

  document.getElementById("saveGameBtn").onclick = async () => {
    const nazwa = document.getElementById("modalGameName");
    if (!nazwa.value.trim()) { nazwa.style.borderColor = "red"; return; }

    try {
      const res = await fetch("api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nazwa: nazwa.value.trim(),
          rodzaj: document.getElementById("modalGameRodzaj").value.trim(),
          max_graczy: document.getElementById("modalGameMax").value,
          min_graczy: document.getElementById("modalGameMin").value,
          rodzaj_wygranej: document.getElementById("modalGameWygrana").value
        })
      });
      if (res.ok) { document.getElementById("gameName").value = nazwa.value.trim(); closeModal("gameModal"); }
      else nazwa.style.borderColor = "red";
    } catch { nazwa.style.borderColor = "red"; }
  };

});
