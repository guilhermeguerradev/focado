# PRD — Focado

**Versão:** 1.2 (cadastro e login definidos; v1.1: stack confirmada + regras de fuso, offline e cálculo no servidor)
**Objetivo deste documento:** servir como fonte única de verdade sobre o produto para orientar desenvolvimento, modelagem de dados e criação de endpoints em etapas futuras. Este documento descreve o **quê** e o **porquê**; modelagem técnica detalhada (schemas, endpoints, contratos de API) fica para uma etapa posterior.

---

## 1. Visão Geral

**Focado** é um aplicativo mobile para estudantes que combina três mecânicas já validadas em outros apps:

- **Forest** → cronometragem de tempo focado, sessões de estudo.
- **Anki** → flashcards com repetição espaçada.
- **Duolingo** → gamificação (ofensiva/streak, ranking social).

O produto resolve três dores do estudante: (1) medir e visualizar quanto tempo realmente estuda por matéria, (2) memorizar conteúdo de forma eficiente via revisão espaçada, e (3) manter consistência através de competição social saudável e recompensas por hábito.

### 1.1 Público-alvo
Estudantes de qualquer nível (ensino médio, vestibular, concursos, faculdade, idiomas, certificações). O app é agnóstico de área de estudo — o usuário define suas próprias matérias.

### 1.2 Stack (confirmada)
- **Frontend:** React Native com **Expo**, em **TypeScript**.
- **Persistência local:** `AsyncStorage` (sessão em andamento e fila de envio offline — ver 3.3 e 3.6).
- **Backend/DB:** Supabase — Postgres + Auth + Row Level Security (RLS) + Realtime.
- **Lógica no servidor:** funções SQL / Edge Functions do Supabase para cálculos que não podem ser confiados ao celular (ofensiva, ranking — ver 11).
- **Presença online:** Supabase Realtime Presence (para status "online" e "o que está estudando agora" na aba Amigos).
- **Pagamento:** IAP nativo (Apple In-App Purchase / Google Play Billing) gerenciado via **RevenueCat** (validação de recibos, renovação, cancelamento). O dinheiro continua passando pela Apple/Google. Plano gratuito da RevenueCat até um certo faturamento mensal; reavaliar se o app crescer. **Implementação do pagamento fica para a última etapa do desenvolvimento.**
- **Algoritmo de repetição espaçada:** FSRS (Free Spaced Repetition Scheduler), usando a biblioteca pronta **`ts-fsrs`** — o algoritmo não deve ser reimplementado do zero.

### 1.3 Fuso horário (regra global)
- Cada usuário tem um **fuso horário** salvo no perfil, no formato IANA (ex.: `America/Sao_Paulo`, `America/Manaus`, `Europe/Lisbon`).
- O fuso é detectado automaticamente pelo dispositivo no cadastro e atualizado se mudar (ex.: viagem); pode ser ajustado em Configurações.
- Usa-se o fuso, e não apenas o país, porque um mesmo país pode ter vários fusos (o Brasil tem 4).
- **O banco grava todos os horários em UTC.** O fuso do usuário é aplicado apenas para decidir "que dia/semana/mês/ano é" para aquele usuário (estatísticas, ofensiva, ranking).

### 1.4 Cadastro e login
- Cadastro com **nome, e-mail e senha**. Senha com **no mínimo 8 caracteres** (validada também no servidor).
- **Sem confirmação de e-mail** no v1: após o cadastro o usuário já entra no app (ver seção 9).
- Os demais dados do perfil começam com valores iniciais: meta diária de 30 min, fuso detectado pelo celular, avatar escolhido depois.
- Após o primeiro login, ao chegar na tela inicial, um **pop-up pergunta a meta diária** do usuário:
  - Opções: **15, 30, 45, 60, 90 ou 120 minutos**.
  - Pode ser **pulado**: nesse caso fica o padrão de 30 min.
  - Aparece **uma única vez** (respondido ou pulado, não volta).
  - É a **primeira definição** da meta, não uma mudança: vale **já no dia do cadastro**. Mudanças posteriores (Configurações) seguem a regra de 7.3 (valem a partir do dia seguinte).
- **Entrar com Google** (e **Entrar com Apple**, exigido pela App Store quando há login social no iPhone): planejado para antes da publicação, quando o Supabase na nuvem existir. No v1 inicial, só e-mail e senha.

---

## 2. Navegação Principal

Menu inferior (bottom tab bar) com 5 abas:

1. **Estudar** (tela inicial/padrão)
2. **Estatísticas**
3. **Amigos**
4. **Baralho**
5. **Perfil**

---

## 3. Módulo: Estudar

### 3.1 Função principal
Cronômetro de tempo de estudo, associado obrigatoriamente a uma **Matéria**. Ao iniciar, cria-se uma **Sessão de Estudo**; ao encerrar, a sessão é persistida no banco.

