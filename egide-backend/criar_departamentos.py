#!/usr/bin/env python
"""
Script para criar os 13 departamentos da Polícia Civil com seus usuários
Sistema EGIDE - Django Backend
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Departamento
from api.models_security import PerfilDepartamento

User = get_user_model()

# Lista dos 13 departamentos
DEPARTAMENTOS = [
    {
        'sigla': 'depatri',
        'nome': 'DEPATRI - Delegacia de Proteção ao Patrimônio',
        'email': 'depatri@egide.com',
        'senha': 'depatri2026',
        'descricao': 'Delegacia especializada em crimes contra o patrimônio'
    },
    {
        'sigla': 'dhpp',
        'nome': 'DHPP - Delegacia de Homicídios e Proteção à Pessoa',
        'email': 'dhpp@egide.com',
        'senha': 'dhpp2026',
        'descricao': 'Delegacia especializada em homicídios'
    },
    {
        'sigla': 'dpc',
        'nome': 'DPC - Delegacia de Polícia da Criança',
        'email': 'dpc@egide.com',
        'senha': 'dpc2026',
        'descricao': 'Delegacia de proteção à criança e adolescente'
    },
    {
        'sigla': 'coplan',
        'nome': 'COPLAN - Coordenadoria de Plantões',
        'email': 'coplan@egide.com',
        'senha': 'coplan2026',
        'descricao': 'Coordenadoria de plantões operacionais'
    },
    {
        'sigla': 'dpm',
        'nome': 'DPM - Delegacia de Proteção à Mulher',
        'email': 'dpm@egide.com',
        'senha': 'dpm2026',
        'descricao': 'Delegacia especializada em proteção à mulher'
    },
    {
        'sigla': 'dpi_norte',
        'nome': 'DPI Norte - Departamento de Polícias Interior Norte',
        'email': 'dpinorte@egide.com',
        'senha': 'dpinorte2026',
        'descricao': 'Departamento de polícias do interior da região norte'
    },
    {
        'sigla': 'dpi_sul',
        'nome': 'DPI Sul - Departamento de Polícias Interior Sul',
        'email': 'dpisul@egide.com',
        'senha': 'dpisul2026',
        'descricao': 'Departamento de polícias do interior da região sul'
    },
    {
        'sigla': 'dhpp_caucaia',
        'nome': 'DHPP Caucaia - Delegacia de Homicídios Caucaia',
        'email': 'dhppcaucaia@egide.com',
        'senha': 'dhppcaucaia2026',
        'descricao': 'Delegacia de homicídios da região de Caucaia'
    },
    {
        'sigla': 'dpe',
        'nome': 'DPE - Departamento de Polícias Especializadas',
        'email': 'dpe@egide.com',
        'senha': 'dpe2026',
        'descricao': 'Departamento de polícias especializadas'
    },
    {
        'sigla': 'dpgv',
        'nome': 'DPGV - Delegacia de Proteção a Grupos Vulneráveis',
        'email': 'dpgv@egide.com',
        'senha': 'dpgv2026',
        'descricao': 'Delegacia de proteção a grupos vulneráveis'
    },
    {
        'sigla': 'dra',
        'nome': 'DRA - Departamento de Recuperação de Ativos',
        'email': 'dra@egide.com',
        'senha': 'dra2026',
        'descricao': 'Departamento de recuperação de ativos'
    },
    {
        'sigla': 'drco',
        'nome': 'DRCO - Delegacia de Repressão ao Crime Organizado',
        'email': 'drco@egide.com',
        'senha': 'drco2026',
        'descricao': 'Delegacia de repressão ao crime organizado'
    },
    {
        'sigla': 'dto',
        'nome': 'DTO - Departamento Técnico Operacional',
        'email': 'dto@egide.com',
        'senha': 'dto2026',
        'descricao': 'Departamento técnico operacional'
    },
    {
        'sigla': 'gadel',
        'nome': 'GADEL - Gabinete',
        'email': 'gadel@egide.com',
        'senha': 'gadel2026',
        'descricao': 'Gabinete da Polícia Civil'
    }
]


def criar_departamentos():
    """Cria os departamentos e seus perfis de usuário"""
    
    print('🏢 Criando Departamentos da Polícia Civil...\n')
    print('=' * 80)
    
    criados = 0
    atualizados = 0
    
    for dept_data in DEPARTAMENTOS:
        sigla = dept_data['sigla']
        nome = dept_data['nome']
        email = dept_data['email']
        senha = dept_data['senha']
        descricao = dept_data['descricao']
        
        print(f'\n📍 Processando: {nome}')
        
        # 1. Criar ou atualizar o Departamento
        departamento, dept_created = Departamento.objects.get_or_create(
            sigla=sigla,
            defaults={
                'nome': nome,
                'descricao': descricao,
                'ativo': True
            }
        )
        
        if not dept_created:
            departamento.nome = nome
            departamento.descricao = descricao
            departamento.ativo = True
            departamento.save()
            print(f'   ✓ Departamento atualizado')
        else:
            print(f'   ✓ Departamento criado')
        
        # 2. Criar ou atualizar o User
        username = sigla
        user, user_created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': False,  # Departamentos não acessam admin do Django
                'is_active': True,
                'first_name': nome.split('-')[0].strip(),
            }
        )
        
        # Atualizar senha
        user.set_password(senha)
        user.email = email
        user.is_active = True
        user.save()
        
        if user_created:
            print(f'   ✓ Usuário criado: {username}')
        else:
            print(f'   ✓ Usuário atualizado: {username}')
        
        # 3. Criar ou atualizar o PerfilDepartamento
        perfil, perfil_created = PerfilDepartamento.objects.get_or_create(
            user=user,
            defaults={
                'departamento': departamento,
                'sigla': sigla,
                'ativo': True,
                'pode_ver_operacoes': True,
                'pode_responder_notificacoes': True,
                'pode_informar_efetivo': True,
            }
        )
        
        if not perfil_created:
            perfil.departamento = departamento
            perfil.sigla = sigla
            perfil.ativo = True
            perfil.pode_ver_operacoes = True
            perfil.pode_responder_notificacoes = True
            perfil.pode_informar_efetivo = True
            perfil.save()
            print(f'   ✓ Perfil atualizado')
            atualizados += 1
        else:
            print(f'   ✓ Perfil criado')
            criados += 1
        
        print(f'   📧 Email: {email}')
        print(f'   🔑 Senha: {senha}')
    
    print('\n' + '=' * 80)
    print(f'\n✅ Processo concluído!')
    print(f'   • {criados} departamentos criados')
    print(f'   • {atualizados} departamentos atualizados')
    print(f'   • Total: {len(DEPARTAMENTOS)} departamentos')
    
    print('\n' + '=' * 80)
    print('\n📋 RESUMO DAS CREDENCIAIS:\n')
    
    for dept in DEPARTAMENTOS:
        print(f"   {dept['sigla'].upper():15} → Email: {dept['email']:30} | Senha: {dept['senha']}")
    
    print('\n' + '=' * 80)
    print('\n🌐 Acesso:')
    print('   • API: http://localhost:8000/api/')
    print('   • Login: POST http://localhost:8000/api/auth/login/')
    print('\n📝 Exemplo de login:')
    print('   {')
    print('     "username": "depatri",')
    print('     "password": "depatri2026"')
    print('   }')
    print('\n' + '=' * 80)


if __name__ == '__main__':
    try:
        criar_departamentos()
    except Exception as e:
        print(f'\n❌ Erro: {e}')
        import traceback
        traceback.print_exc()
