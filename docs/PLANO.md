# PLANO — Focado

O cronograma da obra. Uma etapa por vez, na ordem. Cada etapa termina com algo **funcionando e testado**.
Marque `[x]` ao concluir cada item. A etapa só fecha quando o "Pronto quando" for verdade.

**Etapa atual:** 5

---

## ⚠️ Decisões pendentes (pensar mais pra frente)

### Anti-fraude de sessões de estudo — "inventar sessões no passado"
*Anotado em 06/11/2026, ao fechar a Etapa 3. Decidir antes da Etapa 11 (ranking), no máximo.*

**O problema:** como as sessões podem começar **offline** (PRD 3.6), o servidor só fica sabendo de uma sessão quando ela é **finalizada**. Alguém que chame a API direto (com a chave pública) pode **inventar** uma sessão num horário passado livre — ex.: "ontem, das 20h às 22h" — e assim inflar o **ranking** ou "salvar" a **ofensiva**.

**Já resolvido na Etapa 4 (não depende desta decisão):** teto de 12h; duração nunca maior que o tempo real decorrido desde o início (relógio do servidor); proibido sessão no futuro; proibido duas sessões do mesmo usuário com horários sobrepostos (constraint no banco).

**Impossível de resolver em qualquer app:** deixar o cronômetro ligado sem estudar (o teto de 12h só limita o estrago).

**Opções levantadas:**
1. **Início verificado** — com internet, o play avisa o servidor, que anota o horário dele (sessão "verificada"). Iniciou offline: conta nas estatísticas e na ofensiva, mas **não no ranking**.
2. **Exigir internet para iniciar** — fecha a fraude em tudo, mas impede começar a estudar sem sinal.
3. **Offline total + prazo máximo de envio** — mais simples; a fraude continua possível dentro do prazo.

**Também decidir:** prazo máximo para uma sessão da fila offline chegar ao servidor (sugestões: 3, 7 ou 30 dias).

### Cronômetro com relógio do celular voltado para trás
*Anotado em 06/11/2026, ao validar a refatoração do useCronometro.*

Hoje, se o relógio do celular voltar para trás com a sessão rodando (ex.: iniciou com o relógio adiantado e depois corrigiu), o trecho atual conta 0 e o cronômetro fica **travado em 00:00** até o relógio "alcançar" o horário de início — a proteção funciona, mas parece que o tempo sumiu. **Proposta:** ao detectar isso, recomeçar o trecho atual a partir de "agora" (mantém o tempo acumulado, não dá tempo extra a ninguém). Muda regra do cronômetro: precisa de ok, teste novo e registro no PRD.

---

## Marco 1 — App pessoal funcionando (só você, sem amigos e sem pagamento)

### Etapa 0 — Preparar a obra
- [x] Instalar ferramentas: Node.js (LTS), Git, Docker Desktop, Supabase CLI, app Expo Go no celular
- [ ] Criar conta no GitHub e no Supabase
- [x] Criar o projeto Expo com TypeScript (`strict`) e Expo Router
- [x] Criar a estrutura de pastas do `CLAUDE.md` e mover `prd-focado.md`, `PLANO.md` e o design para `docs/`
- [x] Configurar ESLint, Prettier e os scripts `lint`, `typecheck`, `test`
- [x] Configurar Vitest com um teste de exemplo passando
- [x] Subir o Supabase local (`supabase start`) e conectar o app a ele
- [x] `.env` + `.gitignore` corretos (nenhuma chave no Git)
- [x] Repositório no GitHub + primeiro commit
- [x] GitHub Actions rodando `lint`, `typecheck` e `test` a cada push

**Pronto quando:** o app abre no celular com uma tela "Olá, Focado", e o GitHub mostra o check verde.

### Etapa 1 — Login e perfil básico
- [x] Cadastro e login com e-mail e senha (Supabase Auth), senha mínima de 8 caracteres validada no servidor
- [x] Tabela `perfil` (nome, avatar, meta diária padrão 30 min, fuso IANA) criada automaticamente no cadastro
- [x] Fuso detectado pelo celular e salvo no perfil
- [x] RLS: cada um só lê/edita o próprio perfil
- [x] Teste de integração: usuário B **não** consegue ler nem editar o perfil do usuário A
- [x] Tab bar com as 5 abas (telas vazias por enquanto)
- [x] Pop-up de meta diária após o primeiro login (15/30/45/60/90/120 min, pode pular, aparece uma vez só — PRD 1.4), gravado por função no servidor
- Telas de login e cadastro: **simples**, com cores e fontes do design atual. Serão refeitas quando chegar o design final.

