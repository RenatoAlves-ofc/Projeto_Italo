// express é o framework q cria o servidor e as rotas (get, post, put, delete)
const express = require('express');
// mysql é a biblioteca q liga o node no banco de dados do xampp
const mysql = require('mysql');
// cors deixa o react (porta 5173) conversar com a api (porta 3000) | sem ele o navegador bloqueia a requisiçao
const cors = require('cors');
// bcryptjs criptografa a senha antes de guardar no banco | assim ninguem ve a senha real nem olhando a tabela
const bcrypt = require('bcryptjs');
// crypto ja vem junto com o node (n precisa instalar nada) | uso pra gerar o token do login
const crypto = require('crypto');

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

// salva uma linha na tabela logs | o id_usuario pode ser null (ex: tentativa de login com email q n existe)
// n tem res aqui de proposito | se der erro no log so mostra no terminal e a rota continua funcionando normal
const registrarLog = (id_usuario, acao, detalhe) => {
    const sql = 'INSERT INTO logs (id_usuario, acao, detalhe) VALUES (?, ?, ?)';

    conn.query(sql, [id_usuario, acao, detalhe], (err) => {
        if (err) {
            console.log('Erro ao salvar o log:', err);
        }
    });
};

// middleware = funcao q roda ANTES da rota | aqui confere se quem chamou ta logado
// o react manda o token no header "Authorization" (Bearer token) | se o token existir no banco a gente sabe quem é a pessoa
const verificarLogin = (req, res, next) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ erro: 'Faça login primeiro' });
    }

    const sql = 'SELECT id_usuario, nome, tipo FROM usuarios WHERE token = ?';

    conn.query(sql, [token], (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao conferir o login' });
        }

        // length 0 = nenhum usuario com esse token (token errado ou a pessoa ja saiu)
        if (data.length === 0) {
            return res.status(401).json({ erro: 'Sessão inválida, faça login de novo' });
        }

        // guarda o usuario dentro do req | assim as rotas de baixo conseguem usar o req.usuario
        req.usuario = data[0];
        // next() libera pra rota de verdade rodar
        next();
    });
};

// outro middleware, esse so deixa passar o admin | 403 é "proibido" (ta logado mas n tem permissao)
// tem q vir DEPOIS do verificarLogin pq usa o req.usuario q ele criou
const somenteAdmin = (req, res, next) => {
    if (req.usuario.tipo !== 'admin') {
        return res.status(403).json({ erro: 'Só o admin pode acessar isso' });
    }

    next();
};

// rota principal | serve so pra testar se a api ta ligada, abre localhost:3000 no navegador
app.get('/', (req, res) => {
    res.json({ mensagem: 'API do cardápio funcionando!' });
});

// POST cadastrar usuario novo
app.post('/api/cadastro', (req, res) => {
    const { nome, senha } = req.body;
    // email em minusculo e sem espaço, pq "Renato@gmail.com" e "renato@gmail.com" tem q ser o mesmo
    const email = (req.body.email || '').trim().toLowerCase();

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }

    if (senha.length < 4) {
        return res.status(400).json({ erro: 'A senha precisa ter pelo menos 4 caracteres' });
    }

    // hashSync transforma a senha num texto embaralhado | o 10 é a força da criptografia
    const senhaCriptografada = bcrypt.hashSync(senha, 10);

    const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';

    conn.query(sql, [nome, email, senhaCriptografada], (err, result) => {
        if (err) {
            // ER_DUP_ENTRY é o erro q o mysql da quando o email ja existe (por causa do UNIQUE) | 409 é "conflito"
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ erro: 'Esse email já está cadastrado' });
            }

            console.log(err);
            return res.status(500).json({ erro: 'Erro ao cadastrar o usuário' });
        }

        registrarLog(result.insertId, 'cadastro', email);

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso',
            id_usuario: result.insertId
        });
    });
});

