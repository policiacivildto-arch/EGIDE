from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Departamento, Delegacia, Policial, Viatura, Vaga,
    Equipe, Operacao, Comboio,
    OperacaoPolicial, Alvo, EquipeOperacao, SubstitutoOperacao,
    ResultadoOperacao, AporteFinanceiro,
    EventoOperacao, DepartamentoEvento, EscalaPolicial,
    Feriado
)
from .models_security import (
    PerfilPolicial, PerfilDepartamento,
    NotificacaoDepartamento, LogAuditoria, SessaoUsuario
)


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = ['id', 'nome', 'sigla', 'descricao', 'ativo', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']


class DelegaciaSerializer(serializers.ModelSerializer):
    departamento_nome = serializers.CharField(source='departamento.nome', read_only=True)

    class Meta:
        model = Delegacia
        fields = ['id', 'nome', 'departamento', 'departamento_nome', 'endereco', 'telefone', 'cidade', 'ativo', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class PolicialSerializer(serializers.ModelSerializer):
    usuario = UserSerializer(read_only=True)
    delegacia_nome = serializers.CharField(source='delegacia.nome', read_only=True)

    class Meta:
        model = Policial
        fields = ['id', 'usuario', 'matricula', 'nome', 'classe', 'cargo', 'delegacia', 'delegacia_nome', 'telefone', 'email', 'ativo', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']


class ViaturaSerializer(serializers.ModelSerializer):
    delegacia_nome = serializers.CharField(source='delegacia.nome', read_only=True)

    class Meta:
        model = Viatura
        fields = ['id', 'placa', 'modelo', 'ano', 'delegacia', 'delegacia_nome', 'ativa', 'km_atual', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']


class VagaSerializer(serializers.ModelSerializer):
    delegacia_nome = serializers.CharField(source='delegacia.nome', read_only=True)

    class Meta:
        model = Vaga
        fields = ['id', 'data', 'turno', 'delegacia', 'delegacia_nome', 'posicoes_disponiveis', 'descricao', 'status', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']
        extra_kwargs = {
            'delegacia': {'required': False, 'allow_null': True},
        }

    def create(self, validated_data):
        # Hotfix de compatibilidade: se o frontend não enviar delegacia,
        # tenta usar primeiro uma delegacia com nome contendo DTO; caso não exista,
        # usa a primeira delegacia ativa disponível.
        if not validated_data.get('delegacia'):
            delegacia = Delegacia.objects.filter(ativo=True, nome__icontains='DTO').first()
            if not delegacia:
                delegacia = Delegacia.objects.filter(ativo=True).order_by('id').first()
            if not delegacia:
                raise serializers.ValidationError({'delegacia': 'Nenhuma delegacia ativa encontrada.'})
            validated_data['delegacia'] = delegacia

        return super().create(validated_data)


class EquipeSerializer(serializers.ModelSerializer):
    chefe_nome = serializers.CharField(source='chefe.nome', read_only=True)
    vaga_info = VagaSerializer(source='vaga', read_only=True)
    viatura_placa = serializers.CharField(source='viatura.placa', read_only=True)
    membros = serializers.PrimaryKeyRelatedField(queryset=Policial.objects.all(), many=True, required=False)
    membros_detalhes = PolicialSerializer(source='membros', many=True, read_only=True)
    membros_count = serializers.SerializerMethodField()

    class Meta:
        model = Equipe
        fields = ['id', 'vaga', 'vaga_info', 'chefe', 'chefe_nome', 'membros', 'membros_detalhes', 'membros_count', 'viatura', 'viatura_placa', 'status', 'telefone_contato', 'observacoes', 'data_criacao', 'data_aprovacao', 'aprovado_por']
        read_only_fields = ['data_criacao', 'data_aprovacao']

    def get_membros_count(self, obj):
        return obj.membros.count()


class OperacaoSerializer(serializers.ModelSerializer):
    equipe_info = serializers.SerializerMethodField()

    class Meta:
        model = Operacao
        fields = ['id', 'data_inicio', 'data_fim', 'equipe', 'equipe_info', 'descricao', 'status', 'ais', 'bairros', 'resultado', 'criado_em']
        read_only_fields = ['criado_em']

    def get_equipe_info(self, obj):
        if obj.equipe:
            return {'id': obj.equipe.id, 'chefe': obj.equipe.chefe.nome}
        return None


class ComboioSerializer(serializers.ModelSerializer):
    dpc_nome = serializers.CharField(source='dpc.nome', read_only=True)
    oip_nome = serializers.CharField(source='oip.nome', read_only=True)
    operacoes_count = serializers.SerializerMethodField()

    class Meta:
        model = Comboio
        fields = ['id', 'data', 'descricao', 'dpc', 'dpc_nome', 'oip', 'oip_nome', 'status', 'ais', 'bairros', 'operacoes_count', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']

    def get_operacoes_count(self, obj):
        return obj.operacoes.count()


# ===================================
# SERIALIZERS - SISTEMA DE OPERAÇÕES
# ===================================

class AlvoSerializer(serializers.ModelSerializer):
    dossie_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Alvo
        fields = ['id', 'operacao', 'nome', 'tipo', 'descricao', 'endereco', 
                  'dossie_pdf', 'dossie_url', 'visivel_apos_briefing', 
                  'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']
    
    def get_dossie_url(self, obj):
        if obj.dossie_pdf:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.dossie_pdf.url)
        return None


class SubstitutoOperacaoSerializer(serializers.ModelSerializer):
    policial_planejado_nome = serializers.CharField(source='policial_planejado.nome', read_only=True)
    policial_substituto_nome = serializers.CharField(source='policial_substituto.nome', read_only=True)
    
    class Meta:
        model = SubstitutoOperacao
        fields = ['id', 'equipe', 'policial_planejado', 'policial_planejado_nome',
                  'policial_substituto', 'policial_substituto_nome', 
                  'motivo', 'registrado_em']
        read_only_fields = ['registrado_em']


class EquipeOperacaoSerializer(serializers.ModelSerializer):
    departamento_nome = serializers.CharField(source='departamento.nome', read_only=True)
    delegacia_nome = serializers.CharField(source='delegacia.nome', read_only=True)
    chefe_nome = serializers.CharField(source='chefe.nome', read_only=True)
    viatura_placa = serializers.CharField(source='viatura.placa', read_only=True)
    membros_detalhes = PolicialSerializer(source='membros', many=True, read_only=True)
    substitutos = SubstitutoOperacaoSerializer(many=True, read_only=True)
    membros_count = serializers.SerializerMethodField()
    
    class Meta:
        model = EquipeOperacao
        fields = ['id', 'operacao', 'departamento', 'departamento_nome', 
                  'delegacia', 'delegacia_nome', 'chefe', 'chefe_nome', 
                  'membros', 'membros_detalhes', 'membros_count',
                  'viatura', 'viatura_placa', 'confirmou_presenca', 
                  'hora_retorno', 'substitutos', 'observacoes', 'criado_em']
        read_only_fields = ['criado_em']
    
    def get_membros_count(self, obj):
        return obj.membros.count()


class ResultadoOperacaoSerializer(serializers.ModelSerializer):
    equipe_info = serializers.SerializerMethodField()
    registrado_por_nome = serializers.CharField(source='registrado_por.username', read_only=True)
    
    class Meta:
        model = ResultadoOperacao
        fields = ['id', 'operacao', 'tipo', 'descricao', 'quantidade', 
                  'equipe', 'equipe_info', 'registrado_por', 'registrado_por_nome',
                  'registrado_em']
        read_only_fields = ['registrado_por', 'registrado_em']
    
    def get_equipe_info(self, obj):
        if obj.equipe:
            return {
                'id': obj.equipe.id,
                'departamento': obj.equipe.departamento.sigla,
                'chefe': obj.equipe.chefe.nome if obj.equipe.chefe else None
            }
        return None


class AporteFinanceiroSerializer(serializers.ModelSerializer):
    departamento_nome = serializers.CharField(source='departamento_responsavel.nome', read_only=True)
    operacao_nome = serializers.CharField(source='operacao.nome', read_only=True)
    
    class Meta:
        model = AporteFinanceiro
        fields = ['id', 'operacao', 'operacao_nome', 'departamento_responsavel', 
                  'departamento_nome', 'total_dpc', 'total_oip', 'total_efetivo',
                  'custo_total', 'observacoes', 'calculado_em', 'atualizado_em']
        read_only_fields = ['calculado_em', 'atualizado_em']


class OperacaoPolicialSerializer(serializers.ModelSerializer):
    departamento_solicitante_nome = serializers.CharField(source='departamento_solicitante.nome', read_only=True)
    responsavel_operacao_nome = serializers.CharField(source='responsavel_operacao.nome', read_only=True)
    aprovado_por_nome = serializers.CharField(source='aprovado_por.username', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.username', read_only=True)
    responsavel_custo_nome = serializers.CharField(source='responsavel_custo.nome', read_only=True)
    
    departamentos_apoio_detalhes = DepartamentoSerializer(source='departamentos_apoio', many=True, read_only=True)
    alvos = AlvoSerializer(many=True, read_only=True)
    equipes_operacao = EquipeOperacaoSerializer(many=True, read_only=True)
    resultados = ResultadoOperacaoSerializer(many=True, read_only=True)
    aporte = AporteFinanceiroSerializer(read_only=True)
    
    total_equipes = serializers.SerializerMethodField()
    total_alvos = serializers.SerializerMethodField()
    total_resultados = serializers.SerializerMethodField()
    
    class Meta:
        model = OperacaoPolicial
        fields = [
            'id', 'nome', 'departamento_solicitante', 'departamento_solicitante_nome',
            'tipo_operacao', 'objetivo', 'data_hora_inicio', 'data_hora_fim', 
            'data_hora_briefing', 'local_concentracao', 'responsavel_operacao', 
            'responsavel_operacao_nome', 'departamentos_apoio', 'departamentos_apoio_detalhes',
            'status', 'aprovado_por', 'aprovado_por_nome', 'data_aprovacao', 
            'motivo_reprovacao', 'custo_planejado', 'custo_real', 
            'responsavel_custo', 'responsavel_custo_nome', 'criado_por', 
            'criado_por_nome', 'criado_em', 'atualizado_em',
            'alvos', 'equipes_operacao', 'resultados', 'aporte',
            'total_equipes', 'total_alvos', 'total_resultados'
        ]
        read_only_fields = ['criado_por', 'criado_em', 'atualizado_em', 
                            'aprovado_por', 'data_aprovacao', 'responsavel_custo']
    
    def get_total_equipes(self, obj):
        return obj.equipes_operacao.count()
    
    def get_total_alvos(self, obj):
        return obj.alvos.count()
    
    def get_total_resultados(self, obj):
        return obj.resultados.count()


class OperacaoPolicialListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem"""
    departamento_solicitante_sigla = serializers.CharField(source='departamento_solicitante.sigla', read_only=True)
    responsavel_nome = serializers.CharField(source='responsavel_operacao.nome', read_only=True)
    total_equipes = serializers.SerializerMethodField()
    
    class Meta:
        model = OperacaoPolicial
        fields = ['id', 'nome', 'departamento_solicitante_sigla', 'tipo_operacao',
                  'status', 'data_hora_inicio', 'data_hora_briefing', 
                  'responsavel_nome', 'total_equipes', 'criado_em']
        read_only_fields = ['criado_em']
    
    def get_total_equipes(self, obj):
        return obj.equipes_operacao.count()


# =====================================================
# SERIALIZERS PARA OPERAÇÕES DE EVENTO
# =====================================================

class EscalaPolicialSerializer(serializers.ModelSerializer):
    """Serializer para escalas individuais de policiais"""
    policial_nome = serializers.CharField(source='policial.nome', read_only=True)
    
    class Meta:
        model = EscalaPolicial
        fields = [
            'id', 'departamento_evento', 'policial', 'policial_nome', 'identificacao',
            'data_servico', 'horario_entrada', 'horario_saida', 
            'horas_trabalhadas', 'valor_hora', 'custo_total',
            'observacoes', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['horas_trabalhadas', 'custo_total', 'criado_em', 'atualizado_em']


class DepartamentoEventoSerializer(serializers.ModelSerializer):
    """Serializer para participação de departamento em evento"""
    departamento_nome = serializers.CharField(source='departamento.nome', read_only=True)
    delegacia_nome = serializers.CharField(source='delegacia.nome', read_only=True)
    escalas = EscalaPolicialSerializer(many=True, read_only=True)
    total_escalas = serializers.SerializerMethodField()
    custo_total_departamento = serializers.SerializerMethodField()
    total_horas = serializers.SerializerMethodField()
    
    class Meta:
        model = DepartamentoEvento
        fields = [
            'id', 'evento', 'departamento', 'departamento_nome', 
            'delegacia', 'delegacia_nome', 'tipo_servico', 'tipo_policial',
            'quantidade_policiais', 'com_aporte_financeiro',
            'horario_inicio_delegacia', 'horario_fim_delegacia',
            'escalas_definidas', 'observacoes',
            'escalas', 'total_escalas', 'custo_total_departamento', 'total_horas',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['escalas_definidas', 'criado_em', 'atualizado_em']
    
    def get_total_escalas(self, obj):
        return obj.escalas.count()
    
    def get_custo_total_departamento(self, obj):
        from django.db.models import Sum
        total = obj.escalas.aggregate(Sum('custo_total'))['custo_total__sum']
        return float(total) if total else 0
    
    def get_total_horas(self, obj):
        from django.db.models import Sum
        total = obj.escalas.aggregate(Sum('horas_trabalhadas'))['horas_trabalhadas__sum']
        return float(total) if total else 0


class DepartamentoEventoSimplificadoSerializer(serializers.ModelSerializer):
    """Versão simplificada sem escalas para listagens"""
    departamento_nome = serializers.CharField(source='departamento.nome', read_only=True)
    delegacia_nome = serializers.CharField(source='delegacia.nome', read_only=True)
    total_escalas = serializers.SerializerMethodField()
    
    class Meta:
        model = DepartamentoEvento
        fields = [
            'id', 'departamento', 'departamento_nome', 
            'delegacia', 'delegacia_nome', 'tipo_servico', 'tipo_policial',
            'quantidade_policiais', 'com_aporte_financeiro',
            'escalas_definidas', 'total_escalas'
        ]
    
    def get_total_escalas(self, obj):
        return obj.escalas.count()


class EventoOperacaoSerializer(serializers.ModelSerializer):
    """Serializer completo para eventos"""
    criado_por_nome = serializers.CharField(source='criado_por.username', read_only=True)
    departamentos_participantes = DepartamentoEventoSimplificadoSerializer(many=True, read_only=True)
    total_departamentos = serializers.SerializerMethodField()
    total_policiais_planejado = serializers.SerializerMethodField()
    total_escalas = serializers.SerializerMethodField()
    custo_total_evento = serializers.SerializerMethodField()
    
    class Meta:
        model = EventoOperacao
        fields = [
            'id', 'nome', 'tipo_evento', 'descricao', 'local',
            'data_inicio', 'data_fim', 'status',
            'criado_por', 'criado_por_nome',
            'departamentos_participantes', 'total_departamentos',
            'total_policiais_planejado', 'total_escalas', 'custo_total_evento',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['criado_por', 'criado_em', 'atualizado_em']
    
    def get_total_departamentos(self, obj):
        return obj.departamentos_participantes.count()
    
    def get_total_policiais_planejado(self, obj):
        from django.db.models import Sum
        total = obj.departamentos_participantes.aggregate(Sum('quantidade_policiais'))['quantidade_policiais__sum']
        return total if total else 0
    
    def get_total_escalas(self, obj):
        total = 0
        for dep in obj.departamentos_participantes.all():
            total += dep.escalas.count()
        return total
    
    def get_custo_total_evento(self, obj):
        from django.db.models import Sum
        total = 0
        for dep in obj.departamentos_participantes.all():
            custo_dep = dep.escalas.aggregate(Sum('custo_total'))['custo_total__sum']
            if custo_dep:
                total += float(custo_dep)
        return total


class EventoOperacaoListSerializer(serializers.ModelSerializer):
    """Versão simplificada para listagens"""
    criado_por_nome = serializers.CharField(source='criado_por.username', read_only=True)
    total_departamentos = serializers.SerializerMethodField()
    total_policiais_planejado = serializers.SerializerMethodField()
    
    class Meta:
        model = EventoOperacao
        fields = [
            'id', 'nome', 'tipo_evento', 'local',
            'data_inicio', 'data_fim', 'status',
            'criado_por_nome', 'total_departamentos', 'total_policiais_planejado',
            'criado_em'
        ]
    
    def get_total_departamentos(self, obj):
        return obj.departamentos_participantes.count()
    
    def get_total_policiais_planejado(self, obj):
        from django.db.models import Sum
        total = obj.departamentos_participantes.aggregate(Sum('quantidade_policiais'))['quantidade_policiais__sum']
        return total if total else 0


class FeriadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feriado
        fields = ['id', 'data', 'nome', 'descricao', 'tipo', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']

