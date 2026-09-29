const formCampos = {
    nome: document.getElementById('nome'),
    cpf: document.getElementById('cpf'),
    telefone: document.getElementById('telefone'),
    id: document.getElementById('id-cliente'),
    btnCancelar: document.getElementById('btn-cancelar'),
    btnExcluir: document.getElementById('btn-excluir')
}
let cliente = {}
let listaClientes = null
let cliente_antes_da_edicao = null
let estadoFormulario= 'novo'

const maskCpf = IMask(formCampos.cpf, {
    mask: '000.000.000-00'
})
const maskTelefone = IMask(formCampos.telefone, {
    mask: '(00) 00000-0000'
})


function validarFormCampos(){
    if (formCampos.nome.value.trim() == '') {
        alert('O campo NOME não pode estar vazio');
        return false;
    }
    if (!Number(maskCpf.unmaskedValue) || !/^\d{11}$/g.test(maskCpf.unmaskedValue)) {
        alert('Campo CPF inválido');
        return false;
    }
    if (!Number(maskTelefone.unmaskedValue) || !/^\d{11}$/g.test(maskTelefone.unmaskedValue)) {
        alert('Campo TELEFONE inválido');
        return false;
    }
    return true
}
async function salvar(){
    if (!validarFormCampos()) return; 

    prepararObjeto()

    if (JSON.stringify(cliente) == JSON.stringify(cliente_antes_da_edicao)) {
        limparEdicao()
        return;
    }     

    let rota = ''
    let metodo = ''
    if(estadoFormulario == 'novo'){
        rota = '/formulario/cliente/new'
        metodo = 'POST'
    } else {
        rota = '/formulario/cliente/'+cliente.id_cliente
        metodo = 'PUT'
    }
    
    try {
        const resposta = await fetch(rota,{
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cliente)
        })
        const data = await resposta.json()

        if (!resposta.ok){
            alert('Não foi possível finalizar a tarefa. \n'+data.message)
        }
        else {
            alert(data.message)
            limparEdicao()
            await pegarClientes()
            renderizarClientes()
        }
        
    } catch (error) {
        console.log(error)
        alert('Não foi possível acesssar o servidor.')
    }
}
async function pegarClientes() {
    try {
        const resposta = await fetch('/clientes')
        const data = await resposta.json()
        if (!resposta.ok) {
            console.log(data.message)
            alert('Não foi possível carregar os clientes.\nErro: '+data.message)
            listaClientes = null
        }
        else listaClientes = data;
    } catch (error){
        alert('Não foi possível acessar o servidor\n'+error.message)
    }
}
function renderizarClientes(){
    let html = ''
    listaClientes.forEach(cliente => {
        html += `
        <tr class="cliente">
            <td class="tb-cliente-id">${cliente.id_cliente}</td>
            <td class="tb-cliente-nome">${cliente.nome}</td>
            <td class="tb-cliente-cpf">${cliente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')}</td>
            <td class="tb-cliente-telefone">${cliente.telefone.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3')}</td>
            <td class="tb-cliente-editar">
                <span onclick="editar(${cliente.id_cliente},this)">✏️</span>
            </td>
        </tr>`
    });
    document.querySelector('tbody').innerHTML = html
}
async function excluir(){
    const res = confirm('Deseja realmente excluir esse produto?')
    if (!res) return
    try {
        const resposta = await fetch('/cliente/'+cliente.id_cliente,{
            method: 'DELETE'
        })
        const data = await resposta.json()

        if (!resposta.ok){
            console.log(data.message)
            alert('Erro ao excluir \n'+data.message)
        } else {
            alert(data.message)
            limparEdicao()
            await pegarClientes()
            renderizarClientes()
        }
    } catch (error) {
        console.log(error)
        alert('Não foi possível acesssar o servidor.')
    }
    
}
function limparEdicao(){
    estadoFormulario = 'novo'
    cliente = {}
    cliente_antes_da_edicao = {}
    formCampos.id.innerText = '#'
    formCampos.nome.value = ''
    formCampos.nome.focus()
    maskCpf.value = ''
    maskTelefone.value = ''
    const itemEditando = document.querySelector('.item-editando')
    if(itemEditando) itemEditando.classList.remove('item-editando')
    formCampos.btnCancelar.disabled = true
    formCampos.btnExcluir.disabled = true
}
function prepararObjeto(){
    cliente.nome = formCampos.nome.value.toUpperCase()
    cliente.cpf = maskCpf.unmaskedValue
    cliente.telefone = maskTelefone.unmaskedValue
}
function cancelar(){
    prepararObjeto()
    if (JSON.stringify(cliente) != JSON.stringify(cliente_antes_da_edicao)){
        const res = confirm('Alterações feitas não serão salvas. \nDeseja continuar?')
        if (!res) return
    } 
    limparEdicao()
}
function editar(id,lapisEl){
    if (estadoFormulario == 'editando') return;
    estadoFormulario = 'editando'
    cliente = {...listaClientes.find((c) => c.id_cliente == id)}
    cliente_antes_da_edicao = {...cliente}
    formCampos.nome.value = cliente.nome
    formCampos.nome.focus()
    maskCpf.value = cliente.cpf
    maskTelefone.value = cliente.telefone
    
    formCampos.btnCancelar.disabled = false
    formCampos.btnExcluir.disabled = false
    formCampos.id.innerText = cliente.id_cliente
    lapisEl.closest('.cliente').classList.add('item-editando')
}
async function main() {
    await pegarClientes()
    renderizarClientes()
}
main()
