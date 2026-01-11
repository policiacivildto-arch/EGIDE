import brasaoPCCE from '../assets/brasao-pcce.png';


export const PCCE_LOGO_URL = brasaoPCCE;

// Organograma completo da PCCE
export const ORGANOGRAMA = {
    "DTO": ["SUPERVISÃO", "APOIO"],
    "DPC - Departamento de Polícia da Capital": ["1ª DP", "2ª DP", "3ª DP", "4ª DP", "5ª DP", "6ª DP", "7ª DP", "8ª DP", "9ª DP", "10ª DP", "11ª DP", "12ª DP", "13ª DP", "14ª DP", "15ª DP", "16ª DP", "17ª DP", "18ª DP", "19ª DP", "20ª DP", "21ª DP", "22ª DP", "23ª DP", "24ª DP", "25ª DP"],
    "DPM - Departamento de Polícia Metropolitana": ["1ª DP de Maracanaú", "2ª DP de Maracanaú", "3ª DP de Maracanaú", "4ª DP de Maracanaú", "5ª DP de Maracanaú", "6ª DP de Maracanaú", "1ª DP de Caucaia", "2ª DP de Caucaia", "3ª DP de Caucaia", "4ª DP de Caucaia", "5ª DP de Caucaia", "1ª DP de Pacatuba", "2ª DP de Pacatuba", "DP de Aquiraz", "DP de Cascavel", "DP de Chorozinho", "DP de Eusébio", "DP de Guaiúba", "DP de Horizonte", "DP de Itaitinga", "DP de Maranguape", "DP de Pacajus", "DP de Pindoretama", "DP de São Gonçalo do Amarante", "DP de Paracuru", "DP de Paraipaba", "DP de Trairí", "DP de São Luís do Curu"],
    "DPE - Departamento de Polícia Especializada": ["DAER", "DECAP", "DECON", "DPMA", "DEPROTUR", "DRCC", "DADT"],
    "DHPP - Departamento de Homicídios e Proteção à Pessoa": ["1ª DHPP", "2ª DHPP", "3ª DHPP", "4ª DHPP", "5ª DHPP", "6ª DHPP", "7ª DHPP", "8ª DHPP", "9ª DHPP", "10ª DHPP", "11ª DHPP", "12ª DHPP"],
    "DPGV - Departamento de Proteção aos Grupos Vulneráveis": ["1ª DDM de Fortaleza", "2ª DDM de Fortaleza", "DCA", "DECECA", "DDM de Maracanaú", "DDM de Pacatuba", "DPIPD", "DECRIN"],
    "DRA - Departamento de Recuperação de Ativos": ["DECOR", "DCLD", "DECOT"],
    "DRCO - Departamento de Repressão ao Crime Organizado": ["DRACO", "DRACO NORTE", "DRACO SUL", "DENARC", "DESARME"],
    "DEPATRI - Departamento de Combate aos Crimes Contra o Patrimônio": ["DAS", "DRF", "DRFV", "DDF"],
    "DPI NORTE - Departamento de Polícia do Interior Norte": ["1ª DP de Sobral", "2ª DP de Sobral", "DP de Forquilha", "DP de Massapê", "DP de Coreaú", "DP de Santana do Acaraú", "DP de Pacujá", "DP de Varjota", "DP de Camocim", "DP de Granja", "DP de Uruoca", "DP de Chaval", "DP de Tianguá", "DP de Viçosa do Ceará", "DP de Ubajara", "DP de Guaraciaba do Norte", "DP de Ipú", "DP de São Benedito", "DP de Canindé", "DP de Boa Viagem", "DP de Santa Quitéria", "DP de Baturité", "DP de Aracoiaba", "DP de Guaramiranga", "DP de Redenção", "DP de Barreira", "DP de Ocara", "DP de Crateús", "DP de Independência", "DP de Ipueiras", "DP de Nova Russas", "DP de Novo Oriente", "DP de Tamboril", "DP de Monsenhor Tabosa", "DP de Itapipoca", "DP de Amontada", "DP de Itapajé", "DP de Pentecoste", "DP de Uruburetama", "DP de Acaraú", "DP de Bela Cruz", "DP de Cruz", "DP de Marco", "DP de Itarema", "DP de Jijoca de Jericoacoara"],
    "DPI SUL - Departamento de Polícia do Interior Sul": ["1ª DP de Juazeiro do Norte", "2ª DP de Juazeiro do Norte", "DP de Acopiara", "DP de Alto Santo", "DP de Aracati", "DP de Araripe", "DP de Assaré", "DP de Aurora", "DP de Banabuiú", "DP de Barbalha", "DP de Beberibe", "DP de Brejo Santo", "DP de Campos Sales", "DP de Caririaçu", "DP de Cedro", "DP de Crato", "DP de Farias Brito", "DP de Icapuí", "DP de Icó", "DP de Iguatu", "DP de Ipaumirim", "DP de Iracema", "DP de Jaguaretama", "DP de Jaguaribe", "DP de Jaguaruana", "DP de Jardim", "DP de Jucás", "DP de Lavras da Mangabeira", "DP de Limoeiro do Norte", "DP de Mauriti", "DP de Milagres", "DP de Missão Velha", "DP de Mombaça", "DP de Morada Nova", "DP de Nova Olinda", "DP de Orós", "DP de Parambu", "DP de Pedra Branca", "DP de Penaforte", "DP de Quiterianópolis", "DP de Quixadá", "DP de Quixerobim", "DP de Russas", "DP de Saboeiro", "DP de São João do Jaguaribe", "DP de Senador Pompeu", "DP de Solonópole", "DP de Tabuleiro do Norte", "DP de Tauá", "DP de Várzea Alegre"],
    "COGEP": [], 
    "COTIC": [], 
    "COLOG": [], 
    "CODIP": [], 
    "GAB": [], 
    "CORE": []
};

