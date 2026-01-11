# Backend Django - ÉGIDE API

**Data**: 2 de dezembro de 2025  
**Status**: ✅ Completo e pronto para instalação

---

## 📦 Estrutura do Backend Criado

```
egide-backend/
├── egide_backend/               # Configurações principais do Django
│   ├── __init__.py
│   ├── settings.py             # Configurações (BD, apps, middleware, etc)
│   ├── urls.py                 # Rotas principais da API
│   └── wsgi.py                 # WSGI para produção (Gunicorn)
├── api/                        # Aplicação Django REST API
│   ├── __init__.py
│   ├── models.py               # 8 modelos de dados
│   ├── serializers.py          # Serializers DRF
│   ├── views.py                # ViewSets e Endpoints
│   ├── admin.py                # Configuração do Django Admin
│   └── apps.py                 # Configuração da app
├── manage.py                   # Script de gerenciamento Django
├── requirements.txt            # Dependências Python
├── README.md                   # Documentação completa
├── .env.example                # Template de variáveis de ambiente
├── .gitignore                  # Arquivos a ignorar no git
├── setup.bat                   # Script de setup para Windows
└── setup.sh                    # Script de setup para Linux/macOS
```

---

## 🎯 Modelos Implementados (8 modelos)

### 1. **Departamento**
- Nome, sigla, descrição, status ativo

### 2. **Delegacia**
- Vinculada a Departamento
- Endereço, telefone, cidade

### 3. **Policial**
- Usuário Django associado
- Matrícula (validada), nome, classe, cargo
- Delegacia, telefone, email

### 4. **Viatura**
- Placa (validada), modelo, ano
- Delegacia, status ativo, km_atual

### 5. **Vaga**
- Data, turno (diurno/noturno)
- Delegacia, posições disponíveis
- Status (Disponível, Ocupada, Cancelada)

### 6. **Equipe**
- Vaga, chefe (policial)
- Membros (M2M com Policial)
- Viatura associada
- Status (Em Análise, Aprovada, Rejeitada, Pendente Conflito)

### 7. **Operação**
- Data início/fim, equipe
- Descrição, status (Planejada, Em Execução, Concluída, Cancelada)
- AIS, bairros, resultado

### 8. **Convóio**
- Data, descrição
- DPC (Delegado PC), OIP (Oficial Investigação PC)
- Status, AIS, bairros
- Operações (M2M)

---

## 🔌 Endpoints REST da API

**Base URL**: `http://localhost:8000/api/`

### Autenticação
```
POST /token/
- username
- password

RESPONSE:
{
  "access": "token_jwt...",
  "refresh": "token_jwt..."
}
```

### Recursos

| Endpoint | Métodos | Descrição |
|----------|---------|-----------|
| `/departamentos/` | GET, POST | Listar/criar departamentos |
| `/delegacias/` | GET, POST | Listar/criar delegacias |
| `/policiais/` | GET, POST | Listar/criar policiais |
| `/policiais/{id}/ativar_desativar/` | POST | Ativar/desativar (Admin) |
| `/viaturas/` | GET, POST | Listar/criar viaturas |
| `/vagas/` | GET, POST | Listar/criar vagas |
| `/vagas/vagas_disponiveis/` | GET | Vagas próximos 30 dias |
| `/equipes/` | GET, POST | Listar/criar equipes |
| `/equipes/minhas_equipes/` | GET | Minhas equipes (chefe) |
| `/equipes/{id}/aprovar/` | POST | Aprovar (Admin) |
| `/equipes/{id}/rejeitar/` | POST | Rejeitar (Admin) |
| `/operacoes/` | GET, POST | Listar/criar operações |
| `/operacoes/{id}/finalizar/` | POST | Finalizar (Admin) |
| `/convoios/` | GET, POST | Listar/criar convóios |
| `/convoios/{id}/adicionar_operacao/` | POST | Adicionar operação (Admin) |

---

## 🚀 Instalação e Setup

### Windows
```bash
cd egide-backend
setup.bat
```

### Linux/macOS
```bash
cd egide-backend
chmod +x setup.sh
./setup.sh
```

### Passos Manuais

1. **Ativar ambiente virtual**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/macOS
   source venv/bin/activate
   ```

2. **Criar banco de dados PostgreSQL**
   ```sql
   CREATE DATABASE egide_db OWNER postgres;
   ```

3. **Executar migrações**
   ```bash
   python manage.py migrate
   ```

4. **Criar superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

5. **Coletar arquivos estáticos (produção)**
   ```bash
   python manage.py collectstatic
   ```

6. **Iniciar servidor**
   ```bash
   # Desenvolvimento
   python manage.py runserver
   
   # Produção (com Gunicorn)
   gunicorn egide_backend.wsgi:application --bind 0.0.0.0:8000
   ```

---

## ⚙️ Configuração Importante

### .env obrigatório antes de rodar!

1. Copie `.env.example` para `.env`
2. Edite com suas credenciais PostgreSQL:

```env
DEBUG=True
SECRET_KEY=sua_chave_secreta_aqui
ALLOWED_HOSTS=localhost,127.0.0.1,10.18.200.78

DB_NAME=egide_db
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://10.18.200.78:3000
```

---

## 🔐 Segurança Implementada

✅ **Autenticação JWT** - rest_framework_simplejwt  
✅ **Permissões** - IsAuthenticated, IsAdminUser  
✅ **CORS** - Configurado para frontend React  
✅ **Validação** - Regex para matrícula e placa  
✅ **ORM Django** - Proteção contra SQL Injection  
✅ **Timestamps** - criado_em, atualizado_em em todos modelos  

---

## 📊 Filtros e Busca

Todos endpoints suportam:
- **Filtros**: `?delegacia=1&status=Aprovada`
- **Busca**: `?search=João`
- **Ordenação**: `?ordering=-data_criacao`
- **Paginação**: `?page=2&page_size=20`

---

## 📋 Checklist de Setup

- [ ] Python 3.8+ instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Ambiente virtual ativado
- [ ] `requirements.txt` instalado
- [ ] `.env` criado e configurado
- [ ] Banco de dados criado
- [ ] Migrações executadas
- [ ] Superuser criado
- [ ] Servidor testado em `http://localhost:8000`
- [ ] Admin acessível em `http://localhost:8000/admin`

---

## 🧪 Teste Rápido

Abra o navegador e acesse:
```
http://localhost:8000/admin/
Username: seu_superuser
Password: sua_senha
```

Se conseguir fazer login, tudo está funcionando! ✅

---

## 📚 Referências

- Django Docs: https://docs.djangoproject.com/
- DRF Docs: https://www.django-rest-framework.org/
- PostgreSQL: https://www.postgresql.org/docs/

---

## 🔄 Próximos Passos (Futuro)

- [ ] Testes automatizados (pytest-django)
- [ ] Documentação Swagger/OpenAPI (drf-spectacular)
- [ ] Logging estruturado (python-json-logger)
- [ ] Cache com Redis
- [ ] Celery para tarefas assíncronas
- [ ] Relatórios PDF (reportlab)
- [ ] Integração com Firebase (autenticação)

---

**Versão**: 1.0.0  
**Pronto para**: Desenvolvimento e Testes  
**Status**: ✅ Completo
