# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_alter_notificacaodepartamento_tipo_demandaoperacao_and_more'),
    ]

    operations = [
        # Remover campo demanda de NotificacaoDepartamento
        migrations.RemoveField(
            model_name='notificacaodepartamento',
            name='demanda',
        ),
        
        # Remover tipos de notificação relacionados a demandas
        migrations.AlterField(
            model_name='notificacaodepartamento',
            name='tipo',
            field=models.CharField(
                max_length=30,
                choices=[
                    ('solicitacao_efetivo', 'Solicitação de Efetivo'),
                    ('informacao', 'Informação'),
                    ('alerta', 'Alerta'),
                    ('urgente', 'Urgente'),
                ],
            ),
        ),
        
        # Deletar tabela DemandaOperacao
        migrations.DeleteModel(
            name='DemandaOperacao',
        ),
    ]
