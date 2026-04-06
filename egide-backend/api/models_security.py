"""
Models de Segurança e Auditoria - Sistema EGIDE
Django Backend

Este arquivo contém os models para:
- Sistema de Roles (Admin, Coordenador, Policial)
- Perfil de Usuário
- Logs de Auditoria
- Sessões e Tokens
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
import json


class PerfilDepartamento(models.Model):
    """
    Perfil de usuário para Departamentos da Polícia Civil
    Os departamentos podem visualizar operações e responder a notificações do DTO
    """
    DEPARTAMENTOS_CHOICES = [
        ('depatri', 'DEPATRI - Departamento de Patrimônio'),
        ('dhpp', 'DHPP - Departamento de Homicídios e Proteção à Pessoa'),
        ('dpc', 'DPC - Departamento de Polícia da Criança'),
        ('coplan', 'COPLAN - Coordenadoria de Plantões'),
        ('dpm', 'DPM - Departamento de Proteção à Mulher'),
        ('dpi_norte', 'DPI Norte - Departamento de Polícias Interior Norte'),
        ('dpi_sul', 'DPI Sul - Departamento de Polícias Interior Sul'),
        ('dhpp_caucaia', 'DHPP Caucaia - Departamento de Homicídios Caucaia'),
        ('dpe', 'DPE - Departamento de Polícias Especializadas'),
        ('dpgv', 'DPGV - Departamento de Proteção a Grupos Vulneráveis'),
        ('dra', 'DRA - Departamento de Recuperação de Ativos'),
        ('drco', 'DRCO - Departamento de Repressão ao Crime Organizado'),
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
    ]

    # Núcleos operacionais são lotações internas e herdam o departamento-mãe.
    NUCLEO_PARA_DEPARTAMENTO = {
        'no_do_depatri': 'depatri',
        'no_depatri': 'depatri',
        'nucleo_meu_celular': 'depatri',
        'no_dpe': 'dpe',
        'no_dhpp': 'dhpp',
        'no_aracati': 'dpi_sul',
        'no_juazeiro_norte': 'dpi_sul',
        'no_quixada': 'dpi_sul',
        'no_iguatu': 'dpi_sul',
        'no_taua': 'dpi_sul',
        'no_dpgv': 'dpgv',
        'no_capital': 'dpc',
        'no_dpi_norte': 'dpi_norte',
        'no_dra': 'dra',
    }
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='perfil_departamento'
    )
    departamento = models.ForeignKey(
        'Departamento',
        on_delete=models.CASCADE,
        related_name='perfis'
    )
    sigla = models.CharField(
        max_length=20,
        choices=DEPARTAMENTOS_CHOICES,
        unique=True,
        help_text='Sigla do departamento'
    )
    ativo = models.BooleanField(
        default=True,
        help_text='Indica se o departamento pode acessar o sistema'
    )
    ultimo_acesso = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='Data e hora do último acesso ao sistema'
    )
    
    # Permissões específicas
    pode_ver_operacoes = models.BooleanField(
        default=True,
        help_text='Pode visualizar operações do departamento'
    )
    pode_responder_notificacoes = models.BooleanField(
        default=True,
        help_text='Pode responder a notificações do DTO'
    )
    pode_informar_efetivo = models.BooleanField(
        default=True,
        help_text='Pode informar efetivo disponível'
    )
    
    # Metadados
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Departamento'
        verbose_name_plural = 'Perfis de Departamentos'
        ordering = ['sigla']
    
    def __str__(self):
        return f"{self.get_sigla_display()}"

    @property
    def sigla_departamento(self):
        """Retorna a sigla-base do departamento para regras de acesso."""
        return self.NUCLEO_PARA_DEPARTAMENTO.get(self.sigla, self.sigla)
    
    @property
    def is_dto(self):
        """Verifica se é o DTO (departamento especial)"""
        return self.sigla_departamento == 'dto'

    def save(self, *args, **kwargs):
        # Se vier um N.O no menu, persistimos a sigla do departamento-mãe.
        self.sigla = self.NUCLEO_PARA_DEPARTAMENTO.get(self.sigla, self.sigla)
        super().save(*args, **kwargs)
    
    def atualizar_ultimo_acesso(self):
        """Atualiza a data/hora do último acesso"""
        self.ultimo_acesso = timezone.now()
        self.save(update_fields=['ultimo_acesso'])


class PerfilDelegacia(models.Model):
    """
    Perfil de usuário para Delegacias vinculadas a um departamento.
    Permite acompanhar operações originadas na delegacia e responder
    solicitações operacionais do respectivo departamento.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='perfil_delegacia'
    )
    delegacia = models.ForeignKey(
        'Delegacia',
        on_delete=models.CASCADE,
        related_name='perfis'
    )
    ativo = models.BooleanField(
        default=True,
        help_text='Indica se a delegacia pode acessar o sistema'
    )
    ultimo_acesso = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Data e hora do último acesso ao sistema'
    )
    pode_ver_operacoes = models.BooleanField(
        default=True,
        help_text='Pode visualizar operações da delegacia e do departamento'
    )
    pode_responder_notificacoes = models.BooleanField(
        default=True,
        help_text='Pode responder solicitações operacionais do departamento'
    )

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Perfil de Delegacia'
        verbose_name_plural = 'Perfis de Delegacias'
        ordering = ['delegacia__nome']

    def __str__(self):
        departamento = self.delegacia.departamento.sigla if self.delegacia and self.delegacia.departamento else 'Sem departamento'
        return f'{self.delegacia.nome} ({departamento})'

    @property
    def departamento(self):
        return self.delegacia.departamento if self.delegacia else None

    @property
    def is_dto(self):
        departamento = self.departamento
        return bool(departamento and str(departamento.sigla).upper() == 'DTO')

    def atualizar_ultimo_acesso(self):
        """Atualiza a data/hora do último acesso"""
        self.ultimo_acesso = timezone.now()
        self.save(update_fields=['ultimo_acesso'])


