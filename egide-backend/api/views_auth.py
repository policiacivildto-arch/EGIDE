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
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q
from django.utils.text import slugify
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from urllib.parse import urlencode
import logging
from api.models_security import LogAuditoria, PerfilDepartamento, PerfilDelegacia
from api.models import Delegacia, Policial, Departamento


logger = logging.getLogger(__name__)


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


def _is_pre_registered_user(user):
    if not user:
        return False
    return user.username.startswith('precad_') and user.email.endswith('@precad.egide.local')


def _get_user_department_id(user):
    try:
        if hasattr(user, 'perfil_delegacia') and user.perfil_delegacia.delegacia_id:
            delegacia = user.perfil_delegacia.delegacia
            if delegacia and delegacia.departamento_id:
                return delegacia.departamento_id
    except Exception:
        pass

    try:
        if hasattr(user, 'perfil_departamento') and user.perfil_departamento.departamento_id:
            return user.perfil_departamento.departamento_id
    except Exception:
        pass

    try:
        if hasattr(user, 'policial') and user.policial.delegacia_id:
            delegacia = user.policial.delegacia
            if delegacia and delegacia.departamento_id:
                return delegacia.departamento_id
    except Exception:
        pass

    return None


def _get_user_delegacia_id(user):
    try:
        if hasattr(user, 'perfil_delegacia') and user.perfil_delegacia.delegacia_id:
            return user.perfil_delegacia.delegacia_id
    except Exception:
        pass

    try:
        if hasattr(user, 'policial') and user.policial.delegacia_id:
            return user.policial.delegacia_id
    except Exception:
        pass

    return None


def _get_user_role_claim(user):
    if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
        return 'admin'

    try:
        if hasattr(user, 'perfil_delegacia'):
            return 'delegacia'
    except Exception:
        pass

    try:
        if hasattr(user, 'perfil_departamento'):
            return 'departamento'
    except Exception:
        pass

    try:
        if hasattr(user, 'policial') and hasattr(user.policial, 'perfil'):
            return user.policial.perfil.tipo
    except Exception:
        pass

    return 'policial'