// Mapeamento simplificado para compatibilidade (mantido para uso em operações legadas)
export const DEPARTMENTS = {
    "DPC": ["1º DP", "2º DP", "3º DP", "4º DP", "5º DP", "6º DP", "7º DP", "8º DP", "9º DP", "10º DP", "11º DP", "12º DP", "13º DP", "14º DP", "15º DP", "16º DP", "17º DP", "18º DP", "19º DP", "20º DP", "21º DP", "22º DP", "23º DP", "24º DP", "25º DP"],
    "DPM": ["1ª DP de Maracanaú", "2ª DP de Maracanaú", "1ª DP de Caucaia", "2ª DP de Caucaia", "3ª DP de Maracanaú", "4ª DP de Maracanaú", "3ª DP de Caucaia", "4ª DP de Caucaia", "1ª DP de Pacatuba", "5ª DP de Maracanaú", "6ª DP de Maracanaú", "5ª DP de Caucaia", "DP de Aquiraz", "DP de Cascavel", "DP de Chorozinho", "DP de Eusébio", "DP de Guaiúba", "DP de Horizonte", "DP de Itaitinga", "DP de Maranguape", "DP de Pacajus", "2ª DP de Pacatuba", "DP de Pindoretama", "DP de São Gonçalo do Amarante", "DP de Paracuru", "DP de Paraipaba", "DP de Trairí", "DP de São Luís do Curu"],
    "DPE": ["DAER", "DECAP", "DECON", "DPMA", "DEPROTUR", "DRCC", "DADT"],
    "DHPP": ["1ª DHPP", "2ª DHPP", "3ª DHPP", "4ª DHPP", "5ª DHPP", "6ª DHPP", "7ª DHPP", "8ª DHPP", "9ª DHPP", "10ª DHPP", "11ª DHPP", "12ª DHPP"],
    "DPGV": ["1ª DDM de Fortaleza", "2ª DDM de Fortaleza", "DCA", "DECECA", "DDM de Maracanaú", "DDM de Pacatuba", "DPIPD", "DECRIN"],
    "DRA": ["DECOR", "DCLD", "DECOT"],
    "DRCO": ["DRACO", "DENARC", "DESARME"],
    "DEPATRI": ["DAS", "DRF", "DRFV", "DDF"],
    "CORE": ["CORE"], "DTO": ["DTO"], "CODIP": ["CODIP"], "COTIC": ["COTIC"], "COGEP": ["COGEP"], "GDGPC": ["GDGPC"], "AESP": ["AESP"], "COAFI": ["COAFI"], "CIOPAER": ["CIOPAER"], "ASCON": ["ASCON"], "COREG": ["COREG"]
};

export const PAY_RATES = {
    "OIP": {
        "A": { dia: 34.42, noite: 44.75 },
        "B": { dia: 34.42, noite: 44.75 },
        "C": { dia: 34.42, noite: 44.75 },
        "D": { dia: 34.42, noite: 44.75 }
    },
    "DPC": {
        "Especial": { dia: 48.18, noite: 62.63 }
    }
};


