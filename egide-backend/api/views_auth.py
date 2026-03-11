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
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.utils.text import slugify
from api.models_security import LogAuditoria, PerfilDepartamento
from api.models import Delegacia, Policial, Departamento


def _normalize_text(value):
    return slugify(str(value or '')).replace('-', ' ').strip().upper()


def _reduced_tokens(value):
    stop_words = {
        'DELEGACIA', 'POLICIA', 'POLICIAL', 'CIVIL', 'DE', 'DA', 'DO', 'DAS', 'DOS'
    }
    tokens = [t for t in _normalize_text(value).split() if t and t not in stop_words]
    return set(tokens)


def _resolve_delegacia(delegacias_qs, delegacia_name, departamento_obj=None):
    qs = delegacias_qs
    if departamento_obj is not None:
        qs = qs.filter(departamento=departamento_obj)

    # 1) Correspondência exata (mais segura).
    delegacia = qs.filter(nome__iexact=delegacia_name).first()
    if delegacia:
        return delegacia

    # 2) Correspondência parcial direta pelo banco.
    delegacia = qs.filter(nome__icontains=delegacia_name).first()
    if delegacia:
        return delegacia

    # 3) Correspondência flexível em memória (ignora prefixos comuns).
    norm_input = _normalize_text(delegacia_name)
    reduced_input = _reduced_tokens(delegacia_name)
    for item in qs:
        norm_item = _normalize_text(item.nome)
        if norm_input in norm_item or norm_item in norm_input:
            return item
        reduced_item = _reduced_tokens(item.nome)
        if reduced_input and len(reduced_input.intersection(reduced_item)) >= 2:
            return item

    return None


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Registro de usuário (frontend SignUp)

    POST /api/auth/register/
    """
    username = (request.data.get('username') or '').strip()
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''
    nome = (request.data.get('nome') or '').strip()
    matricula = ''.join(filter(str.isdigit, str(request.data.get('matricula') or '')))
    telefone = request.data.get('telefone') or ''
    cargo_front = (request.data.get('cargo') or '').strip().upper()
    classe_front = (request.data.get('classe') or '').strip()
    delegacia_value = request.data.get('delegacia')
    departamento_value = request.data.get('departamento')

    required_fields = {
        'username': username,
        'email': email,
        'password': password,
        'nome': nome,
        'matricula': matricula,
        'delegacia': delegacia_value,
    }
    missing = [field for field, value in required_fields.items() if not value]
    if missing:
        return Response(
            {'error': f"Campos obrigatórios ausentes: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 6:
        return Response({'error': 'A senha deve ter no mínimo 6 caracteres'}, status=status.HTTP_400_BAD_REQUEST)

    if len(matricula) != 8:
        return Response({'error': 'Matrícula deve ter 8 dígitos'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'username já existe'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'email já existe'}, status=status.HTTP_400_BAD_REQUEST)

    if Policial.objects.filter(matricula=matricula).exists():
        return Response({'error': 'matricula já existe'}, status=status.HTTP_400_BAD_REQUEST)

    # Mapeamento do payload do frontend para choices do model
    if cargo_front == 'DPC':
        cargo_model = 'Delegado'
    elif cargo_front == 'OIP':
        cargo_model = 'OIP'
    else:
        cargo_model = 'Policial Civil'

    if classe_front in ('Oficial', 'Praça'):
        classe_model = classe_front
    else:
        classe_model = 'Oficial' if cargo_model == 'Delegado' else 'Praça'

    delegacias_qs = Delegacia.objects.select_related('departamento').filter(ativo=True)
    if isinstance(delegacia_value, int) or (isinstance(delegacia_value, str) and str(delegacia_value).isdigit()):
        delegacia = delegacias_qs.filter(id=int(delegacia_value)).first()
    else:
        delegacia_name = str(delegacia_value).strip()
        departamento_name = str(departamento_value).strip() if departamento_value else ''
        if departamento_name:
            normalized_department = _normalize_text(departamento_name)
            department_aliases = {
                'ESSENCIAL': 'DPE',
                'DEPARTAMENTO ESSENCIAL': 'DPE',
                'ESPECIAL': 'DPE',
                'DEPARTAMENTO ESPECIAL': 'DPE',
            }
            candidate_sigla = department_aliases.get(normalized_department, departamento_name)

            departamento_obj = Departamento.objects.filter(
                Q(sigla__iexact=candidate_sigla) |
                Q(nome__iexact=departamento_name) |
                Q(nome__icontains=departamento_name)
            ).first()

            if departamento_obj:
                delegacia = _resolve_delegacia(delegacias_qs, delegacia_name, departamento_obj)
            else:
                delegacia = _resolve_delegacia(delegacias_qs, delegacia_name)

            # Se não encontrou com filtro de departamento, tenta por delegacia sem filtro.
            if not delegacia:
                delegacia = _resolve_delegacia(delegacias_qs, delegacia_name)
        else:
            delegacia = _resolve_delegacia(delegacias_qs, delegacia_name)

    if not delegacia and departamento_value:
        # Caso comum no frontend: delegacia vem como sigla do departamento (ex.: DTO).
        dept_input = str(departamento_value).strip()
        departamento_obj = Departamento.objects.filter(
            Q(sigla__iexact=dept_input) |
            Q(nome__iexact=dept_input) |
            Q(nome__icontains=dept_input)
        ).first()

        if not departamento_obj and isinstance(delegacia_value, str):
            delegacia_as_dept = str(delegacia_value).strip()
            departamento_obj = Departamento.objects.filter(
                Q(sigla__iexact=delegacia_as_dept) |
                Q(nome__iexact=delegacia_as_dept) |
                Q(nome__icontains=delegacia_as_dept)
            ).first()

        if departamento_obj:
            delegacia = Delegacia.objects.filter(
                departamento=departamento_obj,
                ativo=True,
            ).order_by('nome').first()

    if not delegacia:
        return Response({'error': 'Delegacia não encontrada para o cadastro'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=nome,
            )

            policial = Policial.objects.create(
                usuario=user,
                matricula=matricula,
                nome=nome,
                classe=classe_model,
                cargo=cargo_model,
                delegacia=delegacia,
                telefone=telefone,
                email=email,
                ativo=True,
            )

        LogAuditoria.registrar(
            acao='registro',
            usuario=user,
            descricao=f'Registro de novo usuário: {user.username}',
            nivel='info',
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': 'Conta criada com sucesso',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            'policial': {
                'id': policial.id,
                'nome': policial.nome,
                'matricula': policial.matricula,
                'delegacia': policial.delegacia.nome if policial.delegacia else None,
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({'error': f'Falha ao registrar usuário: {exc}'}, status=status.HTTP_400_BAD_REQUEST)


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
    username_or_email = request.data.get('username')
    password = request.data.get('password')
    
    # DEBUG - Log dos dados recebidos
    print(f'🔍 DEBUG Login - Data recebido: {request.data}')
    print(f'🔍 DEBUG Login - Username/Email: {username_or_email}')
    print(f'🔍 DEBUG Login - Password: {"*" * len(password) if password else None}')
    
    if not username_or_email or not password:
        return Response(
            {'error': 'Username/Email e password são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Tenta autenticar com username ou email
    user = authenticate(username=username_or_email, password=password)
    
    # Se falhar, tenta buscar por email e autenticar com username
    if user is None and '@' in username_or_email:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user_obj = User.objects.get(email=username_or_email)
            user = authenticate(username=user_obj.username, password=password)
            print(f'🔍 DEBUG Login - Tentou com email, username encontrado: {user_obj.username}')
        except User.DoesNotExist:
            print(f'🔍 DEBUG Login - Email não encontrado')
            pass
    
    if user is None:
        # Registrar tentativa de login falha
        LogAuditoria.registrar(
            acao='login_falhou',
            descricao=f'Tentativa de login falhou: {username_or_email}',
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
            blacklist_method = getattr(token, 'blacklist', None)
            if callable(blacklist_method):
                blacklist_method()
        
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
