from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Q

from .models import (
    Departamento, Delegacia, Policial, Viatura, Vaga,
    Equipe, Operacao, Comboio,
    OperacaoPolicial, Alvo, EquipeOperacao, SubstitutoOperacao,
    ResultadoOperacao, AporteFinanceiro,
    EventoOperacao, DepartamentoEvento, EscalaPolicial
)
from .serializers import (
    DepartamentoSerializer, DelegaciaSerializer, PolicialSerializer,
    ViaturaSerializer, VagaSerializer, EquipeSerializer,
    OperacaoSerializer, ComboioSerializer,
    OperacaoPolicialSerializer, OperacaoPolicialListSerializer,
    AlvoSerializer, EquipeOperacaoSerializer, SubstitutoOperacaoSerializer,
    ResultadoOperacaoSerializer, AporteFinanceiroSerializer,
    EventoOperacaoSerializer, EventoOperacaoListSerializer,
    DepartamentoEventoSerializer, DepartamentoEventoSimplificadoSerializer,
    EscalaPolicialSerializer
)


class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Departamentos"""
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nome', 'sigla']
    ordering_fields = ['nome', 'criado_em']
    ordering = ['nome']


class DelegaciaViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Delegacias"""
    queryset = Delegacia.objects.all()
    serializer_class = DelegaciaSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['departamento', 'ativo']
    search_fields = ['nome', 'cidade']
    ordering_fields = ['nome', 'criado_em']
    ordering = ['departamento', 'nome']


class PolicialViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Policiais"""
    queryset = Policial.objects.all()
    serializer_class = PolicialSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['delegacia', 'classe', 'cargo', 'ativo']
    search_fields = ['nome', 'matricula', 'email']
    ordering_fields = ['nome', 'matricula', 'criado_em']
    ordering = ['nome']

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def ativar_desativar(self, request, pk=None):
        policial = self.get_object()
        policial.ativo = not policial.ativo
        policial.save()
        return Response({'status': f'Policial {"ativado" if policial.ativo else "desativado"}', 'ativo': policial.ativo})


class ViaturaViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Viaturas"""
    queryset = Viatura.objects.all()
    serializer_class = ViaturaSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['delegacia', 'ativa']
    search_fields = ['placa', 'modelo']
    ordering_fields = ['placa', 'criado_em']
    ordering = ['placa']


class VagaViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Vagas"""
    queryset = Vaga.objects.all()
    serializer_class = VagaSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['delegacia', 'turno', 'data', 'status']
    search_fields = ['delegacia__nome']
    ordering_fields = ['data', 'turno', 'criado_em']
    ordering = ['-data', 'turno']

    @action(detail=False, methods=['get'])
    def vagas_disponiveis(self, request):
        """Retorna vagas disponíveis para o mês atual"""
        hoje = timezone.now().date()
        proximo_mes = hoje + timedelta(days=30)
        vagas = self.queryset.filter(
            data__gte=hoje,
            data__lte=proximo_mes,
            status='Disponível'
        )
        serializer = self.get_serializer(vagas, many=True)
        return Response(serializer.data)


class EquipeViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Equipes"""
    queryset = Equipe.objects.all()
    serializer_class = EquipeSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vaga', 'chefe', 'status']
    search_fields = ['chefe__nome']
    ordering_fields = ['data_criacao', 'status']
    ordering = ['-data_criacao']

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def aprovar(self, request, pk=None):
        """Aprova uma equipe"""
        equipe = self.get_object()
        equipe.status = 'Aprovada'
        equipe.data_aprovacao = timezone.now()
        equipe.aprovado_por = request.user
        equipe.save()
        return Response({'status': 'Equipe aprovada com sucesso'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def rejeitar(self, request, pk=None):
        """Rejeita uma equipe"""
        equipe = self.get_object()
        equipe.status = 'Rejeitada'
        equipe.save()
        return Response({'status': 'Equipe rejeitada'})

    @action(detail=False, methods=['get'])
    def minhas_equipes(self, request):
        """Retorna equipes onde o usuário é chefe"""
        policial = Policial.objects.get(usuario=request.user)
        equipes = self.queryset.filter(chefe=policial)
        serializer = self.get_serializer(equipes, many=True)
        return Response(serializer.data)


class OperacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Operações"""
    queryset = Operacao.objects.all()
    serializer_class = OperacaoSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['equipe', 'status']
    search_fields = ['descricao', 'ais', 'bairros']
    ordering_fields = ['data_inicio', 'status', 'criado_em']
    ordering = ['-data_inicio']

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def finalizar(self, request, pk=None):
        """Finaliza uma operação"""
        operacao = self.get_object()
        operacao.status = 'Concluída'
        operacao.data_fim = timezone.now()
        operacao.save()
        return Response({'status': 'Operação finalizada'})


class ComboioViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar comboios"""
    queryset = Comboio.objects.all()
    serializer_class = ComboioSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['data', 'status', 'dpc', 'oip']
    search_fields = ['descricao', 'ais', 'bairros']
    ordering_fields = ['data', 'status', 'criado_em']
    ordering = ['-data']

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def adicionar_operacao(self, request, pk=None):
        """Adiciona uma operação ao convóio"""
        comboio = self.get_object()
        operacao_id = request.data.get('operacao_id')
        try:
            operacao = Operacao.objects.get(id=operacao_id)
            comboio.operacoes.add(operacao)
            return Response({'status': 'Operação adicionada ao convóio'})
        except Operacao.DoesNotExist:
            return Response({'error': 'Operação não encontrada'}, status=status.HTTP_404_NOT_FOUND)


# ===================================
# VIEWSETS - SISTEMA DE OPERAÇÕES
# ===================================

class OperacaoPolicialViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Operações Policiais"""
    queryset = OperacaoPolicial.objects.all()
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['departamento_solicitante', 'status', 'tipo_operacao']
    search_fields = ['nome', 'objetivo']
    ordering_fields = ['data_hora_inicio', 'status', 'criado_em']
    ordering = ['-data_hora_inicio']

    def get_serializer_class(self):
        if self.action == 'list':
            return OperacaoPolicialListSerializer
        return OperacaoPolicialSerializer

    def perform_create(self, serializer):
        # Salvar com usuário se autenticado, senão salvar sem usuário
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(criado_por=self.request.user)
        else:
            serializer.save(criado_por=None)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def aprovar(self, request, pk=None):
        """DTO aprova a operação"""
        operacao = self.get_object()
        if operacao.status != 'Aguardando Aprovação':
            return Response(
                {'error': 'Operação não está aguardando aprovação'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        operacao.status = 'Aprovada pelo DTO'
        operacao.aprovado_por = request.user
        operacao.data_aprovacao = timezone.now()
        operacao.save()
        
        return Response({'status': 'Operação aprovada com sucesso'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reprovar(self, request, pk=None):
        """DTO reprova a operação"""
        operacao = self.get_object()
        motivo = request.data.get('motivo', '')
        
        if not motivo:
            return Response(
                {'error': 'Motivo da reprovação é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        operacao.status = 'Reprovada pelo DTO'
        operacao.motivo_reprovacao = motivo
        operacao.save()
        
        return Response({'status': 'Operação reprovada'})

    @action(detail=True, methods=['post'])
    def enviar_aprovacao(self, request, pk=None):
        """Envia operação para aprovação do DTO"""
        operacao = self.get_object()
        
        if operacao.status != 'Rascunho':
            return Response(
                {'error': 'Apenas operações em rascunho podem ser enviadas para aprovação'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validações básicas
        if not operacao.equipes_operacao.exists():
            return Response(
                {'error': 'Adicione pelo menos uma equipe antes de enviar para aprovação'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        operacao.status = 'Aguardando Aprovação'
        operacao.save()
        
        return Response({'status': 'Operação enviada para aprovação do DTO'})

    @action(detail=True, methods=['post'])
    def iniciar_execucao(self, request, pk=None):
        """Inicia a execução da operação"""
        operacao = self.get_object()
        
        if operacao.status != 'Aprovada pelo DTO':
            return Response(
                {'error': 'Apenas operações aprovadas podem ser iniciadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        operacao.status = 'Em Execução'
        operacao.save()
        
        return Response({'status': 'Operação iniciada'})

    @action(detail=True, methods=['post'])
    def concluir(self, request, pk=None):
        """Conclui a operação"""
        operacao = self.get_object()
        
        if operacao.status != 'Em Execução':
            return Response(
                {'error': 'Apenas operações em execução podem ser concluídas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        operacao.status = 'Concluída'
        operacao.data_hora_fim = timezone.now()
        operacao.save()
        
        # Calcular custo real baseado no efetivo que realmente participou
        self._calcular_custo_real(operacao)
        
        return Response({'status': 'Operação concluída'})

    def _calcular_custo_real(self, operacao):
        """Calcula o custo real da operação baseado no efetivo"""
        total_efetivo = 0
        total_dpc = 0
        total_oip = 0
        
        for equipe in operacao.equipes_operacao.filter(confirmou_presenca=True):
            # Conta membros que confirmaram presença
            membros = equipe.membros.count()
            if equipe.chefe:
                membros += 1  # Inclui o chefe
                if equipe.chefe.cargo == 'Delegado':
                    total_dpc += 1
                elif equipe.chefe.cargo in ['Inspetor', 'Investigador']:
                    total_oip += 1
            
            total_efetivo += membros
        
        # Cálculo simplificado: R$ 100 por policial (ajustar conforme necessário)
        custo = total_efetivo * 100
        
        operacao.custo_real = custo
        operacao.save()
        
        # Criar/atualizar aporte financeiro
        aporte, created = AporteFinanceiro.objects.get_or_create(
            operacao=operacao,
            defaults={
                'departamento_responsavel': operacao.responsavel_custo,
                'total_dpc': total_dpc,
                'total_oip': total_oip,
                'total_efetivo': total_efetivo,
                'custo_total': custo
            }
        )
        
        if not created:
            aporte.total_dpc = total_dpc
            aporte.total_oip = total_oip
            aporte.total_efetivo = total_efetivo
            aporte.custo_total = custo
            aporte.save()

    @action(detail=False, methods=['get'])
    def minhas_operacoes(self, request):
        """Retorna operações do departamento do usuário"""
        try:
            policial = Policial.objects.get(usuario=request.user)
            departamento = policial.delegacia.departamento
            
            operacoes = self.queryset.filter(
                departamento_solicitante=departamento
            ) | self.queryset.filter(
                departamentos_apoio=departamento
            )
            
            serializer = self.get_serializer(operacoes.distinct(), many=True)
            return Response(serializer.data)
        except Policial.DoesNotExist:
            return Response({'error': 'Usuário não é um policial'}, status=status.HTTP_403_FORBIDDEN)


class AlvoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Alvos"""
    queryset = Alvo.objects.all()
    serializer_class = AlvoSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['operacao', 'tipo']
    search_fields = ['nome', 'descricao']

    @action(detail=True, methods=['get'])
    def verificar_acesso(self, request, pk=None):
        """Verifica se o usuário pode acessar o alvo (após briefing)"""
        alvo = self.get_object()
        operacao = alvo.operacao
        agora = timezone.now()
        
        if alvo.visivel_apos_briefing and agora < operacao.data_hora_briefing:
            tempo_restante = operacao.data_hora_briefing - agora
            return Response({
                'acesso_permitido': False,
                'mensagem': 'Acesso será liberado após o briefing',
                'data_hora_briefing': operacao.data_hora_briefing,
                'tempo_restante_segundos': tempo_restante.total_seconds()
            })
        
        return Response({
            'acesso_permitido': True,
            'alvo': self.get_serializer(alvo).data
        })


class EquipeOperacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Equipes de Operação"""
    queryset = EquipeOperacao.objects.all()
    serializer_class = EquipeOperacaoSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['operacao', 'departamento', 'delegacia']
    search_fields = ['chefe__nome', 'departamento__nome']

    @action(detail=True, methods=['post'])
    def confirmar_presenca(self, request, pk=None):
        """Confirma presença da equipe na operação"""
        equipe = self.get_object()
        equipe.confirmou_presenca = True
        equipe.save()
        return Response({'status': 'Presença confirmada'})

    @action(detail=True, methods=['post'])
    def registrar_retorno(self, request, pk=None):
        """Registra horário de retorno da equipe"""
        equipe = self.get_object()
        equipe.hora_retorno = timezone.now()
        equipe.save()
        return Response({'status': 'Retorno registrado', 'hora_retorno': equipe.hora_retorno})

    @action(detail=True, methods=['post'])
    def adicionar_substituto(self, request, pk=None):
        """Adiciona um substituto para um policial faltoso"""
        equipe = self.get_object()
        policial_planejado_id = request.data.get('policial_planejado_id')
        policial_substituto_id = request.data.get('policial_substituto_id')
        motivo = request.data.get('motivo', '')
        
        try:
            policial_planejado = Policial.objects.get(id=policial_planejado_id)
            policial_substituto = Policial.objects.get(id=policial_substituto_id)
            
            substituto = SubstitutoOperacao.objects.create(
                equipe=equipe,
                policial_planejado=policial_planejado,
                policial_substituto=policial_substituto,
                motivo=motivo
            )
            
            return Response({
                'status': 'Substituto adicionado',
                'substituto': SubstitutoOperacaoSerializer(substituto).data
            })
        except Policial.DoesNotExist:
            return Response({'error': 'Policial não encontrado'}, status=status.HTTP_404_NOT_FOUND)


class ResultadoOperacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Resultados de Operações"""
    queryset = ResultadoOperacao.objects.all()
    serializer_class = ResultadoOperacaoSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['operacao', 'tipo', 'equipe']
    search_fields = ['descricao']

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)


class AporteFinanceiroViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para visualizar Aportes Financeiros (somente leitura)"""
    queryset = AporteFinanceiro.objects.all()
    serializer_class = AporteFinanceiroSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['operacao', 'departamento_responsavel']


# =====================================================
# VIEWSETS PARA OPERAÇÕES DE EVENTO
# =====================================================

class EventoOperacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Eventos (Carnaval, etc)"""
    queryset = EventoOperacao.objects.all()
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo_evento', 'status']
    search_fields = ['nome', 'local', 'descricao']
    ordering_fields = ['data_inicio', 'data_fim', 'criado_em']
    ordering = ['-data_inicio']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EventoOperacaoListSerializer
        return EventoOperacaoSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """
        Retorna dados completos do dashboard do evento
        """
        evento = self.get_object()
        
        # Buscar todos os departamentos participantes
        departamentos = DepartamentoEvento.objects.filter(evento=evento).select_related(
            'departamento', 'delegacia'
        ).prefetch_related('escalas')
        
        # Calcular estatísticas
        total_departamentos = departamentos.count()
        total_policiais_planejado = departamentos.aggregate(Sum('quantidade_policiais'))['quantidade_policiais__sum'] or 0
        
        # Escalas
        total_escalas = 0
        total_horas = 0
        custo_total = 0
        
        for dep in departamentos:
            escalas_dep = dep.escalas.all()
            total_escalas += escalas_dep.count()
            total_horas += sum([float(e.horas_trabalhadas) for e in escalas_dep])
            custo_total += sum([float(e.custo_total) for e in escalas_dep])
        
        # Dados por departamento
        departamentos_data = []
        for dep in departamentos:
            escalas_dep = dep.escalas.all()
            dep_horas = sum([float(e.horas_trabalhadas) for e in escalas_dep])
            dep_custo = sum([float(e.custo_total) for e in escalas_dep])
            
            departamentos_data.append({
                'id': dep.id,
                'departamento': dep.departamento.nome,
                'delegacia': dep.delegacia.nome if dep.delegacia else None,
                'tipo_servico': dep.get_tipo_servico_display(),
                'tipo_policial': dep.get_tipo_policial_display(),
                'quantidade_planejada': dep.quantidade_policiais,
                'escalas_cadastradas': escalas_dep.count(),
                'com_aporte': dep.com_aporte_financeiro,
                'total_horas': dep_horas,
                'custo_total': dep_custo,
                'escalas_definidas': dep.escalas_definidas,
            })
        
        # Dados por tipo de serviço
        servicos_stats = departamentos.values('tipo_servico').annotate(
            total=Count('id'),
            policiais=Sum('quantidade_policiais')
        )
        
        # Dados por tipo de policial
        tipo_policial_stats = departamentos.values('tipo_policial').annotate(
            total=Count('id'),
            policiais=Sum('quantidade_policiais')
        )
        
        return Response({
            'evento': EventoOperacaoSerializer(evento).data,
            'estatisticas': {
                'total_departamentos': total_departamentos,
                'total_policiais_planejado': total_policiais_planejado,
                'total_escalas_cadastradas': total_escalas,
                'total_horas': round(total_horas, 2),
                'custo_total': round(custo_total, 2),
                'progresso_escalas': round((total_escalas / total_policiais_planejado * 100) if total_policiais_planejado > 0 else 0, 1),
            },
            'departamentos': departamentos_data,
            'servicos': list(servicos_stats),
            'tipos_policial': list(tipo_policial_stats),
        })
    
    @action(detail=True, methods=['post'])
    def mudar_status(self, request, pk=None):
        """Muda o status do evento"""
        evento = self.get_object()
        novo_status = request.data.get('status')
        
        if novo_status not in dict(EventoOperacao.STATUS):
            return Response(
                {'error': 'Status inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        evento.status = novo_status
        evento.save()
        
        return Response(EventoOperacaoSerializer(evento).data)


class DepartamentoEventoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar participação de departamentos em eventos"""
    queryset = DepartamentoEvento.objects.all()
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['evento', 'departamento', 'tipo_servico', 'tipo_policial', 'com_aporte_financeiro']
    ordering_fields = ['criado_em']
    ordering = ['departamento__nome']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DepartamentoEventoSimplificadoSerializer
        return DepartamentoEventoSerializer
    
    @action(detail=True, methods=['post'])
    def gerar_escalas(self, request, pk=None):
        """
        Gera escalas em branco para o departamento baseado na quantidade planejada
        """
        departamento_evento = self.get_object()
        quantidade = departamento_evento.quantidade_policiais
        
        # Data padrão (primeiro dia do evento)
        data_padrao = departamento_evento.evento.data_inicio
        
        # Criar escalas
        escalas_criadas = []
        for i in range(1, quantidade + 1):
            escala = EscalaPolicial.objects.create(
                departamento_evento=departamento_evento,
                identificacao=f"Policial {i}",
                data_servico=data_padrao,
                horario_entrada=departamento_evento.horario_inicio_delegacia,
                horario_saida=departamento_evento.horario_fim_delegacia,
                valor_hora=50.00  # Valor padrão, pode ser ajustado
            )
            escalas_criadas.append(escala)
        
        # Marcar como escalas definidas
        departamento_evento.escalas_definidas = True
        departamento_evento.save()
        
        return Response({
            'message': f'{len(escalas_criadas)} escalas criadas com sucesso',
            'escalas': EscalaPolicialSerializer(escalas_criadas, many=True).data
        })
    
    @action(detail=True, methods=['get'])
    def resumo(self, request, pk=None):
        """Retorna resumo do departamento no evento"""
        departamento_evento = self.get_object()
        escalas = departamento_evento.escalas.all()
        
        total_horas = sum([float(e.horas_trabalhadas) for e in escalas])
        custo_total = sum([float(e.custo_total) for e in escalas])
        
        return Response({
            'departamento': departamento_evento.departamento.nome,
            'evento': departamento_evento.evento.nome,
            'quantidade_planejada': departamento_evento.quantidade_policiais,
            'escalas_cadastradas': escalas.count(),
            'total_horas': round(total_horas, 2),
            'custo_total': round(custo_total, 2),
            'media_horas_policial': round(total_horas / escalas.count(), 2) if escalas.count() > 0 else 0,
        })


class EscalaPolicialViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar escalas individuais de policiais"""
    queryset = EscalaPolicial.objects.all()
    serializer_class = EscalaPolicialSerializer
    # permission_classes = [IsAuthenticated]  # TEMPORÁRIO: Usando AllowAny do settings
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['departamento_evento', 'data_servico', 'policial']
    ordering_fields = ['data_servico', 'horario_entrada']
    ordering = ['data_servico', 'horario_entrada']
    
    @action(detail=False, methods=['post'])
    def criar_multiplas(self, request):
        """
        Cria múltiplas escalas de uma vez
        Espera um array de objetos de escala
        """
        escalas_data = request.data.get('escalas', [])
        
        if not escalas_data:
            return Response(
                {'error': 'Nenhuma escala fornecida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        escalas_criadas = []
        erros = []
        
        for idx, escala_data in enumerate(escalas_data):
            serializer = self.get_serializer(data=escala_data)
            if serializer.is_valid():
                escala = serializer.save()
                escalas_criadas.append(escala)
            else:
                erros.append({
                    'index': idx,
                    'errors': serializer.errors
                })
        
        return Response({
            'criadas': len(escalas_criadas),
            'erros': len(erros),
            'escalas': EscalaPolicialSerializer(escalas_criadas, many=True).data,
            'detalhes_erros': erros
        })

