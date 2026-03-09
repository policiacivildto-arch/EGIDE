#!/usr/bin/env python
"""Script para limpar vagas de teste"""
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from api.models import Vaga

# Para semana que começa segunda 10/02 
start = date(2026, 2, 9)  # Segunda
end = date(2026, 2, 15)   # Domingo

vagas_deleted = Vaga.objects.filter(data__gte=start, data__lte=end).delete()
print(f"🗑️  Vagas deletadas: {vagas_deleted[0]}")

# Lista vagas restantes próximas
print(f"\n📋 Vagas for próximas semanas:")
vagas = Vaga.objects.all().order_by('data', 'turno')[:20]
for v in vagas:
    print(f"  - {v.data} {v.turno} ({v.delegacia.nome}): {v.posicoes_disponiveis} posições")
