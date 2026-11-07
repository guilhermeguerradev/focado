// Cortes de período das estatísticas (PRD 4.1 e 4.2). Funções puras.
//
// Os dias são DATAS DE CALENDÁRIO em texto ("2026-11-06"), não horários.
// Só `hojeNoFuso` olha o relógio + fuso; todo o resto é conta de calendário,
// e por isso horário de verão e fusos diferentes não bagunçam nada.
// Calendário fixo: semana começa no DOMINGO, mês no dia 1, ano em 1º de janeiro.

export type TipoPeriodo = 'dia' | 'semana' | 'mes' | 'ano';

export type Periodo = {
  tipo: TipoPeriodo;
  inicio: string; // "AAAA-MM-DD", inclusive
  fim: string; // "AAAA-MM-DD", inclusive
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]; // prettier-ignore

// Que dia é hoje, NO FUSO DO USUÁRIO (ex.: 23h de Manaus ainda é "hoje" lá).
export function hojeNoFuso(agora: Date, fuso: string): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora);
  const pegar = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${pegar('year')}-${pegar('month')}-${pegar('day')}`;
}

// ---- conta de calendário (usa UTC só como "papel quadriculado", sem fuso) ----

function paraData(dia: string): Date {
  const [ano, mes, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, d));
}

function paraTexto(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function somarDias(dia: string, dias: number): string {
  const data = paraData(dia);
  data.setUTCDate(data.getUTCDate() + dias);
  return paraTexto(data);
}

// ---- períodos ----

// O período (dia/semana/mês/ano) que contém a data.
export function periodoQueContem(tipo: TipoPeriodo, dia: string): Periodo {
  const data = paraData(dia);
  const ano = data.getUTCFullYear();
  const mes = data.getUTCMonth();

  switch (tipo) {
    case 'dia':
      return { tipo, inicio: dia, fim: dia };
    case 'semana': {
      const inicio = somarDias(dia, -data.getUTCDay()); // getUTCDay: 0 = domingo
      return { tipo, inicio, fim: somarDias(inicio, 6) };
    }
    case 'mes':
      return {
        tipo,
        inicio: paraTexto(new Date(Date.UTC(ano, mes, 1))),
        fim: paraTexto(new Date(Date.UTC(ano, mes + 1, 0))), // dia 0 do mês seguinte = último dia
      };
    case 'ano':
      return { tipo, inicio: `${ano}-01-01`, fim: `${ano}-12-31` };
  }
}

export function periodoAnterior(periodo: Periodo): Periodo {
  return periodoQueContem(periodo.tipo, somarDias(periodo.inicio, -1));
}

export function proximoPeriodo(periodo: Periodo): Periodo {
  return periodoQueContem(periodo.tipo, somarDias(periodo.fim, 1));
}

// Datas no formato "AAAA-MM-DD" podem ser comparadas como texto.
export function ehPeriodoAtual(periodo: Periodo, hoje: string): boolean {
  return periodo.inicio <= hoje && hoje <= periodo.fim;
}

export function ehPeriodoPassado(periodo: Periodo, hoje: string): boolean {
  return periodo.fim < hoje;
}

// ---- textos da navegação ("Esta semana" / "1 – 7 de julho") ----

function diaEMes(dia: string): string {
  const data = paraData(dia);
  return `${data.getUTCDate()} de ${MESES[data.getUTCMonth()]}`;
}

export function tituloDoPeriodo(periodo: Periodo, hoje: string): string {
  const atual = periodoQueContem(periodo.tipo, hoje);
  const anterior = periodoAnterior(atual);
  const ehAtual = periodo.inicio === atual.inicio;
  const ehAnterior = periodo.inicio === anterior.inicio;
  const data = paraData(periodo.inicio);

  switch (periodo.tipo) {
    case 'dia':
      if (ehAtual) return 'Hoje';
      if (ehAnterior) return 'Ontem';
      return diaEMes(periodo.inicio);
    case 'semana':
      if (ehAtual) return 'Esta semana';
      if (ehAnterior) return 'Semana passada';
      return `Semana de ${diaEMes(periodo.inicio)}`;
    case 'mes': {
      if (ehAtual) return 'Este mês';
      if (ehAnterior) return 'Mês passado';
      const nome = MESES[data.getUTCMonth()];
      return nome[0].toUpperCase() + nome.slice(1);
    }
    case 'ano':
      if (ehAtual) return 'Este ano';
      if (ehAnterior) return 'Ano passado';
      return String(data.getUTCFullYear());
  }
}

export function subtituloDoPeriodo(periodo: Periodo): string {
  const inicio = paraData(periodo.inicio);
  const fim = paraData(periodo.fim);
  const ano = inicio.getUTCFullYear();

  switch (periodo.tipo) {
    case 'dia':
      return `${diaEMes(periodo.inicio)} de ${ano}`;
    case 'semana':
      // Mesmo mês: "1 – 7 de julho". Meses diferentes: "29 de junho – 5 de julho".
      if (inicio.getUTCMonth() === fim.getUTCMonth()) {
        return `${inicio.getUTCDate()} – ${diaEMes(periodo.fim)}`;
      }
      return `${diaEMes(periodo.inicio)} – ${diaEMes(periodo.fim)}`;
    case 'mes':
      return `${MESES[inicio.getUTCMonth()]} de ${ano}`;
    case 'ano':
      return `1º de janeiro – 31 de dezembro de ${ano}`;
  }
}
