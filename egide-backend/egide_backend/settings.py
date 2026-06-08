import os
from pathlib import Path
from decouple import config
import dj_database_url
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-in-production')

DEBUG = config('DEBUG', default=True, cast=bool)

# ALLOWED_HOSTS configurado para desenvolvimento e produção
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS', 
    default='localhost,127.0.0.1,10.18.200.78,.railway.app,.up.railway.app,.onrender.com',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# Railway define este domínio automaticamente; inclui quando disponível.
railway_public_domain = config('RAILWAY_PUBLIC_DOMAIN', default='').strip()
if railway_public_domain:
    ALLOWED_HOSTS.append(railway_public_domain)

frontend_url = config('FRONTEND_URL', default='').strip()
backend_public_url = config('BACKEND_PUBLIC_URL', default='').strip()
reset_password_path = config('RESET_PASSWORD_PATH', default='/reset-password').strip() or '/reset-password'

for public_url in [frontend_url, backend_public_url]:
    if not public_url:
        continue
    parsed = urlparse(public_url)
    if parsed.hostname:
        ALLOWED_HOSTS.append(parsed.hostname)

# Se estiver em produção no Render ou Railway
if not DEBUG:
    ALLOWED_HOSTS.append('.onrender.com')
    ALLOWED_HOSTS.append('.railway.app')

# Remove duplicidades mantendo a ordem.
ALLOWED_HOSTS = list(dict.fromkeys(ALLOWED_HOSTS))

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'api',
]

MIDDLEWARE = [
    # Deve ficar no topo para garantir headers CORS mesmo em respostas antecipadas
    # (redirects HTTPS, respostas de segurança, etc.).
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Para servir arquivos estáticos
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'egide_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'egide_backend.wsgi.application'

# Banco de Dados: SQLite (dev) ou PostgreSQL/Supabase (prod)
DATABASE_URL = config('DATABASE_URL', default=None)
USE_REMOTE_DB_IN_DEBUG = config('USE_REMOTE_DB_IN_DEBUG', default=False, cast=bool)

use_remote_database = bool(DATABASE_URL and (not DEBUG or USE_REMOTE_DB_IN_DEBUG))

if use_remote_database:
    # Produção: Usar Supabase ou outro PostgreSQL (via DATABASE_URL).
    # Em DEBUG só usa remoto quando USE_REMOTE_DB_IN_DEBUG=True.
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    # Desenvolvimento: SQLite local
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Fortaleza'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')] if os.path.exists(os.path.join(BASE_DIR, 'static')) else []

# Configuração do WhiteNoise para servir arquivos estáticos em produção
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        # TEMPORÁRIO: Permitir acesso sem autenticação para desenvolvimento
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
}

# CORS Configuration
CORS_ALLOWED_ORIGINS_DEV = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8080',
]

# Em produção, adicione suas URLs de frontend (Vercel, Netlify, etc.)
CORS_ALLOWED_ORIGINS_PROD = config(
    'CORS_ALLOWED_ORIGINS',
    default='https://egide-production-59f6.up.railway.app',
    cast=lambda v: [s.strip() for s in v.split(',')] if v else []
)

# Garante esquema explicito (https://) para origens de producao.
normalized_cors_origins = []
for origin in CORS_ALLOWED_ORIGINS_PROD:
    if not origin:
        continue
    origin = origin.strip().rstrip('/')
    if origin.startswith('http://') or origin.startswith('https://'):
        normalized_cors_origins.append(origin)
    else:
        normalized_cors_origins.append(f'https://{origin}')

CORS_ALLOWED_ORIGINS_PROD = normalized_cors_origins

if frontend_url:
    frontend_url = frontend_url.rstrip('/')
    if frontend_url.startswith('http://') or frontend_url.startswith('https://'):
        CORS_ALLOWED_ORIGINS_PROD.append(frontend_url)
    else:
        CORS_ALLOWED_ORIGINS_PROD.append(f'https://{frontend_url}')

CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_DEV + CORS_ALLOWED_ORIGINS_PROD

# Permite frontends Railway sem precisar listar manualmente cada novo subdomínio.
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://.*\.up\.railway\.app$',
    r'^https://.*\.railway\.app$',
]

CORS_ALLOW_CREDENTIALS = True
CORS_PREFLIGHT_MAX_AGE = 86400

CSRF_TRUSTED_ORIGINS = [
    'https://*.up.railway.app',
    'https://*.railway.app',
] + [origin for origin in CORS_ALLOWED_ORIGINS_PROD if origin.startswith('https://')]

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Configuração de email (recuperação de senha)
# Sempre respeita o valor do .env. Fallback: console em dev, smtp em produção.
_default_email_backend = (
    'django.core.mail.backends.console.EmailBackend' if DEBUG
    else 'django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_BACKEND = config('EMAIL_BACKEND', default=_default_email_backend)

EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_TIMEOUT = config('EMAIL_TIMEOUT', default=10, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER or 'nao-responda@egide.local')
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = config('PASSWORD_RESET_TOKEN_EXPIRY_MINUTES', default=15, cast=int)

# Expostos para uso nas views de autenticação
FRONTEND_URL = frontend_url
RESET_PASSWORD_PATH = reset_password_path

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
