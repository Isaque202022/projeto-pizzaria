// Geral - início
const venda = {}
let clientes = []
const navBtns = document.querySelectorAll('.nav-btn')
navBtns[0].classList.add('navegacao-selected')
let btnPaginaAberta = navBtns[0]
const editandoLinhaE = document.querySelector('.editando-linha')
let produtos = []
let carrinho = []
let idItemSelecionado = null
const imaskOptions = {
    valor: {
        mask: Number,
        scale: 2,
        thousandsSeparator: '.',
        padFractionalZeros: true,
        radix: ',',
        min: 0
    },
    qtd: {
        mask: /^\d*$/,
        scale: 0,
    }
}
let carrinhoItemIdDisponivel = []
const formatoMoeda = Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})
let edicaoInputs = {}
const optionsSelectPagamento = {
    bandeiras: [
        // {id:1, bandeira: 'ELO CRÉDITO'},
        // {id:2, bandeira: 'ELO DÉBITO'},
        // {id:3, bandeira: 'MASTERCARD CRÉDITO'},
        // {id:4, bandeira: 'MASTERCARD DÉBITO'},
        // {id:5, bandeira: 'VISA CRÉDITO'},
        // {id:6, bandeira: 'VISA DÉBITO'},
    ],
    formas: [
        // {id:1, forma:'DINHEIRO'},
        // {id:2, forma:'PIX'},
        // {id:3, forma:'CARTÃO'},
    ]
}
const elementosPagamento = {}
let pagamentosLancados = []
let idsDisponiveisPagamentos = []
let totalCarrinho = 0
const dataAtual = new Date()
const data = {
    dia: /^\d$/.test(dataAtual.getDate())? '0'+dataAtual.getDate() : dataAtual.getDate(),
    mes: /^\d$/.test(dataAtual.getMonth()+1)? '0'+(dataAtual.getMonth()+1) : dataAtual.getMonth()+1,
    ano: dataAtual.getFullYear()
}
document.getElementById('data').innerText = `${data.dia}/${data.mes}/${data.ano}`

navBtns.forEach(nav => {
    nav.addEventListener('click', ()=>{
        btnPaginaAberta.classList.remove('navegacao-selected')
        let id = btnPaginaAberta.querySelector('label').htmlFor
        document.getElementById(id).classList.add('esconder')
        nav.classList.add('navegacao-selected')
        btnPaginaAberta = nav
        id = btnPaginaAberta.querySelector('label').htmlFor
        document.getElementById(id).classList.remove('esconder')
        selecionarItem()
        fecharEdicaoCarrinho()
    })
})
function selecionarItem(id, linha){
    if (!editandoLinhaE.classList.contains('esconder')) return
    const previamenteSelecionado = document.querySelector('.selecionado')
    if (previamenteSelecionado) previamenteSelecionado.classList.remove('selecionado')
    if (typeof(id) === 'undefined') {
        idItemSelecionado = null;
        return
    }
    linha.classList.add('selecionado')
    idItemSelecionado = id
}
async function pegarOpcoesPagamento(){
    const resposta = await fetch('/vendas/opcoes-pagamento')
    const dados = await resposta.json()
    optionsSelectPagamento.bandeiras = dados.cartoes
    optionsSelectPagamento.formas = dados.formas_pagamento
}
async function main(){
    await pegarProdutos()
    renderizarProdutos()
    renderizarCarrinho()
    await pegarClientes()
    selecionarCliente(1)
    await pegarOpcoesPagamento()
    preencherSelectsPag()
}
main()
// Geral - fim