### 3.2 Estados da sessão
- **Rodando** — cronômetro ativo.
- **Pausado** — cronômetro parado, mas sessão não finalizada (pode retomar).
- **Finalizado** — sessão salva no banco, imutável.

### 3.3 Persistência local resiliente (AsyncStorage)
Como o cronômetro **não pode perder progresso** em casos de app fechado, celular reiniciado/descarregado, etc., o estado da sessão em andamento é espelhado localmente:

```json
{
  "sessionId": "uuid-local",
  "materiaId": "uuid-materia",
  "status": "pausado",
  "horaInicio": "2026-07-22T14:32:00Z",
  "saldoAcumulado": 300
}
```

**Lógica de reconstrução do tempo decorrido:**
- Se `status = "rodando"`: tempo decorrido = `saldoAcumulado + (agora - horaInicio)`.
- Se `status = "pausado"`: tempo decorrido = `saldoAcumulado` (o relógio não avança).
- Ao pausar: `saldoAcumulado += (agora - horaInicio)`, e `horaInicio` é descartado/zerado até retomar.
- Ao retomar: `horaInicio = agora`, `saldoAcumulado` mantém o valor acumulado.
- Ao finalizar: duração total da sessão = `saldoAcumulado` (após consolidar o trecho em andamento), sessão é enviada ao Supabase e o registro local é limpo.

Esse mecanismo garante que o app consiga **recalcular** o tempo correto mesmo se tiver sido encerrado/kill pelo sistema operacional, bastando ler o último estado salvo ao reabrir.

### 3.4 Teto máximo de duração de sessão (regra de negócio)
Para evitar sessões "esquecidas" em background por dias distorcerem as estatísticas, existe um **teto máximo de duração de 12 horas** por sessão (valor mantido como configuração do sistema, para poder ser ajustado sem mudar código). Se o tempo decorrido calculado ultrapassar o teto:
- A sessão é **truncada** em 12h ao ser salva (não descartada por completo, para não perder o estudo real feito).
- O teto é validado **também no servidor**: uma sessão recebida com duração acima de 12h é gravada com 12h.

### 3.6 Finalizar sessão sem internet (fila offline)
Se o usuário finalizar uma sessão sem conexão:
- A sessão finalizada é gravada numa **fila local de envio** (`AsyncStorage`) e o cronômetro é liberado normalmente para uma nova sessão.
- Quando a conexão voltar (ou o app for reaberto com internet), o app envia as sessões pendentes da fila, na ordem em que foram finalizadas.
- Cada sessão tem um **identificador único gerado no celular** (`sessionId`); o servidor ignora uma sessão com `sessionId` já recebido, evitando duplicar tempo se o envio for repetido.
- Uma sessão só é removida da fila depois que o servidor confirmar o recebimento.
- Enquanto houver sessões pendentes, estatísticas locais podem mostrar o tempo dessas sessões, mas ranking e ofensiva oficiais só as consideram após chegarem ao servidor.
- A sessão é atribuída ao dia em que **começou** (no fuso do usuário), não ao dia em que foi enviada.

### 3.5 Matérias
- Usuário cria suas próprias matérias (nome + cor).
- Cor da matéria é usada de forma consistente em toda a UI (gráficos, listas, etc.).
- Free: máximo 4 matérias (ver seção 8 — Planos).

---

## 4. Módulo: Estatísticas

### 4.1 Períodos de análise
Quatro visões, todas navegáveis entre períodos anteriores (não só o período atual):

- **Diário** — navega entre dias.
- **Semanal** — navega entre semanas.
- **Mensal** — navega entre meses.
- **Anual** — navega entre anos.

### 4.2 Regra de corte de período ("dia 1")
- **Semana:** começa **domingo**. Domingo = "dia 1" da semana. Ao virar domingo, o acumulado da semana zera e uma nova semana se inicia — o corte **não** é uma janela móvel de 7 dias.
- **Mês:** mesma lógica — inicia sempre no dia 1 do mês civil, o acumulado zera na virada do mês.
- **Ano:** mesma lógica — inicia em 1º de janeiro, acumulado zera na virada do ano.

Ou seja, todos os períodos são **calendário fixo**, não janelas deslizantes.

- **Fuso:** os cortes acontecem à meia-noite **no fuso do próprio usuário** (ver 1.3). Ex.: para um usuário em `America/Sao_Paulo`, a semana começa no domingo 00:00 de Brasília.
- **Sessão que atravessa a meia-noite:** a sessão inteira conta para o dia em que começou (regra simples para o MVP).

### 4.3 Métricas exibidas por período
- Matéria mais estudada.
- Tempo total de estudo.
- Total de sessões.
- Tempo médio por sessão.

