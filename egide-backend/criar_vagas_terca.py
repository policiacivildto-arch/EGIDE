#!/usr/bin/env python
"""
Script para criar vagas em uma terça-feira:
- 1 vaga com 7 posições: disponível para qualquer policial pegar
- 1 vaga com 1 posição: restrita APENAS para ADM cadastrar

Total: 8 posições (7 abertas + 1 restrita)

Uso:
    python criar_vagas_terca.py [data_terca] [turno]
    
    data_terca: data da terça-feira (formato YYYY-MM-DD)
               Se não informar, usa a próxima terça-feira
    turno: 'day' (padrão) ou 'night'

Exemplos:
    python criar_vagas_terca.py                    # Próxima terça, turno diurno
    python criar_vagas_terca.py 2026-05-05 day     # 05/05/2026 (terça), turno diurno
    python criar_vagas_terca.py 2026-05-05 night   # 05/05/2026 (terça), turno noturno
"""

import os
import sys
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()

from api.models import Vaga, Delegacia

def is_tuesday(data):
    """Verifica se a data é uma terça-feira (weekday=1)"""
    return data.weekday() == 1

def get_next_tuesday():
    """Retorna a próxima terça-feira"""
    hoje = date.today()
    dias_para_terca = (1 - hoje.weekday()) % 7
    if dias_para_terca == 0 and hoje.weekday() != 1:
        dias_para_terca = 7
    return hoje + timedelta(days=dias_para_terca)

def criar_vagas_terca(data_terca=None, turno='day'):
    """
    Cria 8 vagas em uma terça-feira:
    - 7 vagas normais (qualquer policial pode pegar)
    - 1 vaga restrita para ADM
    """
    
    # Validar data
    if data_terca is None:
        data_terca = get_next_tuesday()
    else:
        if not isinstance(data_terca, date):
            try:
                data_terca = date.fromisoformat(data_terca)
            except (ValueError, TypeError):
                print(f"❌ Formato de data inválido: {data_terca}")
                print("   Use formato YYYY-MM-DD")
                return False
    
    # Verificar se é terça-feira
    if not is_tuesday(data_terca):
        print(f"❌ A data {data_terca} não é uma terça-feira!")
        print(f"   Dia da semana: {['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'][data_terca.weekday()]}")
        return False
    
    # Validar turno
    if turno not in ['day', 'night']:
        print(f"❌ Turno inválido: {turno}. Use 'day' ou 'night'")
        return False
    
    # Buscar delegacia ativa
    delegacia = Delegacia.objects.filter(ativo=True, nome__icontains='DTO').first()
    if not delegacia:
        delegacia = Delegacia.objects.filter(ativo=True).first()
    
    if not delegacia:
        print("❌ Nenhuma delegacia ativa encontrada!")
        return False
    
    print(f"\n📅 Criando 8 vagas para {data_terca.strftime('%A, %d/%m/%Y')}")
    print(f"🏢 Delegacia: {delegacia.nome}")
    print(f"⏰ Turno: {'Diurno (day)' if turno == 'day' else 'Noturno (night)'}")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    # Deletar vagas existentes para esta data/turno/delegacia
    vagas_existentes = Vaga.objects.filter(
        data=data_terca,
        turno=turno,
        delegacia=delegacia
    )
    
    if vagas_existentes.exists():
        count = vagas_existentes.count()
        vagas_existentes.delete()
        print(f"🗑️  Deletadas {count} vaga(s) existente(s) para esta data/turno/delegacia")
    
    vagas_criadas = []
    
    # Criar 1 vaga ABERTA com 7 posições (qualquer policial)
    try:
        vaga_aberta = Vaga.objects.create(
            data=data_terca,
            turno=turno,
            delegacia=delegacia,
            posicoes_disponiveis=7,
            status='Disponível',
            restrito_adm_cadastra=False,
            descricao='7 posições - Disponível para qualquer policial se candidatar'
        )
        vagas_criadas.append(vaga_aberta)
        print(f"✅ Vaga ABERTA criada: 7 posições disponíveis para qualquer policial")
    except Exception as e:
        print(f"❌ Erro ao criar vaga aberta: {str(e)}")
        return False
    
    # Criar 1 vaga RESTRITA com 1 posição (apenas ADM)
    try:
        vaga_adm = Vaga.objects.create(
            data=data_terca,
            turno=turno,
            delegacia=delegacia,
            posicoes_disponiveis=1,
            status='Disponível',
            restrito_adm_cadastra=True,
            descricao='1 posição reservada - APENAS ADMINISTRADOR pode cadastrar'
        )
        vagas_criadas.append(vaga_adm)
        print(f"🔒 Vaga RESTRITA criada: 1 posição exclusiva para ADM cadastrar")
    except Exception as e:
        print(f"❌ Erro ao criar vaga restrita: {str(e)}")
        return False
    
    print(f"\n{'━'*50}")
    print(f"✅ SUCESSO! Vagas criadas para terça-feira:")
    print(f"   🟢 Vaga ABERTA: 7 posições (qualquer policial)")
    print(f"   🔒 Vaga RESTRITA: 1 posição (apenas ADM cadastra)")
    print(f"   {'━'*44}")
    print(f"   📊 TOTAL: 8 posições disponíveis")
    print(f"{'━'*50}\n")
    
    return True

if __name__ == '__main__':
    data_terca = None
    turno = 'day'
    
    # Processar argumentos
    if len(sys.argv) > 1:
        data_terca = sys.argv[1]
    
    if len(sys.argv) > 2:
        turno = sys.argv[2].lower()
    
    # Executar
    sucesso = criar_vagas_terca(data_terca, turno)
    sys.exit(0 if sucesso else 1)
