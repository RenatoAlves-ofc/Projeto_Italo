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

