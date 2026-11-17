const adminDb = window.supabase?.createClient(window.VIVA_SUPABASE_URL, window.VIVA_SUPABASE_KEY);
const sections = {
  destinations: { title: "Destinos", singular: "destino", fields: [
    ["name", "Nome", "text", true], ["category", "Categoria", "category", true],
    ["description", "Descrição", "textarea", true], ["location", "Localização", "text"],
    ["image_path", "Foto do destino", "image"], ["website_url", "Link oficial", "url"],
    ["is_published", "Publicado no site", "checkbox"]
  ] },
  events: { title: "Eventos", singular: "evento", fields: [
    ["name", "Nome", "text", true], ["description", "Descrição", "textarea", true],
    ["starts_at", "Data de início", "date", true], ["ends_at", "Data de término", "date"],
    ["location", "Local", "text", true], ["city", "Cidade", "text", true],
    ["image_path", "Foto do evento", "image"], ["website_url", "Link oficial", "url"],
    ["is_published", "Publicado no site", "checkbox"]
  ] },
  featured_routes: { title: "Roteiros e rotas", singular: "roteiro", fields: [
    ["slug", "Identificador (slug)", "text", true], ["title", "Título", "text", true],
    ["origin", "Origem", "text", true], ["destination", "Destino", "text", true],
    ["transport", "Transporte", "text"], ["estimated_duration", "Duração estimada", "text"],
    ["description", "Descrição", "textarea", true], ["maps_url", "Link do mapa", "url"],
    ["is_published", "Publicado no site", "checkbox"]
  ] },
  assistant_responses: { title: "Respostas auxiliares", singular: "resposta", fields: [
    ["intent", "Assunto", "text", true], ["response", "Resposta", "textarea", true],
    ["is_published", "Publicado no site", "checkbox"]
  ] },
  gallery_photos: { title: "Fotografias e banners", singular: "fotografia", fields: [
    ["title", "Título", "text", true], ["alt_text", "Descrição da imagem", "text", true],
    ["caption", "Legenda", "textarea"], ["image_path", "Imagem", "image", true], ["is_published", "Publicado no site", "checkbox"]
  ] },
  site_settings: { title: "Textos e contato", singular: "informação", idField: "setting_key", fields: [
    ["setting_key", "Campo (ex.: hero_title, contact_email)", "text", true], ["value", "Texto ou endereço", "textarea", true]
  ] }
};
let activeTable = "destinations";
let currentRecord = null;
const storagePublicBase = `${window.VIVA_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/site-images/`;

function imagemPermitida(path) {
  return typeof path === "string" && (
    (path.startsWith("images/") && !path.includes("..")) || path.startsWith(storagePublicBase)
  );
}

const byId = (id) => document.getElementById(id);
const statusText = (id, message, error = false) => {
  const node = byId(id);
  node.textContent = message;
  node.classList.toggle("error", error);
};

async function initialize() {
  if (!adminDb) {
    statusText("login-status", "Confira a configuração do Supabase no js/config.js.", true);
    return;
  }
  adminDb.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => showSession(session));
  });
  const { data: { session } } = await adminDb.auth.getSession();
  await showSession(session);
}

async function showSession(session) {
  byId("login-view").hidden = Boolean(session);
  byId("admin-view").hidden = !session;
  if (!session) return;
  const { data, error } = await adminDb.from("site_staff").select("role").eq("user_id", session.user.id).maybeSingle();
  if (error || !data || !["admin", "developer"].includes(data.role)) {
    await adminDb.auth.signOut();
    byId("login-view").hidden = false;
    byId("admin-view").hidden = true;
    statusText("login-status", "Conta autenticada, mas sem permissão de administrador ou desenvolvedor.", true);
    return;
  }
  byId("account-label").textContent = `${session.user.email} · ${data.role === "admin" ? "Administrador" : "Desenvolvedor"}`;
  window.siteAdminRole = data.role;
  renderTabs();
  await loadRecords();
}

function renderTabs() {
  const tabs = byId("tabs");
  tabs.replaceChildren();
  Object.entries(sections).forEach(([table, section]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = section.title;
    button.classList.toggle("selected", table === activeTable);
    button.addEventListener("click", async () => {
      activeTable = table;
      byId("form-card").hidden = true;
      byId("team-card").hidden = true;
      byId("editor-card").hidden = false;
      renderTabs();
      await loadRecords();
    });
    tabs.append(button);
  });
  const team = document.createElement("button");
  team.type = "button"; team.textContent = "Equipe"; team.hidden = window.siteAdminRole !== "admin";
  team.addEventListener("click", async () => { byId("form-card").hidden = true; byId("editor-card").hidden = true; byId("team-card").hidden = false; await loadTeam(); });
  tabs.append(team);
}