// Cardápio - início
async function pegarProdutos(){
    try {
        const resposta = await fetch('/produtos')
        const dados = await resposta.json()
        if (!resposta.ok){
            alert('Erro! Algo deu errado. Não foi possível pegar os produtos.')
            console.log(dados.message)
            return
        }
        produtos = dados
    } catch(error){
        alert('Não foi possível conectar ao servidor.')
        console.log(error)
    }
}
function renderizarProdutos(){
    let html = ''
    produtos.forEach((produto, index) => {
        html += `
        <tr onclick="selecionarItem(${produto.id_produto},this)">
            <td class="prod-num-item">${index+1}</td>
            <td class="prod-id">${produto.id_produto}</td>
            <td class="prod-desc">${produto.descricao}</td>
            <td class="prod-valor">${
                formatoMoeda.format(produto.valor/100)
            }</td>
        </tr>`
    });
    document.getElementById('corpo-navegacao-cardapio').querySelector('tbody').innerHTML = html
}
function addToCart(){
    if (idItemSelecionado == null) {
        alert('Selecione um item do cardápio primeiro.')
        return
    }
    const produto = { ...produtos.find((produto) => produto.id_produto == idItemSelecionado)}
    produto.quantidade = 1

    if (carrinhoItemIdDisponivel.length){
        produto.id_item_carrinho = carrinhoItemIdDisponivel[0]
        carrinhoItemIdDisponivel.splice(0,1)
    } else {
        produto.id_item_carrinho = carrinho.length
    }

    carrinho.push(produto)
    selecionarItem()
    renderizarCarrinho()
}
// Cardápio - fim

// Carrinho - início
function renderizarCarrinho(){
    let html = ''
    totalCarrinho = 0
    carrinho.forEach((produto,index) =>{
        let totalItem = produto.quantidade * produto.valor
        html += `
        <tr onclick="selecionarItem(${produto.id_item_carrinho},this)">
            <td class="prod-num-item">${index+1}</td>
            <td class="prod-id">${produto.id_produto}</td>
            <td class="prod-desc">${produto.descricao}</td>
            <td class="prod-valor">${
                formatoMoeda.format(produto.valor/100)
            }</td>
            <td class="prod-quant">${produto.quantidade}</td>
            <td class="prod-total">${
                formatoMoeda.format(totalItem/100)
            }</td>
        </tr>`
        totalCarrinho += totalItem
    })
    document.getElementById('corpo-navegacao-carrinho').querySelector('tbody').innerHTML = html
    document.getElementById('carrinho-total-geral').innerText = 'R$ '+formatoMoeda.format(totalCarrinho/100)
    atualizarStatusPagamento()
}
function editarCarrinho(){
    if (idItemSelecionado == null) {
        alert('Selecione um item do carrinho primeiro.')
        return
    }
    editandoLinhaE.classList.remove('esconder')
    const produto = carrinho.find((produto) => produto.id_item_carrinho == idItemSelecionado)
    editandoLinhaE.innerHTML = `
        <th></th>
        <th>${produto.id_produto}</th>
        <th>${produto.descricao}</th>
        <th><input id="carrinho-edit-valor" value="${
            formatoMoeda.format(produto.valor)
        }"></th>
        <th><input id="carrinho-edit-qtd" value="${produto.quantidade}"></th>
        <th id="carrinho-edit-total">${formatoMoeda.format(produto.valor * produto.quantidade)}</th>
    `;   
    document.getElementById('btn-cancelar-edicao').classList.remove('esconder') 
    // criar as mascaras dos inputs de editar item carrinho
    edicaoInputs.valor = document.getElementById('carrinho-edit-valor'),
    edicaoInputs.qtd = document.getElementById('carrinho-edit-qtd')
    edicaoInputs.maskQtd = IMask(edicaoInputs.qtd, imaskOptions.qtd)
    edicaoInputs.maskValor = IMask(edicaoInputs.valor, imaskOptions.valor)
    edicaoInputs.qtd.focus()
    edicaoInputs.qtd.select()
    function inputModificado(evento) {
        let [valor,qtd] = [
            Number(edicaoInputs.maskValor.unmaskedValue), 
            Number(edicaoInputs.maskQtd.unmaskedValue)
        ]
        document.getElementById('carrinho-edit-total').innerText = formatoMoeda.format(Math.round(valor * 100 * qtd)/100)
        if (evento.key == 'Enter') {
            salvarEdicao(idItemSelecionado,qtd,valor)
        }
    }
    edicaoInputs.qtd.addEventListener('keyup', inputModificado)
    edicaoInputs.valor.addEventListener('keyup', inputModificado)
}
function salvarEdicao(id,qtd,valor){
    if(!validarCamposEditCart()) return
    const index = carrinho.findIndex(item => item.id_item_carrinho == id)
    carrinho[index].valor = valor
    carrinho[index].quantidade = qtd
    fecharEdicaoCarrinho()
    selecionarItem()
    renderizarCarrinho()
}
function validarCamposEditCart(){
    if (!Number(edicaoInputs.maskQtd.unmaskedValue)) {
        alert('Campo QUANTIDADE inválido!')
        return false;
    }
    if (!Number(edicaoInputs.maskValor.unmaskedValue)) {
        alert('Campo VALOR inválido!')   
        return false;
    }
    return true;
}
function fecharEdicaoCarrinho(){
    idItemSelecionado = null
    editandoLinhaE.classList.add('esconder')
    editandoLinhaE.innerHTML = ''
    document.getElementById('btn-cancelar-edicao').classList.add('esconder') 
    edicaoInputs = {}
    selecionarItem()
}
function removerFromCart(){
    if (idItemSelecionado == null) {
        alert('Selecione um item do carrinho primeiro.')
        return
    }
    const indiceParaRemover = carrinho.findIndex(prod => prod.id_item_carrinho == idItemSelecionado)
    carrinhoItemIdDisponivel.push(idItemSelecionado)
    if (indiceParaRemover !== -1) {
        carrinho.splice(indiceParaRemover, 1); 
    }
    selecionarItem()
    renderizarCarrinho()
}
// Carrinho - fim

