// Descobre o fuso horário configurado no celular, no formato IANA
// (ex.: 'America/Sao_Paulo', 'America/Manaus'). PRD 1.3.

// Rede de segurança: o mesmo padrão usado pelo servidor.
const FUSO_PADRAO = 'America/Sao_Paulo';

export function detectarFuso(): string {
  try {
    const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return fuso || FUSO_PADRAO;
  } catch {
    return FUSO_PADRAO;
  }
}