**Pronto quando:** você cria conta, sai, entra de novo e vê seu nome; o teste de RLS passa.

### Etapa 2 — Matérias
- [x] Tabela `materia` (nome, cor, dono) com RLS
- [x] Função no servidor para criar matéria com limite Free de 4 (checagem + inserção na mesma transação)
- [x] Telas: listar, criar, editar e excluir matéria, com seletor de cor
- [x] Testes de integração: 5ª matéria recusada; duas criações simultâneas não furam o limite; usuário B não vê matérias de A

**Pronto quando:** você cadastra suas matérias com cores e o limite funciona mesmo tentando burlar.

### Etapa 3 — Cronômetro (só no celular)
- [x] `src/domain/cronometro.ts`: estados rodando/pausado/finalizado, reconstrução do tempo, teto de 12h
- [x] Testes unitários do domínio (pausar, retomar, app fechado e reaberto, passar de 12h)
- [x] Espelhar o estado em AsyncStorage a cada mudança
- [x] Tela Estudar: escolher matéria, iniciar, pausar, retomar, finalizar (seguindo o design)
- Modo Pomodoro: **fora do v1** (ver PRD seção 9). Não implementar; a tela mostra só o cronômetro.
- Finalizar nesta etapa: **só mostra o resumo** ("Você estudou X de Y"); a sessão não é guardada. Gravar no servidor (com fila offline) é a Etapa 4.
- `sessionId` gerado no celular com `expo-crypto` (`randomUUID`).

**Pronto quando:** você inicia uma sessão, fecha o app à força, reabre e o tempo está certo.

### Etapa 4 — Salvar sessões no servidor
- [x] Tabela `sessao_estudo` com `session_id` UNIQUE e RLS
- [x] Função `finalizar_sessao` no servidor: idempotente, aplica teto de 12h, atribui ao dia de início no fuso do usuário
- [x] Prazo de 1h fora do app (PRD 3.4.1): notificação local ao sair e aos 55 min; voltou depois de 1h → sessão pausada contando até 1h fora. Regra no domínio do cronômetro, com testes.
- [x] Fila offline no AsyncStorage: guarda sessões finalizadas sem internet e envia depois; só remove após confirmação
- [x] Testes de integração: mesma sessão 2× conta 1×; sessão de 20h vira 12h; usuário não grava sessão em nome de outro
- [x] Defesas anti-fraude que não dependem da decisão pendente (ver topo do plano): duração ≤ tempo real decorrido, sem sessão no futuro, sem sessões sobrepostas — com testes de ataque

**Pronto quando:** você finaliza uma sessão em modo avião, liga a internet e ela aparece no banco uma vez só.

### Etapa 5 — Estatísticas
- [ ] `src/domain/periodos.ts`: cortes de dia/semana (domingo)/mês/ano no fuso do usuário + testes unitários (incluindo virada de semana e fusos diferentes)
- [ ] Função no servidor que devolve as métricas do período: total, sessões, média, matéria mais estudada, tempo por matéria
- [ ] Tela Estatísticas: abas Diário/Semanal/Mensal/Anual, navegação entre períodos, gráfico de barras e pizza com as cores das matérias
- [ ] Comparação com o período anterior + mensagem motivacional
- [ ] Testes de integração das métricas

**Pronto quando:** os números da tela batem com as sessões que você fez.

### Etapa 6 — Meta diária e ofensiva
- [ ] Meta diária editável (mudança vale a partir do dia seguinte)
- [ ] Ofensiva calculada no servidor a partir das sessões
- [ ] Barra "Tempo estudado hoje" e foguinho 🔥 na Home
- [ ] Testes de integração: bater a meta soma; dia sem meta zera; mudar a hora do celular não altera nada
- [ ] Segurança: **trocar o fuso** não pode ser usado para mexer na ofensiva (hoje, mudar o fuso muda em que "dia" as próximas sessões caem). Definir a regra (ex.: limite de trocas, ou ofensiva usa o fuso da época da sessão) + teste de ataque. *(Anotado na auditoria de 06/11/2026.)*

**Pronto quando:** a ofensiva sobe e zera corretamente nos testes.

### Etapa 7 — Perfil e configurações
- [ ] Avatares pré-definidos (pandas)
- [ ] Tela Perfil: avatar, nome, amigos, ofensiva, matérias com horas
- Nível ("Nível 7 · Panda Focado"): **fora do v1** (ver PRD seção 9). Não implementar.
- [ ] Configurações: meta diária, fuso, sair, **excluir conta** (as lojas exigem)

