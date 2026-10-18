# Backend NestJS

Projeto gerado pela CLI oficial do NestJS, em TypeScript ESM/NodeNext. Usa PostgreSQL com Drizzle, validação Zod nativa do NestJS (Standard Schema), Swagger, Scalar e Better Auth com o plugin Organization. O backend recebe apenas JSON: imagens são enviadas e lidas diretamente no S3.

## Iniciar

Requisitos: Node.js 22+, pnpm 12, PostgreSQL 18+ (UUIDv7 nativo) e um bucket S3 privado (ou serviço compatível com URLs assinadas; para Magalu Cloud, veja a configuração de PUT simples ao final).

Execute dentro de `backend-nestjs/`:

```sh
pnpm install
cp .env.example .env
# Configure DATABASE_URL, S3_REGION, S3_BUCKET, BETTER_AUTH_URL e BETTER_AUTH_SECRET.
# Confira o banco de destino antes de aplicar:
pnpm db:migrate
pnpm start:dev
```

O ambiente é validado com Zod no ConfigModule. O schema, os helpers de validação e a tipagem do ambiente ficam em um único arquivo, `src/shared/config/env.ts`. Campos numéricos e booleanos são convertidos e consumidos com ConfigService tipado. As credenciais usam S3_KEY_ID e S3_KEY_SECRET, quando ambas são informadas. Se ambas estiverem vazias, o SDK usa a cadeia padrão AWS (IAM role, perfil local ou variáveis `AWS_*`). FRONTEND_URL define a origem permitida pelo CORS da API. Variáveis opcionais vazias são normalizadas para undefined. BETTER_AUTH_URL e BETTER_AUTH_SECRET são obrigatórios; o segredo deve conter pelo menos 32 caracteres. Variáveis legadas de JWT continuam opcionais e não são utilizadas pela autenticação. As variáveis `INITIAL_USER_*` e `INITIAL_ORGANIZATION_*` são opcionais para iniciar a API e obrigatórias para executar o seed. O módulo de e-mail usa as variáveis SMTP existentes com Nodemailer. Não coloque credenciais no código.

Por padrão, a API usa `http://localhost:5000`:

- Scalar: `/docs`
- Swagger UI: `/swagger`
- OpenAPI JSON da API: `/openapi.json`
- Scalar do Better Auth: `/api/auth/reference`
- OpenAPI de autenticação/organizações: `/api/auth/open-api/generate-schema`

O Scalar em `/docs` permite selecionar as fontes API e Auth e organizações.

## Autenticação e organizações

Better Auth usa o adaptador Drizzle/PostgreSQL e sessões por cookie. O cadastro por e-mail e senha está habilitado. O plugin Organization fornece criação de organizações, organização ativa, membros, papéis e convites. São usados os papéis padrão `owner`, `admin` e `member`, com as permissões nativas do plugin. Qualquer usuário autenticado pode criar uma organização.

Sessões padrão duram 2 horas (`expiresIn: 7200`) e são renovadas a cada validação bem-sucedida (`updateAge: 0`), sem cache de sessão no cookie. A renovação atualiza somente a sessão consultada e envia `Set-Cookie`, inclusive nas rotas protegidas pelo `AuthGuard`. Consultas automáticas também renovam o prazo. Sessões expiradas exigem novo login. O modo nativo `rememberMe: false` continua sem renovação automática. Sessões emitidas antes dessa configuração podem manter o prazo antigo até a renovação nativa; faça novo login para aplicar imediatamente o prazo de 2 horas.

O handler nativo fica em `/api/auth/*` e é montado antes dos parsers do Nest em `setupHttp`. Novas inicializações da aplicação devem manter `bodyParser: false` e chamar essa função. CORS permite cookies da origem FRONTEND_URL; verificações de origem e CSRF permanecem habilitadas.

Principais rotas (corpos e contratos completos na documentação Better Auth):

| Método | Rota                                           | Uso                                      |
| ------ | ---------------------------------------------- | ---------------------------------------- |
| POST   | `/api/auth/sign-up/email`                      | Cadastro: name, email, password          |
| POST   | `/api/auth/sign-in/email`                      | Login: email, password                   |
| GET    | `/api/auth/get-session`                        | Sessão e usuário atuais                  |
| POST   | `/api/auth/sign-out`                           | Logout e revogação da sessão             |
| POST   | `/api/auth/organization/create`                | Criar: name, slug                        |
| GET    | `/api/auth/organization/list`                  | Listar organizações do usuário           |
| POST   | `/api/auth/organization/set-active`            | Selecionar: organizationId               |
| GET    | `/api/auth/organization/get-full-organization` | Organização e membros                    |
| POST   | `/api/auth/organization/invite-member`         | Convidar: email, role, organizationId    |
| POST   | `/api/auth/organization/accept-invitation`     | Aceitar: invitationId                    |
| POST   | `/api/auth/organization/remove-member`         | Remover: memberIdOrEmail, organizationId |

