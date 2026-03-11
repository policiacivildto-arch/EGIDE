#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Departamento
from api.models_security import PerfilDepartamento

User = get_user_model()

email = 'policiacivildto@gmail.com'

try:
    user = User.objects.get(email=email)

    # Mantem privilegios de admin para acesso total ao sistema.
    user.is_staff = True
    user.is_superuser = True
    user.save()

    # Vincula explicitamente o usuario ao departamento DTO.
    departamento_dto = Departamento.objects.filter(sigla__iexact='dto').first()
    if not departamento_dto:
        print('⚠️ Departamento DTO não encontrado na base. Execute criar_departamentos.py antes.')
    else:
        perfil, created = PerfilDepartamento.objects.update_or_create(
            user=user,
            defaults={
                'departamento': departamento_dto,
                'sigla': 'dto',
                'ativo': True,
                'pode_ver_operacoes': True,
                'pode_responder_notificacoes': True,
                'pode_informar_efetivo': True,
            },
        )
        status_perfil = 'criado' if created else 'atualizado'
        print(f'✅ Perfil DTO {status_perfil} com sucesso!')
        print(f'   Departamento: {perfil.departamento.nome}')
        print(f'   Sigla: {perfil.sigla}')
        print(f'   is_dto: {perfil.is_dto} ✅')

    print('✅ Usuário atualizado para ADMINISTRADOR!')
    print(f'   Email: {email}')
    print(f'   Username: {user.username}')
    print(f'   is_staff: {user.is_staff} ✅')
    print(f'   is_superuser: {user.is_superuser} ✅')
except User.DoesNotExist:
    print(f'❌ Usuário com email {email} não encontrado')
