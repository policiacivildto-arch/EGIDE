#!/usr/bin/env python
import json
import os
import re

import django
from django.db import IntegrityError

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Policial, Delegacia


def normalize_digits(value):
    return re.sub(r'\D', '', str(value or ''))


def build_username(matricula):
    return f'policial_{matricula}'


def build_email(matricula):
    return f'policial.{matricula}@pcce.local'


def map_cargo(cargo_atual):
    raw = (cargo_atual or '').strip().upper()
    if raw == 'DPC':
        return 'Delegado'
    if raw in ('OIP', 'IPC'):
        return 'Inspetor'
    if raw in ('EPC', 'ESCRIVAO', 'ESCRIVÃO'):
        return 'Escrivão'
    if raw in ('IPC2', 'INVESTIGADOR'):
        return 'Investigador'
    return 'Policial Civil'


def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(project_root, 'src', 'data', 'policiais.json')

    if not os.path.exists(json_path):
        raise FileNotFoundError(f'Arquivo não encontrado: {json_path}')

    with open(json_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError('Formato inválido: esperado array no policiais.json')

    default_delegacia = (
        Delegacia.objects.filter(nome__icontains='DTO').first()
        or Delegacia.objects.first()
    )

    created_users = 0
    updated_users = 0
    created_policiais = 0
    updated_policiais = 0
    skipped = 0

    for item in data:
        matricula = normalize_digits(item.get('matricula') or item.get('MATRICULA'))
        nome = (item.get('nome') or item.get('NOME') or '').strip().upper()
        cargo_atual = item.get('cargo_atual') or item.get('cargo')

        if not matricula or len(matricula) != 8 or not nome:
            skipped += 1
            continue

        username = build_username(matricula)
        email = build_email(matricula)
        cargo = map_cargo(cargo_atual)

        user = User.objects.filter(username=username).first()
        if not user:
            user = User.objects.filter(email=email).first()
        if not user:
            policial_existente = Policial.objects.filter(matricula=matricula).select_related('usuario').first()
            if policial_existente and policial_existente.usuario:
                user = policial_existente.usuario
                if user.username != username:
                    user.username = username
                if user.email != email:
                    user.email = email
                user.is_active = True
                user.save()
                updated_users += 1
            else:
                try:
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password='front',
                        first_name=nome.split(' ')[0] if nome else '',
                        last_name=' '.join(nome.split(' ')[1:]) if len(nome.split(' ')) > 1 else '',
                    )
                    created_users += 1
                except IntegrityError:
                    existing_by_username = User.objects.filter(username=username).first()
                    if existing_by_username:
                        user = existing_by_username
                    else:
                        fallback_username = f'u_{matricula}'
                        user = User.objects.filter(username=fallback_username).first()
                        if not user:
                            user = User.objects.create_user(
                                username=fallback_username,
                                email=email,
                                password='front',
                                first_name=nome.split(' ')[0] if nome else '',
                                last_name=' '.join(nome.split(' ')[1:]) if len(nome.split(' ')) > 1 else '',
                            )
                            created_users += 1
        else:
            changed = False
            if user.email != email:
                user.email = email
                changed = True
            if not user.is_active:
                user.is_active = True
                changed = True
            if changed:
                user.save()
                updated_users += 1

        policial = Policial.objects.filter(matricula=matricula).first()
        if not policial:
            Policial.objects.create(
                usuario=user,
                matricula=matricula,
                nome=nome,
                classe='Praça',
                cargo=cargo,
                delegacia=default_delegacia,
                telefone='',
                email=email,
                ativo=True,
            )
            created_policiais += 1
        else:
            changed = False
            if policial.usuario_id != user.id:
                policial.usuario = user
                changed = True
            if policial.nome != nome:
                policial.nome = nome
                changed = True
            if policial.cargo != cargo:
                policial.cargo = cargo
                changed = True
            if policial.email != email:
                policial.email = email
                changed = True
            if not policial.ativo:
                policial.ativo = True
                changed = True
            if policial.delegacia is None and default_delegacia is not None:
                policial.delegacia = default_delegacia
                changed = True

            if changed:
                policial.save()
                updated_policiais += 1

    total = Policial.objects.count()

    print('✅ Importação concluída!')
    print(f'   Usuários criados: {created_users}')
    print(f'   Usuários atualizados: {updated_users}')
    print(f'   Policiais criados: {created_policiais}')
    print(f'   Policiais atualizados: {updated_policiais}')
    print(f'   Registros ignorados: {skipped}')
    print(f'   Total de policiais no banco: {total}')


if __name__ == '__main__':
    main()
