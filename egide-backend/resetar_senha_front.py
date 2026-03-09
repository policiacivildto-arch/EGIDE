#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

email = 'policiacivildto@gmail.com'
password = 'secaodeoperaçoes2025@'

try:
    user = User.objects.get(email=email)
    user.set_password(password)
    user.save()
    print(f'✅ Senha atualizada com sucesso!')
    print(f'   Email: {email}')
    print(f'   Username: {user.username}')
    print(f'   Nova senha: {password}')
except User.DoesNotExist:
    print(f'❌ Usuário com email {email} não encontrado')
