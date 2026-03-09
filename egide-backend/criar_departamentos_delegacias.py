#!/usr/bin/env python
"""
Script para criar Departamentos e Delegacias de teste no banco de dados
Execute: python criar_departamentos_delegacias.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from api.models import Departamento, Delegacia

# Criar departamentos
departamentos_data = [
    {'nome': 'Polícia Civil', 'sigla': 'PC'},
    {'nome': 'Departamento de Operações', 'sigla': 'DO'},
    {'nome': 'Departamento Especializado', 'sigla': 'DE'},
]

delegacias_data = [
    {'nome': 'Delegacia Central', 'cidade': 'Centro', 'departamento': 'Polícia Civil'},
    {'nome': 'Delegacia Zona Norte', 'cidade': 'Zona Norte', 'departamento': 'Polícia Civil'},
    {'nome': 'Delegacia Zona Sul', 'cidade': 'Zona Sul', 'departamento': 'Polícia Civil'},
    {'nome': 'Delegacia de Operações Especiais', 'cidade': 'Centro', 'departamento': 'Departamento de Operações'},
]

print("Criando Departamentos...")
for dept_data in departamentos_data:
    dept, created = Departamento.objects.get_or_create(
        sigla=dept_data['sigla'],
        defaults={'nome': dept_data['nome']}
    )
    if created:
        print(f"  ✓ Criado: {dept.nome}")
    else:
        print(f"  ~ Já existe: {dept.nome}")

print("\nCriando Delegacias...")
for delg_data in delegacias_data:
    try:
        dept = Departamento.objects.get(nome=delg_data['departamento'])
        delg, created = Delegacia.objects.get_or_create(
            nome=delg_data['nome'],
            defaults={
                'departamento': dept,
                'cidade': delg_data['cidade'],
                'ativo': True
            }
        )
        if created:
            print(f"  ✓ Criada: {delg.nome} ({delg.departamento.nome})")
        else:
            print(f"  ~ Já existe: {delg.nome}")
    except Departamento.DoesNotExist:
        print(f"  ✗ Erro: Departamento '{delg_data['departamento']}' não encontrado")

print(f"\nResumo:")
print(f"  Total de Departamentos: {Departamento.objects.count()}")
print(f"  Total de Delegacias: {Delegacia.objects.count()}")
