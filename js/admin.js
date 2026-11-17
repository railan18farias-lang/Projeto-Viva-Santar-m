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
      renderTabs();
      await loadRecords();
    });
    tabs.append(button);
  });
}

function labelFor(row) {
  return row.name || row.title || row.intent || row.slug || "Registro";
}

async function loadRecords() {
  const section = sections[activeTable];
  byId("section-title").textContent = section.title;
  statusText("list-status", "Carregando...");
  byId("records").replaceChildren();
  const sortField = activeTable === "events" ? "starts_at" : activeTable === "assistant_responses" ? "intent" : "name";
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
    state.textContent = row.is_published ? "Publicado" : "Rascunho";
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
  const { error } = await adminDb.from(activeTable).delete().eq("id", record.id);
  if (error) statusText("list-status", "Não foi possível excluir este registro.", true);
  else await loadRecords();
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
  const query = currentRecord
    ? adminDb.from(activeTable).update(payload).eq("id", currentRecord.id)
    : adminDb.from(activeTable).insert(payload);
  const { error } = await query;
  if (error) statusText("form-status", "Não foi possível salvar. Confira os campos e as permissões do banco.", true);
  else { byId("form-card").hidden = true; await loadRecords(); }
});

initialize();
