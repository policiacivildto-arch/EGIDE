from unittest.mock import patch
from datetime import timedelta
import hashlib
import secrets

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework import status
from rest_framework.test import APIClient
from api.models import PasswordResetToken, Policial, Delegacia, Departamento


class PasswordResetViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        initial_password = get_random_string(12)
        self.user = User.objects.create_user(
            username='teste.reset',
            email='teste.reset@example.com',
            password=initial_password,
            first_name='Teste',
        )
        departamento = Departamento.objects.create(nome='Departamento Teste', sigla='DT')
        delegacia = Delegacia.objects.create(nome='Delegacia Teste', departamento=departamento)
        self.policial = Policial.objects.create(
            usuario=self.user,
            matricula='12345678',
            nome='Teste Reset',
            classe='Praça',
            cargo='Policial Civil',
            delegacia=delegacia,
            email='teste.reset@example.com',
        )

    @override_settings(
        DEBUG=True,
        FRONTEND_URL='http://localhost:3000',
        RESET_PASSWORD_PATH='/reset-password',
        EMAIL_BACKEND='django.core.mail.backends.console.EmailBackend',
    )
    def test_password_reset_por_matricula_retorna_link_em_debug_e_salva_token(self):
        response = self.client.post(
            '/api/auth/password-reset/',
            {'matricula': self.policial.matricula},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('delivery'), 'debug')
        self.assertIn('reset_link', response.data)
        self.assertIn('token', response.data)
        self.assertIn('/reset-password?', response.data['reset_link'])

        self.assertEqual(PasswordResetToken.objects.filter(usuario=self.user).count(), 1)
        token_obj = PasswordResetToken.objects.get(usuario=self.user)
        self.assertGreater(token_obj.expires_at, timezone.now())

    @override_settings(
        DEBUG=True,
        FRONTEND_URL='http://localhost:3000',
        RESET_PASSWORD_PATH='/reset-password',
        EMAIL_BACKEND='django.core.mail.backends.console.EmailBackend',
    )
    def test_password_reset_retorna_link_em_debug_e_salva_token(self):
        response = self.client.post(
            '/api/auth/password-reset/',
            {'email': self.user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('delivery'), 'debug')
        self.assertIn('reset_link', response.data)
        self.assertIn('token', response.data)
        self.assertIn('/reset-password?', response.data['reset_link'])

        self.assertEqual(PasswordResetToken.objects.filter(usuario=self.user).count(), 1)
        token_obj = PasswordResetToken.objects.get(usuario=self.user)
        self.assertGreater(token_obj.expires_at, timezone.now())

    @override_settings(
        DEBUG=False,
        FRONTEND_URL='https://egide.app',
        RESET_PASSWORD_PATH='/reset-password',
        EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend',
    )
    @patch('api.views_auth.send_mail', side_effect=Exception('smtp indisponivel'))
    def test_password_reset_retorna_503_quando_envio_falha(self, mocked_send_mail):
        response = self.client.post(
            '/api/auth/password-reset/',
            {'matricula': self.policial.matricula},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('error', response.data)
        mocked_send_mail.assert_called_once()

    @override_settings(
        DEBUG=False,
        FRONTEND_URL='https://egide.app',
        RESET_PASSWORD_PATH='/reset-password',
        EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend',
    )
    @patch('api.views_auth._create_password_reset_token', side_effect=Exception('relation api_passwordresettoken does not exist'))
    def test_password_reset_retorna_503_quando_fluxo_interno_falha(self, mocked_create_token):
        response = self.client.post(
            '/api/auth/password-reset/',
            {'email': self.user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(
            response.data.get('error'),
            'Não foi possível processar a redefinição de senha no momento.',
        )
        mocked_create_token.assert_called_once_with(self.user)

    def test_password_reset_email_inexistente_retorna_sucesso_generico(self):
        response = self.client.post(
            '/api/auth/password-reset/',
            {'email': 'nao.existe@example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(PasswordResetToken.objects.count(), 0)

    @override_settings(
        DEBUG=True,
        FRONTEND_URL='http://localhost:3000',
        RESET_PASSWORD_PATH='/reset-password',
        EMAIL_BACKEND='django.core.mail.backends.console.EmailBackend',
    )
    def test_password_reset_confirm_redefine_senha_e_invalida_token(self):
        request_response = self.client.post(
            '/api/auth/password-reset/',
            {'matricula': self.policial.matricula},
            format='json',
        )
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        token = request_response.data.get('token')
        self.assertTrue(token)

        new_password = 'NovaSenha123'
        response = self.client.post(
            '/api/auth/password-reset-confirm/',
            {'token': token, 'new_password': new_password},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('message'), 'Senha redefinida com sucesso')

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))

        token_obj = PasswordResetToken.objects.get(usuario=self.user)
        self.assertIsNotNone(token_obj.used_at)

        reused_response = self.client.post(
            '/api/auth/password-reset-confirm/',
            {'token': token, 'new_password': 'OutraSenha123'},
            format='json',
        )
        self.assertEqual(reused_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(reused_response.data.get('error'), 'Token inválido ou expirado')

    def test_password_reset_confirm_token_expirado_retorna_erro(self):
        raw_token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(
            usuario=self.user,
            token_hash=hashlib.sha256(raw_token.encode('utf-8')).hexdigest(),
            expires_at=timezone.now() - timedelta(minutes=1),
        )

        response = self.client.post(
            '/api/auth/password-reset-confirm/',
            {'token': raw_token, 'new_password': 'NovaSenha123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error'), 'Token inválido ou expirado')