export const AIS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11,12, 13,23, 24, 25];
export const DPC_LIST = ["KLEVER FARIAS", "ALCEU VIANA", "HUGGO LEONARDO", "LUIS JUNIOR", "EVNA AMERICA", "ROBERTA FROTA", "JOÃO GABRIEL", "KEYLA LACERDA", "WILSON CAMELO", "JULIUS BERNARDO"];
export const OIP_LIST = ["JARBAS", "LUCAS", "PAULO JUNIOR", "ALEX", "ROGERIO", "JOÃO PAULO CAVALCANTE TEIXEIRA"];
export const BRIEFING_LOCATIONS = ["Polícia Civil - CISP", ...DEPARTMENTS.DPC];
export const WEAPON_TYPES = ["PISTOLA", "REVÓLVER", "CARABINA", "METRALHADORA", "FUZIL", "ESCOPETA"];
export const AMMO_TYPES = ["9mm", ".40", ".380", ".38", ".32", ".22", "12", "5.56", "7.62", ".50", ".30"];
export const DRUG_TYPES = ["MACONHA", "HAXIXE", "COCAÍNA", "HEROÍNA", "CRACK", "SKANK", "LSD", "ECSTASY", "ANFETAMINAS", "ANABOLIZANTES"];
export const PRISON_TYPES = { 'preventiva': 'Preventiva', 'temporaria': 'Temporária', 'definitiva': 'Definitiva', 'civil': 'Civil', 'flagrante': 'Flagrante' };
export const DEFAULT_VAGAS_RULES = { night_weekday: 8, night_weekend_holiday: 10, day_weekend_holiday: 2 };

