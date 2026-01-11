"""
Views de Autenticação - Sistema EGIDE
Endpoints para login, logout, e informações do usuário
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from api.models_security import LogAuditoria, PerfilDepartamento


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login de usuário com JWT
    
    POST /api/auth/login/
    Body: {
        "username": "dpm",
        "password": "senha123"
    }
    
    Response: {
        "access": "token_jwt",
        "refresh": "refresh_token",
        "user": {...},
        "perfil_departamento": {...}
    }
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username e password são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Autenticar usuário
    user = authenticate(username=username, password=password)
    
    if user is None:
        # Registrar tentativa de login falha
        LogAuditoria.registrar(
            acao='login_falhou',
            descricao=f'Tentativa de login falhou: {username}',
            nivel='warning',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response(
            {'error': 'Credenciais inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'Usuário inativo'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Gerar tokens JWT
    refresh = RefreshToken.for_user(user)
    
    # Buscar perfil de departamento (se existir)
    perfil_data = None
    try:
        if hasattr(user, 'perfil_departamento'):
            perfil = user.perfil_departamento
            perfil_data = {
                'sigla': perfil.sigla,
                'departamento': perfil.departamento.nome if perfil.departamento else None,
                'ativo': perfil.ativo
            }
    except:
        pass
    
    # Registrar login bem-sucedido
    LogAuditoria.registrar(
        acao='login',
        usuario=user,
        descricao=f'Login bem-sucedido: {user.username}',
        nivel='info',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT')
    )
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        },
        'perfil_departamento': perfil_data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout do usuário
    
    POST /api/auth/logout/
    Headers: Authorization: Bearer {access_token}
    Body: {
        "refresh": "refresh_token"
    }
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Registrar logout
        LogAuditoria.registrar(
            acao='logout',
            usuario=request.user,
            descricao=f'Logout: {request.user.username}',
            nivel='info',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'message': 'Logout realizado com sucesso'})
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Retorna informações do usuário autenticado
    
    GET /api/auth/me/
    Headers: Authorization: Bearer {access_token}
    
    Response: {
        "user": {...},
        "perfil_departamento": {...}
    }
    """
    user = request.user
    
    # Buscar perfil de departamento
    perfil_data = None
    try:
        if hasattr(user, 'perfil_departamento'):
            perfil = user.perfil_departamento
            perfil_data = PerfilDepartamentoSerializer(perfil).data
    except:
        pass
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
        },
        'perfil_departamento': perfil_data
    })
