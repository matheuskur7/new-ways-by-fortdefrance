# Ajustes do usuário

A tela `/ajustes-do-usuario` permite editar nome, foto e senha. A senha usa o endpoint do Better Auth, exige a senha atual e encerra as outras sessões.

## Foto e S3

Configure as variáveis `S3_REGION`, `S3_ENDPOINT`, `S3_KEY_ID`, `S3_KEY_SECRET` e `S3_BUCKET` documentadas em `.env.example`. O bucket precisa permitir CORS para a origem do frontend (`FRONTEND_URL`), método `PUT` e header `Content-Type`. Mantenha os objetos privados; a leitura usa URLs assinadas.

1. O frontend compacta JPEG, PNG ou WebP de até 10 MB usando `browser-image-compression`, o mesmo mecanismo do projeto Fort de France. Para avatares, usa JPEG com lado máximo de 512 px, qualidade inicial 0,8 e alvo de 150 KB. A compactação roda localmente sem baixar código de worker de um CDN.
2. `POST /api/user-settings/avatar-upload` gera uma chave exclusiva em `user-avatar/<hash-do-usuário>-<uuid>.jpg` e uma URL de upload válida por 5 minutos.
3. O navegador envia a foto diretamente ao S3 com `PUT` e `Content-Type: image/jpeg`.
4. `PATCH /api/user-settings` recebe `name` e `imageKey` opcional. O servidor valida o dono da chave, a existência do objeto, o tipo JPEG e o limite de 200 KB antes de atualizar o perfil.
5. O banco guarda a chave permanente em `User.image`, usando o campo existente. O contexto autenticado transforma essa chave em uma URL de leitura válida por uma hora; não há migração de banco.

`DELETE /api/user-settings/avatar` remove a foto do usuário autenticado. Novas fotos ficam juntas em `user-avatar/`, sem subpastas; o hash no nome permite validar a propriedade. Fotos antigas continuam acessíveis.

A foto anterior é excluída após salvar a nova, desde que não esteja referenciada por nenhum usuário. Falhas de exclusão não desfazem a atualização: a limpeza tenta novamente.

A limpeza roda ao iniciar o backend e a cada hora, percorre as páginas do prefixo `user-avatar/` e exclui objetos com mais de 24 horas sem referência em `auth_user.image`. Fotos em uso são preservadas. Para evitar salvar uploads que estão elegíveis para limpeza, o perfil aceita apenas imagens enviadas na última hora. As credenciais S3 precisam permitir listar o prefixo, consultar, ler, enviar e excluir objetos.
