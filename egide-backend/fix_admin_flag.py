#!/usr/bin/env python
"""
Script para marcar o usuário policiacivildto@gmail.com como staff/admin
para permitir criar escalas de 12 horas
"""
import os
import django
from decouple import config

# Carrega .env.local se existir
if os.path.exists('.env.local'):
    from dotenv import load_dotenv
    load_dotenv('.env.local')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth.models import User

try:
    user = User.objects.get(email='dto@egide.com')
    print(f"✓ Usuário encontrado: {user.username}")
    print(f"  - is_staff (antes): {user.is_staff}")
    print(f"  - is_superuser (antes): {user.is_superuser}")
    
    user.is_staff = True
    user.is_superuser = True
    user.save()
    
    print(f"\n✓ Usuário atualizado!")
    print(f"  - is_staff (depois): {user.is_staff}")
    print(f"  - is_superuser (depois): {user.is_superuser}")
    print(f"\n✓ Agora {user.email} pode criar escalas de 12 horas")
    
except User.DoesNotExist:
    print("✗ Usuário não encontrado: dto@egide.com")
    print("\nUsuários existentes com 'dto' no email:")
    for u in User.objects.filter(email__icontains='dto'):
        print(f"  - {u.email}")
