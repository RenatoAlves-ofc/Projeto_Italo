    set names utf8mb4;
    -- traduzir que tudo que vai chegar no banco de dados seja aceito sem problemas, pra n dar problema de conexao de diferentes caracteres ou emojis chegando corrompidos no servidor

    create database lanchonete character set utf8mb4 collate utf8mb4_general_ci;
    -- ta definindo o tipo de codificação que ele vai aceitar no banco de dados todo, "modelo pai" | "utf8mb4_general_ci" é pra comparar o conjunto de acordo com o "utf8mb4" e usa um algoritmo geral que simplifica, ignorando acentos e deixando indiferente maiuscullo e minusculo

    use lanchonete;

    create table cardapio (
        id_item int not null auto_increment primary key,
        nome varchar(100) not null,
        descricao varchar(255),
        preco decimal(8,2) not null,
        categoria varchar(50) not null
    ) default charset=utf8mb4; -- nao sei se funciona mas coloquei pra garantir que a tabela tambem ficaria como utf8mb4

-- tabela dos usuarios (login e cadastro)
-- o email é UNIQUE pra n deixar cadastrar 2 pessoas com o mesmo email
-- a senha tem 255 pq vai guardada criptografada (o hash fica bem maior q a senha digitada)
-- tipo diz se a pessoa é 'usuario' comum ou 'admin' | todo mundo q se cadastra começa como usuario
-- token é a chave q a api cria quando a pessoa faz login | o react manda ela em toda requisiçao pra api saber quem é
CREATE TABLE usuarios (
  id_usuario INT PRIMARY KEY AUTO_INCREMENT,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  senha      VARCHAR(255) NOT NULL,
  tipo       VARCHAR(10) NOT NULL DEFAULT 'usuario',
  token      VARCHAR(64) NULL
) DEFAULT CHARSET=utf8mb4;

-- tabela dos logs (historico do q cada usuario fez)
-- id_usuario pode ser NULL pq tem log sem usuario (ex: tentativa de login com email q n existe)
-- se o usuario for apagado o log fica e o id_usuario vira NULL (ON DELETE SET NULL)
-- data_hora o proprio mysql preenche com a hora atual
CREATE TABLE  logs (
  id_log     INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NULL,
  acao       VARCHAR(30) NOT NULL,
  detalhe    VARCHAR(255),
  data_hora  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

-- pra virar admin troca o email pelo seu e roda essa linha (so precisa rodar uma vez)
-- UPDATE usuarios SET tipo = 'admin' WHERE email = 'seuemail@exemplo.com';