// Forma de pagamento - início
elementosPagamento.selectForma = document.getElementById('select-forma-pagamento')
elementosPagamento.inputValor = document.getElementById('input-valor-pagamento')
elementosPagamento.inputMaskValor = IMask(elementosPagamento.inputValor,imaskOptions.valor)
elementosPagamento.selectBandeira = document.getElementById('select-bandeira-pagamento')
elementosPagamento.inputParcelas = document.getElementById('input-parcelas-pagamento')
elementosPagamento.inputMaskParcelas = IMask(elementosPagamento.inputParcelas,imaskOptions.qtd)

// preencher selects
function preencherSelectsPag(){
    elementosPagamento.selectForma.innerHTML = '<option value=""></option>'
    optionsSelectPagamento.formas.forEach(forma => {
        const opt = document.createElement('option')
        opt.value = forma.id_forma_pagamento
        opt.innerText = forma.nome
        elementosPagamento.selectForma.appendChild(opt)
    });
    elementosPagamento.selectBandeira.innerHTML = '<option value=""></option>'
    optionsSelectPagamento.bandeiras.forEach(bandeira => {
        const opt = document.createElement('option')
        opt.value = bandeira.id_cartao
        opt.innerText = bandeira.nome
        elementosPagamento.selectBandeira.appendChild(opt)
    });
}

