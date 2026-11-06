import * as Notifications from 'expo-notifications';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

// Notificações LOCAIS do cronômetro (PRD 3.4.1): o próprio celular agenda,
// sem servidor. Avisam quando o app sai da tela com o cronômetro rodando.

const CANAL = 'cronometro';
const ID_AVISO_SAIDA = 'focado-cronometro-saiu';
const ID_LEMBRETE_FINAL = 'focado-cronometro-faltam-5-min';
const MINUTOS_ANTES_DO_FIM = 5;

// Diagnóstico: aparece SÓ no terminal do Expo, em desenvolvimento.
// Falhar ao notificar não pode travar o cronômetro, mas também não pode
// sumir em silêncio — senão fica impossível descobrir o problema.
function registrar(mensagem: string, detalhe?: unknown) {
  if (__DEV__) console.log(`[notificações] ${mensagem}`, detalhe ?? '');
}

// Android exige um "canal" para notificações; e o usuário precisa permitir.
// Devolve true se as notificações estão permitidas.
export async function prepararNotificacoes(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CANAL, {
        name: 'Cronômetro',
        importance: AndroidImportance.HIGH,
      });
    }
    const atual = await Notifications.getPermissionsAsync();
    registrar('permissão atual', { status: atual.status, podePerguntar: atual.canAskAgain });
    if (atual.granted) return true;

    const pedido = await Notifications.requestPermissionsAsync();
    registrar('resposta ao pedido de permissão', { status: pedido.status });
    return pedido.granted;
  } catch (erro) {
    registrar('ERRO ao preparar', erro);
    return false; // sem notificação, a regra de 1h continua valendo
  }
}

// App saiu da tela com o cronômetro rodando: avisa agora e agenda o lembrete
// para 5 minutos antes do prazo acabar.
export async function agendarAvisosDeSaida(saiuEm: Date, prazoSegundos: number): Promise<void> {
  try {
    const permissao = await Notifications.getPermissionsAsync();
    if (!permissao.granted) {
      registrar('saiu do app, mas SEM permissão: nada agendado', { status: permissao.status });
      return;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: ID_AVISO_SAIDA,
      content: {
        title: 'Seu cronômetro continua rodando ⏱️',
        body: 'Volte em até 1h ou ele será pausado.',
      },
      trigger: { channelId: CANAL }, // "agora"
    });

    const lembreteEm = saiuEm.getTime() + (prazoSegundos - MINUTOS_ANTES_DO_FIM * 60) * 1000;
    await Notifications.scheduleNotificationAsync({
      identifier: ID_LEMBRETE_FINAL,
      content: {
        title: `Faltam ${MINUTOS_ANTES_DO_FIM} minutos ⏳`,
        body: 'Volte ao Focado ou seu cronômetro será pausado.',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: lembreteEm,
        channelId: CANAL,
      },
    });
    registrar('avisos agendados', { lembreteEm: new Date(lembreteEm).toISOString() });
  } catch (erro) {
    registrar('ERRO ao agendar avisos', erro);
  }
}

// Voltou ao app (ou pausou/finalizou): cancela o lembrete agendado e
// some com o aviso que estiver na barra de notificações.
export async function cancelarAvisosDeSaida(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_LEMBRETE_FINAL);
    await Notifications.dismissNotificationAsync(ID_AVISO_SAIDA);
    await Notifications.dismissNotificationAsync(ID_LEMBRETE_FINAL);
  } catch (erro) {
    registrar('ERRO ao cancelar avisos', erro);
  }
}
