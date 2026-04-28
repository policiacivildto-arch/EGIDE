from django.contrib.auth.models import User
from django.test import TestCase
from django.utils.crypto import get_random_string
from rest_framework import status
from rest_framework.test import APIClient


class LoginViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_login_com_email_duplicado_retorna_400(self):
        duplicated_email = 'duplicado@example.com'
        password_a = get_random_string(12)
        password_b = get_random_string(12)

        User.objects.create_user(
            username='usuario.a',
            email=duplicated_email,
            password=password_a,
        )
        User.objects.create_user(
            username='usuario.b',
            email=duplicated_email,
            password=password_b,
        )

        response = self.client.post(
            '/api/auth/login/',
            {'email': duplicated_email, 'password': password_a},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Email duplicado', response.data['error'])

    def test_login_com_email_unico_retorna_tokens(self):
        unique_email = 'unico@example.com'
        password = get_random_string(12)

        User.objects.create_user(
            username='usuario.unico',
            email=unique_email,
            password=password,
        )

        response = self.client.post(
            '/api/auth/login/',
            {'email': unique_email, 'password': password},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
