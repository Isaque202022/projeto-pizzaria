// Geral - início
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
        scale: 0
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
        {id:1, bandeira: 'ELO', cartao: 'CRÉDITO'},
        {id:2, bandeira: 'ELO', cartao: 'DÉBITO'},
        {id:3, bandeira: 'MASTERCARD', cartao: 'CRÉDITO'},
        {id:4, bandeira: 'MASTERCARD', cartao: 'DÉBITO'},
        {id:5, bandeira: 'VISA', cartao: 'CRÉDITO'},
        {id:6, bandeira: 'VISA', cartao: 'DÉBITO'},
    ],
    forma: [
        {id:1, forma:'DINHEIRO'},
        {id:2, forma:'PIX'},
        {id:3, forma:'CARTÃO'},
    ]
}
const elementosPagamento = {}
let pagamentosLancados = []

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
async function main(){
    await pegarProdutos()
    renderizarProdutos()
    renderizarCarrinho()
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
                formatoMoeda.format(produto.valor)
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
    console.log(JSON.stringify(carrinho, null, 2))
}
// Cardápio - fim

// Carrinho - início
function renderizarCarrinho(){
    let html = ''
    let totalGeral = 0
    carrinho.forEach((produto,index) =>{
        html += `
        <tr onclick="selecionarItem(${produto.id_item_carrinho},this)">
            <td class="prod-num-item">${index+1}</td>
            <td class="prod-id">${produto.id_produto}</td>
            <td class="prod-desc">${produto.descricao}</td>
            <td class="prod-valor">${
                formatoMoeda.format(produto.valor)
            }</td>
            <td class="prod-quant">${produto.quantidade}</td>
            <td class="prod-total">${
                formatoMoeda.format(Math.round(produto.valor * 100 * produto.quantidade)/100)
            }</td>
        </tr>`
        totalGeral += Math.round(produto.valor * 100 * produto.quantidade)/100
    })
    document.getElementById('corpo-navegacao-carrinho').querySelector('tbody').innerHTML = html
    document.getElementById('carrinho-total-geral').innerText = 'R$ '+formatoMoeda.format(Math.round(totalGeral*100)/100)
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
elementosPagamento.inputMaksValor = IMask(document.getElementById('input-valor-pagamento'),imaskOptions.valor)
elementosPagamento.selectBandeira = document.getElementById('select-bandeira-pagamento')
elementosPagamento.inputMaskParcelas = IMask(document.getElementById('input-parcelas-pagamento'),imaskOptions.qtd)

function renderizarPagamentosLancados() {
    let html = ''
    pagamentosLancados.forEach(pagamento => {
        html += `
        <tr>
            <td class="pag-forma">dinheiro</td>
            <td class="pag-valor">565416560,00</td>
            <td class="pag-bandeira"></td>
            <td class="pag-parcelas"></td>
            <td class="pag-excluir">🗑️</td>
        </tr>`
    });
    document.getElementById('pagamentos-lancados').querySelector('tbody').innerHTML = html
}
// Forma de pagamento - fim