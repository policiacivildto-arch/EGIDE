from datetime import timedelta
import datetime

# Tabela de valores por cargo e período
TABELA_VALORES = {
    'OIP': {'dia': 36.15, 'noite': 47.00},
    'DPC': {'dia': 50.60, 'noite': 65.80},
}

# Lista de feriados no formato 'dd/mm/yyyy'
FERIADOS = ["03/04/2026"]

def converter_para_minutos(dt):
    if isinstance(dt, datetime.datetime):
        return dt.hour * 60 + dt.minute
    if isinstance(dt, datetime.time):
        return dt.hour * 60 + dt.minute
    return None

def calcular_pagamento_backend(cargo, servico, data_entrada, hora_entrada, data_saida, hora_saida):
    """
    cargo: string (ex: 'OIP', 'DPC')
    servico: string (ex: 'EXTRA')
    data_entrada, data_saida: datetime.date
    hora_entrada, hora_saida: datetime.time ou datetime.datetime
    Retorna valor total calculado (float)
    """
    if not servico or servico.upper() != 'EXTRA':
        return 0.0
    if not cargo or cargo.upper() not in TABELA_VALORES:
        return 0.0
    inicio = converter_para_minutos(hora_entrada)
    fim = converter_para_minutos(hora_saida)
    if inicio is None or fim is None:
        return 0.0
    minutos = fim - inicio
    if data_saida > data_entrada:
        minutos += 1440
    horas = int((minutos + 59) // 60)  # arredonda para cima
    valor_hora = TABELA_VALORES[cargo.upper()]
    total = 0.0
    data_atual = datetime.datetime.combine(data_entrada, hora_entrada)
    for h in range(horas):
        hora = data_atual.hour
        d = data_atual.day
        m = data_atual.month
        a = data_atual.year
        data_formatada = f"{d:02d}/{m:02d}/{a}"
        if data_formatada in FERIADOS or data_atual.weekday() in [5, 6]:
            total += valor_hora['noite']
        else:
            if 6 <= hora < 22:
                total += valor_hora['dia']
            else:
                total += valor_hora['noite']
        data_atual += timedelta(hours=1)
    return round(total, 2)
