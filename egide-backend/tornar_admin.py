#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

email = 'policiacivildto@gmail.com'

try:
    user = User.objects.get(email=email)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f'✅ Usuário atualizado para ADMINISTRADOR!')
    print(f'   Email: {email}')
    print(f'   Username: {user.username}')
    print(f'   is_staff: {user.is_staff} ✅')
    print(f'   is_superuser: {user.is_superuser} ✅')
except User.DoesNotExist:
    print(f'❌ Usuário com email {email} não encontrado')
