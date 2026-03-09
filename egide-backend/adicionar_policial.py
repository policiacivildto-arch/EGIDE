#!/usr/bin/env python
"""Script para adicionar novo policial"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Policial, Delegacia

email = 'kleverdpc@gmail.com'

# Verifica se usuário já existe
user = User.objects.filter(email=email).first()
if user:
    print(f"❌ Usuário {email} já existe")
    exit(1)

# Cria usuário
nome_partes = email.split('@')[0].split('.')
firstname = nome_partes[0].capitalize() if nome_partes else 'Policial'
lastname = nome_partes[-1].capitalize() if len(nome_partes) > 1 else 'User'
username = email.split('@')[0]

user = User.objects.create_user(
    username=username,
    email=email,
    first_name=firstname,
    last_name=lastname,
    password='SenhaTemporaria123!'
)
print(f"✅ Usuário criado: {user.username} ({user.get_full_name()})")

# Pega primeiro delegacia para associar
delegacia = Delegacia.objects.first()
if not delegacia:
    print("❌ Nenhuma delegacia cadastrada no sistema")
    user.delete()
    exit(1)

# Gera matrícula única (8 dígitos)
last_policial = Policial.objects.all().order_by('-id').first()
if last_policial:
    last_matricula = int(last_policial.matricula) if last_policial.matricula.isdigit() else 10000000
    matricula = str(last_matricula + 1)
else:
    matricula = '10000001'

# Garante que tem 8 dígitos
matricula = matricula.zfill(8)

# Cria policial
policial = Policial.objects.create(
    usuario=user,
    nome=f"{firstname} {lastname}".title(),
    email=email,
    matricula=matricula,
    delegacia=delegacia,
    telefone='',
    classe='Praça',
    cargo='Policial Civil',
    ativo=True
)
print(f"✅ Policial criado com sucesso!")
print(f"   Nome: {policial.nome}")
print(f"   Email: {policial.email}")
print(f"   Matrícula: {policial.matricula}")
print(f"   Delegacia: {policial.delegacia.nome}")
print(f"   Classe: {policial.classe}")
print(f"   Cargo: {policial.cargo}")
print(f"")
print(f"📋 Dados de acesso:")
print(f"   Usuário: {username}")
print(f"   Senha: SenhaTemporaria123!")
print(f"   ⚠️  Deve mudar a senha no primeiro login")
