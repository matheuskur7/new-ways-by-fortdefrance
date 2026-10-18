# Auditoria de entidades

`User`, `Organization`, `Member`, `Invitation`, `Customer`, `Image`,
`CardFeeGroup` e `CardFee` possuem `createdAt`, `updatedAt`, `createdBy` e
`updatedBy`. O schema separa a auditoria dos demais campos por uma linha em branco.
As referências de autoria são usuários do Better Auth, com exclusão restrita.

## Preenchimento automático

O middleware de auditoria é instalado antes dos handlers do Better Auth e do
Nest. Valida a sessão no servidor e isola o ID do
usuário com `AsyncLocalStorage`. Autor informado no corpo ou em headers não é
usado. A sessão validada é reutilizada pelo guard dentro da mesma requisição,
sem compartilhar sessões entre requisições. A extensão do Prisma grava criador e editor na criação, preserva o criador
e a data original nas alterações e atualiza editor e data de alteração.
O contexto inclui callbacks de autenticação por GET; requisições OPTIONS ficam
sem ator e continuam sem acesso à lógica de escrita.

O middleware não concede acesso: Better Auth e o guard continuam responsáveis
pela autorização e origem confiável. A extensão sobrescreve IDs de autoria e
bloqueia relações `creator`/`updater` e seus vínculos inversos fornecidos na escrita. O cadastro de clientes
continua restrito à empresa ativa e exige usuário identificado.

Operações em lote, upserts e gravações aninhadas também recebem auditoria. As
relações percorridas estão declaradas na extensão; ao adicionar modelos ou
relações graváveis, atualize esse mapeamento e os testes. Upserts sem alterações
preservam os dados existentes, inclusive autoria e timestamps.
Alterações de vínculo por `connect`/`disconnect`/`set` em relações inversas
(por exemplo, `Organization.members`) são rejeitadas: atualize o registro filho
diretamente para registrar seu editor. Conexões em chaves do próprio registro,
como `Member.organization`, continuam permitidas.

## Operações sem sessão e registros antigos

Os campos `createdBy` e `updatedBy` são opcionais em todas as entidades auditadas para representar registros antigos e ações
automáticas sem pessoa identificada. Não há backfill presumido de autoria.
Novos timestamps adicionados a tabelas existentes recebem o momento da migração;
eles não reconstituem datas históricas que não eram armazenadas.

No autocadastro do usuário, a identidade gerada pelo servidor é usada como
criador/editor do próprio registro. Seeds e tarefas automáticas sem sessão ficam
com autor nulo; não se atribuem alterações a um administrador arbitrário.
Uma tarefa administrativa que conheça o ator pode executar sua escrita dentro de
`runWithAuditActor(userId, async () => ...)`, somente no backend.

Sessões, contas com credenciais e verificações ficam fora dessa auditoria: já
possuem o vínculo/timestamps de autenticação e têm ciclo de vida próprio.
O mecanismo registra criação e última alteração, não um histórico de versões ou
de exclusões. SQL direto e clientes Prisma independentes não passam pela extensão.

## Migração

`20261014010000_add_entity_audit` adiciona campos, índices e referências às
entidades existentes. `20261014020000_make_customer_audit_optional` torna os
autores de clientes opcionais, preservando os valores existentes. Nenhuma dessas
migrações foi aplicada automaticamente ao banco.