function labelFor(row) {
  return row.name || row.title || row.intent || row.slug || row.setting_key || "Registro";
}

async function loadRecords() {
  const section = sections[activeTable];
  byId("section-title").textContent = section.title;
  statusText("list-status", "Carregando...");
  byId("records").replaceChildren();
  const sortField = activeTable === "events" ? "starts_at" : activeTable === "assistant_responses" ? "intent" : activeTable === "site_settings" ? "setting_key" : activeTable === "gallery_photos" ? "title" : "name";
  const { data, error } = await adminDb.from(activeTable).select("*").order(sortField, { ascending: true });
  if (error) {
    statusText("list-status", "Não foi possível carregar. Confira a migration de administração no Supabase.", true);
    return;
  }
  statusText("list-status", data.length ? `${data.length} registro(s)` : "Nenhum registro ainda.");
  const records = byId("records");
  data.forEach((row) => {
    const item = document.createElement("article");
    item.className = "record";
    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = labelFor(row);
    const state = document.createElement("span");
    state.className = `badge ${row.is_published ? "published" : "draft"}`;
    state.textContent = row.is_published == null ? "Ativo" : row.is_published ? "Publicado" : "Rascunho";
    text.append(title, state);
    const actions = document.createElement("div");
    actions.className = "record-actions";
    const edit = document.createElement("button");
    edit.type = "button"; edit.className = "secondary"; edit.textContent = "Editar";
    edit.addEventListener("click", () => openForm(row));
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "danger"; remove.textContent = "Excluir";
    remove.addEventListener("click", () => deleteRecord(row));
    actions.append(edit, remove);
    if (activeTable === "gallery_photos") {
      const copy = document.createElement("button"); copy.type = "button"; copy.className = "secondary"; copy.textContent = "Copiar endereço";
      copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(row.image_path); statusText("list-status", "Endereço da imagem copiado."); } catch { statusText("list-status", row.image_path); } });
      actions.append(copy);
    }
    item.append(text, actions);
    records.append(item);
  });
}

function openForm(record = null) {
  currentRecord = record;
  const section = sections[activeTable];
  byId("form-title").textContent = record ? `Editar ${section.singular}` : `Novo ${section.singular}`;
  const form = byId("record-form");
  form.replaceChildren();
  section.fields.forEach(([name, label, type, required]) => {
    const wrapper = document.createElement("div");
    wrapper.className = type === "checkbox" ? "field checkbox-field" : "field";
    const controlId = `field-${name}`;
    const labelEl = document.createElement("label");
    labelEl.htmlFor = controlId;
    labelEl.textContent = label;
    let input;
    if (type === "textarea") {
      input = document.createElement("textarea"); input.rows = 3;
    } else if (type === "category") {
      input = document.createElement("select");
      [["praias", "Praias"], ["natureza", "Natureza"], ["cultura", "Cultura"], ["gastronomia", "Gastronomia"]].forEach(([value, text]) => {
        const option = document.createElement("option"); option.value = value; option.textContent = text; input.append(option);
      });
    } else if (type === "image") {
      input = document.createElement("input"); input.type = "file"; input.accept = "image/jpeg,image/png,image/webp,image/avif";
      if (required && !record?.[name]) input.required = true;
      const preview = document.createElement("img");
      preview.className = "image-preview";
      preview.alt = "Prévia da foto atual ou selecionada";
      preview.hidden = !imagemPermitida(record?.[name]);
      if (!preview.hidden) preview.src = record[name];
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file) { preview.src = URL.createObjectURL(file); preview.hidden = false; }
      });
      wrapper.append(labelEl, input, preview);
      form.append(wrapper);
      return;
    } else {
      input = document.createElement("input"); input.type = type === "checkbox" ? "checkbox" : type;
    }
    input.id = controlId; input.name = name;
    if (required) input.required = true;
    if (type === "checkbox") input.checked = record ? Boolean(record[name]) : false;
    else if (record?.[name] != null) input.value = record[name];
    if (type === "checkbox") wrapper.append(input, labelEl);
    else wrapper.append(labelEl, input);
    form.append(wrapper);
  });
  const actions = document.createElement("div"); actions.className = "form-actions";
  const save = document.createElement("button"); save.type = "submit"; save.textContent = "Salvar";
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "secondary"; cancel.textContent = "Cancelar";
  cancel.addEventListener("click", () => { byId("form-card").hidden = true; });
  actions.append(save, cancel); form.append(actions);
  statusText("form-status", "");
  byId("form-card").hidden = false;
  byId("form-card").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteRecord(record) {
  if (!window.confirm(`Excluir “${labelFor(record)}”?`)) return;
  const idField = sections[activeTable].idField || "id";
  const { error } = await adminDb.from(activeTable).delete().eq(idField, record[idField]);
  if (error) statusText("list-status", "Não foi possível excluir este registro.", true);
  else await loadRecords();
}