// POST login | recebe email e senha e confere com oq ta no banco
app.post('/api/login', (req, res) => {
    const { senha } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    // busca so pelo email | a senha n da pra procurar no sql pq ta criptografada, entao compara aqui no node
    const sql = 'SELECT * FROM usuarios WHERE email = ?';

    conn.query(sql, [email], (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao fazer login' });
        }

        // 401 é "n autorizado" | a msg é a mesma pra email errado e senha errada, assim n da pra descobrir quais emails existem
        if (data.length === 0) {
            // email q n existe n tem id_usuario, por isso null | o email digitado vai no detalhe
            registrarLog(null, 'login falhou', email);
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        const usuario = data[0];

        // compareSync compara a senha digitada com a criptografada do banco | devolve true ou false
        const senhaCerta = bcrypt.compareSync(senha, usuario.senha);

        if (!senhaCerta) {
            registrarLog(usuario.id_usuario, 'login falhou', 'senha incorreta');
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        // gera um token aleatorio (48 letras e numeros) | é a "chave" q o react vai mandar nas proximas requisiçoes
        const token = crypto.randomBytes(24).toString('hex');

        // guarda o token no banco, na linha desse usuario | é assim q o verificarLogin descobre quem é
        conn.query('UPDATE usuarios SET token = ? WHERE id_usuario = ?', [token, usuario.id_usuario], (err2) => {
            if (err2) {
                console.log(err2);
                return res.status(500).json({ erro: 'Erro ao fazer login' });
            }

            registrarLog(usuario.id_usuario, 'login', usuario.email);

            // manda de volta id, nome, email, tipo e o token | a senha nunca sai da api
            res.status(200).json({
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo,
                token: token
            });
        });
    });
});

// POST logout | apaga o token do banco, ai ele n serve mais pra nada
app.post('/api/logout', verificarLogin, (req, res) => {
    const sql = 'UPDATE usuarios SET token = NULL WHERE id_usuario = ?';

    conn.query(sql, [req.usuario.id_usuario], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao sair' });
        }

        registrarLog(req.usuario.id_usuario, 'logout', null);
        res.status(200).json({ mensagem: 'Logout feito' });
    });
});

// GET logs | so o admin consegue (por isso os 2 middlewares antes da rota, um depois do outro)
// LEFT JOIN pega o nome do usuario la da tabela usuarios | é LEFT (e n INNER) pq tem log sem usuario e ele n pode sumir da lista
// DESC deixa os mais novos primeiro | LIMIT 300 é pra n pesar a tela quando tiver muito log
app.get('/api/logs', verificarLogin, somenteAdmin, (req, res) => {
    const sql = `
        SELECT logs.id_log, logs.acao, logs.detalhe, logs.data_hora, usuarios.nome
        FROM logs
        LEFT JOIN usuarios ON logs.id_usuario = usuarios.id_usuario
        ORDER BY logs.data_hora DESC, logs.id_log DESC
        LIMIT 300
    `;

    conn.query(sql, (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao buscar os logs' });
        }

        res.status(200).json(data);
    });
});

// GET listar todos os itens | o ORDER BY deixa tudo organizado por categoria e depois por nome
// o req é oq chega do react e o res é a resposta q a api devolve pra ele
app.get('/api/cardapio', verificarLogin, (req, res) => {
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
app.get('/api/cardapio/:id_item', verificarLogin, (req, res) => {
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
app.post('/api/cardapio', verificarLogin, (req, res) => {
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

        registrarLog(req.usuario.id_usuario, 'criar item', nome);

        // 201 é q foi criado | result.insertId é o id q o banco deu pro item novo (auto_increment)
        res.status(201).json({
            mensagem: 'Item cadastrado com sucesso',
            id_item: result.insertId
        });
    });
});

// PUT atualizar item | igual o post, so q usa o id da url pra saber qual item vai mudar
app.put('/api/cardapio/:id_item', verificarLogin, (req, res) => {
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

        registrarLog(req.usuario.id_usuario, 'editar item', nome);

        res.status(200).json({ mensagem: 'Item atualizado com sucesso' });
    });
});

// DELETE excluir item pelo id | sem o WHERE apagava o cardapio inteiro
app.delete('/api/cardapio/:id_item', verificarLogin, (req, res) => {
    const id_item = req.params.id_item;

    // primeiro busca o nome do item, pq depois de apagar n da mais pra saber qual era (e o log precisa do nome)
    conn.query('SELECT nome FROM cardapio WHERE id_item = ?', [id_item], (err, itens) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao excluir o item' });
        }

        // se n achou nenhum item com esse id nem tenta apagar
        if (itens.length === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        const nomeDoItem = itens[0].nome;

        conn.query('DELETE FROM cardapio WHERE id_item = ?', [id_item], (err2) => {
            if (err2) {
                console.log(err2);
                return res.status(500).json({ erro: 'Erro ao excluir o item' });
            }

            registrarLog(req.usuario.id_usuario, 'excluir item', nomeDoItem);

            res.status(200).json({ mensagem: 'Item excluído com sucesso' });
        });
    });
});