/**
 * ==========================================================================
 * CONTADOR REGRESSIVO OFICIAL • ELEIÇÃO GERAL 2026 (04/10/2026 08:00 BRT)
 * Deputado Adir Gentil 2211 - Tocantins
 * ==========================================================================
 */

(() => {
  "use strict";

  // Data do 1º Turno das Eleições 2026 (04 de Outubro de 2026 às 08h00 - Horário de Brasília)
  const ELECTION_DATE = new Date("2026-10-04T08:00:00-03:00").getTime();

  const d1 = document.getElementById("countDay1");
  const d2 = document.getElementById("countDay2");
  const h1 = document.getElementById("countHour1");
  const h2 = document.getElementById("countHour2");
  const m1 = document.getElementById("countMin1");
  const m2 = document.getElementById("countMin2");
  const s1 = document.getElementById("countSec1");
  const s2 = document.getElementById("countSec2");

  if (!d1 || !d2) return;

  const updateCard = (el, val) => {
    if (!el) return;
    const strVal = String(val);
    if (el.textContent !== strVal) {
      el.textContent = strVal;
    }
  };

  const pad2 = (num) => String(Math.max(0, num)).padStart(2, "0");

  const tick = () => {
    const now = new Date().getTime();
    const distance = ELECTION_DATE - now;

    if (distance <= 0) {
      updateCard(d1, "0");
      updateCard(d2, "0");
      updateCard(h1, "0");
      updateCard(h2, "0");
      updateCard(m1, "0");
      updateCard(m2, "0");
      updateCard(s1, "0");
      updateCard(s2, "0");
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const dStr = pad2(days);
    const hStr = pad2(hours);
    const mStr = pad2(minutes);
    const sStr = pad2(seconds);

    // Se dias tiver 2 dígitos (ou pegamos os dois últimos)
    updateCard(d1, dStr[dStr.length - 2] || "0");
    updateCard(d2, dStr[dStr.length - 1] || "0");

    updateCard(h1, hStr[0]);
    updateCard(h2, hStr[1]);

    updateCard(m1, mStr[0]);
    updateCard(m2, mStr[1]);

    updateCard(s1, sStr[0]);
    updateCard(s2, sStr[1]);
  };

  tick();
  setInterval(tick, 1000);
})();
