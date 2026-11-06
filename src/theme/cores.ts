// Cores do Focado, tiradas de docs/design/ (telas de referência).
// Use sempre estes nomes nas telas, nunca o código da cor solto.
export const cores = {
  texto: '#1A1D1F', // títulos e textos principais
  textoSecundario: '#5C666B', // textos de apoio
  textoApagado: '#9AA4A8', // dicas, rótulos pequenos e placeholders
  primaria: '#14C4CE', // turquesa: botões e destaques
  primariaEscura: '#0FA6B0', // turquesa ao pressionar / fim do degradê
  fundo: '#F4F8F9', // fundo das telas
  superficie: '#FFFFFF', // cards e campos
  borda: '#E3E9EB', // contorno dos campos
  bordaNavegacao: '#EEF1F2', // linha acima da barra de abas
  botaoSuave: '#F1F5F6', // botões redondos cinzas do cronômetro
  trilha: '#EDF1F2', // fundo da barra de progresso
  fogoFundo: '#FFF1E6', // pílula da ofensiva 🔥
  fogoTexto: '#FF7A24',
  erro: '#E5484D', // mensagens de erro
} as const;

// Arredondamento padrão dos cantos (botões e campos), como no design.
export const raio = 14;

// Sombra suave dos cards do design: 0 8px 24px -12px rgba(20,60,65,.2)
export const sombraCard = {
  boxShadow: '0 8px 24px -12px rgba(20, 60, 65, 0.2)',
} as const;