Exemplo de cliente (o frontend existente não foi alterado):

```ts
import { createAuthClient } from 'better-auth/client';
import { organizationClient } from 'better-auth/client/plugins';

const authClient = createAuthClient({
  baseURL: 'http://localhost:5000',
  plugins: [organizationClient()],
});

await authClient.signUp.email({
  name: 'Usuário',
  email: 'usuario@example.com',
  password: 'uma-senha-forte',
});
await authClient.organization.create({
  name: 'Minha empresa',
  slug: 'minha-empresa',
});
const { data: organizations } = await authClient.organization.list();
if (organizations?.[0]) {
  await authClient.organization.setActive({
    organizationId: organizations[0].id,
  });
}
```

Para chamadas diretas por fetch, use `credentials: 'include'` nas requisições ao backend. Não envie cookies da API ao S3. Em produção, use HTTPS e uma implantação compatível com os cookies SameSite padrão (por exemplo, frontend e backend no mesmo site).

Os fluxos do Better Auth ainda não estão conectados ao envio de e-mails de convite, verificação ou recuperação de senha. Convites são criados/aceitos pelo plugin usando invitationId; a distribuição desse identificador cabe ao cliente até integrar o envio de e-mail. JWT separado, login social, teams e seed de administrador não estão habilitados.

## E-mail com Nodemailer e SMTP

`EmailModule` em `src/shared/email/` exporta `EmailService` para uso interno por outros módulos. Importe EmailModule no módulo consumidor e injete EmailService. Não há endpoint HTTP de envio genérico.

Configure no `.env` (mesmos nomes usados pelo ambiente existente):

```dotenv
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=nao-responda@seu-dominio.com
SMTP_PASSWORD=sua-senha-smtp
SMTP_FROM="New Ways <nao-responda@seu-dominio.com>"
SMTP_REPLY_TO=suporte@seu-dominio.com
```

Na porta 465, use SMTP_SECURE=true para TLS direto. Na porta 587, use SMTP_SECURE=false: o transporte exige STARTTLS antes da autenticação. A validação de certificados permanece habilitada. Não há necessidade de chave de API de outro provedor.

SMTP_HOST, SMTP_USER, SMTP_PASSWORD e SMTP_FROM devem ser preenchidos juntos. SMTP_PORT e SMTP_SECURE usam 465 e true como padrão; SMTP_REPLY_TO é opcional. SMTP_FROM e SMTP_REPLY_TO aceitam endereço simples ou nome de exibição. Sem host e credenciais, a aplicação inicia, mas o envio retorna ServiceUnavailableException. Não há conexão SMTP nem envio durante a inicialização: o transporte conecta sob demanda.

Exemplo dentro de um serviço com EmailService injetado:

```ts
const { id } = await this.email.send({
  to: 'destinatario@example.com',
  subject: 'Bem-vindo',
  text: 'Sua conta foi criada.',
  html: '<p>Sua conta foi criada.</p>',
});
```

Informe text ou html (ou ambos). to, cc e bcc aceitam um endereço ou uma lista, limitados a 50 destinatários no total. replyTo pode sobrescrever o padrão para uma mensagem. O remetente sempre vem de SMTP_FROM. O módulo não oferece idempotência nem faz tentativas automáticas de reenvio.

O retorno id contém o Message-ID da mensagem aceita pelo servidor SMTP; ele não confirma a entrega na caixa de entrada. Se algum destinatário for rejeitado, o serviço retorna BadGatewayException, inclusive em aceitação parcial (os destinatários aceitos podem já ter recebido a mensagem). Falhas de transporte também retornam BadGatewayException, sem expor respostas SMTP, conteúdo, destinatários ou credenciais. O transporte é encerrado no desligamento da aplicação.

Os testes simulam o transporte e não enviam e-mails reais. Os fluxos de convite/verificação/recuperação do Better Auth ainda não estão ligados ao módulo.

