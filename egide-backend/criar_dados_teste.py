import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from api.models import Departamento, Delegacia, Policial, Viatura, Vaga, Equipe

print('🚀 Criando dados de teste...\n')

# 1. Departamentos
dpc, _ = Departamento.objects.get_or_create(
    sigla='DPC',
    defaults={'nome': 'Departamento de Polícia Civil', 'descricao': 'Departamento principal'}
)
dhpp, _ = Departamento.objects.get_or_create(
    sigla='DHPP',
    defaults={'nome': 'Delegacia de Homicídios e Proteção à Pessoa', 'descricao': 'Crimes contra a vida'}
)
print(f'✅ Departamentos: {Departamento.objects.count()}')

# 2. Delegacias
del1, _ = Delegacia.objects.get_or_create(
    nome='1ª Delegacia - Centro',
    defaults={'departamento': dpc, 'endereco': 'Centro, Fortaleza', 'telefone': '(85) 3101-0001'}
)
del2, _ = Delegacia.objects.get_or_create(
    nome='2ª Delegacia - Aldeota',
    defaults={'departamento': dpc, 'endereco': 'Aldeota, Fortaleza', 'telefone': '(85) 3101-0002'}
)
print(f'✅ Delegacias: {Delegacia.objects.count()}')

# 3. Policiais
policiais_data = [
    {'matricula': '12345678', 'nome': 'João Silva', 'email': 'joao@pcce.ce.gov.br'},
    {'matricula': '23456789', 'nome': 'Maria Santos', 'email': 'maria@pcce.ce.gov.br'},
    {'matricula': '34567890', 'nome': 'Pedro Costa', 'email': 'pedro@pcce.ce.gov.br'},
    {'matricula': '45678901', 'nome': 'Ana Oliveira', 'email': 'ana@pcce.ce.gov.br'},
    {'matricula': '56789012', 'nome': 'Carlos Souza', 'email': 'carlos@pcce.ce.gov.br'},
]

policiais = []
for p_data in policiais_data:
    policial, created = Policial.objects.get_or_create(
        matricula=p_data['matricula'],
        defaults={
            'nome': p_data['nome'],
            'email': p_data['email'],
            'delegacia': del1,
            'cargo': 'AGENTE',
            'telefone': '(85) 99999-0000',
            'ativo': True
        }
    )
    policiais.append(policial)
    
print(f'✅ Policiais: {Policial.objects.count()}')

# 4. Viaturas
viatura1, _ = Viatura.objects.get_or_create(
    placa='ABC-1234',
    defaults={'modelo': 'Toyota Hilux', 'delegacia': del1, 'ativa': True}
)
viatura2, _ = Viatura.objects.get_or_create(
    placa='DEF-5678',
    defaults={'modelo': 'Chevrolet S10', 'delegacia': del1, 'ativa': True}
)
print(f'✅ Viaturas: {Viatura.objects.count()}')

# 5. Vagas (semana atual)
today = datetime.now().date()
week_start = today - timedelta(days=today.weekday())
week_id = f'W{week_start.isocalendar()[1]:02d}-{week_start.year}'

vagas_count = 0
for i in range(7):  # 7 dias
    day = week_start + timedelta(days=i)
    for turno in ['DIA', 'NOITE']:
        for _ in range(2):  # 2 vagas por turno
            vaga, created = Vaga.objects.get_or_create(
                data=day,
                turno=turno,
                weekId=week_id,
                defaults={'disponivel': True}
            )
            if created:
                vagas_count += 1

print(f'✅ Vagas: {Vaga.objects.count()} criadas para semana {week_id}')

# 6. Equipe de exemplo
equipe, created = Equipe.objects.get_or_create(
    nome='Equipe Alpha',
    defaults={
        'lider': policiais[0],
        'viatura': viatura1,
        'data_inicio': today,
        'data_fim': today + timedelta(days=1),
        'weekId': week_id,
        'status': 'PENDENTE',
        'turno': 'DIA'
    }
)
if created:
    equipe.membros.set([policiais[0], policiais[1], policiais[2]])
    print(f'✅ Equipe: {equipe.nome} criada com {equipe.membros.count()} membros')
else:
    print(f'ℹ️  Equipe {equipe.nome} já existe')

print('\n📊 Resumo:')
print(f'   Departamentos: {Departamento.objects.count()}')
print(f'   Delegacias: {Delegacia.objects.count()}')
print(f'   Policiais: {Policial.objects.count()}')
print(f'   Viaturas: {Viatura.objects.count()}')
print(f'   Vagas: {Vaga.objects.count()}')
print(f'   Equipes: {Equipe.objects.count()}')
print('\n✅ Dados de teste criados com sucesso!')