// ao selecionar o pagamento em cartao, permitir escolher a bandeira
elementosPagamento.selectForma.addEventListener('change',()=>{
    const id = elementosPagamento.selectForma.value
    if (id == '3') { // cartao
        elementosPagamento.selectBandeira.disabled = false
    } else {
        elementosPagamento.selectBandeira.selectedIndex = 0
        elementosPagamento.selectBandeira.disabled = true
        elementosPagamento.inputParcelas.disabled = true
        elementosPagamento.inputMaskParcelas.typedValue = ''
    }
})
// ao selecionar o cartao, se for de crédito, abilitar o input de parcelas
elementosPagamento.selectBandeira.addEventListener('change',()=>{
    if (!ehCredito(elementosPagamento.selectBandeira.value)) {
        elementosPagamento.inputParcelas.disabled = true
        elementosPagamento.inputMaskParcelas.typedValue = ''
    } else {
        elementosPagamento.inputParcelas.disabled = false
    }
})
function renderizarPagamentosLancados() {
    let html = ''
    pagamentosLancados.forEach(pag => {
        html += `
        <tr>
            <td class="pag-forma">
            ${optionsSelectPagamento.formas.find(forma => forma.id_forma_pagamento == pag.forma)?.nome || 'Não existe'}
            </td>
            <td class="pag-valor">${formatoMoeda.format(pag.valor/100)}</td>
            <td class="pag-bandeira">
            ${pag.bandeira ? 
                (optionsSelectPagamento.bandeiras.find(
                    band => band.id_cartao == pag.bandeira
                )?.nome || 'Não existe') : ''}
            </td>
            <td class="pag-parcelas">${pag.parcelas? pag.parcelas : ''}</td>
            <td class="pag-excluir" onclick="excluirPagamento(${pag.id})">🗑️</td>
        </tr>`
    });
    document.getElementById('pagamentos-lancados').querySelector('tbody').innerHTML = html
}
renderizarPagamentosLancados()
function lancarPagamento(){
    if (!validarCamposPagamento()) return
    const pagamento = {
        forma: elementosPagamento.selectForma.value,
        valor: floatToCents(elementosPagamento.inputMaskValor.typedValue),
        bandeira: elementosPagamento.selectBandeira.disabled? null : elementosPagamento.selectBandeira.value,
        parcelas: elementosPagamento.inputParcelas.disabled? null : Number(elementosPagamento.inputMaskParcelas.value)
    }
    if (pagamento.forma != '') pagamento.forma = Number(pagamento.forma);
    if (pagamento.bandeira == '') pagamento.bandeira = null;
    else {
        pagamento.bandeira = Number(pagamento.bandeira)
    }

    if (idsDisponiveisPagamentos.length) {
        pagamento.id = idsDisponiveisPagamentos[0]
        idsDisponiveisPagamentos.splice(0,1)
    } else {
        pagamento.id = pagamentosLancados.length
    }    
    console.log(pagamento)
    pagamentosLancados.push(pagamento)
    renderizarPagamentosLancados()
    limparFormularioPagamento()
    atualizarStatusPagamento()
}
function ehCredito(valor){
    const texto = optionsSelectPagamento.bandeiras.find(b => b.id_cartao == valor)?.nome || ''
    if (texto.includes('CRÉDITO')) return true;
    else return false;
}
function validarCamposPagamento() {
    if (elementosPagamento.selectForma.value == ''){
        alert('Escolha a forma de pagamento')
        return false
    }
    if (!elementosPagamento.inputMaskValor.typedValue) {
        alert('Informe o valor')
        return false
    }
    if (elementosPagamento.selectForma.value == '3'){
        if (elementosPagamento.selectBandeira.value == ''){
            alert('Informe a bandeira do cartão')
            return false
        }
        if (ehCredito(elementosPagamento.selectBandeira.value)){
            if (!Number(elementosPagamento.inputMaskParcelas.typedValue)){
                alert('Informe as parcelas')
                return false
            }
        }
    }
    return true
}
function limparFormularioPagamento(){
    elementosPagamento.inputMaskParcelas.typedValue = ''
    elementosPagamento.inputMaskValor.typedValue = ''
    elementosPagamento.selectBandeira.selectedIndex = 0
    elementosPagamento.selectForma.selectedIndex = 0
}
function excluirPagamento(id){
    const index = pagamentosLancados.findIndex(p => p.id == id)
    pagamentosLancados.splice(index,1)
    renderizarPagamentosLancados()
    atualizarStatusPagamento()
}
function atualizarStatusPagamento(){
    const elementos = {
        total: document.getElementById('status-total').querySelector('span'),
        recebido: document.getElementById('status-recebido').querySelector('span'),
        falta: document.getElementById('status-falta').querySelector('span'),
        troco: document.getElementById('status-troco').querySelector('span'),
    }
    // total
    
    elementos.total.innerText = formatoMoeda.format(totalCarrinho/100)
    let total = Math.round(totalCarrinho)

    // recebido
    let recebido = 0
    pagamentosLancados.forEach(p => {
        recebido += p.valor
    });
    elementos.recebido.innerText = formatoMoeda.format(recebido/100)

    // falta
    let falta = 0
    if (total > recebido){
        falta = total - recebido
    }
    elementos.falta.innerText = formatoMoeda.format(falta/100)

    // troco
    let troco = 0
    if (recebido > total){
        troco = recebido - total
    }
    elementos.troco.innerText = formatoMoeda.format(troco/100)
}
function floatToCents(n) {
    n = String(n)
    if (/[.]/g.test(n)) {
        n = n.replace(/(.*[.]\d\d).*/g,'$1')
        if (/[.]\d$/g.test(n)){
            n = n+'0'
        } 
        n =  n.replace('.','')
    } else {
        n =  n + '00'
    }
    return Number(n)
}
// Forma de pagamento - fim