class PerfilPolicial(models.Model):
    """
    Perfil estendido para Policiais com sistema de roles e permissões
    """
    TIPO_CHOICES = [
        ('admin', 'Administrador'),
        ('coordenador', 'Coordenador'),
        ('policial', 'Policial'),
    ]
    
    policial = models.OneToOneField(
        'Policial', 
        on_delete=models.CASCADE,
        related_name='perfil'
    )
    tipo = models.CharField(
        max_length=20, 
        choices=TIPO_CHOICES, 
        default='policial',
        help_text='Nível de acesso do policial no sistema'
    )
    ativo = models.BooleanField(
        default=True,
        help_text='Indica se o policial pode acessar o sistema'
    )
    ultimo_acesso = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='Data e hora do último acesso ao sistema'
    )
    pode_criar_operacoes = models.BooleanField(default=False)
    pode_aprovar_escalas = models.BooleanField(default=False)
    pode_gerenciar_usuarios = models.BooleanField(default=False)
    
    # Metadados
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Policial'
        verbose_name_plural = 'Perfis de Policiais'
        ordering = ['policial__nome']
    
    def __str__(self):
        return f"{self.policial.nome} ({self.get_tipo_display()})"
    
    @property
    def is_admin(self):
        """Verifica se o usuário é administrador"""
        return self.tipo == 'admin'
    
    @property
    def is_coordenador(self):
        """Verifica se o usuário é coordenador"""
        return self.tipo == 'coordenador'
    
    @property
    def is_policial(self):
        """Verifica se o usuário é policial comum"""
        return self.tipo == 'policial'
    
    def pode_editar(self, obj):
        """
        Verifica se o policial pode editar um objeto
        Admin: pode editar tudo
        Coordenador: pode editar objetos próprios
        Policial: pode editar apenas dados próprios
        """
        if self.is_admin:
            return True
        
        if self.is_coordenador:
            # Coordenador pode editar operações que coordena
            if hasattr(obj, 'coordenador'):
                return obj.coordenador == self.policial
            return True
        
        # Policial só edita próprios dados
        return obj == self.policial
    
    def pode_deletar(self, obj):
        """Apenas admins podem deletar"""
        return self.is_admin
    
    def atualizar_ultimo_acesso(self):
        """Atualiza a data/hora do último acesso"""
        self.ultimo_acesso = timezone.now()
        self.save(update_fields=['ultimo_acesso'])


