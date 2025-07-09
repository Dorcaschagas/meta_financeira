let parcelas = [];
let saldo = 0;
let juros = 0;
let meta = 0;
let meses = 0;
let mesAtual = 0;
let parcelasPagas = [];
let valoresPagos = [];

function parseMoney(str) {
  return parseFloat(str.replaceAll(".", "").replace(",", ".")) || 0;
}

function formatMoney(val) {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcular() {
  saldo = parseMoney(document.getElementById("atual").value);
  meta = parseMoney(document.getElementById("meta").value);
  juros = (parseFloat(document.getElementById("juros").value) || 0) / 100;
  meses = parseInt(document.getElementById("meses").value) || 1;

  document.querySelector(".parcelas").classList.remove("d-none");
  mesAtual = 0;
  parcelasPagas = [];
  valoresPagos = [];

  const fator = Math.pow(1 + juros, meses);
  const FV_PV = saldo * fator;
  const restante = meta - FV_PV;

  const pmt = (restante * juros) / (fator - 1);
  parcelas = Array.from({ length: meses }, () => pmt);

  exibirParcelas();
  atualizarFaltam();
  salvarLocalStorage();
}

function exibirParcelas() {
  document.querySelector(".parcelas").classList.remove("d-none");
  const lista = document.getElementById("parcelasList");
  lista.innerHTML = "";

  parcelas.forEach((valor, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>Parcela ${index + 1}: R$ 
        <input type="text" id="valor-${index}" value="${formatMoney(
      valor
    )}" onchange="atualizarParcela(${index})" />
      </span>
      <input id="checkbox" class="inputCheck" type="checkbox" onchange="marcarComoPaga(${index})" ${
      parcelasPagas[index] ? "checked disabled" : ""
    } />
    `;
    lista.appendChild(li);
  });
}

function atualizarParcela(index) {
  const valorInput = document.getElementById(`valor-${index}`);
  const novoValor = parseMoney(valorInput.value);
  parcelas[index] = novoValor;
  atualizarFaltam();
}

function marcarComoPaga(index) {
  if (parcelasPagas[index]) return;

  const input = document.getElementById(`valor-${index}`);
  const valorPago = parseMoney(input?.value || "0");

  if (isNaN(valorPago) || valorPago <= 0) {
    alert("Valor inválido na parcela " + (index + 1));
    return;
  }

  saldo = saldo * (1 + juros) + valorPago;
  parcelasPagas[index] = true;
  valoresPagos[index] = valorPago;

  const restantes = parcelas.slice(index + 1).length;

  if (restantes > 0) {
    const FV = saldo * Math.pow(1 + juros, restantes);
    const novoRestante = meta - FV;
    const novoPMT =
      (novoRestante * juros) / (Math.pow(1 + juros, restantes) - 1);

    for (let i = index + 1; i < parcelas.length; i++) {
      parcelas[i] = isNaN(novoPMT) || !isFinite(novoPMT) ? 0 : novoPMT;
    }
  }

  exibirParcelas();
  atualizarFaltam();
  salvarLocalStorage();
}

function atualizarFaltam() {
  const parcelasRestantes = parcelas.filter((_, i) => !parcelasPagas[i]).length;
  const parcelasPagasCount = parcelas.length - parcelasRestantes;

  // Saldo com juros reais acumulados até agora
  const saldoComJurosAcumulado = saldo;

  // Projeção futura do saldo se só aplicar os juros no saldo atual
  const saldoProjetado = saldo * Math.pow(1 + juros, parcelasRestantes);

  const faltam = parcelas.reduce(
    (acc, val, i) => (parcelasPagas[i] ? acc : acc + val),
    0
  );

  const saldoAtual = document.getElementById("saldoAtual");
  saldoAtual.innerHTML = `
      <div>Saldo Atual (acumulado): <strong>R$ ${formatMoney(
        saldoComJurosAcumulado
      )}</strong></div>
      <br>
      <div>Projeção futura do saldo atual ao final do perido definido: <strong>R$ ${formatMoney(
        saldoProjetado
      )}</strong></div>
    `;

  const div = document.getElementById("faltam");
  div.innerHTML = `Total restante previsto: <strong>R$ ${formatMoney(
    faltam
  )}</strong>`;
}

function resetar() {
  parcelas = [];
  parcelasPagas = [];
  valoresPagos = [];
  document.getElementById("parcelasList").innerHTML = "";
  document.getElementById("faltam").innerHTML = "";
  document.getElementById("log").innerHTML = "";

  ["atual", "meta", "juros", "meses"].forEach((id) => {
    document.getElementById(id).value = "";
  });

  localStorage.removeItem("metaFinanceira");
  saldo = 0;
}

window.onload = function () {
  document.querySelectorAll(".money").forEach((input) => {
    new Cleave(input, {
      numeral: true,
      numeralThousandsGroupStyle: "thousand",
      delimiter: ".",
      numeralDecimalMark: ",",
      numeralDecimalScale: 2,
    });
  });
  exibirParcelas();
};

window.addEventListener("DOMContentLoaded", () => {
  const salvo = localStorage.getItem("metaFinanceira");
  if (!salvo) return;

  const dados = JSON.parse(salvo);

  document.getElementById("atual").value = dados.atual || "";
  document.getElementById("meta").value = dados.meta || "";
  document.getElementById("juros").value = dados.juros || "";
  document.getElementById("meses").value = dados.meses || "";

  parcelas = dados.parcelas || [];
  parcelasPagas = dados.parcelasPagas || [];
  valoresPagos = dados.valoresPagos || [];

  // Recalcula o saldo baseado nas parcelas pagas
  saldo = parseMoney(dados.atual || "0");
  juros = (parseFloat(dados.juros) || 0) / 100;
  meta = parseMoney(dados.meta || "0");

  for (let i = 0; i < parcelasPagas.length; i++) {
    if (parcelasPagas[i]) {
      const valor = valoresPagos[i] || 0;
      saldo = saldo * (1 + juros) + valor;
    }
  }

  exibirParcelas();
  atualizarFaltam();
});

function salvarLocalStorage() {
  const dados = {
    atual: document.getElementById("atual").value,
    meta: document.getElementById("meta").value,
    juros: document.getElementById("juros").value,
    meses: document.getElementById("meses").value,
    parcelas: parcelas,
    parcelasPagas: parcelasPagas,
    valoresPagos: valoresPagos,
  };
  localStorage.setItem("metaFinanceira", JSON.stringify(dados));
}
