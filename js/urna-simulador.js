/**
 * =========================================================================
 * SIMULADOR DE URNA ELETRÔNICA - ADIR GENTIL 2211
 * Campanha Oficial Adir Gentil • Deputado Federal • PL Tocantins
 * =========================================================================
 */

(() => {
  "use strict";

  let numeroDigitado = "";
  let isVotoEmBranco = false;
  let isProcessandoVoto = false;

  // Gerador de Áudio com Web Audio API (100% offline e sem latência)
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Bip de tecla padrão
  function tocarBip() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (_) {}
  }

  // Som clássico TSE "Pilili" ao confirmar (rápido e autêntico ~0.4s)
  function tocarSomConfirmaTSE() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      
      // Sequência ágil do pilili da urna eletrônica TSE (~0.4s)
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.setValueAtTime(780, t + 0.08);
      osc.frequency.setValueAtTime(1040, t + 0.16);
      osc.frequency.setValueAtTime(1320, t + 0.24);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.setValueAtTime(0.28, t + 0.26);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.40);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(t + 0.40);
    } catch (_) {}
  }

  function trackEvent(action, label) {
    try {
      if (window.dataLayer) {
        window.dataLayer.push({
          event: "urna_interacao",
          urna_action: action,
          urna_label: label,
        });
      }
    } catch (_) {}
  }

  // Elementos do DOM
  const slot1 = document.getElementById("urnaSlot1");
  const slot2 = document.getElementById("urnaSlot2");
  const slot3 = document.getElementById("urnaSlot3");
  const slot4 = document.getElementById("urnaSlot4");
  const slots = [slot1, slot2, slot3, slot4];

  const infoBox = document.getElementById("urnaInfoBox");
  const photoFrame = document.getElementById("urnaPhotoFrame");
  const lcdNormal = document.getElementById("urnaLcdNormal");
  const lcdFim = document.getElementById("urnaLcdFim");
  const successCard = document.getElementById("urnaSuccessCard");

  function atualizarTela() {
    if (!slot1) return;

    if (isVotoEmBranco) {
      slots.forEach((s) => {
        if (s) {
          s.innerText = "";
          s.classList.remove("active-blink");
        }
      });
      if (infoBox) {
        infoBox.innerHTML =
          '<div class="vote-invalid-msg" style="color: #334155;">VOTO EM BRANCO</div>';
      }
      if (photoFrame) photoFrame.style.display = "none";
      return;
    }

    // Atualiza dígitos nos slots
    slots.forEach((slot, idx) => {
      if (!slot) return;
      slot.innerText = numeroDigitado[idx] || "";
      slot.classList.remove("active-blink");
    });

    // Pisca o slot ativo seguinte
    if (numeroDigitado.length < 4) {
      const nextSlot = slots[numeroDigitado.length];
      if (nextSlot) nextSlot.classList.add("active-blink");
    }

    // Valida o número
    if (numeroDigitado === "2211") {
      if (infoBox) {
        infoBox.innerHTML = `
          <div><span class="label-field">Nome:</span> <span class="candidate-name">ADIR GENTIL</span></div>
          <div><span class="label-field">Partido:</span> <span class="candidate-party">PL (Partido Liberal)</span></div>
          <div><span class="label-field">Número:</span> <strong>2211</strong></div>
        `;
      }
      if (photoFrame) photoFrame.style.display = "flex";
    } else if (numeroDigitado.length === 4) {
      if (infoBox) {
        infoBox.innerHTML = `
          <div class="vote-invalid-msg">VOTO NULO / NÚMERO NÃO CADASTRADO</div>
          <div style="font-size: 0.8rem; color: #475569;">Digite <strong>2211</strong> para votar em Adir Gentil.</div>
        `;
      }
      if (photoFrame) photoFrame.style.display = "none";
    } else {
      if (infoBox) infoBox.innerHTML = "";
      if (photoFrame) photoFrame.style.display = "none";
    }
  }

  function digitar(digito) {
    if (isProcessandoVoto) return;
    if (isVotoEmBranco) isVotoEmBranco = false;

    if (numeroDigitado.length < 4) {
      tocarBip();
      numeroDigitado += String(digito);
      atualizarTela();
      trackEvent("digitar_tecla", digito);
    }
  }

  function corrige() {
    if (isProcessandoVoto) return;
    tocarBip();
    numeroDigitado = "";
    isVotoEmBranco = false;
    atualizarTela();
    trackEvent("clique_corrige", "reiniciar_voto");
  }

  function votarBranco() {
    if (isProcessandoVoto) return;
    tocarBip();
    numeroDigitado = "";
    isVotoEmBranco = true;
    atualizarTela();
    trackEvent("clique_branco", "voto_branco");
  }

  function confirma() {
    if (isProcessandoVoto) return;

    if (!isVotoEmBranco && numeroDigitado.length < 4) {
      // Número incompleto
      tocarBip();
      return;
    }

    isProcessandoVoto = true;
    tocarSomConfirmaTSE();
    trackEvent("clique_confirma", numeroDigitado || "BRANCO");

    // Alterna para a tela de FIM
    if (lcdNormal && lcdFim) {
      lcdNormal.style.display = "none";
      lcdFim.style.display = "flex";
    }

    window.setTimeout(() => {
      // Retorna a tela ao normal
      if (lcdNormal && lcdFim) {
        lcdFim.style.display = "none";
        lcdNormal.style.display = "flex";
      }

      if (numeroDigitado === "2211") {
        if (successCard) successCard.style.display = "flex";
      }

      numeroDigitado = "";
      isVotoEmBranco = false;
      isProcessandoVoto = false;
      atualizarTela();
    }, 850);
  }

  // Vinculação de eventos dos botões numéricos e de ação
  function initUrna() {
    const keypad = document.getElementById("urnaKeypad");
    if (!keypad) return;

    keypad.querySelectorAll("[data-urna-num]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const n = btn.getAttribute("data-urna-num");
        digitar(n);
      });
    });

    const btnBranco = document.getElementById("urnaBtnBranco");
    const btnCorrige = document.getElementById("urnaBtnCorrige");
    const btnConfirma = document.getElementById("urnaBtnConfirma");

    if (btnBranco) btnBranco.addEventListener("click", votarBranco);
    if (btnCorrige) btnCorrige.addEventListener("click", corrige);
    if (btnConfirma) btnConfirma.addEventListener("click", confirma);

    const btnRetry = document.getElementById("urnaBtnRetry");
    if (btnRetry) {
      btnRetry.addEventListener("click", () => {
        if (successCard) successCard.style.display = "none";
        corrige();
      });
    }

    // Teclado físico do usuário
    window.addEventListener("keydown", (e) => {
      // Ignora se o foco estiver em algum input ou formulário
      if (
        e.target &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        digitar(e.key);
      } else if (e.key === "Backspace" || e.key === "Escape") {
        corrige();
      } else if (e.key === "Enter") {
        confirma();
      }
    });

    atualizarTela();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUrna);
  } else {
    initUrna();
  }

  // Exposição de API global para testes e console
  window.urnaSimulador = {
    digitar,
    corrige,
    confirma,
    votarBranco,
  };
})();
