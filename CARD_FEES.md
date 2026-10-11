# Calculadora de taxas de cartão

A página `/taxas` está no grupo privado e exige sessão e empresa ativa no
servidor. O atalho **Calculadora de Taxas** fica na sidebar.

O frontend consulta `GET /api/card-fees` pela pasta `src/api/card-fees`, com
TanStack Query, cancelamento por `AbortSignal` e validação da resposta com Zod.
A rewrite do Next.js encaminha a consulta ao backend na mesma origem dos
cookies. A rota NestJS exige sessão pelo guard global e não permite cache HTTP.

Os grupos e taxas ficam nas tabelas `CardFeeGroup` e `CardFee`. O catálogo é
compartilhado entre as empresas e somente de leitura nesta funcionalidade.
Os percentuais são `Decimal(5, 2)` no PostgreSQL e strings com duas casas
decimais na API, por exemplo `"3.94"` para 3,94%.

A migração `20261011000000_add_card_fees` inclui os dados e logos do projeto
`new-ways-tests`: Visa/Mastercard, Elo/American Express e link de pagamento,
com 12 opções de parcelamento por grupo. Não há atualização automática de taxas.
Para preparar outro banco, confira o destino e execute `pnpm db:migrate` e
`pnpm db:generate` no diretório `backend`.

O seed fica em `src/modules/card-fees/seeds/seed-card-fees.ts`. Execute
`pnpm db:seed` no backend depois das migrações para garantir os grupos iniciais
e o usuário inicial. O comando faz o build e usa o seed configurado no Prisma.
Os SVGs iniciais estão definidos no seed e são persistidos no banco.
A aplicação lê os logos exclusivamente da API/banco; não há arquivos SVG de
logos de cartão nem cópia de assets no build.
O seed não substitui taxas ou grupos já cadastrados.

Configure `ADMIN_USER_NAME`, `ADMIN_USER_EMAIL` e `ADMIN_USER_PASSWORD` no
`backend/.env`, conforme `.env.example`. O seed de usuário fica no módulo
`auth`, cria contas pelo Better Auth (com hash de senha) e preserva dados,
senha e vínculos do usuário quando o e-mail já existe. Uma conta existente
sem credencial de senha gera erro, sem alterações. O nome "admin" identifica
o usuário inicial; o seed não concede permissões adicionais nem cria empresas.
Não versione os dados reais do usuário nem a senha.

O cálculo preserva a fórmula do projeto de origem:

```text
total = valor da venda / (1 - percentual / 100)
parcela = total / quantidade de parcelas
```

A entrada aceita valores brasileiros, como `1.000,00`, maiores que zero e até
R$ 1 bilhão. Os valores exibidos são arredondados para centavos; a divisão pode
exigir ajuste na última parcela.

Verificação: testes do frontend cobrem entrada, limites, percentuais e fórmula.
Os testes do backend usam mocks e o adapter de autenticação em memória para
verificar serialização decimal e acesso autenticado, sem PostgreSQL ou S3.
Os testes de `card-fees` ficam em `test/unit/modules/card-fees/` e cobrem
serviço, consulta HTTP protegida e seed. Os testes do seed de usuário ficam
em `test/unit/modules/auth/`. O Vitest executa os testes unitários em `test/unit/`; a suíte e2e fica
em `test/e2e/` e usa sua configuração própria.
