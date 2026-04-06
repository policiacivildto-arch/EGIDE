from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_perfildelegacia_operacaopolicial_delegacia_solicitante'),
    ]

    operations = [
        migrations.AlterField(
            model_name='perfildepartamento',
            name='sigla',
            field=models.CharField(
                choices=[
                    ('depatri', 'DEPATRI - Delegacia de Proteção ao Patrimônio'),
                    ('dhpp', 'DHPP - Delegacia de Homicídios e Proteção à Pessoa'),
                    ('dpc', 'DPC - Delegacia de Polícia da Criança'),
                    ('coplan', 'COPLAN - Coordenadoria de Plantões'),
                    ('dpm', 'DPM - Delegacia de Proteção à Mulher'),
                    ('dpi_norte', 'DPI Norte - Departamento de Polícias Interior Norte'),
                    ('dpi_sul', 'DPI Sul - Departamento de Polícias Interior Sul'),
                    ('dhpp_caucaia', 'DHPP Caucaia - Delegacia de Homicídios Caucaia'),
                    ('dpe', 'DPE - Departamento de Polícias Especializadas'),
                    ('dpgv', 'DPGV - Delegacia de Proteção a Grupos Vulneráveis'),
                    ('dra', 'DRA - Departamento de Recuperação de Ativos'),
                    ('drco', 'DRCO - Delegacia de Repressão ao Crime Organizado'),
                    ('dto', 'DTO - Departamento Técnico Operacional'),
                    ('gadel', 'GADEL - Gabinete'),
                    ('no_do_depatri', 'N.O DO DEPATRI - DEPATRI'),
                    ('no_dpe', 'N.O DPE - DPE'),
                    ('nucleo_meu_celular', 'NUCLEO MEU CELULAR - DEPATRI'),
                    ('no_dhpp', 'N.O DHPP - DHPP'),
                    ('no_aracati', 'N.O DE ARACATI - DPI SUL'),
                    ('no_juazeiro_norte', 'N.O DE JUAZEIRO DO NORTE - DPI SUL'),
                    ('no_quixada', 'N.O DE QUIXADA - DPI SUL'),
                    ('no_iguatu', 'N.O DE IGUATU - DPI SUL'),
                    ('no_taua', 'N.O DE TAUA - DPI SUL'),
                    ('no_dpgv', 'N.O DPGV - DPGV'),
                    ('no_capital', 'N.O DA CAPITAL - DPC'),
                    ('no_dpi_norte', 'N.O DPI NORTE - DPI NORTE'),
                    ('no_depatri', 'N.O DEPATRI - DEPATRI'),
                    ('no_dra', 'N.O DRA - DRA'),
                ],
                help_text='Sigla do departamento',
                max_length=20,
                unique=True,
            ),
        ),
    ]
