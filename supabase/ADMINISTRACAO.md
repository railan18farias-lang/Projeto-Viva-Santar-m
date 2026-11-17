# Configuração da área administrativa

O painel fica em `admin.html`. Ele não oferece cadastro público: primeiro crie as contas da equipe em **Supabase → Authentication → Users → Add user**.

## Ativar permissões de equipe

1. Execute `migrations/20261116000400_site_staff.sql` no SQL Editor do projeto `santarém-viva`.
2. Execute `migrations/20261116000500_site_image_storage.sql` para ativar o envio de fotos.
3. Execute `migrations/20261117023100_site_editor_policy_performance.sql` para separar as políticas públicas das permissões de edição.
4. Crie sua conta em **Authentication → Users → Add user** e confirme o e-mail, se solicitado.
5. No SQL Editor, associe seu e-mail ao papel de administrador:

```sql
insert into public.site_staff (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = lower('SEU_EMAIL_AQUI')
on conflict (user_id) do update set role = excluded.role;
```

6. Para uma conta de desenvolvedor, repita com `'developer'` no lugar de `'admin'`.
7. Acesse `/admin.html` no endereço publicado do site e entre com o e-mail e a senha criados no Supabase Auth.

O papel `admin` ou `developer` permite gerenciar destinos, eventos, roteiros e respostas auxiliares. A permissão é verificada no banco via RLS; esconder a tela não é usado como controle de segurança. O painel permite editar conteúdo e excluir registros, então use a ação de exclusão com cuidado.

O formulário de destinos e eventos aceita JPEG, PNG, WebP ou AVIF de até 5 MB. As imagens enviadas ao bucket público `site-images` ficam acessíveis publicamente, pois são fotos destinadas ao site; somente usuários da equipe podem enviar, substituir ou remover arquivos.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` publica o site a cada atualização da branch `main`.

1. Envie as alterações locais para o repositório remoto.
2. No GitHub, abra **Settings → Pages** e escolha **GitHub Actions** em **Build and deployment → Source**.
3. Acompanhe o primeiro envio em **Actions**. Quando terminar, o GitHub mostrará o endereço publicado na execução e em **Settings → Pages**.
