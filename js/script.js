const configurado = window.VIVA_SUPABASE_URL && window.VIVA_SUPABASE_KEY
    && !window.VIVA_SUPABASE_URL.includes("SEU-PROJETO")
    && !window.VIVA_SUPABASE_KEY.includes("SUA_CHAVE_PUBLICA");
const db = configurado && window.supabase
    ? window.supabase.createClient(window.VIVA_SUPABASE_URL, window.VIVA_SUPABASE_KEY)
    : null;

// Complementos imediatos do catálogo; a migration correspondente também os grava no Supabase.
const destinosComplementares = [
    { name: "Sairé de Alter do Chão", category: "cultura", description: "Celebração centenária que reúne fé, memória, música, dança e manifestações populares da comunidade.", location: "Alter do Chão, Santarém, PA", image_path: null, website_url: "https://saireoficial.com.br/" },
    { name: "Museu Dica Frazão", category: "cultura", description: "Espaço dedicado ao artesanato amazônico, com peças feitas de raízes, fibras e sementes.", location: "Rua Wilson Dias da Fonseca, 281 — Centro, Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" },
    { name: "Museu de História e Arte Sacra", category: "cultura", description: "Acervo de peças sacras, objetos e documentos ligados à história religiosa e cultural local.", location: "Av. Barão do Rio Branco, 168 — Centro, Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" },
    { name: "Centro de Artesanato do Tapajós — Cristo Rei", category: "cultura", description: "Espaço de valorização do artesanato regional e de produtos de comunidades locais.", location: "Av. Barão do Rio Branco, 375 — Centro, Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" },
    { name: "Círio de Nossa Senhora da Conceição", category: "cultura", description: "Procissão e manifestação de fé que integra as tradições religiosas e culturais de Santarém.", location: "Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" },
    { name: "Casa do Saulo", category: "gastronomia", description: "Restaurante de culinária tapajônica criado em Santarém pelo chef Saulo Jennings.", location: "Santarém, PA", image_path: null, website_url: "https://casadosaulo.com.br/" },
    { name: "Restaurantes do Igarapé-Açu", category: "gastronomia", description: "Passeio de canoa até restaurantes à beira do rio, como Restaurante da Tica, do Jacaré e Pôr do Sol.", location: "Igarapé-Açu, em frente a Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" },
    { name: "Restaurante da Dona Dulce", category: "gastronomia", description: "Restaurante próximo ao Canal do Jari, conhecido por pratos regionais, incluindo opções com vitória-régia.", location: "Região do Canal do Jari, Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" },
    { name: "Mercadão 2000", category: "gastronomia", description: "Mercado com frutas regionais, peixes, farinha de mandioca, ervas e outros sabores locais.", location: "Av. Professor Antônio Carvalho — Aldeia, Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" },
    { name: "Festival da Tapioca — Boa Esperança", category: "gastronomia", description: "Festival gastronômico realizado na Comunidade Boa Esperança.", location: "Comunidade Boa Esperança, Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" },
    { name: "Festival do Açaí — Santa Luzia", category: "gastronomia", description: "Celebração gastronômica dedicada ao açaí, realizada na Comunidade Santa Luzia.", location: "Comunidade Santa Luzia, Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" },
    { name: "Festival do Charutinho — Ponta de Pedras", category: "gastronomia", description: "Festival que celebra a culinária local na Praia de Ponta de Pedras.", location: "Ponta de Pedras, Santarém, PA", image_path: null, website_url: "https://santarem.pa.gov.br/storage/documents/February2026/bFuTPjDBkOiiLfsytfQ0WWSXUgRgQRj8OCnV6et6.pdf" }
];

function informar(id, texto, erro = false) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.classList.toggle("erro", erro);
}

function pedirConfiguracao() {
    return "Banco de dados ainda não configurado. Preencha a URL e a chave pública em js/config.js.";
}

