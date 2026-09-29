const express = require('express')
const app = express()
const database = require('better-sqlite3')
const db = new database('meubanco.db')

// db.exec('DROP TABLE CLIENTES')

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
`)

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