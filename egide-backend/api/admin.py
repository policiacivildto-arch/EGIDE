from django.contrib import admin
from .models import (
    Departamento, Delegacia, Policial, Viatura, Vaga,
    Equipe, Operacao, Comboio, FrequenciaPolicial,
    # Sistema de Operações
    OperacaoPolicial, Alvo, EquipeOperacao, SubstitutoOperacao,
    ResultadoOperacao, AporteFinanceiro,
    # Sistema de Eventos
    EventoOperacao, DepartamentoEvento, EscalaPolicial
)
from .models_security import (
    PerfilPolicial, PerfilDepartamento, LogAuditoria, 
    SessaoUsuario, NotificacaoDepartamento
)


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'sigla', 'ativo', 'criado_em']
    list_filter = ['ativo', 'criado_em']
    search_fields = ['nome', 'sigla']


@admin.register(Delegacia)
class DelegaciaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'departamento', 'cidade', 'ativo', 'criado_em']
    list_filter = ['departamento', 'ativo', 'criado_em']
    search_fields = ['nome', 'cidade']


@admin.register(Policial)
class PolicialAdmin(admin.ModelAdmin):
    list_display = ['matricula', 'nome', 'cargo', 'classe', 'delegacia', 'ativo', 'criado_em']
    list_filter = ['classe', 'cargo', 'delegacia', 'ativo', 'criado_em']
    search_fields = ['nome', 'matricula', 'email']
    readonly_fields = ['criado_em', 'atualizado_em']


@admin.register(Viatura)
class ViaturaAdmin(admin.ModelAdmin):
    list_display = ['placa', 'modelo', 'ano', 'delegacia', 'ativa', 'km_atual']
    list_filter = ['delegacia', 'ativa', 'ano']
    search_fields = ['placa', 'modelo']
    readonly_fields = ['criado_em', 'atualizado_em']


@admin.register(Vaga)
class VagaAdmin(admin.ModelAdmin):
    list_display = ['id', 'data', 'turno', 'delegacia', 'posicoes_disponiveis', 'status']
    list_filter = ['delegacia', 'turno', 'data', 'status']
    readonly_fields = ['criado_em', 'atualizado_em']


@admin.register(Equipe)
class EquipeAdmin(admin.ModelAdmin):
    list_display = ['id', 'chefe', 'vaga', 'status', 'data_criacao', 'data_aprovacao']
    list_filter = ['status', 'data_criacao', 'vaga__delegacia']
    search_fields = ['chefe__nome', 'id']
    readonly_fields = ['data_criacao', 'data_aprovacao']
    filter_horizontal = ['membros']


@admin.register(Operacao)
class OperacaoAdmin(admin.ModelAdmin):
    list_display = ['id', 'data_inicio', 'descricao', 'status', 'ais', 'criado_em']
    list_filter = ['status', 'data_inicio', 'criado_em']
    search_fields = ['descricao', 'ais', 'bairros']
    readonly_fields = ['criado_em']


@admin.register(Comboio)
class ComboioAdmin(admin.ModelAdmin):
    list_display = ['id', 'data', 'dpc', 'oip', 'status', 'criado_em']
    list_filter = ['status', 'data', 'criado_em']
    search_fields = ['descricao', 'ais', 'bairros']
    readonly_fields = ['criado_em', 'atualizado_em']
    filter_horizontal = ['operacoes']


@admin.register(FrequenciaPolicial)
class FrequenciaPolicialAdmin(admin.ModelAdmin):
    list_display = ['policial', 'equipe', 'data_operacao', 'status', 'substituto', 'criado_em']
    list_filter = ['status', 'data_operacao']
    search_fields = ['policial__nome', 'policial__matricula']
    readonly_fields = ['criado_em', 'atualizado_em']


# =====================================================
# ADMIN PARA SISTEMA DE OPERAÇÕES POLICIAIS
# =====================================================

@admin.register(OperacaoPolicial)
class OperacaoPolicialAdmin(admin.ModelAdmin):
    list_display = ['id', 'nome', 'departamento_solicitante', 'tipo_operacao', 'status', 'data_hora_inicio', 'criado_em']
    list_filter = ['status', 'tipo_operacao', 'departamento_solicitante', 'data_hora_inicio']
    search_fields = ['nome', 'objetivo']
    readonly_fields = ['criado_por', 'criado_em', 'atualizado_em']
    filter_horizontal = ['departamentos_apoio']
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.criado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(Alvo)
class AlvoAdmin(admin.ModelAdmin):
    list_display = ['id', 'nome', 'tipo', 'operacao', 'visivel_apos_briefing', 'criado_em']
    list_filter = ['tipo', 'operacao', 'visivel_apos_briefing', 'criado_em']
    search_fields = ['nome', 'descricao', 'endereco']
    readonly_fields = ['criado_em', 'atualizado_em']


@admin.register(EquipeOperacao)
class EquipeOperacaoAdmin(admin.ModelAdmin):
    list_display = ['id', 'operacao', 'departamento', 'delegacia', 'chefe', 'confirmou_presenca']
    list_filter = ['operacao', 'departamento', 'delegacia', 'confirmou_presenca']
    search_fields = ['operacao__nome', 'chefe__nome']
    filter_horizontal = ['membros']
    readonly_fields = ['criado_em']


@admin.register(SubstitutoOperacao)
class SubstitutoOperacaoAdmin(admin.ModelAdmin):
    list_display = ['id', 'equipe', 'policial_planejado', 'policial_substituto', 'motivo', 'registrado_em']
    list_filter = ['equipe__operacao', 'registrado_em']
    search_fields = ['policial_planejado__nome', 'policial_substituto__nome', 'motivo']
    readonly_fields = ['registrado_em']


