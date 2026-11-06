# CLAUDE.md — Regulamento do projeto Focado

Este arquivo é lido em toda sessão. Siga estas regras sempre. Se uma regra aqui conflitar com um pedido, **avise antes de agir**.

## 1. Contexto

- **Focado** é um app mobile de estudos: cronômetro por matéria, estatísticas, flashcards com repetição espaçada e ranking entre amigos.
- **O quê construir:** `docs/prd-focado.md` é a fonte da verdade do produto. Leia a seção relevante antes de implementar qualquer funcionalidade. Se o PRD não responder uma dúvida, **pergunte** — não invente regra de negócio.
- **Em que etapa estamos:** `docs/PLANO.md`. Trabalhe só na etapa atual. Ao concluir um item, marque `[x]`.
- **Como deve parecer:** `docs/design/` tem as telas de referência. Siga cores, espaçamentos e componentes de lá.

## 2. Quem está programando (modo aprendizado)

O dono do projeto **está aprendendo a programar**. Ele não aceita código que não entende. Por isso:

1. **Antes de codar**, diga em linguagem simples: o que vai fazer, quais arquivos vai criar/alterar e por quê. Espere o "ok" em mudanças grandes.
2. **Depois de codar**, explique o que foi feito como para um iniciante, com uma analogia do dia a dia quando ajudar. Destaque o conceito novo que apareceu (ex.: "isso aqui é uma transação").
3. Quando ele perguntar "explique essa parte como se eu fosse iniciante", explique sem jargão, com exemplo concreto, e só então avance.
4. Prefira código **simples e legível** a código "esperto". Nomes claros, funções curtas.
5. Ao final de cada etapa, liste de 3 a 5 conceitos que valem revisar para entrevistas.

## 3. Stack

- **App:** React Native + Expo, **TypeScript** em modo `strict`. Navegação com Expo Router.
- **Backend:** Supabase (Postgres, Auth, RLS, Realtime Presence, Edge Functions).
- **Local:** AsyncStorage (sessão em andamento + fila offline).
- **Flashcards:** biblioteca `ts-fsrs`. **Nunca** reimplemente o algoritmo FSRS.
- **Pagamento:** RevenueCat (somente na etapa de pagamento).
- **Testes:** Vitest. Supabase local (Docker) para testes de integração.
- Não adicione bibliotecas novas sem explicar o motivo e pedir ok.

## 4. Estrutura de pastas (separação de responsabilidades)

Cada coisa na sua gaveta:

```
app/                 → TELAS (Expo Router). Só mostram dados e chamam hooks/serviços. Sem regra de negócio.
src/components/      → peças visuais reutilizáveis (botão, card, gráfico).
src/domain/          → REGRAS DE NEGÓCIO puras (cálculo do cronômetro, cortes de período, limites).
                       Sem React, sem Supabase, sem AsyncStorage. Só funções que recebem dados e devolvem dados.
src/services/        → quem CONVERSA COM O MUNDO DE FORA: Supabase, AsyncStorage, RevenueCat.
src/hooks/           → cola entre telas e serviços.
src/theme/           → cores, fontes, espaçamentos (incluindo cores das matérias).
supabase/migrations/ → tabelas, RLS, funções SQL. Toda mudança no banco é uma migration nova.
supabase/functions/  → Edge Functions.
tests/integration/   → testes de integração contra o Supabase local.
```

Regras:
- Arquivo passou de ~200 linhas ou mistura duas gavetas → proponha dividir.
- Refatoração **não muda comportamento**. Antes de refatorar, garanta testes que registram como funciona hoje. Faça em passos pequenos.

## 5. Segurança — nunca confie no cliente

O app roda no celular do usuário, e **o usuário controla o celular**. Ele pode alterar o app, mudar a hora do aparelho ou chamar a API do Supabase direto com a chave pública. Validação no app serve para a experiência ficar boa; **quem decide é o servidor**.

1. **RLS ligado em TODAS as tabelas**, sem exceção, desde a criação. Tabela nova sem política de RLS = tarefa incompleta.
2. Cada usuário só lê/escreve os próprios dados. Dados de amigos só via funções/visões que expõem o mínimo necessário (nome, avatar, horas da semana, status).
3. **O servidor recalcula; nunca aceita totais vindos do app.** Vale para: duração de sessão (teto de 12h), ofensiva, ranking, limites do plano Free, status Premium.
4. Operações com regra de negócio (finalizar sessão, criar matéria/baralho/card com limite, aceitar convite) passam por **funções no servidor** (função SQL/RPC ou Edge Function), não por insert direto do app.
5. Status de assinatura vem da RevenueCat para o servidor (webhook validado), **nunca** do app.
6. **Segredos:** a chave `service_role` do Supabase e chaves da RevenueCat **nunca** vão para o app nem para o Git. Use `.env` (no `.gitignore`). Só a chave `anon` pode ficar no app.
7. Horários sempre gravados em UTC; o servidor usa `now()` dele, não a hora enviada pelo celular, para decisões (ex.: validade do convite).

