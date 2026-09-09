/**
 * Exit-Intent Popup — TM Sempre Tecnologia
 * Modelo Político Interativo | Site Apresentação para Candidatos
 * 
 * Dispara quando o cursor sai do topo da janela (saída de aba/site).
 * Funciona em desktop e mobile (scroll rápido p/ cima = intenção de saída).
 * Mostra apenas 1x por sessão + respeita recusa do usuário (24h em localStorage).
 */
(function () {
  'use strict';

  /* ─── CONFIGURAÇÃO ─── */
  const CONFIG = {
    WHATSAPP_PHONE: '5562996046458',
    WHATSAPP_MSG: encodeURIComponent('Olá Thiago! Vi o modelo de site político e gostaria de entender como ter uma plataforma assim para a minha campanha.'),
    DELAY_MS: 3000,           // esperar 3s antes de começar a monitorar
    COOLDOWN_H: 24,           // horas antes de mostrar novamente após "fechar"
    LS_KEY: 'tm_exit_popup_dismissed',
    SESSION_KEY: 'tm_exit_popup_shown',
    POPUP_IMG_SRC: './assets/exit-popup-banner.jpg', // imagem do banner gerado
  };

  /* ─── VERIFICAÇÕES INICIAIS ─── */
  const waLink = `https://api.whatsapp.com/send?phone=${CONFIG.WHATSAPP_PHONE}&text=${CONFIG.WHATSAPP_MSG}`;

  function shouldBlock() {
    // Já mostrou nesta sessão
    if (sessionStorage.getItem(CONFIG.SESSION_KEY)) return true;

    // Usuário dispensou recentemente
    const ts = localStorage.getItem(CONFIG.LS_KEY);
    if (ts) {
      const elapsed = (Date.now() - parseInt(ts, 10)) / 3600000; // horas
      if (elapsed < CONFIG.COOLDOWN_H) return true;
    }
    return false;
  }

  /* ─── INJEÇÃO DE CSS ─── */
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      #tm-exit-popup-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 10, 30, 0.82);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        transition: opacity 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
        pointer-events: none;
      }
      #tm-exit-popup-backdrop.is-visible {
        opacity: 1;
        pointer-events: all;
      }
      #tm-exit-popup-card {
        position: relative;
        max-width: 640px;
        width: 100%;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255,255,255,0.1);
        transform: scale(0.92) translateY(24px);
        transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease;
        opacity: 0;
        cursor: default;
      }
      #tm-exit-popup-backdrop.is-visible #tm-exit-popup-card {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
      #tm-exit-popup-banner {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
      }
      #tm-exit-popup-close {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.25);
        color: #fff;
        font-size: 1.2rem;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, transform 0.2s;
        z-index: 10;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      #tm-exit-popup-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }
      #tm-exit-popup-cta {
        display: block;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
        z-index: 5;
      }
      /* Fallback se banner não carregou: UI CSS */
      #tm-exit-popup-fallback {
        display: none;
        background: linear-gradient(135deg, #002B7F 0%, #0A192F 100%);
        padding: 48px 40px 40px;
        text-align: center;
        color: #fff;
      }
      #tm-exit-popup-banner[data-error="1"] + #tm-exit-popup-cta {
        display: none;
      }
      @media (max-width: 520px) {
        #tm-exit-popup-card { border-radius: 16px; }
        #tm-exit-popup-fallback { padding: 32px 24px 28px; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ─── CRIAÇÃO DO POPUP ─── */
  function buildPopup() {
    const backdrop = document.createElement('div');
    backdrop.id = 'tm-exit-popup-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'tm-popup-title');

    backdrop.innerHTML = `
      <div id="tm-exit-popup-card">
        <!-- Banner como imagem -->
        <img
          id="tm-exit-popup-banner"
          src="${CONFIG.POPUP_IMG_SRC}"
          alt="TM Sempre Tecnologia — Plataforma Completa de Campanha Digital"
          loading="lazy"
        />
        <!-- Overlay de clique sobre a imagem inteira -->
        <a
          id="tm-exit-popup-cta"
          href="${waLink}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar com a TM Tecnologia no WhatsApp"
          data-track="exit_popup_whatsapp_click"
        ></a>
        <!-- Fallback caso a imagem não carregue -->
        <div id="tm-exit-popup-fallback">
          <span style="
            display: inline-block;
            background: rgba(255,203,5,0.15);
            color: #FFCB05;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border: 1px solid rgba(255,203,5,0.4);
            border-radius: 999px;
            padding: 4px 14px;
            margin-bottom: 16px;
          ">Modelo Exclusivo</span>
          <h2 id="tm-popup-title" style="
            font-size: clamp(1.5rem, 4vw, 2rem);
            font-weight: 900;
            margin: 0 0 12px;
            line-height: 1.15;
          ">Seu candidato merece um site como esse</h2>
          <p style="color: #94a3b8; font-size: 0.95rem; margin: 0 0 28px; line-height: 1.55;">
            Plataforma completa de campanha digital: site, dashboard, urna virtual e automações.
          </p>
          <a href="${waLink}" target="_blank" rel="noopener noreferrer"
             style="
               display: inline-flex; align-items: center; gap: 10px;
               background: #25D366; color: #fff; text-decoration: none;
               font-weight: 800; font-size: 1rem;
               border-radius: 999px; padding: 14px 28px;
               box-shadow: 0 8px 24px rgba(37,211,102,0.4);
               transition: transform 0.2s, box-shadow 0.2s;
             "
             data-track="exit_popup_whatsapp_click_fallback"
             onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 32px rgba(37,211,102,0.5)'"
             onmouseleave="this.style.transform='';this.style.boxShadow='0 8px 24px rgba(37,211,102,0.4)'"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24z"/>
            </svg>
            Falar com a TM Tecnologia
          </a>
          <p style="color: #64748b; font-size: 0.78rem; margin: 16px 0 0;">
            Fechado para este modelo? <u style="cursor:pointer;">Veja como ter o seu.</u>
          </p>
        </div>
        <!-- Botão de fechar -->
        <button
          id="tm-exit-popup-close"
          type="button"
          aria-label="Fechar popup"
          title="Fechar"
        >×</button>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Fallback se imagem não carregar
    const img = backdrop.querySelector('#tm-exit-popup-banner');
    const fallback = backdrop.querySelector('#tm-exit-popup-fallback');
    const ctaOverlay = backdrop.querySelector('#tm-exit-popup-cta');
    img.addEventListener('error', () => {
      img.style.display = 'none';
      ctaOverlay.style.display = 'none';
      fallback.style.display = 'block';
    });

    return backdrop;
  }

  /* ─── SHOW / HIDE ─── */
  let backdrop = null;

  function showPopup() {
    if (backdrop) return; // já existe
    backdrop = buildPopup();

    // Pequeno delay de render p/ CSS transition funcionar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.classList.add('is-visible');
      });
    });

    // Fechar ao clicar no backdrop (fora do card)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) dismissPopup();
    });

    // Fechar pelo botão X
    document.getElementById('tm-exit-popup-close').addEventListener('click', dismissPopup);

    // ESC fecha
    document.addEventListener('keydown', onKeyDown);

    sessionStorage.setItem(CONFIG.SESSION_KEY, '1');
  }

  function dismissPopup() {
    if (!backdrop) return;
    backdrop.classList.remove('is-visible');
    setTimeout(() => {
      backdrop && backdrop.remove();
      backdrop = null;
    }, 400);
    localStorage.setItem(CONFIG.LS_KEY, Date.now().toString());
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') dismissPopup();
  }

  /* ─── DETECÇÃO DE EXIT INTENT ─── */
  function init() {
    if (shouldBlock()) return;

    let triggered = false;
    let ready = false;

    // Aguarda o delay mínimo na página
    setTimeout(() => { ready = true; }, CONFIG.DELAY_MS);

    // Desktop: cursor sai pela borda superior
    document.addEventListener('mouseleave', (e) => {
      if (!ready || triggered) return;
      if (e.clientY <= 0) {
        triggered = true;
        showPopup();
      }
    });

    // Mobile: scroll rápido para cima (velocidade > 200px/100ms)
    let lastY = window.scrollY;
    let lastT = Date.now();
    let mobileTimer = null;

    window.addEventListener('scroll', () => {
      if (!ready || triggered) return;
      const curY = window.scrollY;
      const curT = Date.now();
      const dy = lastY - curY;   // positivo = scroll p/ cima
      const dt = curT - lastT;

      if (dt > 0 && dy > 0) {
        const vel = dy / dt; // px/ms
        if (vel > 2 && curY < 300) { // rápido e perto do topo
          clearTimeout(mobileTimer);
          mobileTimer = setTimeout(() => {
            if (!triggered) {
              triggered = true;
              showPopup();
            }
          }, 80);
        }
      }
      lastY = curY;
      lastT = curT;
    }, { passive: true });

    // Visibilidade: usuário muda de aba (vai mudar)
    document.addEventListener('visibilitychange', () => {
      if (!ready || triggered) return;
      if (document.visibilityState === 'hidden') {
        triggered = true;
        sessionStorage.setItem(CONFIG.SESSION_KEY, '1'); // marca sem mostrar
      }
    });
  }

  /* ─── BOOT ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectCSS(); init(); });
  } else {
    injectCSS();
    init();
  }

})();