@admin.register(ResultadoOperacao)
class ResultadoOperacaoAdmin(admin.ModelAdmin):
    list_display = ['id', 'operacao', 'tipo', 'quantidade', 'equipe', 'registrado_em']
    list_filter = ['tipo', 'operacao', 'registrado_em']
    search_fields = ['operacao__nome', 'descricao']
    readonly_fields = ['registrado_por', 'registrado_em']
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.registrado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(AporteFinanceiro)
class AporteFinanceiroAdmin(admin.ModelAdmin):
    list_display = ['id', 'operacao', 'departamento_responsavel', 'total_dpc', 'total_oip', 'total_efetivo', 'custo_total']
    list_filter = ['operacao', 'departamento_responsavel', 'calculado_em']
    search_fields = ['operacao__nome', 'departamento_responsavel__nome']
    readonly_fields = ['calculado_em', 'atualizado_em']


# =====================================================
# ADMIN PARA OPERAÇÕES DE EVENTO
# =====================================================

class DepartamentoEventoInline(admin.TabularInline):
    model = DepartamentoEvento
    extra = 1
    fields = ['departamento', 'delegacia', 'tipo_servico', 'tipo_policial', 'quantidade_policiais', 'com_aporte_financeiro']


@admin.register(EventoOperacao)
class EventoOperacaoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo_evento', 'local', 'data_inicio', 'data_fim', 'status', 'criado_em']
    list_filter = ['tipo_evento', 'status', 'data_inicio']
    search_fields = ['nome', 'local', 'descricao']
    readonly_fields = ['criado_por', 'criado_em', 'atualizado_em']
    inlines = [DepartamentoEventoInline]
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.criado_por = request.user
        super().save_model(request, obj, form, change)


class EscalaPolicialInline(admin.TabularInline):
    model = EscalaPolicial
    extra = 1
    fields = ['identificacao', 'data_servico', 'horario_entrada', 'horario_saida', 'valor_hora', 'horas_trabalhadas', 'custo_total']
    readonly_fields = ['horas_trabalhadas', 'custo_total']


@admin.register(DepartamentoEvento)
class DepartamentoEventoAdmin(admin.ModelAdmin):
    list_display = ['evento', 'departamento', 'delegacia', 'tipo_servico', 'tipo_policial', 'quantidade_policiais', 'com_aporte_financeiro', 'escalas_definidas']
    list_filter = ['evento', 'departamento', 'tipo_servico', 'tipo_policial', 'com_aporte_financeiro', 'escalas_definidas']
    search_fields = ['evento__nome', 'departamento__nome', 'delegacia__nome']
    readonly_fields = ['escalas_definidas', 'criado_em', 'atualizado_em']
    inlines = [EscalaPolicialInline]


@admin.register(EscalaPolicial)
class EscalaPolicialAdmin(admin.ModelAdmin):
    list_display = ['identificacao', 'departamento_evento', 'data_servico', 'horario_entrada', 'horario_saida', 'horas_trabalhadas', 'custo_total']
    list_filter = ['departamento_evento__evento', 'departamento_evento__departamento', 'data_servico']
    search_fields = ['identificacao', 'policial__nome']
    readonly_fields = ['horas_trabalhadas', 'custo_total', 'criado_em', 'atualizado_em']


# =====================================================
# ADMIN PARA SISTEMA DE SEGURANÇA
# =====================================================

@admin.register(PerfilPolicial)
class PerfilPolicialAdmin(admin.ModelAdmin):
    list_display = ['policial', 'tipo', 'ativo', 'ultimo_acesso', 'criado_em']
    list_filter = ['tipo', 'ativo', 'criado_em']
    search_fields = ['policial__nome', 'policial__matricula']
    readonly_fields = ['criado_em', 'atualizado_em', 'ultimo_acesso']


@admin.register(PerfilDepartamento)
class PerfilDepartamentoAdmin(admin.ModelAdmin):
    list_display = ['sigla', 'departamento', 'ativo', 'ultimo_acesso', 'criado_em']
    list_filter = ['sigla', 'ativo', 'criado_em']
    search_fields = ['user__username', 'departamento__nome']
    readonly_fields = ['criado_em', 'atualizado_em', 'ultimo_acesso']


@admin.register(NotificacaoDepartamento)
class NotificacaoDepartamentoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'de_departamento', 'para_departamento', 'tipo', 'status', 'criada_em']
    list_filter = ['tipo', 'status', 'criada_em', 'de_departamento', 'para_departamento']
    search_fields = ['titulo', 'mensagem']
    readonly_fields = ['criada_em', 'lida_em', 'respondida_em', 'atualizada_em']


@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = ['acao', 'nivel', 'usuario', 'policial', 'ip_address', 'timestamp']
    list_filter = ['acao', 'nivel', 'timestamp']
    search_fields = ['descricao', 'usuario__username', 'policial__nome']
    readonly_fields = ['timestamp', 'acao', 'nivel', 'usuario', 'policial', 'ip_address', 
                      'user_agent', 'metodo_http', 'url_acessada', 'dados_antes', 
                      'dados_depois', 'dados_extras']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(SessaoUsuario)
class SessaoUsuarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'policial', 'ativa', 'iniciada_em', 'expira_em']
    list_filter = ['ativa', 'iniciada_em', 'expira_em']
    search_fields = ['usuario__username', 'policial__nome', 'ip_address']
    readonly_fields = ['iniciada_em', 'ultima_atividade', 'expira_em', 'finalizada_em']

