"""
Permissões Personalizadas - Sistema EGIDE
Django REST Framework

Define classes de permissão para controlar acesso aos endpoints da API
"""

from rest_framework import permissions


def _get_area_profile(user):
    if not user or not user.is_authenticated:
        return None

    if hasattr(user, 'perfil_delegacia'):
        return user.perfil_delegacia

    if hasattr(user, 'perfil_departamento'):
        return user.perfil_departamento

    return None


def _get_area_departamento(user):
    profile = _get_area_profile(user)
    if not profile:
        return None
    if hasattr(profile, 'delegacia'):
        return profile.delegacia.departamento if profile.delegacia else None
    return getattr(profile, 'departamento', None)


def _get_area_delegacia(user):
    profile = _get_area_profile(user)
    if profile and hasattr(profile, 'delegacia'):
        return profile.delegacia
    return None


class IsAuthenticated(permissions.BasePermission):
    """
    Permite acesso apenas para usuários autenticados
    """
    message = 'Você precisa estar autenticado para acessar este recurso.'
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsActive(permissions.BasePermission):
    """
    Verifica se o usuário está ativo no sistema
    """
    message = 'Sua conta está inativa. Entre em contato com o administrador.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            perfil = request.user.policial.perfil
            return perfil.ativo
        except:
            return False


class IsAdmin(permissions.BasePermission):
    """
    Permite acesso apenas para administradores
    """
    message = 'Apenas administradores podem acessar este recurso.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            return request.user.policial.perfil.is_admin
        except:
            return False


class IsCoordenador(permissions.BasePermission):
    """
    Permite acesso para coordenadores e administradores
    """
    message = 'Apenas coordenadores e administradores podem acessar este recurso.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            perfil = request.user.policial.perfil
            return perfil.is_admin or perfil.is_coordenador
        except:
            return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permite acesso se for o dono do objeto ou administrador
    """
    message = 'Você não tem permissão para acessar este recurso.'
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            perfil = request.user.policial.perfil
            
            # Admin pode tudo
            if perfil.is_admin:
                return True
            
            # Verifica se é o dono do objeto
            if hasattr(obj, 'policial'):
                return obj.policial == request.user.policial
            elif hasattr(obj, 'usuario'):
                return obj.usuario == request.user
            elif isinstance(obj, type(request.user.policial)):
                return obj == request.user.policial
            
            return False
        except:
            return False


class CanCreateOperacao(permissions.BasePermission):
    """
    Verifica se o usuário pode criar operações
    """
    message = 'Você não tem permissão para criar operações.'
    
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            perfil = request.user.policial.perfil
            return perfil.is_admin or perfil.is_coordenador or perfil.pode_criar_operacoes
        except:
            return False


class CanEditOperacao(permissions.BasePermission):
    """
    Verifica se o usuário pode editar operações
    """
    message = 'Você não tem permissão para editar esta operação.'
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            perfil = request.user.policial.perfil
            
            # Admin pode editar qualquer operação
            if perfil.is_admin:
                return True
            
            # Coordenador pode editar operações que coordena
            if perfil.is_coordenador:
                if hasattr(obj, 'coordenador'):
                    return obj.coordenador == request.user.policial
                return True
            
            return False
        except:
            return False


class CanDeleteOperacao(permissions.BasePermission):
    """
    Apenas admins podem deletar operações
    """
    message = 'Apenas administradores podem deletar operações.'
    
    def has_object_permission(self, request, view, obj):
        if request.method != 'DELETE':
            return True
        
        return IsAdmin().has_permission(request, view)


class CanApproveEscala(permissions.BasePermission):
    """
    Verifica se o usuário pode aprovar escalas
    """
    message = 'Você não tem permissão para aprovar escalas.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            perfil = request.user.policial.perfil
            return perfil.is_admin or perfil.is_coordenador or perfil.pode_aprovar_escalas
        except:
            return False


class CanManageUsers(permissions.BasePermission):
    """
    Verifica se o usuário pode gerenciar outros usuários
    """
    message = 'Você não tem permissão para gerenciar usuários.'
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            perfil = request.user.policial.perfil
            return perfil.is_admin or perfil.pode_gerenciar_usuarios
        except:
            return False


class CanViewAuditLog(permissions.BasePermission):
    """
    Apenas admins podem ver logs de auditoria
    """
    message = 'Apenas administradores podem acessar logs de auditoria.'
    
    def has_permission(self, request, view):
        return IsAdmin().has_permission(request, view)


class ReadOnly(permissions.BasePermission):
    """
    Permite apenas leitura (GET, HEAD, OPTIONS)
    """
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


# ============= PERMISSÕES PARA DEPARTAMENTOS =============

class IsDepartamento(permissions.BasePermission):
    """
    Verifica se o usuário é um perfil de departamento
    """
    message = 'Acesso restrito a departamentos.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return bool(_get_area_profile(request.user))


class IsDTO(permissions.BasePermission):
    """
    Verifica se o usuário é o DTO
    """
    message = 'Apenas o DTO pode acessar este recurso.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        profile = _get_area_profile(request.user)
        return bool(profile and getattr(profile, 'is_dto', False))


class DepartamentoCanCreateDemanda(permissions.BasePermission):
    """
    Qualquer departamento pode criar demandas de operação
    """
    message = 'Departamentos podem criar demandas de operação.'
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return IsDepartamento().has_permission(request, view)
        # POST - criar demanda
        return IsDepartamento().has_permission(request, view)


class DTOCanApproveDemanda(permissions.BasePermission):
    """
    Apenas DTO pode aprovar ou rejeitar demandas
    """
    message = 'Apenas o DTO pode aprovar ou rejeitar demandas.'
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return IsDepartamento().has_permission(request, view)
        # POST, PUT, PATCH - aprovar/rejeitar
        return IsDTO().has_permission(request, view)


class DepartamentoCanViewOwnOperations(permissions.BasePermission):
    """
    Departamento pode ver apenas operações relacionadas ao seu departamento
    """
    message = 'Você só pode visualizar operações do seu departamento.'
    
    def has_permission(self, request, view):
        return IsDepartamento().has_permission(request, view)
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        profile = _get_area_profile(request.user)
        departamento = _get_area_departamento(request.user)
        delegacia = _get_area_delegacia(request.user)

        if not profile or not departamento:
            return False

        if getattr(profile, 'is_dto', False):
            return True

        if hasattr(obj, 'departamento_solicitante_id') and obj.departamento_solicitante_id == departamento.id:
            return True

        if delegacia and hasattr(obj, 'delegacia_solicitante_id') and obj.delegacia_solicitante_id == delegacia.id:
            return True

        if hasattr(obj, 'departamentos_apoio') and obj.departamentos_apoio.filter(id=departamento.id).exists():
            return True

        if delegacia and hasattr(obj, 'equipes_operacao') and obj.equipes_operacao.filter(delegacia=delegacia).exists():
            return True

        return False


class DepartamentoCanRespondNotification(permissions.BasePermission):
    """
    Departamento pode responder notificações enviadas para ele
    """
    message = 'Você só pode responder notificações enviadas para seu departamento.'
    
    def has_permission(self, request, view):
        return IsDepartamento().has_permission(request, view)
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        profile = _get_area_profile(request.user)
        departamento = _get_area_departamento(request.user)

        if not profile or not departamento:
            return False

        return getattr(obj.para_departamento, 'departamento_id', None) == departamento.id


class DTOCanSendNotifications(permissions.BasePermission):
    """
    DTO pode enviar notificações para outros departamentos
    """
    message = 'Apenas o DTO pode enviar notificações para departamentos.'
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return IsDepartamento().has_permission(request, view)
        return IsDTO().has_permission(request, view)


# Permissões compostas para uso comum

class AdminOrReadOnly(permissions.BasePermission):
    """
    Admin pode tudo, outros apenas leitura
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return IsAuthenticated().has_permission(request, view)
        return IsAdmin().has_permission(request, view)


