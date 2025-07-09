let parcelas = [];
let saldo = 0;
let juros = 0;
let meta = 0;
let meses = 0;
let mesAtual = 0;

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

  let fator = Math.pow(1 + juros, meses);
  let FV_PV = saldo * fator;
  let pmt = ((meta - FV_PV) * juros) / (fator - 1);

  parcelas = Array(meses).fill(pmt);

  localStorage.setItem("parcelas", JSON.stringify(parcelas));
  localStorage.setItem("saldo", saldo);
  localStorage.setItem("juros", juros);
  localStorage.setItem("meta", meta);
  localStorage.setItem("mesAtual", 0);

  mostrarParcelas();
}

function mostrarParcelas() {
  const list = document.getElementById("parcelasList");
  list.innerHTML = "";
  const parcelas = JSON.parse(localStorage.getItem("parcelas") || "[]");

  const pagos = JSON.parse(localStorage.getItem("pagos") || "{}");
  const valoresEditados = JSON.parse(
    localStorage.getItem("valoresEditados") || "{}"
  );

  console.log("valores editados", valoresEditados);
  for (let i = 0; i < parcelas.length; i++) {
    const valor =
      valoresEditados[i] !== undefined ? valoresEditados[i] : parcelas[i];
    const li = document.createElement("li");
    li.innerHTML = `
        <span>Mês ${i + 1}</span>
        <input type="text" id="valor_${i}" value="${formatMoney(
      valor
    )}" style="width:90px;" />
        <input type="checkbox" id="check_${i}" ${
      pagos[i] ? "checked" : ""
    } onchange="confirmarPagamento(${i})" />
      `;
    list.appendChild(li);
  }

  // Espera o DOM renderizar os inputs antes de calcular o total real
  setTimeout(() => {
    let totalRestante = 0;
    for (let i = 0; i < parcelas.length; i++) {
      const input = document.getElementById(`valor_${i}`);
      let valor = parcelas[i];
      const valorInput = parseMoney(input.value);

      totalRestante += valor;
      if (pagos[i]) {
        totalRestante -= valorInput ;
      }
    }
    console.log("totalRestante", totalRestante);
    document.getElementById("resultado").innerText =
      "Parcela fixa: R$ " + formatMoney(parcelas[0] || 0);
    document.getElementById("faltam").innerText =
      "Total restante: R$ " + formatMoney(totalRestante);
  }, 100);
}

function confirmarPagamento(index) {
  const input = document.getElementById(`valor_${index}`);
  const check = document.getElementById(`check_${index}`);
  const valorPago = parseMoney(input.value);

  // salva valor editado SEM alterar o array de parcelas
  let valoresEditados = JSON.parse(
    localStorage.getItem("valoresEditados") || "{}"
  );
  valoresEditados[index] = valorPago;
  localStorage.setItem("valoresEditados", JSON.stringify(valoresEditados));
  
  // marca como pago
  let pagos = JSON.parse(localStorage.getItem("pagos") || "{}");
  pagos[index] = check.checked;
  localStorage.setItem("pagos", JSON.stringify(pagos));

  // soma ao saldo
  let saldo = parseFloat(localStorage.getItem("saldo") || "0");
  saldo += valorPago;
  localStorage.setItem("saldo", saldo);

  // rescalcula parcelas restatante caso tenha marcado
  if(check.checked){
    let parcelas = JSON.parse(localStorage.getItem("parcelas") || "[]");
    let juros = parseFloat(localStorage.getItem("juros") || "0");
    let meta = parseFloat(localStorage.getItem("meta") || "0");

    let mesesRestantes = parcelas.length - (index + 1);
    console.log(mesesRestantes)
    if(mesesRestantes > 0 ){
        let fator = Math.pow(1 + juros, mesesRestantes);
        let FV_PV = saldo * fator;
        let novaParcela = ((meta - FV_PV) * juros) / (fator - 1);
        let novasParcelas = parcelas.map((p, i) =>
            i <= index ? p : novaParcela
    );
    console.log(novasParcelas)
    localStorage.setItem("parcelas", JSON.stringify(novasParcelas));
    }
  }

  mostrarParcelas();
}

function registrarDeposito() {
  let valor =
    parseFloat(prompt("Quanto você depositou este mês?").replace(",", ".")) ||
    0;
  let saldo = parseFloat(localStorage.getItem("saldo") || "0");
  saldo += valor;
  localStorage.setItem("saldo", saldo);
  document.getElementById("log").innerText =
    "Depósito registrado: R$ " + formatMoney(valor);
  mostrarParcelas();
}

function resetar() {
  localStorage.clear();
  parcelas = [];
  document.getElementById("parcelasList").innerHTML = "";
  document.getElementById("resultado").innerText = "";
  document.getElementById("faltam").innerText = "";
  document.getElementById("log").innerText = "Resetado com sucesso.";
}

// Aplicar máscara
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
