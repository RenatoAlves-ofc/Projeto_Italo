const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();


// ==========================================
// MIDDLEWARES
// ==========================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ==========================================
// CONEXÃO COM MYSQL
// ==========================================

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'TESTE'
});

conn.connect(function(err) {

    if (err) {
        console.log('Erro ao conectar ao MySQL:', err);
        return;
    }

    console.log('Conectado ao MySQL');

    app.listen(3000, function() {
        console.log('Servidor rodando em http://localhost:3000');
    });

});


// ==========================================
// ROTA PRINCIPAL
// ==========================================

app.get('/', (req, res) => {

    res.json({
        mensagem: 'API funcionando!'
    });

});


// ==========================================
// GET
// LISTAR TODOS
// ==========================================

app.get('/api/teste', (req, res) => {

    const sql = 'SELECT * FROM teste';

    conn.query(sql, (err, data) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                erro: 'Erro ao buscar os registros'
            });

        }

        res.status(200).json(data);

    });

});


// ==========================================
// GET
// BUSCAR POR ID
// ==========================================

app.get('/api/teste/:id', (req, res) => {

    const id = req.params.id;

    const sql = 'SELECT * FROM teste WHERE id = ?';

    conn.query(sql, [id], (err, data) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                erro: 'Erro ao buscar o registro'
            });

        }

        if (data.length === 0) {

            return res.status(404).json({
                erro: 'Registro não encontrado'
            });

        }

        res.status(200).json(data[0]);

    });

});


// ==========================================
// POST
// CADASTRAR
// ==========================================

app.post('/api/teste', (req, res) => {

    const { nome } = req.body;

    if (!nome || !nome.trim()) {

        return res.status(400).json({
            erro: 'O campo nome é obrigatório'
        });

    }

    const sql = 'INSERT INTO teste (nome) VALUES (?)';

    conn.query(sql, [nome], (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                erro: 'Erro ao inserir o registro'
            });

        }

        res.status(201).json({

            mensagem: 'Registro criado com sucesso',

            id: result.insertId,

            nome: nome

        });

    });

});


// ==========================================
// PUT
// ATUALIZAR
// ==========================================

app.put('/api/teste/:id', (req, res) => {

    const id = req.params.id;

    const { nome } = req.body;

    if (!nome || !nome.trim()) {

        return res.status(400).json({
            erro: 'O campo nome é obrigatório'
        });

    }

    const sql = `
        UPDATE teste
        SET nome = ?
        WHERE id = ?
    `;

    conn.query(sql, [nome, id], (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                erro: 'Erro ao atualizar o registro'
            });

        }

        if (result.affectedRows === 0) {

            return res.status(404).json({
                erro: 'Registro não encontrado'
            });

        }

        res.status(200).json({

            mensagem: 'Registro atualizado com sucesso',

            id: id,

            nome: nome

        });

    });

});


// ==========================================
// DELETE
// EXCLUIR
// ==========================================

app.delete('/api/teste/:id', (req, res) => {

    const id = req.params.id;

    const sql = 'DELETE FROM teste WHERE id = ?';

    conn.query(sql, [id], (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                erro: 'Erro ao excluir o registro'
            });

        }

        if (result.affectedRows === 0) {

            return res.status(404).json({
                erro: 'Registro não encontrado'
            });

        }

        res.status(200).json({

            mensagem: 'Registro excluído com sucesso'

        });

    });

});