async function callTeamApi(body) {
  const { data: { session } } = await adminDb.auth.getSession();
  const { data, error } = await adminDb.functions.invoke("admin-team", { body, headers: { Authorization: `Bearer ${session.access_token}` } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

async function loadTeam() {
  statusText("team-status", "Carregando equipe...");
  try {
    const { members } = await callTeamApi({ action: "list" });
    const list = byId("team-records"); list.replaceChildren();
    members.forEach(member => {
      const row = document.createElement("article"); row.className = "record";
      const info = document.createElement("div"); const email = document.createElement("strong"); email.textContent = member.email;
      const role = document.createElement("span"); role.className = "badge published"; role.textContent = member.role;
      info.append(email, role); row.append(info);
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "danger"; remove.textContent = "Remover acesso";
      remove.addEventListener("click", async () => {
        if (!window.confirm(`Remover o acesso de ${member.email}?`)) return;
        try { await callTeamApi({ action: "remove", user_id: member.user_id }); await loadTeam(); }
        catch (e) { statusText("team-status", e.message || "Não foi possível remover o acesso.", true); }
      }); row.append(remove); list.append(row);
    });
    statusText("team-status", `${members.length} pessoa(s) com acesso.`);
  } catch (e) { statusText("team-status", e.message || "Não foi possível carregar a equipe.", true); }
}

byId("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  statusText("login-status", "Entrando...");
  const { error } = await adminDb.auth.signInWithPassword({ email: byId("email").value, password: byId("password").value });
  if (error) statusText("login-status", "Não foi possível entrar. Confira o e-mail e a senha.", true);
});

byId("logout-button").addEventListener("click", () => adminDb.auth.signOut());
byId("new-button").addEventListener("click", () => openForm());
byId("record-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {};
  sections[activeTable].fields.forEach(([name, , type]) => {
    const input = event.currentTarget.elements.namedItem(name);
    if (type === "checkbox") payload[name] = input.checked;
    else if (type === "image") payload[name] = currentRecord?.[name] ?? null;
    else payload[name] = formData.get(name)?.toString().trim() || null;
  });
  statusText("form-status", "Salvando...");
  const imageInput = event.currentTarget.elements.namedItem("image_path");
  const imageFile = imageInput?.files?.[0];
  if (imageFile) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024) {
      statusText("form-status", "Escolha uma imagem JPEG, PNG, WebP ou AVIF de até 5 MB.", true);
      return;
    }
    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[imageFile.type];
    const objectPath = `${activeTable}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await adminDb.storage.from("site-images").upload(objectPath, imageFile, {
      cacheControl: "3600", upsert: false, contentType: imageFile.type
    });
    if (uploadError) {
      statusText("form-status", "Não foi possível enviar a foto. Confira a migration de armazenamento no Supabase.", true);
      return;
    }
    payload.image_path = adminDb.storage.from("site-images").getPublicUrl(objectPath).data.publicUrl;
  }
  const idField = sections[activeTable].idField || "id";
  const query = currentRecord
    ? adminDb.from(activeTable).update(payload).eq(idField, currentRecord[idField])
    : adminDb.from(activeTable).insert(payload);
  const { error } = await query;
  if (error) statusText("form-status", "Não foi possível salvar. Confira os campos e as permissões do banco.", true);
  else { byId("form-card").hidden = true; await loadRecords(); }
});

byId("team-form").addEventListener("submit", async event => {
  event.preventDefault(); statusText("team-status", "Enviando convite...");
  try { await callTeamApi({ action: "invite", email: byId("team-email").value.trim(), role: byId("team-role").value }); byId("team-form").reset(); statusText("team-status", "Convite enviado."); await loadTeam(); }
  catch (e) { statusText("team-status", e.message || "Não foi possível enviar o convite.", true); }
});

initialize();
