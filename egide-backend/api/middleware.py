"""
Middlewares de Segurança - Sistema EGIDE

Middlewares para:
- Auditoria automática de requests
- Rate limiting
- Segurança adicional
"""

from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from .models_security import LogAuditoria, PerfilPolicial
import time


class AuditoriaMiddleware(MiddlewareMixin):
    """
    Middleware que registra automaticamente todas as requisições no log de auditoria
    """
    
    # URLs que devem ser auditadas
    AUDITABLE_PATHS = [
        '/api/policiais/',
        '/api/operacoes/',
        '/api/escalas/',
        '/api/equipes/',
        '/api/auth/',
    ]
    
    # Métodos que devem ser auditados
    AUDITABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    def process_request(self, request):
        """Armazena o tempo de início da request"""
        request._audit_start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Registra a request no log de auditoria"""
        
        # Verificar se deve auditar esta request
        if not self._should_audit(request):
            return response
        
        # Extrair informações
        usuario = request.user if request.user.is_authenticated else None
        policial = None
        
        if usuario:
            try:
                policial = usuario.policial
            except:
                pass
        
        # Determinar ação baseada na URL e método
        acao = self._determinar_acao(request)
        nivel = self._determinar_nivel(request, response)
        descricao = self._gerar_descricao(request, response)
        
        # Calcular tempo de resposta
        duracao = None
        if hasattr(request, '_audit_start_time'):
            duracao = time.time() - request._audit_start_time
        
        # Registrar no log
        try:
            LogAuditoria.registrar(
                acao=acao or 'acesso_sistema',
                usuario=usuario,
                policial=policial,
                descricao=descricao,
                nivel=nivel,
                request=request,
                dados_extras={
                    'status_code': response.status_code,
                    'duracao_segundos': duracao,
                }
            )
        except Exception as e:
            # Não deixar a auditoria quebrar a aplicação
            print(f"Erro ao registrar auditoria: {e}")
        
        # Atualizar último acesso do policial
        if policial:
            try:
                perfil = policial.perfil
                perfil.atualizar_ultimo_acesso()
            except:
                pass
        
        return response
    
    def _should_audit(self, request):
        """Verifica se a request deve ser auditada"""
        
        # Não auditar requests de arquivos estáticos
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return False
        
        # Não auditar health checks
        if request.path in ['/health/', '/ping/']:
            return False
        
        # Auditar se o método for POST, PUT, PATCH ou DELETE
        if request.method in self.AUDITABLE_METHODS:
            return True
        
        # Auditar se a URL estiver na lista de auditáveis
        for path in self.AUDITABLE_PATHS:
            if request.path.startswith(path):
                return True
        
        return False
    
    def _determinar_acao(self, request):
        """Determina a ação baseada na URL e método"""
        
        path = request.path
        method = request.method
        
        # Mapeamento de URLs para ações
        mapeamento = {
            '/api/auth/login/': 'login',
            '/api/auth/logout/': 'logout',
            '/api/policiais/': {
                'POST': 'criar_usuario',
                'PUT': 'editar_usuario',
                'PATCH': 'editar_usuario',
                'DELETE': 'deletar_usuario',
            },
            '/api/operacoes/': {
                'POST': 'criar_operacao',
                'PUT': 'editar_operacao',
                'PATCH': 'editar_operacao',
                'DELETE': 'deletar_operacao',
            },
            '/api/escalas/': {
                'POST': 'criar_escala',
                'PUT': 'editar_escala',
                'PATCH': 'editar_escala',
                'DELETE': 'deletar_escala',
            },
        }
        
        # Verificar mapeamento exato
        if path in mapeamento:
            config = mapeamento[path]
            if isinstance(config, dict):
                return config.get(method)
            return config
        
        # Verificar mapeamento parcial
        for url_pattern, config in mapeamento.items():
            if path.startswith(url_pattern):
                if isinstance(config, dict):
                    return config.get(method)
                return config
        
        return None
    
    def _determinar_nivel(self, request, response):
        """Determina o nível de importância do log"""
        
        status_code = response.status_code
        
        # Erros são críticos
        if status_code >= 500:
            return 'critical'
        
        # Erros de cliente são warnings
        if status_code >= 400:
            return 'warning'
        
        # Operações de DELETE são warnings
        if request.method == 'DELETE':
            return 'warning'
        
        # Resto é info
        return 'info'
    
    def _gerar_descricao(self, request, response):
        """Gera uma descrição legível da ação"""
        
        method = request.method
        path = request.path
        status = response.status_code
        usuario = request.user.username if request.user.is_authenticated else 'Anônimo'
        
        return f"{method} {path} - Status {status} - Usuário: {usuario}"


class RateLimitMiddleware(MiddlewareMixin):
    """
    Middleware para rate limiting (limite de requisições por tempo)
    """
    
    # Configurações de rate limit por tipo de usuário
    RATE_LIMITS = {
        'anonymous': {'requests': 100, 'window': 3600},  # 100 req/hora
        'authenticated': {'requests': 1000, 'window': 3600},  # 1000 req/hora
        'admin': {'requests': 10000, 'window': 3600},  # 10000 req/hora
    }
    
    def process_request(self, request):
        """Verifica se o usuário excedeu o limite de requisições"""
        
        # Identificar o usuário
        user_key = self._get_user_key(request)
        user_type = self._get_user_type(request)
        
        # Obter limites
        limits = self.RATE_LIMITS.get(user_type, self.RATE_LIMITS['anonymous'])
        max_requests = limits['requests']
        window = limits['window']
        
        # Chave do cache
        cache_key = f'rate_limit:{user_key}'
        
        # Obter contagem atual
        current_count = cache.get(cache_key, 0)
        
        # Verificar se excedeu o limite
        if current_count >= max_requests:
            from django.http import JsonResponse
            return JsonResponse({
                'error': 'Rate limit excedido',
                'message': f'Você excedeu o limite de {max_requests} requisições por {window} segundos',
                'retry_after': window
            }, status=429)
        
        # Incrementar contador
        cache.set(cache_key, current_count + 1, window)
        
        return None
    
    def _get_user_key(self, request):
        """Retorna uma chave única para o usuário"""
        if request.user.is_authenticated:
            return f'user_{request.user.id}'
        
        # Para anônimos, usar IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        return f'ip_{ip}'
    
    def _get_user_type(self, request):
        """Determina o tipo de usuário para rate limiting"""
        if not request.user.is_authenticated:
            return 'anonymous'
        
        try:
            if request.user.policial.perfil.is_admin:
                return 'admin'
        except:
            pass
        
        return 'authenticated'


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Adiciona headers de segurança às respostas
    """
    
    def process_response(self, request, response):
        """Adiciona headers de segurança"""
        
        # Prevenir clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # Prevenir MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # XSS Protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy
        response['Content-Security-Policy'] = "default-src 'self'"
        
        # HTTPS Strict Transport Security (apenas em produção)
        if not request.get_host().startswith('localhost'):
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response


class UserActivityMiddleware(MiddlewareMixin):
    """
    Rastreia atividade do usuário
    """
    
    def process_request(self, request):
        """Atualiza última atividade do usuário"""
        
        if request.user.is_authenticated:
            try:
                policial = request.user.policial
                perfil = policial.perfil
                
                # Atualizar último acesso (mas não em toda request para não sobrecarregar)
                # Usar cache para limitar atualizações
                cache_key = f'last_activity_update:{request.user.id}'
                last_update = cache.get(cache_key)
                
                if not last_update:
                    perfil.atualizar_ultimo_acesso()
                    # Cachear por 5 minutos
                    cache.set(cache_key, timezone.now(), 300)
            except:
                pass
        
        return None
