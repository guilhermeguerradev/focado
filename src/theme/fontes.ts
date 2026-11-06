import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';

// Fontes do design: Nunito (textos) e Fredoka (títulos).
// Carregamos só os pesos que o design usa, para o app não ficar pesado.
// Obs.: o design pede Fredoka 800, mas ela só existe até 700.
export const arquivosDeFonte = {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
};

// Nomes para usar nos estilos: fontFamily: fontes.textoNegrito
export const fontes = {
  texto: 'Nunito_600SemiBold',
  textoNegrito: 'Nunito_700Bold',
  textoExtraNegrito: 'Nunito_800ExtraBold',
  titulo: 'Fredoka_700Bold',
  tituloLeve: 'Fredoka_600SemiBold',
} as const;
