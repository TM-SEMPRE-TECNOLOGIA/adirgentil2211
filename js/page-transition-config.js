/**
 * =========================================================================
 * CONFIGURAÇÃO DA TRANSIÇÃO / ANIMAÇÃO ENTRE PÁGINAS (PRELOADER)
 * Adir Gentil 2211 - Deputado Federal (Tocantins)
 * =========================================================================
 *
 * Edite os parâmetros abaixo para personalizar como a tela de transição
 * se comporta ao abrir o site ou ao navegar entre as páginas.
 */

window.PAGE_TRANSITION_CONFIG = {
  /**
   * ATIVAÇÃO GERAL:
   * true  -> Animação ligada.
   * false -> Desativa completamente (carregamento imediato sem espera).
   */
  enabled: true,

  /**
   * MODO DE DISPARO:
   * 'every_page'       -> Exibe a animação TODA VEZ que o usuário clica para mudar de página.
   * 'first_visit_only' -> Exibe APENAS na primeira visita do usuário (sessão do navegador).
   *                       (Ao navegar entre páginas, abre instantâneo sem travar o visitante).
   * 'home_only'        -> Exibe SOMENTE na página inicial (Home/index.html).
   * 'disabled'         -> Desativado em todas as páginas.
   */
  mode: 'every_page',

  /**
   * TEMPO DE EXIBIÇÃO (em milissegundos - 1000ms = 1 segundo):
   * Duração que o logotipo e o número 2211 permanecem na tela antes de iniciar a saída.
   * Exemplo: 1200 = 1.2 segundos | 2000 = 2 segundos | 800 = 0.8s (rápido)
   */
  displayDurationMs: 1400,

  /**
   * TEMPO DO EFEITO DE SAÍDA (em milissegundos):
   * Tempo da transição para revelar a página (deslizar ou sumir).
   */
  exitTransitionMs: 700,

  /**
   * ESTILO DA TRANSIÇÃO DE SAÍDA:
   * 'slide-up'  -> A tela azul sobe como uma cortina revelando o conteúdo.
   * 'fade'      -> Esmaecimento suave (vai ficando transparente até sumir).
   * 'zoom-out'  -> A tela encolhe suavemente e desaparece.
   */
  transitionStyle: 'slide-up',

  /**
   * CORES VISUAIS:
   * backgroundColor: Cor do fundo da tela de transição.
   * numberColor: Cor do número '2211'.
   */
  backgroundColor: '#005baa', // Azul da campanha (#005baa ou #015F34 verde)
  numberColor: '#ffcb05',     // Amarelo vibrante (#ffcb05)
};