## 6. Idempotência e race conditions

**Idempotência:** repetir a mesma operação várias vezes dá o mesmo resultado que fazer uma vez.
- Toda sessão de estudo tem um `sessionId` (UUID) gerado no celular. O banco tem `UNIQUE` nele; reenvio da mesma sessão é ignorado, não duplica tempo.
- Envio da fila offline pode repetir à vontade sem efeito colateral.
- Webhooks da RevenueCat podem chegar repetidos: processar pelo ID do evento, uma vez só.

**Race condition:** duas operações ao mesmo tempo atrapalhando uma à outra.
- Limites (4 matérias, 3 baralhos, 50 cards, 20 amigos): checar e inserir **na mesma transação no banco**, com trava (`SELECT ... FOR UPDATE` ou equivalente). Nunca "conta no app, depois insere".
- Convite de amizade: uso do token e criação da amizade na mesma transação. Amizade duplicada barrada por `UNIQUE` no par de usuários.
- Prefira **constraints do banco** (`UNIQUE`, `CHECK`, `FOREIGN KEY`) como última linha de defesa — elas valem mesmo quando o código erra.

## 7. Testes

**Prioridade: testes de integração.** Eles chamam a função/rota de verdade, com um banco de teste de verdade (Supabase local), e só fingem o que é de fora (webhook da RevenueCat, e-mail).

- **Não** escreva testes que mockam tudo e passam sem testar nada. Não mocke o Supabase em teste de integração.
- Testes unitários são bem-vindos **só** para `src/domain/` (funções puras, sem mock): cálculo do cronômetro, cortes de semana/mês/ano por fuso, teto de 12h.
- E2E (Playwright/Maestro) fica fora por enquanto.
- Todo recurso de segurança tem teste provando que **o ataque falha**. Ex.: usuário B não lê matérias do usuário A; 5ª matéria no Free é recusada; sessão de 20h é gravada como 12h; mesma sessão enviada 2× conta uma vez.
- A frase do comportamento vem antes do teste:

```ts
describe('finalizar sessão', () => {
  it('ignora a segunda chamada com o mesmo sessionId (idempotência)', async () => {
    await finalizarSessao(usuarioA, { sessionId, duracaoSegundos: 1500 })
    await finalizarSessao(usuarioA, { sessionId, duracaoSegundos: 1500 })

    const total = await tempoDoDia(usuarioA)
    expect(total).toBe(1500)
  })

  it('grava no máximo 12h mesmo se o app mandar mais', async () => { /* ... */ })
})
```

- Uma funcionalidade só está pronta quando: os testes passam, `npm run lint` e `npm run typecheck` passam, e ela foi testada no celular/emulador.
- **Nunca diga que testou sem ter rodado.** Mostre o resultado do comando.

## 8. Fluxo de trabalho

1. Uma tarefa por vez, da etapa atual do `PLANO.md`.
2. Plano curto → ok → código → testes → explicação → commit.
3. Se travar no mesmo erro 3 vezes, pare e explique o problema em vez de tentar a 4ª variação.
4. Não altere arquivos fora do escopo da tarefa sem avisar.

## 9. Git

- Commits pequenos, um por passo que funciona. Mensagens em português, no formato `tipo: descrição` (ex.: `feat: cria tabela de matérias com RLS`, `fix: corrige corte de semana no fuso do usuário`, `test: ...`, `refactor: ...`, `docs: ...`).
- **Não adicione nenhuma assinatura ou atribuição de IA** em commits ou PRs: sem `Co-Authored-By`, sem "Generated with...", sem links de sessão.
- Nunca faça commit de `.env` ou chaves.

## 10. Idioma

- Converse e explique em **português**.
- Código (variáveis, funções, tabelas) em **português sem acento**, consistente com o PRD (ex.: `materia`, `sessao_estudo`, `baralho`). Termos técnicos consagrados podem ficar em inglês (`status`, `token`).
