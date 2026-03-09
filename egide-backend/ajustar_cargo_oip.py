#!/usr/bin/env python
import os
import django
from django.db.models import Q

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from api.models import Policial

filtro = Q(cargo='Inspetor') | Q(cargo='Escrivão') | Q(cargo='Escrivao')
antes = Policial.objects.filter(filtro).count()
atualizados = Policial.objects.filter(filtro).update(cargo='OIP')
total_oip = Policial.objects.filter(cargo='OIP').count()

print(f'Antes para converter: {antes}')
print(f'Registros atualizados: {atualizados}')
print(f'Total com cargo OIP: {total_oip}')
