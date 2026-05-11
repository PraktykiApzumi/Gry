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
    const modal = document.getElementById("gameModal");
    const nameEl = modal.querySelector('[name="name"]');
    if (!nameEl.value.trim()) { nameEl.style.borderColor = "red"; return; }

    try {
      const payload = {
        name: nameEl.value.trim(),
        type: modal.querySelector('[name="type"]').value.trim(),
        maxPlayers: Number(modal.querySelector('[name="maxPlayers"]').value),
        minPlayers: Number(modal.querySelector('[name="minPlayers"]').value),
        winType: modal.querySelector('[name="winType"]').value
      };
      const res = await fetch("api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => null);
      console.log("[API response]", {
        method: "POST",
        url: "api/game",
        status: res.status,
        ok: res.ok,
        body: data
      });
      if (res.ok) { document.getElementById("gameName").value = payload.name; closeModal("gameModal"); }
      else nameEl.style.borderColor = "red";
    } catch { nameEl.style.borderColor = "red"; }
  };

});