class CoordenadorOrReadOnly(permissions.BasePermission):
    """
    Coordenador/Admin pode escrever, outros apenas leitura
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return IsAuthenticated().has_permission(request, view)
        return IsCoordenador().has_permission(request, view)


class OwnerOrReadOnly(permissions.BasePermission):
    """
    Dono pode editar, outros apenas leitura
    """
    def has_permission(self, request, view):
        return IsAuthenticated().has_permission(request, view)
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsOwnerOrAdmin().has_object_permission(request, view, obj)


# Helper functions

def get_user_role(user):
    """
    Retorna o role do usuário
    
    Returns:
        str: 'admin', 'coordenador', 'policial', 'departamento' ou None
    """
    try:
        if hasattr(user, 'perfil_delegacia'):
            return 'delegacia'
        if hasattr(user, 'perfil_departamento'):
            return 'departamento'
        return user.policial.perfil.tipo
    except:
        return None


def user_can_edit(user, obj):
    """
    Verifica se o usuário pode editar um objeto
    
    Args:
        user: User instance
        obj: Objeto a ser editado
    
    Returns:
        bool: True se pode editar
    """
    try:
        return user.policial.perfil.pode_editar(obj)
    except:
        return False


def user_can_delete(user, obj):
    """
    Verifica se o usuário pode deletar um objeto
    
    Args:
        user: User instance
        obj: Objeto a ser deletado
    
    Returns:
        bool: True se pode deletar
    """
    try:
        return user.policial.perfil.pode_deletar(obj)
    except:
        return False
