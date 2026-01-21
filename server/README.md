# Configuração do Backend (MySQL)

Este é o servidor Node.js que conecta sua aplicação ao banco de dados MySQL.

## Pré-requisitos
1. **MySQL Server** instalado (você pode baixar o [MySQL Installer](https://dev.mysql.com/downloads/installer/) ou usar o [XAMPP](https://www.apachefriends.org/index.html)).
2. Criar um banco de dados chamado `territory_manager`.

## Passo a Passo para Iniciar
1. Abra o seu console do MySQL e execute o conteúdo do arquivo `setup.sql` que está nesta pasta. Isso criará as tabelas necessárias.
2. Certifique-se de que as credenciais no arquivo `.env` (nesta pasta) estão corretas (usuário, senha e nome do banco).
3. No terminal, dentro da pasta `server`, execute:
   ```bash
   npm install
   node index.js
   ```
4. O servidor iniciará na porta `3002`.

## Observação
A aplicação frontend já foi configurada para conversar com este servidor. Enquanto o servidor estiver rodando, todos os dados serão salvos permanentemente no seu MySQL.