export const AIS_BAIRROS = {
       "1": ["ALDEOTA", "VARJOTA", "PRAIA DE IRACEMA", "MEIRELES", "VICENTE PINZON", "CAIS DO PORTO", "MUCURIPE"],
    "2": ["CONJUNTO CEARÁ I E II", "GENIBAÚ", "GRANJA PORTUGAL", "BOM JARDIM", "GRANJA LISBOA", "SIQUEIRA"],
    "3": ["MESSEJANA", "ANCURÍ", "PEDRAS", "BARROSO", "SANTA MARIA", "JANGURUSSU", "CONJUNTO PALMEIRAS", "CURIÓ", "LAGOA REDONDA", "GUAJERU", "SÃO BENTO", "PAUPINA", "COAÇÚ"],
    "4": ["ÁLVARO WEYNE", "VILA ELLERY", "CARLITO PAMPLONA", "MONTE CASTELO", "FARIAS BRITO", "SÃO GERARDO", "JACARECANGA", "CENTRO", "MOURA BRASIL"],
    "5": ["PARANGABA", "VILA PERY", "ITAOCA", "ITAPERI", "DENDÊ", "PANAMERICANO", "JARDIM AMÉRICA", "BENFICA", "DEMÓCRITO ROCHA", "COUTO FERNANDES", "MONTESE", "DAMAS", "BOM FUTURO", "VILA UNIÃO", "JOSÉ BONIFÁCIO", "PARREÃO", "FÁTIMA", "SERRINHA", "AEROPORTO"],
    "6": ["ANTÔNIO BEZERRA", "QUINTINO CUNHA", "OLAVO OLIVEIRA", "PADRE ANDRADE", "BELA VISTA", "PRESIDENTE KENNEDY", "PARQUELÂNDIA", "AMADEU FURTADO", "PARQUE ARAXÁ", "RODOLFO TEÓFILO", "BOM SUCESSO", "JOÃO XXIII", "JÓQUEI CLUBE", "HENRIQUE JORGE", "AUTRAN NUNES", "PICI", "DOM LUSTOSA"],
    "7": ["CIDADE DOS FUNCIONÁRIOS", "CAJAZEIRAS", "ALTO DA BALANÇA", "JARDIM DAS OLIVEIRAS", "AEROLÂNDIA", "EDSON QUEIROZ", "SABIAGUABA", "CAMBEBA", "JOSÉ DE ALENCAR", "PARQUE IRACEMA", "PARQUE MANIBURA", "SAPIRANGA", "PASSARÉ", "PARQUE DOIS IRMÃOS", "DIAS MACEDO", "BOA VISTA"],
    "8": ["PIRAMBU", "CRISTO REDENTOR", "FLORESTA", "JARDIM IRACEMA", "VILA VELHA", "JARDIM GUANABARA", "BARRA DO CEARÁ"],
    "9": ["CONJ. JOSÉ WALTER", "PLANALTO AÍRTON SENA", "MONDUBIM", "NOVO MONDUBIM", "CONJUNTO ESPERANÇA", "CANINDEZINHO", "VILA MANOEL SÁTIRO", "PRESIDENTE VARGAS", "PARQUE SÃO JOSÉ", "MARAPONGA", "JARDIM CEARENSE", "ARACAPÉ", "PARQUE SANTA ROSA"],
    "10": ["GUARARAPES", "ENG. LUCIANO CAVALCANTE", "SÃO JOÃO DO TAUAPE", "SALINAS", "JOAQUIM TÁVORA", "DIONÍSIO TORRES", "PAPICU", "LOURDES", "CIDADE 2000", "PRAIA DO FUTURO I E II", "COCÓ", "MANOEL DIAS BRANCO"],
    "11": ["CENTRO", "CIGANA", "NOVA CIDADE", "AÇUDE", "PARQUE SOLEDADE", "PARQUE SÃO GERARDO", "PADRE JÚLIA MARIA I E II", "ITAMBÉ I E II", "PLANALTO CAUCAIA", "PABUSSU I", "NOVO PABUSSU", "IPAUMIRIM", "BOM JESUS", "CAPUAN", "GENIPABU", "JANDAIGUABA", "PADRE ROMUALDO", "PICUÍ (CONJUNTO METROPOLITANO)", "CONJ PATRÍCIA GOMES", "CABATAN", "CURICACA", "CATUANA", "SÍTIOS NOVOS", "CIPÓ", "GARROTE", "ALTO DO GARROTE E GRILO", "COITÉ/PEDREIRAS", "ASSENTAMENTO LAGOA DA SERRA", "JUREMA", "CONJ. MIRANTE DO SOL POENTE", "CONJ. JURUPARI I E II", "PARQUE POTIRA I E II", "PARQUE GUADALAJARA", "CONJ. TABAPUÁ", "CONJ. TABAPUÁ BRASÍLIA 1", "CONJ. TABAPUÁ BRASÍLIA 2", "LOTEAMENTO PARQUE IPIRANGA", "PARQUE DAS NAÇÕES", "CONJ. SÃO MIGUEL", "CONJ. NOVO SÃO MIGUEL", "VILA MOSQUITO", "VILA NOVA", "CONJ. MARECHAL RONDON", "PARQUE ALBANO E CAMPOS DOS CARIOCAS", "ICARAÍ", "GUAJIRU", "PACHECO", "ÁREA VERDE I E II", "BARRA NOVA", "DEODATO", "MUCUMBA I E II", "DUNAS", "PARQUE LEBLON E IPARANA", "CONJ. NOVA METRÓPOLE", "CAMPO GRANDE", "ARIANÓPOLIS", "ELDORADO", "METRÓPOLE V", "URUCUTUBA", "TAQUARA", "MIRAMBÉ", "TUCUNDUBA", "BOM PRINCÍPIO I E II", "FAZENDA FEIJÃO", "JARANDRAGOEIRA", "CARAUÇANGA", "CONJ. ARATURI", "CONJ. NOVO PARAÍSO", "ESPLANADA DO ARATURI E LAGOA DOS PORCOS", "CUMBUCO", "LAGOA DO BANANA", "LAGOA DO CAUÍPE", "TABUBA", "CRISTALINAS", "CARAÚBAS", "PIRAPORA", "TANUPABA", "PARAZINHO", "LAGOA DO PARNAMIRIM", "LAGOA DO BARRO", "GUARARU E CARAÚBAS"],
    "12": ["CONJ. JEREISSATI I", "CONJ. JEREISSATI II (ATÉ A RUA 64)", "SERRA DO MARACANAÚ", "SANTO ANTÔNIO DO PITAGUARY", "LOTEAMENTO MARACANAÚ SUL", "OLHO D'ÁGUA DE CIMA", "OLHO D'ÁGUA DE BAIXO", "OLHO D'ÁGUA DOS PRATAS", "ESTRADA DA TANGUEIRA", "FURNA DA ONÇA", "ATERRO SANITÁRIO", "MUTIRÃO VIDA NOVA", "COLÔNIA ANTÔNIO JUSTA", "FÓRUM DO MARACANAÚ", "OLARIA", "HORTO", "ESCOLA DE MENORES", "PICADAS", "RESIDENCIAIS SÃO FRANCISCO", "SANTA MARTA", "BELA VISTA", "JARDIM DO AMOR", "ALTO DA MANGUEIRA", "BOA VISTA", "COQUEIRAL", "CENTRO", "PIRATININGA (ATÉ A RUA PERU)", "CONJUNTO INDUSTRIAL", "ESPLANADA MONDUBIM E PARTE DO ARACAPÉ", "ACARACUZINHO", "JAÇANAÚ", "PARQUE JARI", "PARQUE TIJUCA", "ALTO ALEGRE I", "ALTO ALEGRE II", "SANTA MARTA", "SANTO SÁTIRO", "NOVO ORIENTE", "SIQUEIRA", "CONJUNTO TIMBÓ", "DISTRITO INDUSTRIAL I E II", "CÁGADO", "MUCUNÃ", "PARQUE LUZARDO VIANA", "PAU SERRADO", "RESIDENCIAL MARACANAÚ", "PIRATININGA", "NOVO MARACANAÚ", "JENIPAPEIRO", "COQUEIRAL", "MARACANANZINHO", "PAJUÇARA", "JARDIM BANDEIRANTES", "BOA ESPERANÇA", "PLANALTO CIDADE NOVA", "DISTRITO INDUSTRIAL III"],
    "13": ["AQUIRAZ", "CASCAVEL", "EUSÉBIO", "PINDORETAMA"],
    "23": ["SG AMARANTE", "PARACURU", "PARAIPABA", "TRAIRI", "SÃO LUIZ DO CURU"],
    "24": ["PACATUBA", "GUAIÚBA", "MARANGUAPE", "JEREISSATI II", "CAMPOS DO JORDÃO", "CONJ. SANTA MARTA", "CONJ. SÃO FRANCISCO", "CONJ. BOM FUTURO", "PLANALTO DO BENJAMIM", "PAVUNA", "JEREISSATI III", "MONGUBA"],
    "25": ["CHOROZINHO", "HORIZONTE", "ITAITINGA", "PACAJUS"]
}