class LogAuditoria(models.Model):
    """
    Registro de auditoria para todas as ações importantes do sistema
    """
    ACAO_CHOICES = [
        # Usuários
        ('criar_usuario', 'Criar Usuário'),
        ('editar_usuario', 'Editar Usuário'),
        ('deletar_usuario', 'Deletar Usuário'),
        ('ativar_usuario', 'Ativar Usuário'),
        ('desativar_usuario', 'Desativar Usuário'),
        ('alterar_role', 'Alterar Permissão'),
        
        # Operações
        ('criar_operacao', 'Criar Operação'),
        ('editar_operacao', 'Editar Operação'),
        ('deletar_operacao', 'Deletar Operação'),
        ('finalizar_operacao', 'Finalizar Operação'),
        
        # Escalas
        ('criar_escala', 'Criar Escala'),
        ('editar_escala', 'Editar Escala'),
        ('deletar_escala', 'Deletar Escala'),
        ('aprovar_escala', 'Aprovar Escala'),
        
        # Eventos
        ('criar_evento', 'Criar Evento'),
        ('editar_evento', 'Editar Evento'),
        ('deletar_evento', 'Deletar Evento'),
        
        # Autenticação
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('falha_login', 'Falha no Login'),
        ('alterar_senha', 'Alterar Senha'),
        
        # Sistema
        ('exportar_dados', 'Exportar Dados'),
        ('importar_dados', 'Importar Dados'),
        ('backup', 'Backup do Sistema'),
        ('alterar_configuracao', 'Alterar Configuração'),
        
        # Acesso
        ('acesso_negado', 'Acesso Negado'),
        ('tentativa_acesso_nao_autorizado', 'Tentativa de Acesso Não Autorizado'),
    ]
    
    NIVEL_CHOICES = [
        ('info', 'Informação'),
        ('warning', 'Aviso'),
        ('error', 'Erro'),
        ('critical', 'Crítico'),
    ]
    
    # Dados da ação
    acao = models.CharField(max_length=50, choices=ACAO_CHOICES)
    nivel = models.CharField(max_length=10, choices=NIVEL_CHOICES, default='info')
    descricao = models.TextField(help_text='Descrição detalhada da ação')
    
    # Usuário que executou
    usuario = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='acoes_auditoria'
    )
    policial = models.ForeignKey(
        'Policial',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acoes_auditoria'
    )
    
    # Detalhes técnicos
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metodo_http = models.CharField(max_length=10, blank=True)
    url_acessada = models.TextField(blank=True)
    
    # Dados alterados (JSON)
    dados_antes = models.JSONField(
        null=True, 
        blank=True,
        help_text='Estado anterior do objeto'
    )
    dados_depois = models.JSONField(
        null=True, 
        blank=True,
        help_text='Estado posterior do objeto'
    )
    dados_extras = models.JSONField(
        null=True,
        blank=True,
        help_text='Informações adicionais'
    )
    
    # Metadados
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        verbose_name = 'Log de Auditoria'
        verbose_name_plural = 'Logs de Auditoria'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['usuario', '-timestamp']),
            models.Index(fields=['acao', '-timestamp']),
            models.Index(fields=['nivel', '-timestamp']),
        ]
    
    def __str__(self):
        usuario_nome = self.policial.nome if self.policial else 'Sistema'
        return f"[{self.get_nivel_display()}] {self.get_acao_display()} por {usuario_nome} em {self.timestamp}"
    
    @classmethod
    def registrar(cls, acao, usuario=None, policial=None, descricao='', nivel='info', 
                  request=None, dados_antes=None, dados_depois=None, **kwargs):
        """
        Método auxiliar para registrar uma ação de auditoria
        
        Uso:
            LogAuditoria.registrar(
                acao='criar_operacao',
                usuario=request.user,
                policial=request.user.policial,
                descricao='Nova operação criada',
                request=request,
                dados_depois={'operacao_id': op.id}
            )
        """
        log_data = {
            'acao': acao,
            'nivel': nivel,
            'descricao': descricao,
            'usuario': usuario,
            'policial': policial,
            'dados_antes': dados_antes,
            'dados_depois': dados_depois,
            'dados_extras': kwargs
        }
        
        # Extrair dados da request se fornecida
        if request:
            log_data['ip_address'] = cls._get_client_ip(request)
            log_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
            log_data['metodo_http'] = request.method
            log_data['url_acessada'] = request.get_full_path()
        
        return cls.objects.create(**log_data)
    
    @staticmethod
    def _get_client_ip(request):
        """Obtém o IP real do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SessaoUsuario(models.Model):
    """
    Rastreamento de sessões ativas de usuários
    """
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessoes'
    )
    policial = models.ForeignKey(
        'Policial',
        on_delete=models.CASCADE,
        related_name='sessoes'
    )
    token_jwt = models.TextField(help_text='Token JWT da sessão')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    iniciada_em = models.DateTimeField(auto_now_add=True)
    ultima_atividade = models.DateTimeField(auto_now=True)
    expira_em = models.DateTimeField()
    finalizada_em = models.DateTimeField(null=True, blank=True)
    
    ativa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Sessão de Usuário'
        verbose_name_plural = 'Sessões de Usuários'
        ordering = ['-iniciada_em']
    
    def __str__(self):
        status = 'Ativa' if self.ativa else 'Finalizada'
        return f"Sessão de {self.policial.nome} - {status}"
    
    def finalizar(self):
        """Finaliza a sessão"""
        self.ativa = False
        self.finalizada_em = timezone.now()
        self.save()
    
    @property
    def duracao(self):
        """Retorna a duração da sessão"""
        fim = self.finalizada_em or timezone.now()
        return fim - self.iniciada_em
    
    @property
    def expirada(self):
        """Verifica se a sessão está expirada"""
        return timezone.now() > self.expira_em


# Signals para auditoria automática

@receiver(post_save, sender='api.Policial')
def auditar_policial_save(sender, instance, created, **kwargs):
    """Registra criação/edição de policial"""
    if created:
        LogAuditoria.registrar(
            acao='criar_usuario',
            descricao=f'Policial {instance.nome} criado',
            dados_depois={'matricula': instance.matricula, 'nome': instance.nome}
        )
    else:
        LogAuditoria.registrar(
            acao='editar_usuario',
            descricao=f'Policial {instance.nome} atualizado',
            dados_depois={'matricula': instance.matricula}
        )


@receiver(post_delete, sender='api.Policial')
def auditar_policial_delete(sender, instance, **kwargs):
    """Registra exclusão de policial"""
    LogAuditoria.registrar(
        acao='deletar_usuario',
        nivel='warning',
        descricao=f'Policial {instance.nome} deletado',
        dados_antes={'matricula': instance.matricula, 'nome': instance.nome}
    )


class NotificacaoDepartamento(models.Model):
    """
    Sistema de notificações entre DTO e Departamentos
    DTO solicita apoio, Departamentos respondem com efetivo disponível
    """
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('lida', 'Lida'),
        ('respondida', 'Respondida'),
        ('cancelada', 'Cancelada'),
    ]
    
    TIPO_CHOICES = [
        ('solicitacao_efetivo', 'Solicitação de Efetivo'),
        ('informacao', 'Informação'),
        ('alerta', 'Alerta'),
        ('urgente', 'Urgente'),
    ]
    
    # Remetente e Destinatário
    de_departamento = models.ForeignKey(
        PerfilDepartamento,
        on_delete=models.CASCADE,
        related_name='notificacoes_enviadas',
        help_text='Departamento que enviou (geralmente DTO)'
    )
    para_departamento = models.ForeignKey(
        PerfilDepartamento,
        on_delete=models.CASCADE,
        related_name='notificacoes_recebidas',
        help_text='Departamento destinatário'
    )
    
    # Dados da notificação
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    mensagem = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    
    # Operação relacionada
    operacao = models.ForeignKey(
        'OperacaoPolicial',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notificacoes'
    )
    
    # Resposta do departamento
    respondida_em = models.DateTimeField(null=True, blank=True)
    resposta_texto = models.TextField(blank=True)
    efetivo_disponivel = models.IntegerField(
        null=True,
        blank=True,
        help_text='Quantidade de policiais disponíveis informada pelo departamento'
    )
    viaturas_disponiveis = models.IntegerField(
        null=True,
        blank=True,
        help_text='Quantidade de viaturas disponíveis'
    )
    observacoes = models.TextField(
        blank=True,
        help_text='Observações adicionais do departamento'
    )
    
    # Metadados
    criada_em = models.DateTimeField(auto_now_add=True)
    lida_em = models.DateTimeField(null=True, blank=True)
    atualizada_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Notificação de Departamento'
        verbose_name_plural = 'Notificações de Departamentos'
        ordering = ['-criada_em']
        indexes = [
            models.Index(fields=['para_departamento', 'status', '-criada_em']),
            models.Index(fields=['operacao', '-criada_em']),
        ]
    
    def __str__(self):
        return f"{self.titulo} - {self.de_departamento.sigla} → {self.para_departamento.sigla}"
    
    def marcar_como_lida(self):
        """Marca a notificação como lida"""
        if self.status == 'pendente':
            self.status = 'lida'
            self.lida_em = timezone.now()
            self.save()
    
    def responder(self, resposta_texto, efetivo=None, viaturas=None, observacoes=''):
        """Registra a resposta do departamento"""
        self.status = 'respondida'
        self.respondida_em = timezone.now()
        self.resposta_texto = resposta_texto
        self.efetivo_disponivel = efetivo
        self.viaturas_disponiveis = viaturas
        self.observacoes = observacoes
        self.save()
        
        # Registrar na auditoria
        LogAuditoria.registrar(
            acao='criar_evento',  # Pode criar nova ação específica
            descricao=f'Departamento {self.para_departamento.sigla} respondeu notificação',
            nivel='info',
            dados_depois={
                'notificacao_id': self.id,
                'efetivo': efetivo,
                'viaturas': viaturas
            }
        )
    
    @property
    def esta_pendente(self):
        """Verifica se a notificação está pendente"""
        return self.status in ['pendente', 'lida']


@receiver(pre_save, sender=PerfilPolicial)
def auditar_alteracao_role(sender, instance, **kwargs):
    """Registra alteração de role"""
    if instance.pk:  # Só se for atualização
        try:
            old_instance = PerfilPolicial.objects.get(pk=instance.pk)
            if old_instance.tipo != instance.tipo:
                LogAuditoria.registrar(
                    acao='alterar_role',
                    nivel='warning',
                    policial=instance.policial,
                    descricao=f'Role alterada de {old_instance.get_tipo_display()} para {instance.get_tipo_display()}',
                    dados_antes={'tipo': old_instance.tipo},
                    dados_depois={'tipo': instance.tipo}
                )
        except PerfilPolicial.DoesNotExist:
            pass