Documentação: [Nodemailer SMTP](https://nodemailer.com/smtp).

## Imagens: fluxo direto para S3

As rotas atuais de fotos de perfil exigem sessão válida e usam exclusivamente o usuário autenticado como proprietário. Não exigem empresa ativa nem vínculo com uma empresa. Sessão ausente retorna 401; fotos de outro usuário retornam 404, inclusive quando ambos pertencem à mesma empresa. O usuário proprietário não é recebido no corpo.

1. Envie `POST /user-images/upload-url` com apenas:

```json
{
  "key": "user-image"
}
```

`key` define a pasta/prefixo da imagem no S3. Por enquanto, apenas `user-image` é válido. Esse valor é validado pelo DTO de `src/modules/user-images/`. Imagens de empresa permanecem no módulo `images`, com lista própria em `src/shared/storage/image-keys.ts`, ainda sem prefixos habilitados. IDs, nomes, tamanho, tipo e checksum não devem ser enviados nessa solicitação.

2. O backend insere o registro com status `pending`. O PostgreSQL gera o ID com `DEFAULT uuidv7()`. A coluna calculada do PostgreSQL gera a chave completa `user-image/<userId>/<uuidv7>` na tabela `user_images`. Usuário e chave completa são NOT NULL; não existe coluna de organização nessa tabela. Após o INSERT, a URL PUT é assinada para essa chave.

A resposta contém `id`, `key` (chave completa), `status: "pending"`, `url`, `method: "PUT"`, `headers` e `expiresIn`. Se a assinatura falhar, o registro continua pendente.

3. Envie os bytes diretamente à URL S3 com PUT, sem multipart, usando os headers retornados. Defina Content-Type com o tipo do arquivo. Com `S3_USE_CONDITIONAL_UPLOAD=true` (padrão), a URL exige `If-None-Match: *`, impedindo sobrescrever um objeto já enviado à mesma chave. Nesse modo, um upload repetido retorna 412; confirme pelo backend ou solicite uma nova URL/registro. Para Magalu Cloud, configure `false`: o contrato retorna headers sem a condição e usa uma chave exclusiva por upload.

```ts
const response = await fetch('http://localhost:5000/user-images/upload-url', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'user-image' }),
});
if (!response.ok) throw new Error('Falha ao solicitar upload');
const upload = await response.json();
const sent = await fetch(upload.url, {
  method: 'PUT',
  headers: {
    ...upload.headers,
    'Content-Type': file.type,
  },
  body: file,
});
if (!sent.ok) throw new Error('Falha no upload ao S3');
const complete = await fetch(`http://localhost:5000/user-images/${upload.id}/complete`, {
  method: 'POST',
  credentials: 'include',
});
if (!complete.ok) throw new Error('Falha na confirmação');
```

4. `POST /user-images/:id/complete` consulta apenas HeadObject no S3, valida o tipo declarado (JPEG, PNG, WebP ou GIF) e o tamanho e preenche esses metadados no banco. O limite padrão é 10 MiB, configurável por MAX_IMAGE_SIZE_BYTES (máximo 100 MiB). Arquivos vazios, tipos incompatíveis e arquivos acima do limite não são confirmados; continuam pendentes. A checagem ocorre depois do envio ao S3, não durante a assinatura. A confirmação é idempotente e muda o status para `ready`.
5. `GET /user-images/:id/download-url` retorna uma URL temporária GET para uma imagem pronta. O cliente lê os bytes diretamente do S3.

Para fotos de usuário, `GET /user-images/:id/download-url` usa o módulo independente `UserImagesModule`: consulta somente fotos do usuário autenticado, exige status `ready` e gera a URL de leitura com validade de 12 horas (`43200` segundos). A validade das demais imagens e dos uploads continua sendo `S3_URL_TTL_SECONDS`. Credenciais temporárias AWS podem encerrar a validade antes do prazo assinado. A propriedade da foto é verificada no banco em cada solicitação.

A página `/user-settings` atualiza nome e imagem pelo endpoint nativo `POST /api/auth/update-user`. O e-mail não é enviado. O envio da foto usa `POST /user-images/upload-url` com `{ "key": "user-image" }`, PUT direto ao S3 com os headers retornados e `POST /user-images/:id/complete` antes de vincular a foto por `POST /user-images/:id/attach`. No campo `image`, o servidor salva a URL estável `/user-images/:id` (absoluta), nunca uma URL pré-assinada. Essa rota solicita uma nova URL de leitura e redireciona o navegador diretamente ao S3, sem cache ou transporte de arquivos pelo servidor. Upload, confirmação, leitura, vínculo e remoção funcionam sem empresa selecionada e são filtrados pelo usuário autenticado.

O backend não inspeciona os bytes nem detecta o formato real da imagem: MIME é declarado pelo cliente ao S3. Verificação de conteúdo e antivírus, se necessários, devem ocorrer em processamento externo ao backend.

URLs são temporárias (300 segundos por padrão, máximo 3600). Não registre URLs em logs. Uploads abandonados ou rejeitados deixam registros/objetos pendentes; limpeza e política de retenção devem ser definidas conforme o produto. filename e checksum não fazem parte do schema. Tipo e tamanho podem ser nulos no status pending; CHECK constraints impedem ready sem esses metadados e rejeitam tamanhos não positivos.

As fotos de perfil não possuem referência à organização. Imagens de outros domínios na tabela `images` continuam usando organização e ON DELETE RESTRICT. URLs S3 já emitidas continuam válidas até a expiração, mesmo após logout ou remoção do vínculo.

## Configuração S3

Mantenha Block Public Access habilitado. A identidade da API precisa de `s3:PutObject` e `s3:GetObject` nos prefixos `user-image/*` e `images/*` do bucket (este último preserva o acesso às fotos migradas); HeadObject usa a permissão GetObject. Nenhum ACL público é aplicado.

Configure CORS no bucket para as origens do cliente (FRONTEND_URL configura apenas a API). Exemplo para desenvolvimento:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "if-none-match", "x-amz-*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 300
  }
]
```

Para S3 compatível local, configure S3_ENDPOINT e S3_FORCE_PATH_STYLE=true. A URL assinada deve usar um endpoint acessível pelo cliente e pela API.

## Banco e comandos

Schemas de banco separados por domínio em `src/shared/database/schemas/`, com exportações em `index.ts`. Os grupos `storage.schema.ts`, `auth.schema.ts` e `organization.schema.ts` contêm as tabelas de seus domínios. Relações entre grupos ficam em `relations.ts`. Migrações versionadas em `drizzle/`. Migrações não são executadas automaticamente no startup.

```sh
pnpm auth:check   # Valida o mapeamento Drizzle sem consultar o banco
pnpm auth:generate # Gera referência em auth.generated.ts (ignorada pelo Git)
pnpm db:generate  # Gera SQL e snapshot após alterar o schema
pnpm db:migrate   # Aplica migrações no DATABASE_URL configurado
pnpm db:studio
pnpm build
pnpm start:prod
pnpm lint
pnpm test
pnpm test:e2e
```

Após alterar plugins/opções do Better Auth, gere a referência com `pnpm auth:generate` e distribua as alterações de `auth.generated.ts` nos grupos de schemas existentes, preservando a separação por domínio. Depois gere a migração Drizzle e rode `pnpm auth:check`. A geração e a validação estrutural não aplicam migrações nem confirmam que o banco esteja atualizado.

Todos os testes ficam em `test/`. Unitários em `test/unit/`; testes HTTP em `test/e2e/`, com handlers reais do Better Auth e persistência em memória, repositories de domínio simulados e S3 simulado, sem serviços externos. Os testes cobrem login/logout, organizações, convites, permissões, isolamento de imagens e revogação de vínculo. O SQL de escopo de imagens também é verificado com cliente PostgreSQL simulado. Para testar a integração real, configure PostgreSQL e S3, aplique a migração e execute o fluxo de upload acima.

Referências: [NestJS Standard Schema](https://docs.nestjs.com/techniques/validation), [Scalar](https://scalar.com/products/api-references/integrations/nestjs), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [S3 presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html), [Better Auth Express](https://better-auth.com/docs/integrations/express), [Drizzle Adapter](https://better-auth.com/docs/adapters/drizzle) e [Organization](https://better-auth.com/docs/plugins/organization).

## Conta inicial

Configure `INITIAL_USER_NAME`, `INITIAL_USER_EMAIL`, `INITIAL_USER_PASSWORD`, `INITIAL_ORGANIZATION_NAME` e `INITIAL_ORGANIZATION_SLUG` no `.env` e execute `pnpm run db:seed` após aplicar as migrações. A senha deve ter de 8 a 128 caracteres. O comando usa o ConfigModule e garante o usuário inicial, sua credencial com hash do Better Auth e a empresa **Fort de France - Matriz**, com slug `fortdefrance-matriz`, na mesma transação. O usuário inicial é vinculado como `owner` (proprietário) da empresa.

Reexecutar preserva contas e senhas existentes com o mesmo e-mail e os dados da organização já cadastrada com esse slug. Mesmo quando o usuário já existe, o seed cria a empresa e o vínculo que estiverem faltando; vínculos existentes recebem o papel `owner` caso ainda não o tenham, preservando os outros papéis. O bloqueio da organização durante a transação evita vínculos duplicados entre execuções concorrentes do seed. O seed não seleciona a empresa nas sessões existentes nem cria permissões de administrador global. O nome e o slug da empresa vêm de `INITIAL_ORGANIZATION_NAME` e `INITIAL_ORGANIZATION_SLUG`; preencha-os com `Fort de France - Matriz` e `fortdefrance-matriz` para a matriz. O slug aceita letras minúsculas, números e hífens entre segmentos. As variáveis `INITIAL_USER_*` substituem as antigas `ADMIN_USER_*`; atualize os ambientes existentes. Não há novas migrações para esse seed.

## Listagem de empresas do usuário

`GET /organizations` exige sessão válida pelo `AuthGuard` e retorna uma lista de `{ id, name, slug, role }`. A listagem usa um único SELECT Drizzle com JOIN entre `member` e `organization`, filtrado por `session.user.id`, e ordena por nome e ID. A validação da sessão ocorre separadamente. Não recebe o usuário nem a organização por DTO, não exige organização ativa e retorna `[]` se não houver vínculos. Respostas usam `Cache-Control: private, no-store`; o contrato Zod está documentado no OpenAPI. Os endpoints nativos do Better Auth para criação, seleção de empresa, membros e convites permanecem disponíveis.

## Fotos de usuário com Magalu Cloud

Assim como em `zexperiments`, use PUT simples para Magalu Cloud. Esse provedor não suporta PUT condicional (`If-None-Match`/`If-Match`) e retorna `501 NotImplemented`. Configure `S3_USE_CONDITIONAL_UPLOAD=false` e `S3_FORCE_PATH_STYLE=true`. O padrão de `S3_USE_CONDITIONAL_UPLOAD` permanece `true` para provedores compatíveis com escrita condicional. Cada upload continua recebendo uma nova chave gerada a partir do UUIDv7 do banco; na Magalu a URL pode ser reutilizada até expirar. O frontend envia exatamente os headers retornados pela API, além do Content-Type do arquivo.

Após o PUT e a confirmação, `POST /user-images/:id/attach` recebe o nome, verifica o proprietário autenticado, o status `ready` e a criação na última hora. Em seguida chama o handler nativo `updateUser` do Better Auth e devolve seus cookies. A referência permanente é criada pelo servidor usando FRONTEND_URL. A foto anterior só é excluída depois de atualizar o perfil e verificar que nenhum usuário a referencia. A exclusão usa bloqueio da linha da imagem; em caso de falha no S3, o registro é preservado para nova tentativa.

A limpeza de fotos órfãs roda somente após o vínculo bem-sucedido de uma nova foto e se limita ao usuário autenticado na requisição. Os bloqueios de linha no repository protegem a exclusão quando há requisições concorrentes. Não há execução na inicialização nem agendamento periódico. Mantém fotos em uso e remove objetos `user-image` sem vínculo criados há mais de 24 horas, incluindo uploads pendentes abandonados. Os limites de uma hora para vincular e 24 horas para limpeza evitam apagar uploads em andamento. Remover a foto continua tentando excluir somente o arquivo anterior sem vínculo; não dispara a varredura de órfãs. Falhas na limpeza são registradas sem desfazer o perfil salvo e uma nova tentativa ocorre no próximo envio bem-sucedido. As credenciais precisam permitir DeleteObject além de PutObject/GetObject; não é necessário listar objetos no bucket, pois os uploads já são registrados no banco antes da assinatura.

Referência do provedor: https://docs.magalu.cloud/docs/storage/object-storage/troubleshooting/error-proxmox-backupserver

Na interface de `/user-settings`, a foto recortada é exportada em WebP com lado máximo de 512 px, sem ampliar recortes menores. Começa em qualidade 80% e ajusta qualidade e, se necessário, resolução para respeitar 50.000 bytes. JPEG é usado como alternativa apenas quando o navegador não exporta WebP. O botão de lixeira prepara a remoção, aplicada junto do nome ao salvar por `DELETE /user-images/current`. O servidor limpa a referência pelo Better Auth antes de excluir o objeto sem vínculo; falhas no salvamento preservam a foto atual.

O módulo de fotos concentra leitura, vínculo, remoção e limpeza no `UserImagesService`. O `UserImagesRepository` mantém o escopo do usuário, os bloqueios e a proteção de fotos referenciadas por usuários. Não existe enumeração global de empresas nesse fluxo.

### Migração das fotos pessoais

A migração `0003` transfere fotos vinculadas de `images` para `user_images` e atualiza as referências em `user.image`. A coluna `imported_key` preserva a localização de objetos já existentes; novos uploads não preenchem essa coluna e usam `user-image/<userId>/<id>`. Não há cópia nem exclusão de objetos S3 durante a migração. Referências compartilhadas recebem registros separados, mantendo o arquivo enquanto houver uma referência. Registros antigos sem vínculo continuam na tabela anterior para uma futura limpeza; não são atribuídos arbitrariamente a usuários.

O módulo `src/modules/user-images/` registra suas próprias rotas em `/user-images`, com controller, service, repository e DTOs. O schema pessoal fica em `user-images.schema.ts`. O módulo `images` mantém seu fluxo por organização e não importa nem chama `UserImagesModule`; fotos pessoais não fazem parte de sua lista de prefixos. Ambos reutilizam somente a infraestrutura de armazenamento e consulta de metadados S3. `inspectUploadedObject` consulta a existência do objeto e retorna tipo e tamanho, sem regras de imagem; cada service valida os tipos aceitos e seu limite de tamanho antes de confirmar o upload.

## Gerenciamento da empresa

A tela `/organization-settings?organizationId=...` valida o vínculo atual e permite acesso somente a proprietários e administradores. Consulta os dados pela rota nativa `GET /api/auth/organization/get-organization` e salva nome, e-mail e endereço por `POST /api/auth/organization/update`, com a empresa explícita, sem trocar a organização ativa da sessão. E-mail e endereço são campos opcionais do plugin Organization, persistidos na tabela `organization` pelas migrações `0004` e `0005`. O endereço é texto simples de até 500 caracteres para futura exibição em impressões; não há geração de impressão neste fluxo. O código (`slug`) permanece imutável, inclusive em solicitações diretas ao backend.

Membros são consultados com paginação por `GET /api/auth/organization/list-members`. Alterações de cargo usam `POST /api/auth/organization/update-member-role`, após confirmação no frontend e com as permissões nativas revalidadas no backend. Proprietários são exibidos sem seletor; os demais cargos disponíveis são membro e administrador. Falhas preservam os dados editados; mutações bem-sucedidas invalidam o cache correspondente. Se o próprio administrador mudar seu cargo para membro, o acesso ao gerenciamento é revalidado.

O card de convites continua somente visual, com o botão de envio desativado. Esta etapa não envia nem registra convites.

### Taxas de cartão

`GET /card-fees` exige sessão Better Auth e retorna os grupos compartilhados de taxas, ordenados por exibição e parcelas. A tela `/taxas` calcula `valor da venda / (1 - taxa / 100)` para repassar a taxa ao comprador, com exibição em reais.

O schema Drizzle mantém grupos, logotipos SVG e taxas decimais por parcela (1 a 12), com unicidade por grupo/parcela. Após conferir o banco de destino, execute `pnpm db:migrate` e `pnpm run db:seed` no backend. O seed inclui os três grupos e as 36 taxas do `zexperiments`; execuções posteriores preservam grupos existentes e suas taxas.

### Execução centralizada dos seeds

No diretório `backend-nestjs`, execute `pnpm run db:seed`. O comando compila o backend e executa `src/seed.ts`, que chama, em sequência:

1. Dados iniciais: usuário, credencial, matriz e Outra Empresa com seus vínculos.
2. Taxas de cartão: os três grupos, logotipos e 36 taxas do `zexperiments`.

Todos os seeds e seus dados ficam em `src/shared/database/seeds/`. O `SeedsModule` carrega somente configuração e banco; os seeds não são registrados na API nem executados ao iniciá-la. Novos seeds devem ser adicionados nessa pasta e chamados em `src/seed.ts`.

Aplique as migrações antes e configure as variáveis `INITIAL_USER_*` e `INITIAL_ORGANIZATION_*`. Cada seed usa sua própria transação; uma falha interrompe a sequência, retorna código de erro e permite reexecutar o comando. As taxas só são inseridas para grupos ainda não cadastrados, preservando taxas e logotipos existentes.
