# 🎯 GUIA PRÁTICO: Usando Django Backend para EGIDE

## 📍 Onde os dados são armazenados

### **Desenvolvimento (agora)**
```
egide-backend/db.sqlite3
```
- Arquivo único que contém TODOS os dados
- Fácil de copiar/compartilhar
- **Limitação**: Não aguenta muitos acessos simultâneos

### **Produção (recomendado)**
Use PostgreSQL ou MySQL em um servidor dedicado
- Mais rápido
- Suporta milhares de usuários simultâneos
- Backups automáticos

---

## 🚀 COMO USAR NA PRÁTICA

### **1. Iniciar o Backend Django**

```powershell
cd egide-backend
venv\Scripts\activate
python manage.py runserver
```

✅ Backend rodando em: `http://localhost:8000/api/`

---

### **2. Endpoints Disponíveis (API)**

| Recurso | URL | Métodos |
|---------|-----|---------|
| Departamentos | `/api/departamentos/` | GET, POST, PUT, DELETE |
| Delegacias | `/api/delegacias/` | GET, POST, PUT, DELETE |
| Policiais | `/api/policiais/` | GET, POST, PUT, DELETE |
| Viaturas | `/api/viaturas/` | GET, POST, PUT, DELETE |
| Escalas | `/api/escalas/` | GET, POST, PUT, DELETE |
| Operações | `/api/operacoes/` | GET, POST, PUT, DELETE |
| Eventos | `/api/eventos/` | GET, POST, PUT, DELETE |

---

### **3. Exemplos de Uso**

#### **A) Criar um Departamento (via API)**

```javascript
// No frontend React
const criarDepartamento = async () => {
  const response = await fetch('http://localhost:8000/api/departamentos/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Departamento de Polícia Civil',
      sigla: 'DPC',
      descricao: 'Departamento principal',
      ativo: true
    })
  });
  const data = await response.json();
  console.log('Departamento criado:', data);
};
```

#### **B) Buscar todos os Policiais**

```javascript
const buscarPoliciais = async () => {
  const response = await fetch('http://localhost:8000/api/policiais/');
  const policiais = await response.json();
  console.log('Policiais:', policiais);
};
```

#### **C) Criar uma Escala**

```javascript
const criarEscala = async () => {
  const response = await fetch('http://localhost:8000/api/escalas/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Escala Carnaval 2026',
      data_inicio: '2026-02-14',
      data_fim: '2026-02-18',
      evento: 1, // ID do evento
      observacoes: 'Escala especial para o carnaval'
    })
  });
  const escala = await response.json();
  console.log('Escala criada:', escala);
};
```

---

### **4. Acessar o Painel Admin**

1. Crie um superusuário (se ainda não tiver):

```powershell
python manage.py createsuperuser
```

2. Acesse: `http://localhost:8000/admin/`

3. Faça login e você pode:
   - Ver todos os dados
   - Criar/editar/excluir registros manualmente
   - Exportar dados
   - Gerenciar usuários

---

## 💾 GERENCIAMENTO DE DADOS

### **Backup do Banco de Dados**

**SQLite (desenvolvimento):**
```powershell
# Copiar o arquivo
copy egide-backend\db.sqlite3 backup_$(Get-Date -Format 'yyyy-MM-dd').sqlite3
```

**PostgreSQL (produção):**
```bash
pg_dump egide_db > backup_$(date +%Y-%m-%d).sql
```

---

### **Migrar para PostgreSQL (Produção)**

#### **1. Instalar PostgreSQL**
- Download: https://www.postgresql.org/download/

#### **2. Criar banco de dados**
```sql
CREATE DATABASE egide_db;
CREATE USER egide_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE egide_db TO egide_user;
```

#### **3. Atualizar settings.py**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'egide_db',
        'USER': 'egide_user',
        'PASSWORD': 'senha_segura',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

#### **4. Instalar driver PostgreSQL**
```powershell
pip install psycopg2-binary
```

#### **5. Executar migrações**
```powershell
python manage.py migrate
```

---

## 🔄 INTEGRAÇÃO FRONTEND + BACKEND

### **No App.js ou AppDjango.js**

```javascript
import React, { useState, useEffect } from 'react';

function EscalasPage() {
  const [escalas, setEscalas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar escalas do Django
    fetch('http://localhost:8000/api/escalas/')
      .then(res => res.json())
      .then(data => {
        setEscalas(data.results || data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar escalas:', err);
        setLoading(false);
      });
  }, []);

  const criarEscala = async (novaEscala) => {
    const response = await fetch('http://localhost:8000/api/escalas/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaEscala)
    });
    const escala = await response.json();
    setEscalas([...escalas, escala]);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Escalas da EGIDE</h1>
      {escalas.map(escala => (
        <div key={escala.id}>
          <h3>{escala.nome}</h3>
          <p>Período: {escala.data_inicio} até {escala.data_fim}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 ESTRUTURA DE DADOS ATUAL

Você já tem estes models criados:

1. **Departamento** - Delegacias e departamentos
2. **Delegacia** - Unidades policiais
3. **Policial** - Cadastro de agentes
4. **Viatura** - Viaturas disponíveis
5. **Escala** - Escalas de serviço
6. **OperacaoPolicial** - Operações especiais
7. **Evento** - Eventos (Carnaval, etc.)
8. **Comboio** - Comboios para transporte

---

## 🎯 FLUXO COMPLETO NA PRÁTICA

### **Exemplo: Sistema de Escalas para Carnaval 2026**

#### **1. Frontend React envia dados:**
```javascript
const escala = {
  nome: 'Escala Carnaval - Dia 1',
  data_inicio: '2026-02-14',
  data_fim: '2026-02-14',
  evento: 1,
  policiais: [1, 2, 3, 4, 5] // IDs dos policiais
};

fetch('http://localhost:8000/api/escalas/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(escala)
});
```

#### **2. Django recebe e salva no banco:**
- Valida os dados
- Salva em `db.sqlite3`
- Retorna JSON com o registro criado

#### **3. Dados ficam armazenados:**
```
db.sqlite3
  ├── api_departamento
  ├── api_policial
  ├── api_escala  ← AQUI
  ├── api_operacaopolicial
  └── ...
```

---

## ✅ CHECKLIST DE USO DIÁRIO

**Desenvolvendo:**
- [ ] Backend rodando: `python manage.py runserver`
- [ ] Frontend rodando: `npm start`
- [ ] Teste endpoints no navegador: `http://localhost:8000/api/`

**Produção:**
- [ ] Migrar para PostgreSQL
- [ ] Configurar autenticação JWT
- [ ] Fazer backups automáticos
- [ ] Configurar HTTPS
- [ ] Desabilitar DEBUG

---

## 🆘 PROBLEMAS COMUNS

### **Erro: "No such table"**
```powershell
python manage.py migrate
```

### **Erro: "Access Denied"**
Temporariamente em `settings.py`:
```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',  # APENAS DEV
    ),
}
```

### **Dados desapareceram**
Verifique se `db.sqlite3` existe:
```powershell
ls egide-backend\db.sqlite3
```

---

## 📞 PRÓXIMOS PASSOS

1. **Testar cada endpoint** no Postman ou navegador
2. **Conectar frontend React** com os endpoints Django
3. **Implementar autenticação** (JWT)
4. **Migrar para PostgreSQL** antes de produção
5. **Configurar deploy** (Heroku, AWS, etc.)

---

**Atualizado em:** 3 de fevereiro de 2026  
**Status do projeto:** Backend funcional com SQLite, pronto para integração frontend
