create database biblioteca;
use biblioteca;

create table usuario(
id_usuario int primary key not null auto_increment,
nome varchar (100) not null check(length(nome)>=10) unique,
email varchar (150) unique not null,
senha varchar (300) not null check(length(senha)>=8),
perfil enum('bibliotecario', 'leitor') not null
);

create table livros(
id_livro int primary key not null auto_increment,
titulo varchar(250) not null,
autor varchar(150) not null,
ano_publicacao int,
quantidade_disponivel int not null
);

create table emprestimos(
id_emprestimo int primary key not null auto_increment,
id_livro int,
id_usuario int,
data_emprestimo date not null,
data_devolucao_prevista date not null,
data_devolucao_real date,
status_livro varchar(20) check(status_livro in ('ativo', 'devolvido', 'atrasado')) not null default 'ativo',
foreign key (id_livro) references livros (id_livro),
foreign key (id_usuario) references usuario (id_usuario)
);




