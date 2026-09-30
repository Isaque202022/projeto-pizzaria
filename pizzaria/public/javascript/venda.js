const navBtns = document.querySelectorAll('.nav-btn')
navBtns[0].classList.add('navegacao-selected')
let btnPaginaAberta = navBtns[0]
const editandoLinhaE = document.querySelector('.editando-linha')
let produtos = []
let carrinho = []
let idItemSelecionado = null
let carrinhoItemIdDisponivel = []
const formatoMoeda = Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})
let edicaoInputs = {}

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
    const produto = produtos.find((produto) => produto.id_produto == idItemSelecionado)
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
function salvarEdicao(id,qtd,valor){
    if(!validarCamposEditCart()) return
    const index = carrinho.findIndex(item => item.id_item_carrinho == id)
    carrinho[index].valor = valor
    carrinho[index].quantidade = qtd
    fecharEdicaoCarrinho()
    selecionarItem()
    renderizarCarrinho()
}
function editarCarrinho(){
    if (idItemSelecionado == null) {
        alert('Selecione um item do carrinho primeiro.')
        return
    }
    editandoLinhaE.classList.remove('esconder')
    const produto = produtos.find((produto) => produto.id_item_carrinho == idItemSelecionado)
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
    edicaoInputs.maskQtd = IMask(edicaoInputs.qtd, {
        mask: Number,
        scale: 0
    })
    edicaoInputs.maskValor = IMask(edicaoInputs.valor, {
        mask: Number,
        scale: 2,
        thousandsSeparator: '.',
        padFractionalZeros: true,
        radix: ','
    })
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
function renderizarCarrinho(){
    let html = ''
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
                formatoMoeda.format(produto.valor * produto.quantidade)
            }</td>
        </tr>`
    })
    document.getElementById('corpo-navegacao-carrinho').querySelector('tbody').innerHTML = html

}
renderizarCarrinho()

async function main(){
    await pegarProdutos()
    renderizarProdutos()
}
main()