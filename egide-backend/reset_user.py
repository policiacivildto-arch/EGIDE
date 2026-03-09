#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

email = 'policiacivildto@gmail.com'
username = 'front'
password = 'front'

# Verifica se já existe
if User.objects.filter(username=username).exists():
    print(f'✅ Usuário "{username}" já existe!')
    user = User.objects.get(username=username)
    # Atualiza a senha e dados
    user.set_password(password)
    user.email = email
    user.is_active = True
    user.save()
    print('✅ Senha e dados atualizados!')
elif User.objects.filter(email=email).exists():
    print(f'✅ Usuário com email {email} já existe!')
    user = User.objects.get(email=email)
    # Atualiza username e senha
    user.username = username
    user.set_password(password)
    user.is_active = True
    user.save()
    print('✅ Username e senha atualizados!')
else:
    # Cria novo
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )
    print('✅ Usuário criado com sucesso!')

print(f'\n📝 Credenciais:')
print(f'   Username: {username}')
print(f'   Email: {email}')
print(f'   Senha: {password}')
print(f'   Ativo: {user.is_active} ✅' if user.is_active else f'   Ativo: {user.is_active} ❌')
