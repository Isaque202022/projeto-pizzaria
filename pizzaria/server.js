const express = require('express')
const app = express()
const database = require('better-sqlite3')
const db = new database('meubanco.db')


try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS FORMAS_PAGAMENTO (
      id_forma_pagamento INTEGER PRIMARY KEY,
      nome TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS CARTOES (
      id_cartao INTEGER PRIMARY KEY,
      nome TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS CLIENTES (
      id_cliente INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT CHECK (length(cpf) = 11 AND cpf NOT GLOB '[%^0-9%]'),
      telefone TEXT CHECK (length(telefone) = 11 AND telefone NOT GLOB '[%^0-9%]')
    );
    CREATE TABLE IF NOT EXISTS PRODUTOS (
      id_produto INTEGER PRIMARY KEY,
      descricao TEXT NOT NULL,
      valor INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS VENDAS (
      id_venda INTEGER PRIMARY KEY,
      data TEXT NOT NULL CHECK (data GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
      observacao TEXT,
      id_cliente INTEGER,
      FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente)
    );
    CREATE TABLE IF NOT EXISTS PAGAMENTOS_VENDA (
      id_pagamento INTEGER PRIMARY KEY,
      forma_pagamento INTEGER NOT NULL,
      valor INTEGER NOT NULL,
      cartao INTEGER,
      parcelas INTEGER,
      id_venda INTEGER,
      FOREIGN KEY (id_venda) REFERENCES VENDAS(id_venda)
    );
    CREATE TABLE IF NOT EXISTS ITENS_VENDA (
      id_item_venda INTEGER PRIMARY KEY,
      quantidade INTEGER NOT NULL,
      valor INTEGER NOT NULL,
      id_venda INTEGER NOT NULL,
      id_produto INTEGER NOT NULL,
      FOREIGN KEY (id_venda) REFERENCES VENDAS(id_venda),
      FOREIGN KEY (id_produto) REFERENCES PRODUTOS(id_produto)
    );
  `)
} catch (erro) {
  console.log('erro ao executar comandos sqlite linha 55')
  console.log(erro.message)
}
app.set('view engine','ejs')
app.use(express.static('public'))
app.use(express.json())

app.get('/',(req,res) =>{
  res.render('index')
})
// CLIENTE
app.get('/formulario/cliente',(req,res) =>{
  res.render('formulario-cliente')
})
app.post('/formulario/cliente/new',(req,res) => {
  try {
    const cliente = req.body
    console.log('PREPARANDO CLIENTE PARA INSERIR NO BANCO:',cliente)
    const statement = db.prepare('INSERT INTO CLIENTES (nome, cpf, telefone) VALUES (?,?,?)')
    statement.run(cliente.nome, cliente.cpf, cliente.telefone)
    res.status(200).json({message: 'Cliente cadastrado com sucesso!'})
  } catch(error){
    res.status(400).json({message: error.message})
  }
})
app.get('/clientes',(req,res) =>{
  const statement = db.prepare('SELECT * FROM CLIENTES')
  const clientes = statement.all()
  res.json(clientes)
})
app.put('/formulario/cliente/:id',(req,res) =>{
  try {
    const id = req.params.id
    const cliente = req.body
    const statement = db.prepare('UPDATE CLIENTES SET nome =?, cpf =?, telefone =? WHERE id_cliente = ?')
    statement.run(cliente.nome, cliente.cpf, cliente.telefone, id)
    res.status(200).json({message: 'Cliente atualizado com sucesso!'})
  } catch (error) {
    res.status(400).json({message: error.message})
  }
})
app.delete('/cliente/:id',(req,res) =>{
  try {
    const id = req.params.id
    const statement = db.prepare('DELETE FROM CLIENTES WHERE id_cliente = ?')
    statement.run(id)
    res.status(200).json({message: 'Cliente deletado com sucesso!'})
  } catch (error) {
    res.status(400).json({message: error.message})
  }
})
// VENDAS
app.get('/vendas/new',(req,res) =>{
  res.render('venda')
})
app.get('/vendas/opcoes-pagamento',(req,res) => {
  // pegar formas de pagamento e cartoes
  const cartoes = db.prepare('SELECT * FROM CARTOES').all()
  const formas_pagamento = db.prepare('SELECT * FROM FORMAS_PAGAMENTO').all()
  res.json({
    cartoes: cartoes,
    formas_pagamento: formas_pagamento
  })
})
const cadastrarNovaVenda = db.transaction((venda, carrinho, pagamento)=>{
  // venda
  let statement = db.prepare("INSERT INTO VENDAS (id_cliente, data, observacao) VALUES (?,?,?)")
  const resultadoVenda = statement.run(venda.id_cliente, venda.data, venda.observacao)
  const idUltimaVenda = resultadoVenda.lastInsertRowid;
  // itens_venda
  statement = db.prepare("INSERT INTO ITENS_VENDA (id_venda, id_produto,valor,quantidade) VALUES(?,?,?,?)")
  carrinho.forEach(item => {
    statement.run(idUltimaVenda, item.id_produto, item.valor, item.quantidade)
  });
  // pagamento
  statement = db.prepare("INSERT INTO PAGAMENTOS_VENDA (id_venda, forma_pagamento, valor, cartao, parcelas) VALUES(?,?,?,?,?)")
  pagamento.forEach(p => {
    statement.run(idUltimaVenda, p.forma, p.valor, p.bandeira, p.parcelas)
  });
  
})


app.post('/vendas/new',(req,res) => {
  try {
    const dados = req.body
    console.log(dados)
    cadastrarNovaVenda(dados.venda, dados.carrinho, dados.pagamento)
    
    res.status(200).json({message: 'Venda salva com sucesso!'})
  } catch (erro) {
    res.status(400).json({message: erro.message})
  }
})
// PRODUTO
app.get('/formulario/produto',(req,res) =>{
  res.render('formulario-produto')
})
app.post('/formulario/produto/new', (req,res) => {
  try {
    const novoProduto = req.body
    const statement = db.prepare('INSERT INTO PRODUTOS (descricao, valor) VALUES(?,?)')
    statement.run(novoProduto.descricao, novoProduto.valor)
    res.status(200).json({message: 'Produto cadastrado com sucesso!'})
  } catch(error){
    res.json({message: error.message})
  }
})
app.get('/produtos',(req,res) => {
  try {
    const statement = db.prepare('SELECT * FROM PRODUTOS')
    res.status(200).json(statement.all())
  } catch(error){
    res.status(400).json({message: error.message})
  }
})
app.put('/formulario/produto/:id',(req,res) => {
  try {
    const id = req.params.id
    const produto = req.body
    db.prepare(`
      UPDATE PRODUTOS
      SET descricao = ?, valor = ?
      WHERE id_produto = ?  
    `).run(produto.descricao, produto.valor, id)
    res.status(200).json({message: 'Produto atualizado com sucesso!'})
  } catch (error) {
    res.status(400).json({message: error.message})
  }

})
app.delete('/produto/:id', (req,res) => {
  try {
    const id = req.params.id
    db.prepare('DELETE FROM PRODUTOS WHERE id_produto = ?').run(id)
    res.status(200).json({message: 'Produto deletado com sucesso!'})
  } catch (error) {
    res.status(400).json({message: error.message})
  }
})

app.listen(3001, ()=>{
  console.log('App rodando em http://localhost:3001')
})