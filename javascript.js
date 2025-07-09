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
}

function exibirParcelas() {
  const lista = document.getElementById("parcelasList");
  lista.innerHTML = "";

  parcelas.forEach((valor, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>Parcela ${index + 1}: R$ 
        <input type="text" id="valor-${index}" value="${formatMoney(
      valor
    )}" onchange="atualizarParcela(${index})" style="width: 100px;" />
      </span>
      <input type="checkbox" onchange="marcarComoPaga(${index})" ${
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

  const valorPago = parseMoney(document.getElementById(`valor-${index}`).value);
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
      parcelas[i] = novoPMT;
    }
  }

  exibirParcelas();
  atualizarFaltam();
}

function atualizarFaltam() {
  const faltam = parcelas.reduce(
    (acc, val, i) => (parcelasPagas[i] ? acc : acc + val),
    0
  );
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
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("faltam").innerHTML = "";
  document.getElementById("log").innerHTML = "";
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
  mostrarParcelas();
};
