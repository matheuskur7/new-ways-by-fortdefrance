# Exclusão lógica de usuários

`DELETE /api/users/me` exige sessão, origem confiável e JSON com `password`
(senha atual). O usuário-alvo vem exclusivamente da sessão. A verificação usa o
Better Auth; sessão não recente pode exigir novo login.

`UserService.softDelete` grava `deletedAt` e remove todas as sessões na mesma
transação. O usuário, suas contas, memberships e referências de auditoria são
preservados. O e-mail continua único; não há reativação ou reutilização automática.
A extensão de auditoria registra o editor quando há contexto de sessão.

O `PrismaService` filtra usuários ativos nas leituras e alterações e filtra sessões
pelo usuário ativo, inclusive quando o Better Auth carrega usuários por join.
Login e recuperação por e-mail não encontram usuários excluídos. Cookies antigos
não concedem acesso, mesmo que uma sessão seja criada em uma corrida com a exclusão.
Não há cache de cookie nem armazenamento secundário de sessão configurado.

Exclusão física (`delete`/`deleteMany`) e `upsert` diretos de usuários são bloqueados.
Não use exclusões/reativações aninhadas nem SQL direto para contornar o serviço.
A extensão não filtra usuários em relações aninhadas de outros modelos; mantenha
referências históricas e filtre `deletedAt: null` explicitamente para listas de
pessoas ativas. Novas formas de autenticação/cache precisam preservar essa política.

A migration `20261014030000_add_user_soft_delete` adiciona uma coluna nullable.
Não foi aplicada automaticamente. Não há interface de exclusão de conta neste fluxo.
