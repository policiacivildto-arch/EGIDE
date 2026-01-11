"""
Configurações de Segurança para o Django - Sistema EGIDE

Adicione estas configurações ao seu settings.py principal
ou importe este arquivo:

from .settings_security import *
"""

from datetime import timedelta
import os

# =============================================================================
# DJANGO REST FRAMEWORK
# =============================================================================

REST_FRAMEWORK = {
    # Autenticação
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # Para o browsable API
    ],
    
    # Permissões padrão
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    
    # Paginação
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    
    # Filtros
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    
    # Renderizadores
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',  # Remover em produção
    ],
    
    # Throttling (Rate Limiting)
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/minute',  # Limite para tentativas de login
    },
    
    # Tratamento de exceções
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    
    # Formato de data/hora
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
    'DATE_FORMAT': '%Y-%m-%d',
}

# =============================================================================
# JWT (JSON Web Tokens)
# =============================================================================

SIMPLE_JWT = {
    # Tempo de vida dos tokens
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    
    # Rotação de tokens
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    
    # Algoritmo de criptografia
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.getenv('JWT_SECRET_KEY', 'sua-chave-secreta-super-segura-aqui'),
    
    # Headers
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    # Payload
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # Token types
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    # Sliding tokens
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# =============================================================================
# CORS (Cross-Origin Resource Sharing)
# =============================================================================

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',  # React dev server
    'http://localhost:5000',  # React build
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# =============================================================================
# MIDDLEWARE
# =============================================================================

# Adicionar ao MIDDLEWARE existente
MIDDLEWARE_SECURITY = [
    'api.middleware.SecurityHeadersMiddleware',
    'api.middleware.AuditoriaMiddleware',
    'api.middleware.RateLimitMiddleware',
    'api.middleware.UserActivityMiddleware',
]

# =============================================================================
# SEGURANÇA
# =============================================================================

# Debug mode (SEMPRE False em produção)
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# Hosts permitidos
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Secret key (SEMPRE usar variável de ambiente em produção)
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-this-in-production')

# HTTPS/SSL
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000  # 1 ano
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Proteção CSRF
CSRF_COOKIE_HTTPONLY = False  # Precisa ser False para React acessar
CSRF_USE_SESSIONS = False
CSRF_COOKIE_SAMESITE = 'Lax'

# Sessões
SESSION_COOKIE_AGE = 86400  # 24 horas
SESSION_SAVE_EVERY_REQUEST = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Senha
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# =============================================================================
# CACHE (para rate limiting e sessões)
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    }
}

# =============================================================================
# LOGGING
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file_security': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': 'logs/security.log',
            'formatter': 'verbose',
        },
        'file_auditoria': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/auditoria.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'file_security'],
            'level': 'WARNING',
            'propagate': False,
        },
        'api': {
            'handlers': ['console', 'file_auditoria'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Criar diretório de logs se não existir
import os
os.makedirs('logs', exist_ok=True)

# =============================================================================
# BANCO DE DADOS (exemplo para produção)
# =============================================================================

# Para produção, usar PostgreSQL:
"""
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'egide_db'),
        'USER': os.getenv('DB_USER', 'egide_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'senha_segura'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,
    }
}
"""

# =============================================================================
# OUTRAS CONFIGURAÇÕES DE SEGURANÇA
# =============================================================================

# Timeout de inatividade (em segundos)
INACTIVITY_TIMEOUT = 3600  # 1 hora

# Máximo de tentativas de login
MAX_LOGIN_ATTEMPTS = 5

# Tempo de bloqueio após tentativas de login (em segundos)
LOGIN_LOCKOUT_TIME = 300  # 5 minutos

# Tempo de expiração de senha (em dias) - 0 = nunca
PASSWORD_EXPIRY_DAYS = 90

# Força uso de senha forte
ENFORCE_STRONG_PASSWORDS = True

# Permite múltiplas sessões por usuário
ALLOW_MULTIPLE_SESSIONS = False

# Registra ações sensíveis mesmo se DEBUG=True
ALWAYS_AUDIT_SENSITIVE_ACTIONS = True
