# Páginas de PDF para migração futura

Cópia das páginas e componentes de `src/app/(pdf)` do projeto
`fortdefrance-frontend`, preservando sua estrutura e conteúdo originais.

- `os/pdf`: PDF da ordem de serviço e seus componentes.
- `notas-fiscais/pdf`: PDF das etiquetas de unidades da nota fiscal.
- `layout.tsx.txt`: layout original com validação de sessão.

Os 17 arquivos foram armazenados com o sufixo `.tsx.txt` para permanecerem
fora da compilação e das rotas enquanto a migração não for retomada.
O projeto de origem foi mantido intacto.

Antes de ativar as páginas, adaptar os imports e os contratos ao novo projeto:

- Bibliotecas `@react-pdf/renderer` e `qrcode` e seus tipos.
- APIs de clientes, ordens de serviço, tipos, verificações e itens de revisão,
  e notas fiscais (`@/api/*`).
- Utilitários de formatação, etiquetas e configuração da ordem de serviço,
  incluindo as funções do antigo `@/lib/utils`.
- Validação de sessão do antigo `@/lib/session`, autorização por empresa e
  integração com os componentes e estados de carregamento deste frontend.

Ao retomar, remover o sufixo `.txt` e mover os arquivos para fora de
`_reference` somente após integrar essas dependências. Validar com `pnpm lint`
e `pnpm build` no diretório `frontend`.
