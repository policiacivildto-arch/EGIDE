#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Verifica se já existe
if User.objects.filter(username='adm').exists():
    print('✅ Usuário "adm" já existe!')
    user = User.objects.get(username='adm')
    # Atualiza a senha e flags
    user.set_password('adm')
    user.is_superuser = True
    user.is_staff = True
    user.is_active = True
    user.save()
    print('✅ Senha e permissões atualizadas!')
else:
    # Cria novo
    user = User.objects.create_superuser(
        username='adm',
        email='adm@egide.com',
        password='adm'
    )
    print('✅ Superusuário criado com sucesso!')

# Verificar flags
print(f'\n🔍 Verificação:')
print(f'   is_staff: {user.is_staff} ✅' if user.is_staff else f'   is_staff: {user.is_staff} ❌')
print(f'   is_superuser: {user.is_superuser} ✅' if user.is_superuser else f'   is_superuser: {user.is_superuser} ❌')
print(f'   is_active: {user.is_active} ✅' if user.is_active else f'   is_active: {user.is_active} ❌')

print(f'\n📝 Credenciais:')
print(f'   Username: adm')
print(f'   Senha: adm')
print(f'\n🌐 Acesse: http://localhost:8000/admin')
