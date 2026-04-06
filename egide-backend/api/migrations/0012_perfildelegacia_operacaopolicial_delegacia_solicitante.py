from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_pagamento'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PerfilDelegacia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ativo', models.BooleanField(default=True, help_text='Indica se a delegacia pode acessar o sistema')),
                ('ultimo_acesso', models.DateTimeField(blank=True, help_text='Data e hora do último acesso ao sistema', null=True)),
                ('pode_ver_operacoes', models.BooleanField(default=True, help_text='Pode visualizar operações da delegacia e do departamento')),
                ('pode_responder_notificacoes', models.BooleanField(default=True, help_text='Pode responder solicitações operacionais do departamento')),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
                ('delegacia', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='perfis', to='api.delegacia')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='perfil_delegacia', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Perfil de Delegacia',
                'verbose_name_plural': 'Perfis de Delegacias',
                'ordering': ['delegacia__nome'],
            },
        ),
        migrations.AddField(
            model_name='operacaopolicial',
            name='delegacia_solicitante',
            field=models.ForeignKey(blank=True, help_text='Delegacia que originou a demanda da operação', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='operacoes_solicitadas', to='api.delegacia'),
        ),
    ]