# Configuração da área administrativa

O painel fica em `admin.html`. Ele não oferece cadastro público: primeiro crie as contas da equipe em **Supabase → Authentication → Users → Add user**.

## Ativar permissões de equipe

1. Execute `migrations/20261116000400_site_staff.sql` no SQL Editor do projeto `santarém-viva`.
2. Execute `migrations/20261116000500_site_image_storage.sql` para ativar o envio de fotos.
3. Execute `migrations/20261117023100_site_editor_policy_performance.sql` para separar as políticas públicas das permissões de edição.
4. Execute `migrations/20261117030000_site_content_and_gallery.sql` para criar os textos editáveis e a galeria de fotos.
5. Execute `migrations/20261117031000_site_settings_defaults.sql` para disponibilizar os textos atuais dos cartões no editor.
6. Crie a primeira conta em **Authentication → Users → Add user** e confirme o e-mail, se solicitado.
7. No SQL Editor, associe seu e-mail ao papel de administrador:

```sql
insert into public.site_staff (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = lower('SEU_EMAIL_AQUI')
on conflict (user_id) do update set role = excluded.role;
```

8. Para uma conta de desenvolvedor, repita com `'developer'` no lugar de `'admin'`.
9. Acesse `/admin.html` no endereço publicado do site e entre com o e-mail e a senha criados no Supabase Auth.

O papel `admin` ou `developer` permite gerenciar destinos, eventos, roteiros, respostas auxiliares, textos do site, fotos e banners. Somente `admin` pode convidar ou remover acessos. A verificação ocorre no banco e na função de servidor; esconder a tela não é usado como controle de segurança. As edições do site são salvas no Supabase e aparecem imediatamente, sem uma nova publicação no GitHub Pages.

O painel não possui formulário de cadastro público. Para bloquear também o endpoint público de criação de contas do Supabase, abra **Authentication → Sign In / Providers → User Signups** e desative **Allow new users to sign up**. Convites feitos pela função administrativa continuam sendo feitos pelo Supabase Auth.

O primeiro administrador precisa ser criado no Dashboard do Supabase e receber o papel por SQL, conforme as etapas acima. Depois disso, a seção Equipe do painel pode enviar convites e administrar os papéis.

Os formulários de destinos, eventos e galeria aceitam JPEG, PNG, WebP ou AVIF de até 5 MB. As imagens enviadas ao bucket público `site-images` ficam acessíveis publicamente, pois são fotos destinadas ao site; somente usuários da equipe podem enviar arquivos.

Para trocar o banner, abra **Fotografias e banners**, envie/edite a foto e use **Copiar endereço**. Em **Textos e contato**, crie ou edite a chave `hero_banner` e cole esse endereço no valor.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` publica o site a cada atualização da branch `main`.

1. Envie as alterações locais para o repositório remoto.
2. No GitHub, abra **Settings → Pages** e escolha **GitHub Actions** em **Build and deployment → Source**.
3. Acompanhe o primeiro envio em **Actions**. Quando terminar, o GitHub mostrará o endereço publicado na execução e em **Settings → Pages**.
