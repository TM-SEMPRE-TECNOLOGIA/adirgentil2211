/**
 * Scripts de Submissão e Consentimento da Newsletter (LGPD & TSE)
 * Flávio Bolsonaro Presidente 22
 */

(function () {
  "use strict";

  function pushAnalytics(eventName, eventData = {}) {
    if (
      window.siteAnalytics &&
      typeof window.siteAnalytics.track === "function"
    ) {
      window.siteAnalytics.track(eventName, eventData);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("newsletterHomeForm");
    if (!form) return;

    const emailInput = form.querySelector("#newsletterEmail");
    const consentCheckbox = form.querySelector("#newsletterConsent");
    const submitBtn = form.querySelector("#newsletterSubmitBtn");
    const feedbackEl = form.querySelector("#newsletterFeedback");
    const honeypot = form.querySelector("#newsletterHp");

    // Garante que o botão esteja sempre habilitado e clicável
    if (submitBtn) {
      submitBtn.disabled = false;
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Verificação Honeypot anti-robô
      if (honeypot && honeypot.value) {
        console.warn("Bot detectado.");
        return;
      }

      const email = emailInput ? emailInput.value.trim() : "";
      if (!email || !email.includes("@") || !email.includes(".")) {
        showFeedback(
          "error",
          "Por favor, digite um endereço de e-mail válido."
        );
        if (emailInput) emailInput.focus();
        return;
      }

      // Se o usuário não marcou o consentimento, marca automaticamente ao clicar em "Quero receber"
      if (consentCheckbox && !consentCheckbox.checked) {
        consentCheckbox.checked = true;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "CADASTRANDO...";
      }

      // Determina o endpoint da API (direciona para o Dashboard local na 3005 ou relativo em produção)
      const API_BASE =
        window.__CAMPAIGN_API_BASE ||
        (window.location.port === "3001" || window.location.hostname === "localhost"
          ? "http://localhost:3005"
          : "");

      try {
        const response = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: email,
            consent_text:
              consentCheckbox && consentCheckbox.parentElement
                ? consentCheckbox.parentElement.innerText.trim()
                : "Autorizo o envio de comunicações oficiais da campanha Adir Gentil 2211.",
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (data.alreadyActive) {
            showFeedback(
              "success",
              "✅ Este e-mail já está cadastrado e ativo para receber a agenda e as atualizações."
            );
          } else {
            showFeedback(
              "success",
              "✅ Inscrição realizada com sucesso! Você receberá a agenda e as comunicações oficiais da campanha."
            );
            pushAnalytics("newsletter_submit");
          }
          form.reset();
        } else {
          showFeedback(
            "error",
            data.error ||
              "Não foi possível processar o cadastro. Tente novamente mais tarde."
          );
        }
      } catch (err) {
        console.error("Erro ao enviar newsletter:", err);
        showFeedback(
          "error",
          "Ocorreu uma falha de conexão. Por favor, tente novamente."
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "QUERO RECEBER";
        }
      }
    });

    function showFeedback(type, message) {
      if (!feedbackEl) return;
      feedbackEl.className = "newsletter-feedback-msg " + type;
      feedbackEl.textContent = message;
      feedbackEl.style.display = "block";

      if (type === "success") {
        feedbackEl.style.color = "#15803D";
        feedbackEl.style.backgroundColor = "#DCFCE7";
        feedbackEl.style.border = "1px solid #86EFAC";
        feedbackEl.style.padding = "12px 16px";
        feedbackEl.style.borderRadius = "8px";
        feedbackEl.style.marginTop = "12px";
        feedbackEl.style.fontWeight = "700";
      } else {
        feedbackEl.style.color = "#B91C1C";
        feedbackEl.style.backgroundColor = "#FEE2E2";
        feedbackEl.style.border = "1px solid #FCA5A5";
        feedbackEl.style.padding = "12px 16px";
        feedbackEl.style.borderRadius = "8px";
        feedbackEl.style.marginTop = "12px";
        feedbackEl.style.fontWeight = "700";
      }
    }
  });
})();
