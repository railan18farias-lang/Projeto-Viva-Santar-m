function mostrarMensagem(categoria) {
    alert("Em breve você poderá conhecer os destinos de " + categoria + " cadastrados no Viva Santarém.");
}

function montarRoteiro() {
    document.getElementById("perola").scrollIntoView({
        behavior: "smooth"
    });

    setTimeout(function() {
        document.getElementById("resposta").innerText =
            "Para montar seu roteiro, a Pérola poderá considerar seus dias disponíveis, interesses, localização e orçamento.";
    }, 500);
}

function perguntar(tipo) {

    const resposta = document.getElementById("resposta");

    if (tipo === "praias") {
        resposta.innerText =
            "A Pérola poderá apresentar praias e balneários de Santarém e região, com informações sobre localização, acesso e atividades.";
    }

    if (tipo === "roteiro") {
        resposta.innerText =
            "Claro! Informe quantos dias você tem, o que gosta de fazer e quanto pretende gastar. A Pérola poderá montar uma sugestão de roteiro.";
    }

    if (tipo === "turismo") {
        resposta.innerText =
            "Você poderá encontrar praias, natureza, cultura, gastronomia, passeios, hospedagens, eventos e outras experiências turísticas.";
    }
}