### 4.4 Visualizações
- **Gráfico de colunas/barras**: tempo de estudo por matéria, cada matéria com sua cor definida.
- **Gráfico de setores (pizza)**: distribuição percentual do tempo total entre matérias.
- **Mini feedback comparativo**: comparação do período atual vs. período anterior equivalente (ex.: essa semana vs. semana passada), com mensagem motivacional dinâmica (estudou mais → parabenização; estudou menos → incentivo).

---

## 5. Módulo: Amigos

### 5.1 Sistema de amizade
- Adição de amigo via **link de convite ou QR Code**, com **validade de 5 minutos**.
- **Sem necessidade de aceite/notificação**: quem gera o link decide a quem enviar; quem abre o link (ou escaneia o QR) dentro da janela de validade já se torna amigo automaticamente. Não há fluxo de "solicitação pendente".
- Após expirar os 5 minutos, o link/QR deixa de ser válido e um novo precisa ser gerado.
- Free: máximo 20 amigos (ver seção 8).

### 5.2 Ranking semanal
- Lista todos os amigos ordenados por **horas estudadas na semana corrente** (mesma regra de "semana começa domingo" da seção 4.2).
- Os 3 primeiros colocados aparecem em formato de **pódio**.
- Ranking reseta junto com a virada da semana.
- **Cálculo no servidor:** as horas da semana de cada usuário são somadas no servidor a partir das sessões gravadas no banco — nunca a partir de um total enviado pelo celular. Isso impede trapaça (ex.: mudar a hora do aparelho).
- **Amigos em fusos diferentes:** as horas de cada amigo são contadas na semana do fuso dele. O ranking compara esses totais.

### 5.3 Presença em tempo real (Supabase Presence)
Para cada amigo, exibir:
- Status **online/offline** em tempo real.
- **O que está estudando agora** (matéria da sessão ativa), quando online e com uma sessão em andamento.

---

## 6. Módulo: Baralho (Flashcards)

### 6.1 Conceito
Funciona como o Anki, mas com UI mais amigável. O usuário cria seus próprios **baralhos** e **flashcards** dentro deles.

### 6.2 Algoritmo de repetição espaçada
**FSRS (Free Spaced Repetition Scheduler)** é o algoritmo de referência para agendamento de revisões — mais moderno que o SM-2 clássico, com melhor previsão de retenção por card.

### 6.3 Estados do flashcard
- **Novo**
- **Aprendendo**
- **Revisar**

(Esses três estados de UI devem mapear para os estados internos do FSRS — ex.: New/Learning/Review/Relearning — simplificação a ser definida na modelagem técnica.)

### 6.4 Relação com Matérias
- Cada baralho pode (opcionalmente) estar associado a uma matéria.
- Baralho sem matéria associada é permitido (ex.: baralhos genéricos).

### 6.5 Limites do plano Free
Máximo 3 baralhos e 50 flashcards no total (ver seção 8).

---

## 7. Módulo: Perfil

### 7.1 Foto de perfil
- Usuário escolhe entre **avatares pré-definidos pelo app** (estilo Netflix) — **não é permitido upload de foto própria**.

### 7.2 Informações exibidas
- Número total de amigos.
- Número de matérias cadastradas.
- **Ofensiva (streak/"foguinho")** — número de dias consecutivos em que a meta diária de estudo foi atingida.

### 7.3 Ofensiva (streak)
- É incrementada **apenas** quando o usuário atinge a **meta diária de estudo** configurada.
- Meta diária é **editável em Configurações**, com valor padrão de **30 minutos**.
- O "dia" é definido pelo fuso do usuário (ver 1.3).
- Se o dia passar sem atingir a meta, a ofensiva reseta (comportamento padrão estilo Duolingo — a confirmar se haverá "congelamento"/proteção de ofensiva no futuro).
- **Cálculo no servidor:** a ofensiva é calculada pelo servidor com base nas sessões gravadas no banco. O celular apenas exibe o valor recebido.
- Mudança de meta vale a partir do dia seguinte; dias anteriores mantêm a meta que estava valendo.

### 7.4 Configurações
- Meta diária de estudo.
- Fuso horário (detectado automaticamente, ajustável).
- Gerenciamento de assinatura/plano.
- Conta (logout, exclusão de conta, etc.).
- (Notificações push: fora do escopo do MVP — ver seção 9.)

---

## 8. Planos e Monetização

### 8.1 Modelo
Freemium com upgrade via **assinatura mensal**, processada via **IAP nativo** (Apple/Google) e gerenciada pela **RevenueCat**. O status do plano do usuário (Free/Premium) é sincronizado com o Supabase, e os limites do plano são validados **no servidor**.