**Pronto quando:** você usa o app no dia a dia sozinho. 🎉 **Fim do Marco 1.**

---

## Marco 2 — Flashcards

### Etapa 8 — Baralhos e cartões
- [ ] Tabelas `baralho` (matéria opcional) e `flashcard` com RLS
- [ ] Funções de criação com limites Free (3 baralhos, 50 cards) em transação
- [ ] Telas: lista de baralhos (como no design), criar/editar baralho e cards
- [ ] Testes de integração de limites e RLS

### Etapa 9 — Revisão com FSRS
- [ ] Integrar `ts-fsrs` (sem reimplementar o algoritmo)
- [ ] Mapear estados FSRS → Novo / Aprendendo / Revisar
- [ ] Tela de revisão: frente, verso, botões de resposta; "Revisão de hoje" e "Revisar tudo"
- [ ] Testes: card respondido agenda a próxima revisão; resposta repetida não agenda duas vezes

**Pronto quando:** você revisa seus cards e eles voltam nos dias certos. 🎉 **Fim do Marco 2.**

---

## Marco 3 — Social

### Etapa 10 — Convite e amizade
- [ ] Tabelas `convite_amizade` (token, criador, expira em 5 min pelo relógio do servidor) e `amizade` (par UNIQUE)
- [ ] Gerar link e QR Code; abrir link/escanear QR cria a amizade
- [ ] Função de aceitar em transação: token válido, não expirado, limite de 20 amigos para os dois
- [ ] Testes de integração: token expirado recusado; dois usos simultâneos não duplicam; limite de 20 respeitado; não dá para ser amigo de si mesmo

### Etapa 11 — Ranking semanal
- [ ] Função no servidor: horas da semana de cada amigo (no fuso de cada um), a partir das sessões
- [ ] Tela Amigos: pódio top 3 + lista + card "Você está em Xº lugar"
- [ ] Testes: ranking ignora qualquer total enviado pelo app; usuário só vê dados mínimos dos amigos

### Etapa 12 — Presença em tempo real
- [ ] Realtime Presence: online/offline e "estudando X agora"
- [ ] Atualiza ao iniciar/pausar/finalizar sessão

**Pronto quando:** dois celulares se veem estudando em tempo real. 🎉 **Fim do Marco 3.**

---

## Marco 4 — Lançamento

### Etapa 13 — Pagamento
- [ ] Contas de desenvolvedor Apple/Google, produtos de assinatura nas lojas
- [ ] RevenueCat no app + webhook para o Supabase (validado e idempotente)
- [ ] Status Premium só vem do servidor; limites Free/Premium validados no servidor
- [ ] Regra de downgrade: leitura liberada, criação bloqueada acima do limite
- [ ] Testes de integração com webhook simulado (incluindo evento repetido)

### Etapa 14 — Publicação
- [ ] Criar o projeto no Supabase na nuvem e apontar o app para ele
- [ ] Login social: Entrar com Google + Entrar com Apple (exigido pela App Store quando há login social no iPhone) — PRD 1.4
- [ ] Revisão geral de segurança (todas as tabelas com RLS, nenhuma chave exposta)
- Pontos da auditoria de 06/11/2026 (nenhum é buraco aberto hoje, com banco local; resolver antes de publicar):
  - [ ] **Limite de chamadas (rate limit)** nas funções do servidor (`criar_materia`, `finalizar_sessao` etc.), contra abuso — risco médio
  - [ ] **Vulnerabilidades do `npm audit`** (5 moderadas, vindas de dependências do Expo): revisar e atualizar — risco baixo
  - [ ] **Crachá de login no AsyncStorage** sem criptografia (legível em celular rooteado): avaliar `expo-secure-store` — risco baixo
  - [ ] **Senhas vazadas**: ligar a proteção de senha vazada do Supabase na nuvem (hoje só exige 8 caracteres) — risco baixo
  - [ ] **GitHub Actions**: fixar as ações pela "impressão digital" (SHA) em vez da versão `@v5` — risco baixo
- [ ] **Testes E2E (Maestro)** dos fluxos principais (cadastro/login, cronômetro, fila offline, matérias): hoje serviços, hooks e telas só são verificados no teste manual no celular
- [ ] Ícone, splash, nome nas lojas, política de privacidade
- [ ] Build com EAS, teste fechado com amigos, envio às lojas

**Pronto quando:** o Focado está na loja. 🚀
