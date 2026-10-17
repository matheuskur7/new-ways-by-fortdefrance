# Backend NestJS

Projeto gerado pela CLI oficial do NestJS, em TypeScript ESM/NodeNext. Usa PostgreSQL com Drizzle, validação Zod nativa do NestJS (Standard Schema), Swagger, Scalar e Better Auth com o plugin Organization. O backend recebe apenas JSON: imagens são enviadas e lidas diretamente no S3.

## Iniciar

Requisitos: Node.js 22+, pnpm 12, PostgreSQL 18+ (UUIDv7 nativo) e um bucket S3 privado (ou serviço compatível com URLs assinadas e escrita condicional If-None-Match).

Execute dentro de `backend-nestjs/`:

```sh
pnpm install
cp .env.example .env
# Configure DATABASE_URL, S3_REGION, S3_BUCKET, BETTER_AUTH_URL e BETTER_AUTH_SECRET.
# Confira o banco de destino antes de aplicar:
pnpm db:migrate
pnpm start:dev
```

O ambiente é validado com Zod no ConfigModule. O schema, os helpers de validação e a tipagem do ambiente ficam em um único arquivo, `src/shared/config/env.ts`. Campos numéricos e booleanos são convertidos e consumidos com ConfigService tipado. As credenciais usam S3_KEY_ID e S3_KEY_SECRET, quando ambas são informadas. Se ambas estiverem vazias, o SDK usa a cadeia padrão AWS (IAM role, perfil local ou variáveis AWS_*). FRONTEND_URL define a origem permitida pelo CORS da API. Variáveis opcionais vazias são normalizadas para undefined. BETTER_AUTH_URL e BETTER_AUTH_SECRET são obrigatórios; o segredo deve conter pelo menos 32 caracteres. Variáveis legadas de JWT, seed e SMTP continuam opcionais e não são utilizadas pela autenticação. Não coloque credenciais no código.

Por padrão, a API usa `http://localhost:5000`:

- Scalar: `/docs`
- Swagger UI: `/swagger`
- OpenAPI JSON da API: `/openapi.json`
- Scalar do Better Auth: `/api/auth/reference`
- OpenAPI de autenticação/organizações: `/api/auth/open-api/generate-schema`

O Scalar em `/docs` permite selecionar as fontes API e Auth e organizações.

## Autenticação e organizações

Better Auth usa o adaptador Drizzle/PostgreSQL e sessões por cookie. O cadastro por e-mail e senha está habilitado. O plugin Organization fornece criação de organizações, organização ativa, membros, papéis e convites. São usados os papéis padrão `owner`, `admin` e `member`, com as permissões nativas do plugin. Qualquer usuário autenticado pode criar uma organização.

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

O backend não envia e-mails de convite, verificação ou recuperação de senha nesta implementação. Convites são criados/aceitos pelo plugin usando invitationId; a distribuição desse identificador cabe ao cliente até integrar o envio de e-mail. JWT separado, login social, teams e seed de administrador não estão habilitados.

## Imagens: fluxo direto para S3

Todas as rotas de imagens exigem uma sessão válida e uma organização ativa com vínculo atual no banco. A organização vem da sessão; não deve ser enviada no corpo. Os metadados e as chaves S3 usam o escopo da organização. Sessão ausente retorna 401, ausência de organização/vínculo retorna 403 e imagem de outra organização retorna 404.

1. Envie `POST /images/upload-url` com apenas:

```json
{
  "key": "user-image"
}
```

`key` define a pasta/prefixo da imagem no S3. Por enquanto, apenas `user-image` é válido. Outros valores, como `car-image` ou `car-image/rear`, serão adicionados conforme seus domínios forem implementados. A lista central fica em `src/shared/storage/image-keys.ts`. IDs, nomes, tamanho, tipo e checksum não devem ser enviados nessa solicitação.

2. O backend insere o registro com status `pending`. O PostgreSQL gera o ID com `DEFAULT uuidv7()`. A coluna calculada do PostgreSQL gera a chave completa `images/<organizationId>/user-image/<uuidv7>`. Organização, prefixo e chave completa são NOT NULL. Após o INSERT, a URL PUT é assinada para essa chave.

A resposta contém `id`, `key` (chave completa), `status: "pending"`, `url`, `method: "PUT"`, `headers` e `expiresIn`. Se a assinatura falhar, o registro continua pendente.

3. Envie os bytes diretamente à URL S3 com PUT, sem multipart, usando os headers retornados. Defina Content-Type com o tipo do arquivo. A URL exige `If-None-Match: *`, impedindo sobrescrever um objeto já enviado à mesma chave. Um upload já concluído no S3 retorna 412 se for repetido; nesses casos, confirme pelo backend ou solicite uma nova URL/registro para outro arquivo.

```ts
const response = await fetch('http://localhost:5000/images/upload-url', {
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
const complete = await fetch(
  `http://localhost:5000/images/${upload.id}/complete`,
  { method: 'POST', credentials: 'include' },
);
if (!complete.ok) throw new Error('Falha na confirmação');
```

4. `POST /images/:id/complete` consulta apenas HeadObject no S3, valida o tipo declarado (JPEG, PNG, WebP ou GIF) e o tamanho e preenche esses metadados no banco. O limite padrão é 10 MiB, configurável por MAX_IMAGE_SIZE_BYTES (máximo 100 MiB). Arquivos vazios, tipos incompatíveis e arquivos acima do limite não são confirmados; continuam pendentes. A checagem ocorre depois do envio ao S3, não durante a assinatura. A confirmação é idempotente e muda o status para `ready`.
5. `GET /images/:id/download-url` retorna uma URL temporária GET para uma imagem pronta. O cliente lê os bytes diretamente do S3.

O backend não inspeciona os bytes nem detecta o formato real da imagem: MIME é declarado pelo cliente ao S3. Verificação de conteúdo e antivírus, se necessários, devem ocorrer em processamento externo ao backend.

URLs são temporárias (300 segundos por padrão, máximo 3600). Não registre URLs em logs. Uploads abandonados ou rejeitados deixam registros/objetos pendentes; limpeza e política de retenção devem ser definidas conforme o produto. filename e checksum não fazem parte do schema. Tipo e tamanho podem ser nulos no status pending; CHECK constraints impedem ready sem esses metadados e rejeitam tamanhos não positivos.

Uma organização com imagens não pode ser excluída por causa da referência de integridade (ON DELETE RESTRICT). URLs S3 já emitidas continuam válidas até a expiração, mesmo após logout ou remoção do vínculo.

## Configuração S3

Mantenha Block Public Access habilitado. A identidade da API precisa de `s3:PutObject` e `s3:GetObject` no prefixo `images/*` do bucket; HeadObject usa a permissão GetObject. Nenhum ACL público é aplicado.

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
