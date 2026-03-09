#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print('\n📋 Usuários cadastrados:\n')
for user in User.objects.all():
    print(f'  Username: {user.username}')
    print(f'  Email: {user.email}')
    print(f'  Ativo: {user.is_active}')
    print(f'  Staff: {user.is_staff}')
    print(f'  Superuser: {user.is_superuser}')
    print(f'  ---')
