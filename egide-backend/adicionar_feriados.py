#!/usr/bin/env python
"""
Script para adicionar feriados de 2026 ao banco de dados
Execute: python adicionar_feriados.py
"""

import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from api.models import Feriado

# Feriados de 2026
feriados_2026 = [
    # Feriados Nacionais
    {
        'data': date(2026, 1, 1),
        'nome': 'Ano Novo',
        'tipo': 'feriado_nacional',
        'descricao': 'Primeiro dia do ano'
    },
    {
        'data': date(2026, 2, 16),
        'nome': 'Carnaval',
        'tipo': 'carnaval',
        'descricao': 'Segunda-feira de Carnaval'
    },
    {
        'data': date(2026, 2, 17),
        'nome': 'Terça de Carnaval',
        'tipo': 'carnaval',
        'descricao': 'Terça-feira de Carnaval'
    },
    {
        'data': date(2026, 4, 3),
        'nome': 'Sexta-feira Santa',
        'tipo': 'feriado_nacional',
        'descricao': 'Sexta-feira antes da Páscoa'
    },
    {
        'data': date(2026, 4, 21),
        'nome': 'Tiradentes',
        'tipo': 'feriado_nacional',
        'descricao': 'Dia de Tiradentes'
    },
    {
        'data': date(2026, 5, 1),
        'nome': 'Dia do Trabalho',
        'tipo': 'feriado_nacional',
        'descricao': 'Dia Internacional do Trabalho'
    },
    {
        'data': date(2026, 9, 7),
        'nome': 'Independência do Brasil',
        'tipo': 'feriado_nacional',
        'descricao': 'Sete de Setembro'
    },
    {
        'data': date(2026, 10, 12),
        'nome': 'Nossa Senhora Aparecida',
        'tipo': 'feriado_nacional',
        'descricao': 'Padroeira do Brasil'
    },
    {
        'data': date(2026, 11, 2),
        'nome': 'Finados',
        'tipo': 'feriado_nacional',
        'descricao': 'Dia de Finados'
    },
    {
        'data': date(2026, 11, 15),
        'nome': 'Proclamação da República',
        'tipo': 'feriado_nacional',
        'descricao': '15 de Novembro'
    },
    {
        'data': date(2026, 11, 20),
        'nome': 'Dia da Consciência Negra',
        'tipo': 'feriado_nacional',
        'descricao': 'Dia da Consciência Negra'
    },
    {
        'data': date(2026, 12, 25),
        'nome': 'Natal',
        'tipo': 'feriado_nacional',
        'descricao': 'Dia de Natal'
    },
]

# Adicionar feriados ao banco
criados = 0
duplicados = 0

for feriado_data in feriados_2026:
    feriado, created = Feriado.objects.get_or_create(
        data=feriado_data['data'],
        defaults={
            'nome': feriado_data['nome'],
            'tipo': feriado_data['tipo'],
            'descricao': feriado_data.get('descricao', '')
        }
    )
    
    if created:
        criados += 1
        print(f"✓ Criado: {feriado.nome} ({feriado.data.strftime('%d/%m/%Y')})")
    else:
        duplicados += 1
        print(f"~ Já existe: {feriado.nome} ({feriado.data.strftime('%d/%m/%Y')})")

print(f"\nResumo:")
print(f"  Feriados criados: {criados}")
print(f"  Feriados duplicados (não adicionados): {duplicados}")
print(f"  Total no banco: {Feriado.objects.count()}")
