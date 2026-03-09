from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_feriado_alter_perfildepartamento_sigla'),
    ]

    operations = [
        migrations.AlterField(
            model_name='policial',
            name='cargo',
            field=models.CharField(
                choices=[
                    ('Policial Civil', 'Policial Civil'),
                    ('Delegado', 'Delegado'),
                    ('OIP', 'OIP'),
                    ('Investigador', 'Investigador'),
                ],
                max_length=50,
            ),
        ),
    ]
