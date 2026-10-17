# Backend NestJS

Projeto gerado pela CLI oficial do NestJS, em TypeScript ESM/NodeNext. Usa PostgreSQL com Drizzle, validação Zod nativa do NestJS (Standard Schema), Swagger e Scalar. O backend recebe apenas JSON: imagens são enviadas e lidas diretamente no S3.

## Iniciar

Requisitos: Node.js 22+, pnpm 12, PostgreSQL e um bucket S3 privado (ou serviço compatível com suporte a SHA-256 e URLs assinadas).

Execute dentro de `backend-nestjs/`:

```sh
pnpm install
cp .env.example .env
# Configure DATABASE_URL, S3_REGION, S3_BUCKET e as demais variáveis.
# Confira o banco de destino antes de aplicar:
pnpm db:migrate
pnpm start:dev
```

O ambiente é validado com Zod no ConfigModule. O schema, os helpers de validação e a tipagem do ambiente ficam em um único arquivo, `src/shared/config/env.ts`. Campos numéricos e booleanos são convertidos e consumidos com ConfigService tipado. As credenciais usam S3_KEY_ID e S3_KEY_SECRET, quando ambas são informadas. Se ambas estiverem vazias, o SDK usa a cadeia padrão AWS (IAM role, perfil local ou variáveis AWS_*). FRONTEND_URL define a origem permitida pelo CORS da API. Variáveis opcionais vazias são normalizadas para undefined. As variáveis existentes de autenticação, seed e SMTP também estão tipadas, mas esses módulos ainda não estão implementados. Não coloque credenciais no código.

Por padrão, a API usa `http://localhost:5000`:

- Scalar: `/docs`
- Swagger UI: `/swagger`
- OpenAPI JSON: `/openapi.json`

## Imagens: fluxo direto para S3

1. Calcule o SHA-256 dos bytes do arquivo e codifique o digest em base64.
2. Envie `POST /images/upload-url` com JSON:

```json
{
  "filename": "foto.png",
  "contentType": "image/png",
  "size": 12345,
  "checksum": "<SHA-256 em base64>"
}
```

A resposta contém `id`, `url`, `method: "PUT"`, `headers` e `expiresIn` em segundos. O registro começa como `pending`. Tipos aceitos: JPEG, PNG, WebP e GIF. O limite padrão é 10 MiB, configurável por MAX_IMAGE_SIZE_BYTES (máximo 100 MiB).

3. Envie os bytes diretamente à URL S3 com PUT, sem multipart, usando os headers retornados. O checksum vincula a assinatura ao conteúdo e o S3 verifica sua integridade. No navegador, não defina Content-Length manualmente: ele é calculado pelo navegador a partir do arquivo.

```ts
const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
const checksum = btoa(String.fromCharCode(...new Uint8Array(digest)));
const response = await fetch('http://localhost:5000/images/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filename: file.name,
    contentType: file.type,
    size: file.size,
    checksum,
  }),
});
if (!response.ok) throw new Error('Falha ao solicitar upload');
const upload = await response.json();
const sent = await fetch(upload.url, {
  method: 'PUT',
  headers: {
    'Content-Type': upload.headers['Content-Type'],
    'x-amz-checksum-sha256': upload.headers['x-amz-checksum-sha256'],
  },
  body: file,
});
if (!sent.ok) throw new Error('Falha no upload ao S3');
const complete = await fetch(
  `http://localhost:5000/images/${upload.id}/complete`,
  { method: 'POST' },
);
if (!complete.ok) throw new Error('Falha na confirmação');
```

4. `POST /images/:id/complete` consulta apenas HeadObject no S3 e compara tamanho, tipo declarado e checksum. A confirmação é idempotente e muda o status para `ready`.
5. `GET /images/:id/download-url` retorna uma URL temporária GET para uma imagem pronta. O cliente lê os bytes diretamente do S3.

O backend não inspeciona os bytes nem detecta o formato real da imagem: MIME é declarado pelo cliente. Verificação de conteúdo e antivírus, se necessários, devem ocorrer em processamento externo ao backend.

URLs são temporárias (300 segundos por padrão, máximo 3600). Um PUT pode ser repetido enquanto a assinatura for válida, mas deve preservar tamanho, tipo e checksum assinados. Não registre URLs em logs. Uploads abandonados deixam registros pendentes; limpeza de pendências e política de retenção devem ser definidas conforme o produto.

Este scaffold não inclui autenticação ou isolamento por empresa. As rotas de imagens estão abertas; adicione autorização de domínio antes de disponibilizá-las publicamente.

## Configuração S3

Mantenha Block Public Access habilitado. A identidade da API precisa de `s3:PutObject` e `s3:GetObject` no prefixo `images/*` do bucket; HeadObject usa a permissão GetObject. Para objetos com SSE-KMS, a consulta de checksum também requer as permissões KMS correspondentes. Nenhum ACL público é aplicado.

Configure CORS no bucket para as origens do cliente (FRONTEND_URL configura apenas a API). Exemplo para desenvolvimento:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "content-length", "x-amz-*"],
    "ExposeHeaders": ["ETag", "x-amz-checksum-sha256"],
    "MaxAgeSeconds": 300
  }
]
```

Para S3 compatível local, configure S3_ENDPOINT e S3_FORCE_PATH_STYLE=true. A URL assinada deve usar um endpoint acessível pelo cliente e pela API.

## Banco e comandos

Schemas de banco separados por domínio em `src/shared/database/schemas/`, com exportações em `index.ts`. O grupo `storage.schema.ts` contém a tabela de imagens; futuros grupos, como `auth.schema.ts`, devem reunir as tabelas, enums e relações do domínio correspondente. Migrações versionadas em `drizzle/`. Migrações não são executadas automaticamente no startup.

```sh
pnpm db:generate  # Gera SQL e snapshot após alterar o schema
pnpm db:migrate   # Aplica migrações no DATABASE_URL configurado
pnpm db:studio
pnpm build
pnpm start:prod
pnpm lint
pnpm test
pnpm test:e2e
```

Todos os testes ficam em `test/`. Unitários em `test/unit/`; testes HTTP em `test/e2e/`, com banco e S3 simulados, sem serviços externos. Para testar a integração real, configure PostgreSQL e S3, aplique a migração e execute o fluxo de upload acima.

Referências: [NestJS Standard Schema](https://docs.nestjs.com/techniques/validation), [Scalar](https://scalar.com/products/api-references/integrations/nestjs), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [S3 presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html).
