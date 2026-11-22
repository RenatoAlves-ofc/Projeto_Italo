// express é o framework q cria o servidor e as rotas (get, post, put, delete)
const express = require('express');
// mysql é a biblioteca q liga o node no banco de dados do xampp
const mysql = require('mysql');
// cors deixa o react (porta 5173) conversar com a api (porta 3000) | sem ele o navegador bloqueia a requisiçao
const cors = require('cors');

// app é o servidor em si | tudo q a api faz é em cima dele
const app = express();



// libera pra qualquer endereço acessar a api
app.use(cors());
// faz o servidor entender o json q o react manda no body
app.use(express.json());
// faz entender tbm os dados q vem de formulario normal
app.use(express.urlencoded({ extended: true }));



// dados pra fazer a conecxao com o banco | no xampp o user é root e a senha vem vazia
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lanchonete', // nome do banco q criei no phpmyadmin
    charset: 'utf8mb4' // pros acentos n chegarem quebrados
});

// tenta conectar no banco | se der erro mostra no terminal e n liga o servidro
conn.connect(function (err) {
    if (err) {
        console.log('Erro ao conectar ao MySQL:', err);
        return;
    }

    console.log('Conectado ao MySQL');

    // so liga o servidor depois q o banco conectou, pq se n a api ligava sem ter de onde buscar os dados
    app.listen(3000, function () {
        console.log('Servidor rodando em http://localhost:3000');
    });
});

// rota principal | serve so pra testar se a api ta ligada, abre localhost:3000 no navegador
app.get('/', (req, res) => {
    res.json({ mensagem: 'API do cardápio funcionando!' });
});

// GET listar todos os itens | o ORDER BY deixa tudo organizado por categoria e depois por nome
// o req é oq chega do react e o res é a resposta q a api devolve pra ele
app.get('/api/cardapio', (req, res) => {
    const sql = 'SELECT * FROM cardapio ORDER BY categoria, nome';

    conn.query(sql, (err, data) => {
        // err so tem valor se deu problema no banco | 500 é erro do servidor
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao buscar o cardápio' });
        }

        // 200 é q deu certo | manda a lista de itens em json pro react
        res.status(200).json(data);
    });
});

// GET buscar um item so | o :id_item na rota é um valor q muda, o req.params.id_item pega ele da url (ex: /api/cardapio/3)
app.get('/api/cardapio/:id_item', (req, res) => {
    const id_item = req.params.id_item;
    // o ? é preenchido com o valor do colchete | isso protege o banco, n deixa ninguem escrver sql na url
    const sql = 'SELECT * FROM cardapio WHERE id_item = ?';

    conn.query(sql, [id_item], (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao buscar o item' });
        }

        // length 0 é q n achou nenhum item com esse id | 404 é "nao encontrado"
        if (data.length === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        // o data vem como lista, entao o [0] pega o primeiro (e unico) item
        res.status(200).json(data[0]);
    });
});

// POST cadastrar item novo
app.post('/api/cardapio', (req, res) => {
    // pega do body os 4 campos q o react mandou
    const { nome, descricao, preco, categoria } = req.body;

    // 400 é q o usuario mandou errado | se faltar nome, preço ou categoria nem tenta salvar
    if (!nome || !preco || !categoria) {
        return res.status(400).json({ erro: 'Nome, preço e categoria são obrigatórios' });
    }

    // 4 interrogaçoes, uma pra cada campo | a ordem tem q ser a mesma do colchete la embaixo
    const sql = 'INSERT INTO cardapio (nome, descricao, preco, categoria) VALUES (?, ?, ?, ?)';

    conn.query(sql, [nome, descricao, preco, categoria], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao cadastrar o item' });
        }

        // 201 é q foi criado | result.insertId é o id q o banco deu pro item novo (auto_increment)
        res.status(201).json({
            mensagem: 'Item cadastrado com sucesso',
            id_item: result.insertId
        });
    });
});

// PUT atualizar item | igual o post, so q usa o id da url pra saber qual item vai mudar
app.put('/api/cardapio/:id_item', (req, res) => {
    const id_item = req.params.id_item;
    const { nome, descricao, preco, categoria } = req.body;

    if (!nome || !preco || !categoria) {
        return res.status(400).json({ erro: 'Nome, preço e categoria são obrigatórios' });
    }

    // sem o WHERE ele mudava todos os itens do cardapio, por isso tem o id_item no final
    const sql = `
        UPDATE cardapio
        SET nome = ?, descricao = ?, preco = ?, categoria = ?
        WHERE id_item = ?
    `;

    // o id fica por ultmo no colchete pq o ultimo ? é o do WHERE
    conn.query(sql, [nome, descricao, preco, categoria, id_item], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao atualizar o item' });
        }

        // affectedRows é quantas linhas mudaram | se for 0 o id n existe
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        res.status(200).json({ mensagem: 'Item atualizado com sucesso' });
    });
});

// DELETE excluir item pelo id | sem o WHERE apagava o cardapio inteiro
app.delete('/api/cardapio/:id_item', (req, res) => {
    const id_item = req.params.id_item;
    const sql = 'DELETE FROM cardapio WHERE id_item = ?';

    conn.query(sql, [id_item], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao excluir o item' });
        }

        // mesma ideia do put | se n apagou nenhuma linha é pq o id n existe
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        res.status(200).json({ mensagem: 'Item excluído com sucesso' });
    });
});