from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.test import TestCase, override_settings
from django.utils.crypto import get_random_string
from rest_framework import status
from rest_framework.test import APIClient


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

    @override_settings(
        DEBUG=True,
        FRONTEND_URL='http://localhost:3000',
        RESET_PASSWORD_PATH='/reset-password',
        EMAIL_BACKEND='django.core.mail.backends.console.EmailBackend',
    )
    def test_password_reset_retorna_link_em_debug(self):
        response = self.client.post(
            '/api/auth/password-reset/',
            {'email': self.user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('delivery'), 'debug')
        self.assertIn('reset_link', response.data)
        self.assertIn('uid', response.data)
        self.assertIn('token', response.data)
        self.assertIn('/reset-password?', response.data['reset_link'])

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
            {'email': self.user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('error', response.data)
        mocked_send_mail.assert_called_once()

    def test_password_reset_email_inexistente_retorna_sucesso_generico(self):
        response = self.client.post(
            '/api/auth/password-reset/',
            {'email': 'nao.existe@example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