// Outros órgãos e siglas estaduais
export const OUTROS_ORGAOS = ["Ministério Público", "Polícia Civil de Outros Estados"];
export const SIGLAS_ESTADOS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

// Órgãos Externos que podem solicitar operações
export const ORGAOS_EXTERNOS = {
    "MPCE - Ministério Público do Ceará": [],
    "MPPE - Ministério Público de Pernambuco": [],
    "MPBA - Ministério Público da Bahia": [],
    "MPPI - Ministério Público do Piauí": [],
    "PCRN - Polícia Civil do Rio Grande do Norte": [],
    "PCPB - Polícia Civil da Paraíba": [],
    "PCPE - Polícia Civil de Pernambuco": [],
    "PCBA - Polícia Civil da Bahia": [],
    "PCPI - Polícia Civil do Piauí": [],
    "PCMA - Polícia Civil do Maranhão": [],
    "Polícia Federal": [],
    "PRF - Polícia Rodoviária Federal": [],
    "Receita Federal": [],
    "SEFAZ - Secretaria da Fazenda": []
};
export const TIPOS_APOIO = ["Cartório", "Inteligência", "Apoio Logístico"];
export const RESTRICTED_DEPTS = ["COGEP", "COTIC", "COLOG", "CODIP", "GAB", "CORE"];

// Taxas de hora extra
export const HORA_EXTRA_RATES = {
    dpc: { slot1: 47.70, slot2: 62.01 },
    oip: { slot1: 34.08, slot2: 44.30 }
};

// Dados de demandas para operações
export const DEMAND_DATA = {
    tiposPenais: ["Homicídio", "Tráfico de Drogas", "ORCRIM Lavagem de Dinheiro", "Roubo", "Furto", "Outros"],
    modalidades: ["Mandado de Busca e Apreensão Domiciliar", "Mandado de Prisão Preventiva", "Mandado de Prisão Temporária", "Sequestro/Bloqueio de Bens", "Outros"],
    faccoes: ["CV", "GDE", "Neutros", "PCC", "TCP", "Outros"],
    alvosSensiveis: ["Mulher", "Policial", "Político", "Advogado", "Servidor Público", "Outros"],
    apoioOutrosOrgaos: ["MP", "Polícia Militar", "Polícia Federal", "Polícia Rodoviária Federal", "Receita Federal", "SEFAZ", "AMC", "Guarda Municipal"]
};