### 8.2 Limites do plano Free
| Recurso | Limite Free |
|---|---|
| Baralhos | até 3 |
| Flashcards (total) | até 50 |
| Matérias | até 4 |
| Amigos | até 20 |

Plano **Premium**: sem esses limites (valores exatos de "ilimitado" ou novos tetos maiores a definir).

### 8.3 Comportamento no downgrade (Premium → Free)
Se o usuário está acima dos limites do Free ao perder o Premium (ex.: tinha 10 baralhos):
- **Leitura permanece liberada** para todo o conteúdo existente (baralhos, flashcards, matérias, amigos acima do limite continuam visíveis e utilizáveis para estudo/revisão).
- **Criação de novos itens é bloqueada** enquanto o total estiver acima do limite do plano Free, em qualquer uma das categorias (baralhos, flashcards, matérias, amigos).
- Não há exclusão automática de dados excedentes.

---

## 9. Fora de Escopo (v1) / Roadmap Futuro

- **Notificações push** (lembrete de estudo, ofensiva quebrando, amigo ultrapassou no ranking) — adiado para versão futura. O app deve ser desenhado de forma a não depender delas para nenhuma funcionalidade core do MVP.
- Proteção/congelamento de ofensiva (streak freeze).
- Upload de foto de perfil própria.
- Métodos de pagamento fora das lojas (ex.: Stripe, pagamento via site) — hoje restrito a IAP nativo via RevenueCat.
- Divisão de sessões que atravessam a meia-noite entre dois dias.
- **Modo Pomodoro** (aparece no design da tela Estudar) — regras a definir. No v1, a tela Estudar tem apenas o cronômetro.
- **Sistema de nível** (ex.: "Nível 7 · Panda Focado", aparece no design do Perfil) — regras a definir. No v1, o Perfil não exibe nível.
- **Confirmação de e-mail no cadastro** (link enviado por e-mail antes do primeiro acesso) — adiado; no v1 o usuário entra direto após o cadastro.

---

## 10. Entidades Conceituais (alto nível, não é modelagem final)

Apenas para dar contexto — o schema detalhado fica para a etapa de modelagem:

- **Usuário** (perfil, avatar, meta diária, fuso horário, ofensiva atual, plano)
- **Matéria** (nome, cor, dono)
- **SessãoDeEstudo** (matéria, início, duração, status, dono)
- **Baralho** (nome, matéria opcional, dono)
- **Flashcard** (baralho, frente/verso, estado FSRS, parâmetros de agendamento)
- **Amizade** (usuário A, usuário B, criada via convite)
- **ConviteAmizade** (token, criador, expiração de 5 min)
- **Assinatura** (usuário, plano, status, origem IAP)

---

## 11. Regras de Negócio Transversais (resumo)

1. Semana, mês e ano usam **calendário fixo** (não janela móvel), sempre reiniciando em domingo / dia 1 / 1º de janeiro respectivamente, **no fuso horário do usuário**.
2. Todos os horários são gravados em **UTC**; o fuso do usuário (IANA) só é usado para definir dias e períodos.
3. Sessão de estudo sobrevive a fechamento de app via espelhamento em `AsyncStorage`; cronômetro nunca "perde" tempo, mas tem **teto máximo de 12h** por sessão, validado também no servidor.
4. Sessões finalizadas sem internet vão para uma **fila offline** e são enviadas depois, sem duplicar (identificador único por sessão).
5. Ofensiva só soma ao bater a meta diária configurada pelo usuário (padrão: 30 min).
6. **O servidor é a fonte da verdade** para ofensiva, ranking e limites de plano: são calculados/validados a partir dos dados do banco, nunca de totais enviados pelo celular.
7. Amizade é unilateral-simplificada: sem aceite, baseada em posse do link/QR válido por 5 minutos.
8. Downgrade de plano bloqueia criação, nunca leitura, de itens excedentes.
9. Cores de matéria são a identidade visual usada consistentemente em gráficos e listas.

---

## 12. Histórico de versões

- **1.2** — Cadastro e login (1.4): nome + e-mail + senha (mín. 8), sem confirmação de e-mail no v1 (movida para a seção 9), pop-up de meta diária após o primeiro login (opções, pode pular, vale no mesmo dia), login com Google/Apple planejado para antes da publicação.
- **1.1** — Stack confirmada (Expo + TypeScript, Supabase, RevenueCat, `ts-fsrs`); regra de fuso horário por usuário (1.3); fila offline para sessões (3.6); teto de sessão fixado em 12h; meta diária padrão de 30 min; ofensiva, ranking e limites calculados no servidor; Pomodoro e sistema de nível movidos para fora do v1.
- **1.0** — Rascunho inicial.

---


*Este documento é a base conceitual do produto. As próximas etapas (modelagem de banco de dados, definição de endpoints/API, contratos de tela) devem referenciar este PRD como fonte de verdade.*