async function buscarDestinos(categoria) {
    const categoriaNormalizada = categoria.toLowerCase();
    const complementos = destinosComplementares.filter(d => d.category === categoriaNormalizada);
    if (!db) return complementos;
    const { data, error } = await db.from("destinations")
        .select("name, description, location, category, image_path, website_url")
        .eq("category", categoriaNormalizada).order("name");
    if (error && !complementos.length) throw error;

    const registros = (data || []).filter(destino =>
        !(categoriaNormalizada === "praias" && destino.name === "Ponta do Maguari")
    );
    const destinos = new Map(registros.map(destino => [destino.name, destino]));
    complementos.forEach(destino => {
        if (!destinos.has(destino.name)) destinos.set(destino.name, destino);
    });
    return Array.from(destinos.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function imagemDoDestino(destino, classe) {
    const caminho = destino.image_path || "";
    const baseStoragePublica = `${(window.VIVA_SUPABASE_URL || "").replace(/\/$/, "")}/storage/v1/object/public/site-images/`;
    const imagemLocal = caminho.startsWith("images/") && !caminho.includes("..");
    const imagemNoStorage = baseStoragePublica !== "/storage/v1/object/public/site-images/" && caminho.startsWith(baseStoragePublica);
    if (!imagemLocal && !imagemNoStorage) return null;
    const imagem = elemento("img", null, classe);
    imagem.src = caminho;
    imagem.alt = destino.name;
    imagem.loading = "lazy";
    imagem.onerror = function() {
        this.replaceWith(elemento("div", "Foto indisponível", "sem-foto-destino"));
    };
    return imagem;
}

function mostrarListaDestinos(categoria, destinos) {
    const titulo = document.getElementById("titulo-modal-destinos");
    const conteudo = document.getElementById("conteudo-modal-destinos");
    titulo.textContent = `Destinos de ${categoria}`;
    conteudo.replaceChildren();
    if (!destinos.length) {
        conteudo.append(elemento("p", "Ainda não há destinos cadastrados nesta categoria."));
        return;
    }

    const lista = elemento("div", null, "lista-destinos-modal");
    destinos.forEach(destino => {
        const botao = elemento("button", null, "destino-opcao-modal");
        botao.type = "button";
        const imagem = imagemDoDestino(destino);
        if (imagem) botao.append(imagem);
        const texto = elemento("span", null, "destino-opcao-texto");
        texto.append(elemento("strong", destino.name));
        if (destino.location) texto.append(elemento("span", destino.location));
        botao.append(texto);
        botao.addEventListener("click", () => mostrarDetalheDestino(categoria, destino, destinos));
        lista.append(botao);
    });
    conteudo.append(lista);
}

function mostrarDetalheDestino(categoria, destino, destinos) {
    const titulo = document.getElementById("titulo-modal-destinos");
    const conteudo = document.getElementById("conteudo-modal-destinos");
    titulo.textContent = destino.name;
    conteudo.replaceChildren();

    const voltar = elemento("button", `← Voltar aos destinos de ${categoria}`, "voltar-destinos-modal");
    voltar.type = "button";
    voltar.addEventListener("click", () => mostrarListaDestinos(categoria, destinos));
    conteudo.append(voltar);

    const detalhe = elemento("article", null, "detalhe-destino-modal");
    const imagem = imagemDoDestino(destino);
    detalhe.append(imagem || elemento("div", "Foto ainda não cadastrada para este destino.", "sem-foto-destino"));
    detalhe.append(elemento("p", (destino.category || categoria).toUpperCase(), "tag"));
    detalhe.append(elemento("h3", destino.name));
    if (destino.location) detalhe.append(elemento("p", destino.location, "destino-detalhe-local"));
    detalhe.append(elemento("p", destino.description));
    if (destino.website_url?.startsWith("https://")) {
        const link = elemento("a", "Mais informações", "link-rota");
        link.href = destino.website_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        detalhe.append(link);
    }
    conteudo.append(detalhe);
}

async function mostrarMensagem(categoria) {
    const nomes = { Praias: "praias", Natureza: "natureza", Cultura: "cultura", Gastronomia: "gastronomia" };
    const modal = document.getElementById("modal-destinos");
    const titulo = document.getElementById("titulo-modal-destinos");
    const conteudo = document.getElementById("conteudo-modal-destinos");
    titulo.textContent = `Destinos de ${categoria}`;
    conteudo.replaceChildren(elemento("p", "Carregando destinos..."));
    if (!modal.open) modal.showModal();
    try {
        const destinos = await buscarDestinos(nomes[categoria] || categoria.toLowerCase());
        mostrarListaDestinos(categoria, destinos);
    } catch (e) {
        conteudo.replaceChildren(elemento("p", e.message || "Não foi possível consultar os destinos."));
    }
}

document.getElementById("fechar-modal-destinos").addEventListener("click", function() {
    document.getElementById("modal-destinos").close();
});

async function montarRoteiro(evento) {
    if (evento) evento.preventDefault();
    document.getElementById("perola").scrollIntoView({ behavior: "smooth" });
    if (!db) {
        informar("mensagem-roteiro", pedirConfiguracao(), true);
        return;
    }
    const dados = new FormData(document.getElementById("form-roteiro"));
    const pedido = {
        days: Number(dados.get("dias")),
        interest: dados.get("interesse"),
        budget: dados.get("orcamento") ? Number(dados.get("orcamento")) : null
    };
    informar("mensagem-roteiro", "Salvando seu pedido e pedindo uma sugestão à Pérola...");
    try {
        const { error } = await db.from("itinerary_requests").insert(pedido);
        if (error) throw error;
        const pergunta = `Monte uma sugestão de roteiro de ${pedido.days} dia(s) em Santarém e região, com foco em ${pedido.interest}${pedido.budget !== null ? ` e orçamento aproximado de R$ ${pedido.budget}` : ""}. Use os destinos publicados no catálogo do Viva Santarém e avise se alguma informação importante não estiver disponível.`;
        const sugestao = await solicitarRespostaPerola([{ role: "user", content: pergunta }]);
        informar("mensagem-roteiro", `Seu pedido foi salvo. Sugestão da Pérola:\n\n${sugestao}`);
    } catch (e) {
        const mensagem = e.message === "PEROLA_NOT_CONFIGURED"
            ? "Seu pedido foi salvo, mas a Pérola ainda precisa da configuração da função de IA no Supabase."
            : e.message === "ITINERARY_NOT_SAVED"
                ? "Não foi possível salvar seu pedido no banco. Tente novamente."
                : "Seu pedido foi salvo, mas a Pérola não conseguiu responder agora. Tente novamente mais tarde.";
        informar("mensagem-roteiro", mensagem, true);
    }
}

const historicoPerola = [];

function registrarMensagemPerola(texto, autor) {
    const conversa = document.getElementById("conversa-perola");
    const mensagem = elemento("p", texto, `mensagem-perola ${autor === "user" ? "mensagem-visitante" : "mensagem-assistente"}`);
    conversa.append(mensagem);
    conversa.scrollTop = conversa.scrollHeight;
}

async function solicitarRespostaPerola(mensagens) {
    if (!db) throw new Error("PEROLA_NOT_CONFIGURED");
    const { data, error } = await db.functions.invoke("perola-chat", { body: { messages: mensagens } });
    if (error) throw error;
    if (!data || typeof data.answer !== "string") throw new Error("Resposta inválida da Pérola.");
    return data.answer;
}

async function enviarMensagemPerola(texto) {
    const pergunta = texto.trim();
    if (!pergunta) return;
    historicoPerola.push({ role: "user", content: pergunta });
    const mensagens = historicoPerola.slice(-8);
    registrarMensagemPerola(pergunta, "user");
    const status = document.getElementById("status-perola");
    const botao = document.querySelector("#form-perola button[type='submit']");
    botao.disabled = true;
    status.textContent = "A Pérola está pensando...";
    try {
        const resposta = await solicitarRespostaPerola(mensagens);
        historicoPerola.push({ role: "assistant", content: resposta });
        registrarMensagemPerola(resposta, "assistant");
        status.textContent = "";
    } catch (e) {
        historicoPerola.pop();
        status.textContent = e.message === "PEROLA_NOT_CONFIGURED"
            ? "A IA ainda não está configurada no Supabase."
            : "Não consegui falar com a Pérola agora. Tente novamente mais tarde.";
    } finally {
        botao.disabled = false;
        document.getElementById("entrada-perola").focus();
    }
}

function perguntar(tipo) {
    const perguntas = {
        praias: "Quais praias de Santarém e região você recomenda e o que posso fazer nelas?",
        roteiro: "Quero montar um roteiro em Santarém. Faça algumas perguntas para entender o que eu gosto.",
        turismo: "O que posso fazer em Santarém e região?"
    };
    if (perguntas[tipo]) enviarMensagemPerola(perguntas[tipo]);
}

document.getElementById("form-perola").addEventListener("submit", function(evento) {
    evento.preventDefault();
    const entrada = document.getElementById("entrada-perola");
    const pergunta = entrada.value;
    entrada.value = "";
    enviarMensagemPerola(pergunta);
});

function elemento(tag, texto, classe) {
    const item = document.createElement(tag);
    if (texto) item.textContent = texto;
    if (classe) item.className = classe;
    return item;
}

async function carregarEventos() {
    if (!db) return;
    const area = document.getElementById("eventos-publicados");
    try {
        const hoje = new Date().toISOString().slice(0, 10);
        const { data, error } = await db.from("events").select("name, description, starts_at, ends_at, location, city, image_path, website_url")
            .eq("is_published", true).or(`ends_at.gte.${hoje},ends_at.is.null`).order("starts_at").limit(5);
        if (error) throw error;
        area.replaceChildren();
        if (!data.length) { area.append(elemento("p", "Não há eventos futuros publicados no momento.")); return; }
        data.forEach((evento, index) => {
            const article = elemento("article", null, "evento-destaque");
            const imagemEvento = elemento("div", null, "evento-imagem");
            const caminhoImagem = evento.image_path || "";
            const baseStoragePublica = `${(window.VIVA_SUPABASE_URL || "").replace(/\/$/, "")}/storage/v1/object/public/site-images/`;
            if ((caminhoImagem.startsWith("images/") && !caminhoImagem.includes("..")) || caminhoImagem.startsWith(baseStoragePublica)) {
                const urlImagem = new URL(caminhoImagem, document.baseURI).href;
                imagemEvento.style.backgroundImage = `linear-gradient(90deg, rgba(8, 34, 25, .92), rgba(8, 34, 25, .25)), linear-gradient(0deg, rgba(8, 34, 25, .72), transparent 60%), url(${JSON.stringify(urlImagem)})`;
            }
            article.append(imagemEvento);
            const dataEvento = elemento("div", null, "data-evento");
            const inicio = new Date(`${evento.starts_at}T12:00:00`);
            const fim = evento.ends_at ? new Date(`${evento.ends_at}T12:00:00`) : inicio;
            const dias = elemento("span", inicio.getMonth() === fim.getMonth() ? `${inicio.getDate()}–${fim.getDate()}` : `${inicio.getDate()}/${inicio.getMonth()+1}–${fim.getDate()}/${fim.getMonth()+1}`);
            dataEvento.append(dias, document.createTextNode(inicio.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).toUpperCase()));
            article.append(dataEvento);
            const conteudo = elemento("div", null, "evento-conteudo");
            conteudo.append(elemento("p", index === 0 ? "EM DESTAQUE" : "AGENDA", "selo-evento"));
            conteudo.append(elemento("p", `${evento.location} · ${evento.city}, PA`.toUpperCase(), "local-evento"));
            conteudo.append(elemento("h3", evento.name));
            conteudo.append(elemento("p", evento.description));
            if (evento.website_url?.startsWith("https://")) {
                const link = elemento("a", "Ver informações oficiais", "link-evento");
                link.href = evento.website_url; link.target = "_blank"; link.rel = "noopener noreferrer"; conteudo.append(link);
            }
            article.append(conteudo); area.append(article);
        });
    } catch (e) { area.replaceChildren(elemento("p", "Não foi possível carregar os eventos do banco.")); }
}

async function carregarRota() {
    if (!db) return;
    try {
        const { data, error } = await db.from("featured_routes").select("title, origin, destination, transport, estimated_duration, description, maps_url")
            .eq("slug", "hotel-acay-maguari").eq("is_published", true).maybeSingle();
        if (error) throw error;
        if (!data) return;
        document.getElementById("rota-titulo").textContent = data.title;
        document.getElementById("rota-origem").textContent = data.origin;
        document.getElementById("rota-destino").textContent = data.destination;
        document.getElementById("rota-transporte").textContent = `DE ${data.transport || "TRANSPORTE"}`.toUpperCase();
        document.getElementById("rota-duracao").textContent = data.estimated_duration || "Consulte o percurso";
        document.getElementById("rota-descricao").textContent = data.description;
        if (data.maps_url?.startsWith("https://")) document.getElementById("rota-mapas").href = data.maps_url;
    } catch (e) { console.error("Não foi possível carregar a rota:", e.message); }
}

document.getElementById("form-cadastro").addEventListener("submit", async function(evento) {
    evento.preventDefault();
    if (!db) { informar("mensagem-cadastro", pedirConfiguracao(), true); return; }
    const valores = Object.fromEntries(new FormData(this).entries());
    const pedido = {
        service_type: valores["tipo-servico"], name: valores.nome.trim(), cadastur: valores.cadastur.trim(),
        contact: valores.contato.trim(), email: valores.email.trim()
    };
    informar("mensagem-cadastro", "Enviando solicitação...");
    try {
        const { error } = await db.from("provider_requests").insert(pedido);
        if (error) throw error;
        informar("mensagem-cadastro", "Solicitação salva! A equipe do Viva Santarém entrará em contato para validar o Cadastur.");
        this.reset();
    } catch (e) { informar("mensagem-cadastro", e.message || "Não foi possível enviar. Tente novamente.", true); }
});

document.getElementById("form-roteiro").addEventListener("submit", montarRoteiro);

document.getElementById("form-evento").addEventListener("submit", async function(evento) {
    evento.preventDefault();
    if (!db) { informar("mensagem-evento", pedirConfiguracao(), true); return; }
    const v = Object.fromEntries(new FormData(this).entries());
    informar("mensagem-evento", "Enviando para análise...");
    try {
        const { error } = await db.from("event_submissions").insert({
            name: v.nome.trim(), description: v.descricao.trim(), event_date: v.data || null,
            location: v.local.trim(), city: v.cidade, contact_name: v.contato.trim(), contact_email: v.email.trim()
        });
        if (error) throw error;
        informar("mensagem-evento", "Sugestão enviada para análise da equipe.");
        this.reset();
    } catch (e) { informar("mensagem-evento", e.message || "Não foi possível enviar a sugestão.", true); }
});

carregarEventos();
carregarRota();

// Expõe os manipuladores usados pelos onclicks existentes no HTML.
window.mostrarMensagem = mostrarMensagem;
window.perguntar = perguntar;