// campo observações - inicio
function ampliarObservacoes() {
    // document.getElementById('modal-observacoes').open
}
// campo observações - fim

// botoes cabeçalho - inicio
async function salvarVenda(){
    if (carrinho.length == 0){
        alert('Carrinho não pode estar vazio')
        return
    }
    venda.data = `${data.ano}-${data.mes}-${data.dia}`
    const obs = document.getElementById('observacao').value
    venda.observacao = obs? obs : null

    const dados = {
        venda: venda,
        carrinho: carrinho,
        pagamento: pagamentosLancados
    }

    const resposta = await fetch('/vendas/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },        
        body: JSON.stringify(dados)
    })
    const dataResponse = await resposta.json()
    if (!resposta.ok){
        alert('Não foi possível salvar a venda\n'+resposta.ok)
        console.log(dataResponse.message)
    } else {
        alert(dataResponse.message)
    }
}   
async function pegarClientes() {
    const response = await fetch('/clientes')
    const data = await response.json()
    clientes = data
}
function mostrarClientes() {
    const modal = document.getElementById('modal-clientes')
    modal.showModal()
    modal.addEventListener('click', (evento) => {
        const r = modal.getBoundingClientRect();
        
        // Verifica se o clique foi fora das bordas do conteúdo do dialog
        const clicouFora = (
            evento.clientX < r.left ||
            evento.clientX > r.right ||
            evento.clientY < r.top ||
            evento.clientY > r.bottom
        );

        if (clicouFora) {
            modal.close();
        }
    });
    renderizarTabelaClientes()
}
function renderizarTabelaClientes() {
    let html = ''
    clientes.forEach((cliente,index) => {
        html += `
        <tr onclick="selecionarCliente(${cliente.id_cliente})">
            <td>${index+1}</td>
            <td>${cliente.id_cliente}</td>
            <td>${cliente.nome}</td>
            <td>${cliente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')}</td>
            <td>${cliente.telefone.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3')}</td>
        </tr>`
    })
    document.getElementById('table-clientes').querySelector('tbody').innerHTML = html
}
function selecionarCliente(id){
    venda.id_cliente = id
    const cliente = clientes.find(c => c.id_cliente == id)
    const elem = document.querySelector('.cliente-selecionado')
    elem.innerText = `${id} - ${cliente.nome}`
    document.getElementById('cliente-cabecalho').innerText = `Cliente: ${id} - ${cliente.nome}`
}

// botoes cabeçalho - fim