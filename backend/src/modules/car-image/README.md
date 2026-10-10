# Car images

Funcionalidade copiada de `fortdefrance-backend/src/modules/car-image`, com armazenamento S3, paginação e persistência PostgreSQL.

## Configuração

Configure no `.env`: `DATABASE_URL`, `S3_REGION`, `S3_ENDPOINT`, `S3_KEY_ID`, `S3_KEY_SECRET` e `S3_BUCKET`.

Dentro de `backend`, execute:

```bash
pnpm db:generate
pnpm db:migrate
pnpm start:dev
```

A configuração Prisma está em `prisma7.config.ts`; os scripts passam esse arquivo explicitamente.

## Rotas

- `POST /car-image`: cria o registro e retorna `imageData` e `uploadUrl`. Envie o arquivo via `PUT` para `uploadUrl`, com `Content-Type: image/*`. A URL de upload expira em 300 segundos.
- `GET /car-image?page=1`: lista imagens, com 50 registros por página e metadados de paginação.
- `GET /car-image/unlinked?page=1`: lista imagens com `serviceOrderId` nulo.
- `DELETE /car-image/:id`: exclui o objeto do armazenamento e depois o registro. O ID deve ser UUID v7.
- `PATCH /car-image/category/key/:key`: placeholder preservado da origem; retorna texto e não altera o banco.

As URLs de leitura retornadas em `imageData.url` e nas listagens expiram em 900 segundos. Configure CORS no bucket para permitir o upload pelo frontend.

Os campos `userId` e `serviceOrderId` foram preservados, mas ainda não têm relações ou chaves estrangeiras, pois os módulos correspondentes não existem neste backend. Não há autenticação nas rotas desta cópia; a integração de sessão deve acompanhar a migração do módulo de autenticação.

A migração incluída cria somente a tabela `car_image`. Os testes usam mocks de banco e armazenamento; não acessam serviços externos.