def _build_token_claims(user):
    role_claim = _get_user_role_claim(user)
    claims = {
        'user_id': user.id,
        'app_role': role_claim,
        'role_type': role_claim,
        'username': user.username,
    }

    department_id = _get_user_department_id(user)
    if department_id is not None:
        claims['departamento_id'] = department_id

    delegacia_id = _get_user_delegacia_id(user)
    if delegacia_id is not None:
        claims['delegacia_id'] = delegacia_id

    try:
        if hasattr(user, 'policial'):
            claims['policial_id'] = user.policial.id
    except Exception:
        pass

    try:
        if hasattr(user, 'perfil_delegacia'):
            claims['perfil_delegacia_id'] = user.perfil_delegacia.id
    except Exception:
        pass

    try:
        if hasattr(user, 'perfil_departamento'):
            claims['perfil_departamento_id'] = user.perfil_departamento.id
            claims['departamento_sigla'] = getattr(
                user.perfil_departamento,
                'sigla_departamento',
                user.perfil_departamento.sigla,
            )
            claims['is_dto'] = bool(user.perfil_departamento.is_dto)
    except Exception:
        pass

    return claims


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Registro de usuário (frontend SignUp)

    POST /api/auth/register/
    """
    username = (request.data.get('username') or '').strip().lower()
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

    # Se o frontend não enviar username, usa o email como base.
    # Isso evita colisões comuns de prefixo do email (ex.: joao@gmail e joao@pcce).
    if not username:
        username = email

    # Garante username único sem bloquear registro quando apenas o prefixo colide.
    existing_policial = Policial.objects.select_related('usuario').filter(matricula=matricula).first()
    pre_registered_user = existing_policial.usuario if existing_policial and _is_pre_registered_user(existing_policial.usuario) else None

    if User.objects.filter(username=username).exclude(id=pre_registered_user.id if pre_registered_user else None).exists():
        username_base = username
        for suffix in range(1, 1000):
            candidate = f'{username_base}_{suffix}'
            if not User.objects.filter(username=candidate).exclude(id=pre_registered_user.id if pre_registered_user else None).exists():
                username = candidate
                break

    if User.objects.filter(username=username).exclude(id=pre_registered_user.id if pre_registered_user else None).exists():
        return Response({'error': 'username já existe'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=email).exclude(id=pre_registered_user.id if pre_registered_user else None).exists():
        return Response({'error': 'email já existe'}, status=status.HTTP_400_BAD_REQUEST)

    if existing_policial and not pre_registered_user:
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
                'N O DO DEPATRI': 'DEPATRI',
                'N O DEPATRI': 'DEPATRI',
                'NUCLEO MEU CELULAR': 'DEPATRI',
                'N O DPE': 'DPE',
                'N O DHPP': 'DHPP',
                'N O DE ARACATI': 'DPI SUL',
                'N O DE JUAZEIRO DO NORTE': 'DPI SUL',
                'N O DE QUIXADA': 'DPI SUL',
                'N O DE IGUATU': 'DPI SUL',
                'N O DE TAUA': 'DPI SUL',
                'N O DPGV': 'DPGV',
                'N O DA CAPITAL': 'DPC',
                'N O DPI NORTE': 'DPI NORTE',
                'N O DRA': 'DRA',
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
        # Fallback final para ambientes com base incompleta.
        delegacia = Delegacia.objects.filter(ativo=True).order_by('id').first()

    try:
        with transaction.atomic():
            if pre_registered_user:
                user = pre_registered_user
                user.username = username
                user.email = email
                user.first_name = nome
                user.is_active = True
                user.set_password(password)
                user.save(update_fields=['username', 'email', 'first_name', 'is_active', 'password'])

                policial = existing_policial
                policial.usuario = user
                policial.nome = nome
                policial.classe = classe_model
                policial.cargo = cargo_model
                policial.delegacia = delegacia
                policial.telefone = telefone
                policial.email = email
                policial.ativo = True
                policial.save()
            else:
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
def password_reset_view(request):
    """
    Solicitação de redefinição de senha.

    POST /api/auth/password-reset/
    Body: { "email": "usuario@dominio.com" }
    """
    email = str(request.data.get('email') or '').strip().lower()
    if not email:
        return Response({'error': 'email é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()
    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        frontend_url = str(getattr(settings, 'FRONTEND_URL', '') or '').rstrip('/')
        reset_path = str(getattr(settings, 'RESET_PASSWORD_PATH', '/reset-password') or '/reset-password')
        if not reset_path.startswith('/'):
            reset_path = f'/{reset_path}'

        query = urlencode({'uid': uid, 'token': token})
        reset_link = f'{frontend_url}{reset_path}?{query}' if frontend_url else ''

        subject = 'Redefinição de senha - EGIDE'
        if reset_link:
            message = (
                f'Olá {user.first_name or user.username},\n\n'
                f'Recebemos uma solicitação para redefinir sua senha no EGIDE.\n'
                f'Acesse o link abaixo para continuar:\n\n'
                f'{reset_link}\n\n'
                f'Se você não solicitou essa alteração, ignore este email.'
            )
        else:
            # Fallback para ambientes sem FRONTEND_URL configurado.
            message = (
                f'Olá {user.first_name or user.username},\n\n'
                f'Recebemos uma solicitação para redefinir sua senha no EGIDE.\n'
                f'Use os dados abaixo para concluir a redefinição:\n\n'
                f'uid: {uid}\n'
                f'token: {token}\n\n'
                f'Se você não solicitou essa alteração, ignore este email.'
            )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            # Não expõe falha interna ao cliente para evitar enumeração de contas
            # e impedir timeout no frontend por indisponibilidade do provedor SMTP.
            logger.exception('Falha ao enviar email de redefinição para %s', email)

        return Response({
            'message': 'Se o email existir, um link de redefinição foi enviado.',
        })

    return Response({'message': 'Se o email existir, um link de redefinição foi enviado.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    """
    Confirma redefinição de senha.

    POST /api/auth/password-reset-confirm/
    Body: {
      "uid": "...",            # opcional se token vier como "uid:token"
      "token": "...",
      "new_password": "..."
    }
    """
    uid = str(request.data.get('uid') or '').strip()
    token = str(request.data.get('token') or '').strip()
    new_password = str(request.data.get('new_password') or '')

    if not token or not new_password:
        return Response({'error': 'token e new_password são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 6:
        return Response({'error': 'A senha deve ter no mínimo 6 caracteres'}, status=status.HTTP_400_BAD_REQUEST)

    if not uid and ':' in token:
        uid, token = token.split(':', 1)

    if not uid:
        return Response({'error': 'uid ausente para confirmação de senha'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except Exception:
        return Response({'error': 'Link de redefinição inválido'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Token inválido ou expirado'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save(update_fields=['password'])

    LogAuditoria.registrar(
        acao='alterar_senha',
        usuario=user,
        descricao=f'Redefinição de senha via token: {user.username}',
        nivel='info',
        ip_address=request.META.get('REMOTE_ADDR')
    )

    return Response({'message': 'Senha redefinida com sucesso'})


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
    username_or_email = str(
        request.data.get('username') or request.data.get('email') or ''
    ).strip()
    password = request.data.get('password') or ''
    
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
        user_model = get_user_model()
        try:
            user_obj = user_model.objects.get(email=username_or_email)
            user = authenticate(username=user_obj.username, password=password)
            print(f'🔍 DEBUG Login - Tentou com email, username encontrado: {user_obj.username}')
        except user_model.DoesNotExist:
            print('🔍 DEBUG Login - Email não encontrado')

    # Fallback final: valida senha diretamente no usuário localizado.
    # Isso evita falhas intermitentes de backend de autenticação em alguns ambientes.
    if user is None:
        from django.contrib.auth import get_user_model
        user_model = get_user_model()
        candidate = None
        if '@' in username_or_email:
            candidate = user_model.objects.filter(email__iexact=username_or_email).first()
        else:
            candidate = user_model.objects.filter(username__iexact=username_or_email).first()

        if candidate and candidate.check_password(password) and candidate.is_active:
            user = candidate
    
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
    
    # Gerar tokens JWT com claims usadas pelas políticas de RLS no Supabase.
    token_claims = _build_token_claims(user)
    refresh = RefreshToken.for_user(user)
    for claim_name, claim_value in token_claims.items():
        refresh[claim_name] = claim_value
    
    # Buscar perfil de departamento (se existir)
    perfil_data = None
    perfil_delegacia_data = None
    policial_data = None
    try:
        if hasattr(user, 'perfil_departamento'):
            perfil = user.perfil_departamento
            perfil_data = {
                'sigla': perfil.sigla,
                'departamento': perfil.departamento.nome if perfil.departamento else None,
                'ativo': perfil.ativo
            }
    except Exception:
        pass

    try:
        if hasattr(user, 'perfil_delegacia'):
            perfil_delegacia = user.perfil_delegacia
            perfil_delegacia_data = {
                'id': perfil_delegacia.id,
                'delegacia': perfil_delegacia.delegacia.nome if perfil_delegacia.delegacia else None,
                'delegacia_id': perfil_delegacia.delegacia_id,
                'departamento': perfil_delegacia.delegacia.departamento.nome if perfil_delegacia.delegacia and perfil_delegacia.delegacia.departamento else None,
                'departamento_id': perfil_delegacia.delegacia.departamento_id if perfil_delegacia.delegacia else None,
                'ativo': perfil_delegacia.ativo,
                'is_dto': perfil_delegacia.is_dto,
            }
    except Exception:
        pass

    try:
        if hasattr(user, 'policial'):
            policial = user.policial
            policial_data = {
                'id': policial.id,
                'nome': policial.nome,
                'matricula': policial.matricula,
                'telefone': policial.telefone,
                'delegacia': policial.delegacia.nome if policial.delegacia else None,
                'delegacia_id': policial.delegacia_id,
                'classe': policial.classe,
                'cargo': policial.cargo,
                'email': policial.email,
            }
    except Exception:
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
        'token_claims': token_claims,
        'perfil_departamento': perfil_data,
        'perfil_delegacia': perfil_delegacia_data,
        'policial': policial_data,
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
    perfil_delegacia_data = None
    policial_data = None
    try:
        if hasattr(user, 'perfil_departamento'):
            perfil = user.perfil_departamento
            perfil_data = {
                'id': perfil.id,
                'sigla': perfil.sigla,
                'departamento': perfil.departamento.nome if perfil.departamento else None,
                'departamento_id': perfil.departamento_id,
                'ativo': perfil.ativo,
                'is_dto': perfil.is_dto,
            }
    except Exception:
        pass

    try:
        if hasattr(user, 'perfil_delegacia'):
            perfil = user.perfil_delegacia
            perfil_delegacia_data = {
                'id': perfil.id,
                'delegacia': perfil.delegacia.nome if perfil.delegacia else None,
                'delegacia_id': perfil.delegacia_id,
                'departamento': perfil.delegacia.departamento.nome if perfil.delegacia and perfil.delegacia.departamento else None,
                'departamento_id': perfil.delegacia.departamento_id if perfil.delegacia else None,
                'ativo': perfil.ativo,
                'is_dto': perfil.is_dto,
            }
    except Exception:
        pass

    try:
        if hasattr(user, 'policial'):
            policial = user.policial
            policial_data = {
                'id': policial.id,
                'nome': policial.nome,
                'matricula': policial.matricula,
                'telefone': policial.telefone,
                'delegacia': policial.delegacia.nome if policial.delegacia else None,
                'delegacia_id': policial.delegacia_id,
                'classe': policial.classe,
                'cargo': policial.cargo,
                'email': policial.email,
            }
    except Exception:
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
        'perfil_departamento': perfil_data,
        'perfil_delegacia': perfil_delegacia_data,
        'policial': policial_data,
    })
