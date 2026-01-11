"""
Script para criar dados de teste para o Sistema de Operações de Evento
Execute: python criar_dados_teste_eventos.py
"""

import os
import django
import sys
from datetime import datetime, timedelta, time

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import (
    Departamento, Delegacia,
    EventoOperacao, DepartamentoEvento, EscalaPolicial
)


def criar_dados_teste():
    print("🚀 Criando dados de teste para Operações de Evento...\n")

    # 1. Criar usuário admin se não existir
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@pcce.gov.br',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("✅ Usuário admin criado (admin/admin123)")
    else:
        print("ℹ️  Usuário admin já existe")

    # 2. Criar Departamentos se não existirem
    dep1, _ = Departamento.objects.get_or_create(
        sigla='DIG',
        defaults={
            'nome': 'Delegacia de Investigações Gerais',
            'descricao': 'Investigações gerais'
        }
    )
    
    dep2, _ = Departamento.objects.get_or_create(
        sigla='DHPP',
        defaults={
            'nome': 'Delegacia de Homicídios e Proteção à Pessoa',
            'descricao': 'Homicídios e crimes graves'
        }
    )
    
    dep3, _ = Departamento.objects.get_or_create(
        sigla='DECAP',
        defaults={
            'nome': 'Delegacia de Capturas',
            'descricao': 'Capturas e mandados'
        }
    )
    
    print(f"✅ Departamentos criados/verificados: {dep1.sigla}, {dep2.sigla}, {dep3.sigla}")

    # 3. Criar Evento - Carnaval 2026
    data_inicio = datetime.now().date() + timedelta(days=30)
    data_fim = data_inicio + timedelta(days=4)
    
    evento, created = EventoOperacao.objects.get_or_create(
        nome='Carnaval 2026 - Fortaleza',
        defaults={
            'tipo_evento': 'CARNAVAL',
            'descricao': 'Operação especial de segurança para o Carnaval de Fortaleza 2026',
            'local': 'Centro de Fortaleza e Orla',
            'data_inicio': data_inicio,
            'data_fim': data_fim,
            'status': 'PLANEJAMENTO',
            'criado_por': admin_user
        }
    )
    
    if created:
        print(f"✅ Evento criado: {evento.nome}")
        print(f"   📅 Período: {data_inicio} a {data_fim}")
    else:
        print(f"ℹ️  Evento já existe: {evento.nome}")

    # 4. Cadastrar Departamentos no Evento (Fase 1)
    
    # DIG - Serviço Ordinário, OIP, COM aporte
    dep_evento1, created = DepartamentoEvento.objects.get_or_create(
        evento=evento,
        departamento=dep1,
        defaults={
            'tipo_servico': 'ORDINARIO',
            'tipo_policial': 'OIP',
            'quantidade_policiais': 15,
            'com_aporte_financeiro': True,
            'horario_inicio_delegacia': '08:00',
            'horario_fim_delegacia': '20:00',
            'observacoes': 'Patrulhamento na região central'
        }
    )
    if created:
        print(f"✅ {dep1.sigla} cadastrado no evento - 15 OIP (Ordinário com aporte)")
    
    # DHPP - Serviço Extraordinário, DPC, SEM aporte
    dep_evento2, created = DepartamentoEvento.objects.get_or_create(
        evento=evento,
        departamento=dep2,
        defaults={
            'tipo_servico': 'EXTRAORDINARIO',
            'tipo_policial': 'DPC',
            'quantidade_policiais': 8,
            'com_aporte_financeiro': False,
            'horario_inicio_delegacia': '18:00',
            'horario_fim_delegacia': '06:00',
            'observacoes': 'Plantão noturno especial'
        }
    )
    if created:
        print(f"✅ {dep2.sigla} cadastrado no evento - 8 DPC (Extraordinário sem aporte)")
    
    # DECAP - Serviço Ordinário, OIP, COM aporte
    dep_evento3, created = DepartamentoEvento.objects.get_or_create(
        evento=evento,
        departamento=dep3,
        defaults={
            'tipo_servico': 'ORDINARIO',
            'tipo_policial': 'OIP',
            'quantidade_policiais': 10,
            'com_aporte_financeiro': True,
            'horario_inicio_delegacia': '07:00',
            'horario_fim_delegacia': '19:00',
            'observacoes': 'Apoio tático e capturas'
        }
    )
    if created:
        print(f"✅ {dep3.sigla} cadastrado no evento - 10 OIP (Ordinário com aporte)")

    # 5. Criar algumas Escalas de exemplo (Fase 2)
    print("\n📋 Criando escalas de exemplo...")
    
    # Escalas para DIG (primeiros 5 policiais como exemplo)
    for i in range(1, 6):
        escala, created = EscalaPolicial.objects.get_or_create(
            departamento_evento=dep_evento1,
            identificacao=f'Policial {i}',
            defaults={
                'data_servico': data_inicio,
                'horario_entrada': time(8, 0),
                'horario_saida': time(20, 0),
                'valor_hora': 50.00,
                'observacoes': f'Dia {i} do evento'
            }
        )
        if created:
            print(f"   ✅ Escala criada: {escala.identificacao} - {escala.horas_trabalhadas}h - R$ {escala.custo_total}")

    # Escalas para DHPP (primeiros 3 policiais como exemplo)
    for i in range(1, 4):
        escala, created = EscalaPolicial.objects.get_or_create(
            departamento_evento=dep_evento2,
            identificacao=f'Delegado {i}',
            defaults={
                'data_servico': data_inicio,
                'horario_entrada': time(18, 0),
                'horario_saida': time(6, 0),  # Passa da meia-noite
                'valor_hora': 75.00,
                'observacoes': 'Plantão noturno'
            }
        )
        if created:
            print(f"   ✅ Escala criada: {escala.identificacao} - {escala.horas_trabalhadas}h - R$ {escala.custo_total}")

    # 6. Resumo Final
    print("\n" + "="*60)
    print("📊 RESUMO DOS DADOS CRIADOS")
    print("="*60)
    
    print(f"\n🎉 Evento: {evento.nome}")
    print(f"   Status: {evento.get_status_display()}")
    print(f"   Período: {evento.data_inicio} a {evento.data_fim}")
    
    print(f"\n👮 Departamentos Cadastrados: {DepartamentoEvento.objects.filter(evento=evento).count()}")
    for dep_evt in DepartamentoEvento.objects.filter(evento=evento):
        escalas_count = dep_evt.escalas.count()
        print(f"   • {dep_evt.departamento.sigla}: {dep_evt.quantidade_policiais} policiais planejados")
        print(f"     Tipo: {dep_evt.get_tipo_servico_display()} - {dep_evt.get_tipo_policial_display()}")
        print(f"     Aporte: {'✓ Sim' if dep_evt.com_aporte_financeiro else '✗ Não'}")
        print(f"     Escalas: {escalas_count}/{dep_evt.quantidade_policiais}")
    
    total_escalas = EscalaPolicial.objects.filter(departamento_evento__evento=evento).count()
    total_horas = sum([float(e.horas_trabalhadas) for e in EscalaPolicial.objects.filter(departamento_evento__evento=evento)])
    total_custo = sum([float(e.custo_total) for e in EscalaPolicial.objects.filter(departamento_evento__evento=evento)])
    
    print(f"\n💰 Totais:")
    print(f"   Escalas Cadastradas: {total_escalas}")
    print(f"   Total de Horas: {total_horas:.1f}h")
    print(f"   Custo Total: R$ {total_custo:.2f}")
    
    print("\n" + "="*60)
    print("✅ DADOS DE TESTE CRIADOS COM SUCESSO!")
    print("="*60)
    
    print("\n🔗 Próximos Passos:")
    print("   1. Acesse: http://localhost:8000/admin/")
    print("   2. Login: admin / admin123")
    print("   3. Veja os eventos em: http://localhost:8000/api/eventos/")
    print("   4. Dashboard do evento: http://localhost:8000/api/eventos/1/dashboard/")
    print("\n   Ou abra: sistema-eventos.html no navegador")


if __name__ == '__main__':
    try:
        criar_dados_teste()
    except Exception as e:
        print(f"\n❌ Erro ao criar dados: {e}")
        import traceback
        traceback.print_exc()
