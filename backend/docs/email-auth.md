# Confirmação de e-mail e recuperação de senha

## Configuração

Preencha no `backend/.env` (não versionado):

```dotenv
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=nao-responda@seudominio.com.br
SMTP_PASSWORD=senha-da-caixa
SMTP_FROM="New Ways <nao-responda@seudominio.com.br>"
SMTP_REPLY_TO=
```

Crie a caixa na Hostinger e use suas credenciais SMTP. O remetente precisa ser
permitido pela conta; `SMTP_REPLY_TO` é opcional. Confira os registros SPF, DKIM e
DMARC e os limites de envio no provedor. Não coloque a senha no frontend.
Para porta 587 use `SMTP_SECURE=false`: o serviço exige STARTTLS e mantém a
validação do certificado. Reinicie o backend após preencher as variáveis.

`FRONTEND_URL` deve ser a origem pública do frontend. Os links usam seu proxy
`/api/auth`, independentemente do endereço interno em `BETTER_AUTH_URL`.
O `BACKEND_URL` do frontend precisa apontar ao backend. Em produção use HTTPS.

## Fluxos

- O cadastro envia a confirmação e não autentica automaticamente.
- E-mails não confirmados não podem fazer um novo login. A tela oferece reenvio;
  o login, sozinho, não dispara outro e-mail.
- A confirmação expira em 1 hora e retorna a `/verify-email`. Depois o usuário
  entra normalmente; o resultado exibido pela página não substitui a validação
  de `emailVerified` pelo Better Auth.
- `/forgot-password` solicita recuperação. O link expira em 1 hora e retorna a
  `/reset-password`. O token de recuperação é consumido uma única vez.
- Redefinir a senha encerra todas as sessões do usuário e não faz login automático.
- Solicitações de e-mail exibem mensagem genérica, inclusive para contas inexistentes.
- Usuários excluídos logicamente não são encontrados pela autenticação nem podem
  recuperar acesso usando tokens emitidos antes da exclusão.

Contas existentes não são marcadas como verificadas automaticamente. Isso inclui
o usuário do seed: use o reenvio antes de entrar com uma conta não confirmada.
Sessões válidas já existentes não são revogadas só por ativar a confirmação.
Ao implantar, aplique a migration de soft delete antes de iniciar a versão que usa
`deletedAt`; não há nova migration específica para o envio de e-mails.

## Organização e operação

O `EmailModule` em `src/shared/email` centraliza o transporte SMTP. Os callbacks
nativos do Better Auth gerenciam tokens e chamam o serviço; não há tokens ou
senhas implementados em controllers próprios. O frontend centraliza o transporte
em `src/api/auth.ts`, mutations em `auth.queries.ts` e validação Zod nos schemas.

Há limites por IP e rota no Better Auth: 3 solicitações de confirmação,
recuperação ou cadastro por minuto e 5 tentativas de redefinição por minuto.
O armazenamento desses limites é em memória por processo. Ao escalar para várias
instâncias, configure armazenamento compartilhado e valide os IPs encaminhados
pelo proxy confiável.

O envio é assíncrono para não expor a existência de contas pela latência SMTP.
Erros geram log genérico, sem credenciais, destinatários ou links. A resposta de
solicitação não garante entrega: confira os logs e a caixa de entrada. O backend
aguarda envios pendentes no encerramento normal. Não há fila persistente ou
reenvio automático após queda abrupta; o usuário pode solicitar outro e-mail.

Os testes usam SMTP e banco simulados e verificam confirmação, reenvio,
expiração, recuperação, consumo único, revogação de sessões e links públicos.
A entrega real depende do preenchimento das credenciais e deve ser testada em
uma caixa controlada após a configuração.
