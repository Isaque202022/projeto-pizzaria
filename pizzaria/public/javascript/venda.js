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
    produtos.forEach(produto => {
        html += `
        <tr onclick="selecionarItem(${produto.id_produto},this)">
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
function editarCarrinho(){
    if (idItemSelecionado == null) {
        alert('Selecione um item do carrinho primeiro.')
        return
    }
    editandoLinhaE.classList.remove('esconder')
    const produto = produtos.find((produto) => produto.id_item_carrinho == idItemSelecionado)
    editandoLinhaE.innerHTML = `
        <th>${produto.id_produto}</th>
        <th>${produto.descricao}</th>
        <th><input value="${
            formatoMoeda.format(produto.valor)
        }"></th>
        <th><input value="${produto.quantidade}"></th>
        <th>${formatoMoeda.format(produto.valor * produto.quantidade)}</th>
    `;   
    document.getElementById('btn-cancelar-edicao').classList.remove('esconder') 
}
function fecharEdicaoCarrinho(){
    idItemSelecionado = null
    editandoLinhaE.classList.add('esconder')
    editandoLinhaE.innerHTML = ''
    document.getElementById('btn-cancelar-edicao').classList.add('esconder') 
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
    carrinho.forEach(produto =>{
        html += `
        <tr onclick="selecionarItem(${produto.id_item_carrinho},this)">
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