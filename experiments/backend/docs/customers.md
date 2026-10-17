# Clientes

O cadastro mantém os campos importados do projeto original: `id`, `name`,
`cpfCnpj`, `phone`, `type` (`PERSON` ou `COMPANY`), `createdAt` e `updatedAt`.
CPF/CNPJ é obrigatório, numérico e tem de 11 a 14 caracteres; telefone é
obrigatório, numérico e tem até 20 caracteres. Não há endereço ou cadastro
específico para residentes no exterior.

## Acesso e auditoria

As rotas `POST /api/customers`, `GET /api/customers/:id` e
`PATCH /api/customers/:id` exigem sessão válida. Escritas exigem uma origem
confiável. Em cada operação, o backend verifica o vínculo atual do usuário com a
empresa ativa. Clientes de outras empresas não são acessíveis. CPF/CNPJ é único
por empresa.

`organizationId`, `createdBy` e `updatedBy` são obrigatórios e vêm da sessão
validada. Ambos os autores são preenchidos na criação; apenas `updatedBy` muda
nas edições. `createdAt` e `updatedAt` são gerenciados pelo Prisma.

DTOs rejeitam campos extras, incluindo autoria, empresa, relações Prisma e os
antigos `user`/`userId`. O repositório também usa uma lista explícita de campos
graváveis. Identidades referenciadas pela auditoria têm exclusão restrita.

```json
{
  "name": "Cliente Exemplo",
  "cpfCnpj": "12345678901",
  "phone": "11999999999",
  "type": "PERSON"
}
```

No PATCH, campos omitidos são preservados. Campos obrigatórios não aceitam
`null`; atualizações vazias são rejeitadas.

## Migração pendente

`20261014000000_add_customer` cria diretamente o modelo final, com auditoria e
separação por empresa. As migrações intermediárias foram consolidadas porque
nenhuma havia sido aplicada. A migração não foi executada no banco.
