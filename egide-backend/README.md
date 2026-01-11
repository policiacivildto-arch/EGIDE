# ÉGIDE Backend - Django REST API

Backend completo da aplicação ÉGIDE (Sistema de Escala e Gestão de Operações da Polícia Civil) desenvolvido com Django e Django REST Framework.

## 📋 Funcionalidades

- **Gerenciamento de Policiais**: Cadastro, edição e controle de oficiais
- **Gestão de Viaturas**: Controle de veículos por delegacia
- **Calendário de Vagas**: Escalação de equipes para operações
- **Registro de Equipes**: Formação e aprovação de equipes para serviços
- **Operações**: Rastreamento de operações realizadas
- **Convóios**: Coordenação de operações conjuntas
- **Admin Panel**: Interface completa de administração Django

## 🛠️ Tecnologias

- **Django 4.2.7** - Framework web
- **Django REST Framework 3.14.0** - API RESTful
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação segura (rest_framework_simplejwt)
- **CORS** - Suporte para requisições cross-origin

## 📦 Instalação

### Pré-requisitos

- Python 3.8+
- PostgreSQL 12+
- pip ou conda

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd egide-backend
   ```

2. **Crie um ambiente virtual**
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # Windows: venv\Scripts\activate
   ```

3. **Instale as dependências**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   DEBUG=True
   SECRET_KEY=sua-chave-secreta-aqui
   ALLOWED_HOSTS=localhost,127.0.0.1,10.18.200.78
   
   # Database PostgreSQL
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=egide_db
   DB_USER=postgres
   DB_PASSWORD=sua_senha_postgres
   DB_HOST=localhost
   DB_PORT=5432
   ```

5. **Crie o banco de dados PostgreSQL**
   ```sql
   CREATE DATABASE egide_db OWNER postgres;
   ```

6. **Execute as migrações**
   ```bash
   python manage.py migrate
   ```

7. **Crie um superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

8. **Inicie o servidor de desenvolvimento**
   ```bash
   python manage.py runserver
   ```

O servidor estará disponível em: `http://localhost:8000`

## 📚 Endpoints da API

### Base URL
```
http://localhost:8000/api/
```

### Autenticação
Todos os endpoints requerem autenticação via JWT Token.

**Obter Token:**
```bash
POST /token/
Content-Type: application/json

{
    "username": "seu_usuario",
    "password": "sua_senha"
}
```

**Usar Token:**
```bash
Authorization: Bearer seu_token_aqui
```

### Recursos Disponíveis

#### Departamentos
- `GET /departamentos/` - Listar departamentos
- `POST /departamentos/` - Criar departamento
- `GET /departamentos/{id}/` - Detalhes
- `PUT /departamentos/{id}/` - Atualizar
- `DELETE /departamentos/{id}/` - Deletar

#### Delegacias
- `GET /delegacias/` - Listar
- `POST /delegacias/` - Criar
- `GET /delegacias/{id}/` - Detalhes
- `PUT /delegacias/{id}/` - Atualizar
- `DELETE /delegacias/{id}/` - Deletar

#### Policiais
- `GET /policiais/` - Listar policiais
- `POST /policiais/` - Criar policial
- `GET /policiais/{id}/` - Detalhes
- `PUT /policiais/{id}/` - Atualizar
- `DELETE /policiais/{id}/` - Deletar
- `POST /policiais/{id}/ativar_desativar/` - Ativar/Desativar (Admin)

#### Viaturas
- `GET /viaturas/` - Listar
- `POST /viaturas/` - Criar
- `GET /viaturas/{id}/` - Detalhes
- `PUT /viaturas/{id}/` - Atualizar
- `DELETE /viaturas/{id}/` - Deletar

#### Vagas
- `GET /vagas/` - Listar vagas
- `POST /vagas/` - Criar vaga
- `GET /vagas/vagas_disponiveis/` - Vagas disponíveis próximos 30 dias
- `GET /vagas/{id}/` - Detalhes
- `PUT /vagas/{id}/` - Atualizar
- `DELETE /vagas/{id}/` - Deletar

#### Equipes
- `GET /equipes/` - Listar equipes
- `POST /equipes/` - Criar equipe
- `GET /equipes/minhas_equipes/` - Minhas equipes (onde sou chefe)
- `POST /equipes/{id}/aprovar/` - Aprovar equipe (Admin)
- `POST /equipes/{id}/rejeitar/` - Rejeitar equipe (Admin)
- `GET /equipes/{id}/` - Detalhes
- `PUT /equipes/{id}/` - Atualizar
- `DELETE /equipes/{id}/` - Deletar

#### Operações
- `GET /operacoes/` - Listar operações
- `POST /operacoes/` - Criar operação
- `POST /operacoes/{id}/finalizar/` - Finalizar operação (Admin)
- `GET /operacoes/{id}/` - Detalhes
- `PUT /operacoes/{id}/` - Atualizar
- `DELETE /operacoes/{id}/` - Deletar

#### Convóios
- `GET /convoios/` - Listar convóios
- `POST /convoios/` - Criar convóio
- `POST /convoios/{id}/adicionar_operacao/` - Adicionar operação (Admin)
- `GET /convoios/{id}/` - Detalhes
- `PUT /convoios/{id}/` - Atualizar
- `DELETE /convoios/{id}/` - Deletar

## 🔧 Configuração de Produção

Para deploy em produção:

1. **Atualize settings.py**
   ```python
   DEBUG = False
   SECRET_KEY = os.environ.get('SECRET_KEY')
   ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS').split(',')
   ```

2. **Use Gunicorn**
   ```bash
   gunicorn egide_backend.wsgi:application --bind 0.0.0.0:8000
   ```

3. **Configure HTTPS/SSL** com nginx ou Apache

4. **Use banco de dados PostgreSQL** em produção (já configurado)

## 📊 Modelos de Dados

### Departamento
- nome, sigla, descricao, ativo

### Delegacia
- nome, departamento, endereço, telefone, cidade, ativo

### Policial
- usuario (User), matricula, nome, classe, cargo, delegacia, telefone, email, ativo

### Viatura
- placa, modelo, ano, delegacia, ativa, km_atual

### Vaga
- data, turno, delegacia, posicoes_disponiveis, descricao, status

### Equipe
- vaga, chefe, membros (M2M), viatura, status, telefone_contato, observacoes, aprovado_por

### Operação
- data_inicio, data_fim, equipe, descricao, status, ais, bairros, resultado

### Convóio
- data, descricao, dpc, oip, status, ais, bairros, operacoes (M2M)

## 🔐 Segurança

- Autenticação JWT obrigatória
- Permissões granulares (IsAuthenticated, IsAdminUser)
- CORS configurado para frontend
- Validação de dados em todos os endpoints
- Proteção contra SQL Injection (ORM Django)

## 📝 Logs e Debugging

```bash
# Ver logs da aplicação
tail -f logs/django.log

# Modo debug (apenas desenvolvimento)
DEBUG=True python manage.py runserver
```

## 🧪 Testes

```bash
# Executar testes
python manage.py test

# Com cobertura
coverage run --source='.' manage.py test
coverage report
```

## 📞 Suporte

Para dúvidas ou issues, consulte a documentação Django:
- https://docs.djangoproject.com/
- https://www.django-rest-framework.org/

## 📄 Licença

Projeto interno - Polícia Civil do Estado do Ceará

---

**Versão**: 1.0.0  
**Última atualização**: 2 de dezembro de 2025
