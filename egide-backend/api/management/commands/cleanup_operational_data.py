from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import (
    PasswordResetToken,
    Pagamento,
    FrequenciaPolicial,
    Comboio,
    Operacao,
    Equipe,
    Vaga,
    Viatura,
    SubstitutoOperacao,
    EquipeOperacao,
    Alvo,
    ResultadoOperacao,
    AporteFinanceiro,
    OperacaoPolicial,
    EscalaPolicial,
    DepartamentoEvento,
    EventoOperacao,
    Feriado,
)
from api.models_security import LogAuditoria, SessaoUsuario, NotificacaoDepartamento


class Command(BaseCommand):
    help = (
        "Limpa dados operacionais e históricos, preservando usuários e perfis já criados "
        "(User, Policial, PerfilDepartamento, PerfilDelegacia, PerfilPolicial, Departamento, Delegacia)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Confirma a limpeza sem prompt interativo.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Mostra quantidades que seriam removidas sem apagar nada.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "Comando bloqueado: limpeza operacional só pode rodar com DEBUG=True."
            )

        targets = [
            ("PasswordResetToken", PasswordResetToken),
            ("Pagamento", Pagamento),
            ("FrequenciaPolicial", FrequenciaPolicial),
            ("Comboio", Comboio),
            ("Operacao", Operacao),
            ("Equipe", Equipe),
            ("Vaga", Vaga),
            ("Viatura", Viatura),
            ("SubstitutoOperacao", SubstitutoOperacao),
            ("EquipeOperacao", EquipeOperacao),
            ("Alvo", Alvo),
            ("ResultadoOperacao", ResultadoOperacao),
            ("AporteFinanceiro", AporteFinanceiro),
            ("OperacaoPolicial", OperacaoPolicial),
            ("EscalaPolicial", EscalaPolicial),
            ("DepartamentoEvento", DepartamentoEvento),
            ("EventoOperacao", EventoOperacao),
            ("Feriado", Feriado),
            ("NotificacaoDepartamento", NotificacaoDepartamento),
            ("SessaoUsuario", SessaoUsuario),
            ("LogAuditoria", LogAuditoria),
        ]

        self.stdout.write("Resumo antes da limpeza:")
        total = 0
        for name, model in targets:
            count = model.objects.count()
            total += count
            self.stdout.write(f"- {name}: {count}")

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING(f"Dry-run concluído. Total de registros que seriam removidos: {total}"))
            return

        if not options["yes"]:
            self.stdout.write(self.style.WARNING("Operação cancelada: use --yes para confirmar a limpeza."))
            return

        with transaction.atomic():
            for _, model in targets:
                model.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("Limpeza concluída com sucesso."))
        self.stdout.write("Resumo após limpeza:")
        for name, model in targets:
            self.stdout.write(f"- {name}: {model.objects.count()}")
