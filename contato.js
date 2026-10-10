// Formulário de contato: envia sem sair da página; sem JavaScript, o formulário funciona do jeito normal
(function () {
  var form = document.querySelector('.form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var assunto = form.querySelector('#f-assunto');
  var grupoCafe = form.querySelector('.grupo-cafe');
  var estado = form.querySelector('#f-estado');
  var cidade = form.querySelector('#f-cidade');
  var campoOutra = form.querySelector('#campo-outra');
  var outra = form.querySelector('#f-outra');
  var tel = form.querySelector('#f-tel');

  function opcao(valor, texto, desligada) {
    var o = document.createElement('option');
    o.value = valor; o.textContent = texto;
    if (desligada) { o.disabled = true; o.selected = true; }
    return o;
  }
  function mostrarCafe() {
    var ehCafe = assunto.value === 'cafeteria';
    grupoCafe.hidden = !ehCafe;
    grupoCafe.querySelectorAll('[data-cafe-obrigatorio]').forEach(function (c) { c.required = ehCafe; });
    outra.required = ehCafe && cidade.value === '__outra';
  }
  function mostrarOutra() {
    campoOutra.hidden = cidade.value !== '__outra';
    outra.required = !campoOutra.hidden && assunto.value === 'cafeteria';
  }
  // As cidades de cada estado ficam no próprio site (lista do IBGE), carregadas só quando o estado é escolhido
  estado.addEventListener('change', function () {
    cidade.disabled = true;
    cidade.replaceChildren(opcao('', '...', true));
    fetch(form.dataset.cidades + estado.value + '.json')
      .then(function (r) { return r.json(); })
      .then(function (lista) {
        cidade.replaceChildren(opcao('', cidade.dataset.escolha, true));
        lista.forEach(function (c) { cidade.appendChild(opcao(c, c)); });
        cidade.appendChild(opcao('__outra', cidade.dataset.outra));
      })
      .catch(function () {
        cidade.replaceChildren(opcao('', cidade.dataset.escolha, true), opcao('__outra', cidade.dataset.outra));
      })
      .finally(function () { cidade.disabled = false; mostrarOutra(); });
  });
  cidade.addEventListener('change', mostrarOutra);

  var pedido = new URLSearchParams(location.search).get('assunto');
  if (pedido && assunto.querySelector('option[value="' + pedido + '"]')) assunto.value = pedido;
  assunto.addEventListener('change', mostrarCafe);
  mostrarCafe();

  function telefoneOk() { return !tel.required || tel.value.replace(/\D/g, '').length >= 10; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.querySelectorAll('[aria-invalid]').forEach(function (c) { c.removeAttribute('aria-invalid'); });
    var invalidos = Array.prototype.filter.call(form.querySelectorAll('input, select, textarea'), function (c) {
      return !c.closest('[hidden]') && !c.checkValidity();
    });
    if (!telefoneOk() && invalidos.indexOf(tel) < 0) invalidos.push(tel);
    if (invalidos.length) {
      invalidos.forEach(function (c) { c.setAttribute('aria-invalid', 'true'); });
      status.textContent = status.dataset.falta; status.className = 'form-status erro';
      invalidos[0].focus();
      return;
    }
    var botao = form.querySelector('button');
    botao.disabled = true;
    var dados = {};
    new FormData(form).forEach(function (v, k) { dados[k] = v; });
    if (assunto.value !== 'cafeteria') ['cafeteria', 'estado', 'cidade', 'cidade_outra', 'telefone', 'instagram', 'site'].forEach(function (k) { delete dados[k]; });
    else if (dados.cidade === '__outra') { dados.cidade = dados.cidade_outra; delete dados.cidade_outra; }
    else delete dados.cidade_outra;
    fetch(form.dataset.envio, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(dados) })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function () {
        form.reset();
        cidade.replaceChildren(opcao('', cidade.dataset.antes, true)); cidade.disabled = true;
        mostrarCafe(); mostrarOutra();
        status.textContent = status.dataset.ok; status.className = 'form-status ok';
      })
      .catch(function () { status.textContent = status.dataset.erro; status.className = 'form-status erro'; })
      .finally(function () { botao.disabled = false; });
  });
})();
