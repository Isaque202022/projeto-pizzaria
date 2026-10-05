const express = require('express')
const app = express()
const database = require('better-sqlite3')
const db = new database('meubanco.db')


try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS CLIENTES (
      id_cliente INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT CHECK (length(cpf) = 11 AND cpf NOT GLOB '[%^0-9%]'),
      telefone TEXT CHECK (length(telefone) = 11 AND telefone NOT GLOB '[%^0-9%]')
    );
    CREATE TABLE IF NOT EXISTS PRODUTOS (
      id_produto INTEGER PRIMARY KEY,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS VENDAS (
      id_venda INTEGER PRIMARY KEY,
      data TEXT NOT NULL CHECK (data GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
      id_cliente INTEGER,
      FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente)
    );
    CREATE TABLE IF NOT EXISTS PAGAMENTOS_VENDA (
      id_pagamento INTEGER PRIMARY KEY,
      forma_pagamento TEXT NOT NULL,
      valor REAL NOT NULL,
      cartao TEXT,
      parcelas INTEGER,
      id_venda INTEGER,
      FOREIGN KEY (id_venda) REFERENCES VENDAS(id_venda)
    );
    CREATE TABLE IF NOT EXISTS ITENS_VENDA (
      id_item_venda INTEGER PRIMARY KEY,
      quantidade INTEGER NOT NULL,
      id_venda INTEGER,
      id_produto INTEGER,
      FOREIGN KEY (id_venda) REFERENCES VENDAS(id_venda),
      FOREIGN KEY (id_produto) REFERENCES PRODUTOS(id_produto)
    );
  `)
} catch (erro) {
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
app.post('/vendas/new',(req,res) => {
  try {
    const dados = req.body
    console.log(dados)
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