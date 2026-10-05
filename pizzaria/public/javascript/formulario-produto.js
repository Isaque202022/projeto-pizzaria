const formCampos = {
    descricao: document.getElementById('descricao'),
    valor: document.getElementById('valor'),
    id: document.getElementById('id-produto'),
    btnCancelar: document.getElementById('btn-cancelar'),
    btnExcluir: document.getElementById('btn-excluir')
}
let produto = {}
let listaProdutos = null
let produto_antes_da_edicao = null
let estadoFormulario= 'novo'
const formatoMoeda = new Intl.NumberFormat('pt-BR',{
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
})
const maskOptions = {
    mask: Number,
    scale: 2,
    thousandsSeparator: '.',
    min: 0,
    radix: ',',
    padFractionalZeros: true
}
let mask = IMask(formCampos.valor, maskOptions)


function validarFormCampos(){
    if (formCampos.descricao.value.trim() == '') {
        alert('O campo DESCRIÇÃO não pode estar vazio');
        return false;
    }
    if (!Number(mask.unmaskedValue)) {
        alert('Campo VALOR inválido');
        return false;
    }
    return true
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
async function salvar(){
    if (!validarFormCampos()) return; 

    produto.descricao = formCampos.descricao.value.toUpperCase()
    produto.valor = floatToCents(mask.typedValue)
    if (JSON.stringify(produto) == JSON.stringify(produto_antes_da_edicao)) {
        limparEdicao()
        return;
    }     

    let rota = ''
    let metodo = ''
    if(estadoFormulario == 'novo'){
        rota = '/formulario/produto/new'
        metodo = 'POST'
    } else {
        rota = '/formulario/produto/'+produto.id_produto
        metodo = 'PUT'
    }
    
    try {
        const resposta = await fetch(rota,{
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(produto)
        })
        const data = await resposta.json()

        if (!resposta.ok){
            alert('Não foi possível finalizar a tarefa. \n'+data.message)
        }
        else {
            alert(data.message)
            limparEdicao()
            await pegarProdutos()
            renderizarProdutos()
        }
        
    } catch (error) {
        console.log(error)
        alert('Não foi possível acesssar o servidor.')
    }
}
async function pegarProdutos() {
    try {
        const resposta = await fetch('/produtos')
        const data = await resposta.json()
        if (!resposta.ok) {
            alert('Não foi possível carregar os itens.\nErro: '+data.message)
            listaProdutos = null
        }
        else listaProdutos = data;
    } catch (error){
        alert('Não foi possível acessar o servidor\n'+error.message)
    }
}
function renderizarProdutos(){
    let html = ''
    listaProdutos.forEach(produto => {
        html += `
        <tr class="produto">
            <td class="tb-produto-id">${produto.id_produto}</td>
            <td class="tb-produto-descricao">${produto.descricao}</td>
            <td class="tb-produto-valor">${formatoMoeda.format(produto.valor/100)}</td>
            <td class="tb-produto-editar">
                <span onclick="editar(${produto.id_produto},this)">✏️</span>
            </td>
        </tr>`
    });
    document.querySelector('tbody').innerHTML = html
}
async function excluir(){
    const res = confirm('Deseja realmente excluir esse produto?')
    if (!res) return
    try {
        const resposta = await fetch('/produto/'+produto.id_produto,{
            method: 'DELETE'
        })
        const data = await resposta.json()

        if (!resposta.ok){
            console.log(data.message)
            alert('Erro ao excluir \n'+data.message)
        } else {
            alert(data.message)
            limparEdicao()
            await pegarProdutos()
            renderizarProdutos()
        }
    } catch (error) {
        console.log(error)
        alert('Não foi possível acesssar o servidor.')
    }
    
}
function limparEdicao(){
    estadoFormulario = 'novo'
    produto = {}
    produto_antes_da_edicao = {}
    formCampos.id.innerText = '#'
    formCampos.descricao.value = ''
    formCampos.descricao.focus()
    mask.value = ''
    const itemEditando = document.querySelector('.item-editando')
    if(itemEditando) itemEditando.classList.remove('item-editando')
    formCampos.btnCancelar.disabled = true
    formCampos.btnExcluir.disabled = true
}
function cancelar(){
    produto.descricao = formCampos.descricao.value.toUpperCase()
    produto.valor = Number(mask.unmaskedValue)
    if (JSON.stringify(produto) != JSON.stringify(produto_antes_da_edicao)){
        const res = confirm('Alterações feitas não serão salvas. \nDeseja continuar?')
        if (!res) return
    } 
    limparEdicao()
}
function editar(id,lapisEl){
    if (estadoFormulario == 'editando') return;
    estadoFormulario = 'editando'
    produto = {...listaProdutos.find((prod) => prod.id_produto == id)}
    produto_antes_da_edicao = {...produto}
    formCampos.descricao.value = produto.descricao
    formCampos.descricao.focus()
    mask.typedValue = produto.valor/100
    
    formCampos.btnCancelar.disabled = false
    formCampos.btnExcluir.disabled = false
    formCampos.id.innerText = produto.id_produto
    lapisEl.closest('.produto').classList.add('item-editando')
}
async function main() {
    await pegarProdutos()
    renderizarProdutos()
}
main()
