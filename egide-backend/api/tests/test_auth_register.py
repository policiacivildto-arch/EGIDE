from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Delegacia, Departamento, Policial


class RegisterViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.departamento = Departamento.objects.create(
            nome='Departamento de Teste',
            sigla='DTEST',
            ativo=True,
        )
        self.delegacia = Delegacia.objects.create(
            nome='Delegacia de Teste',
            departamento=self.departamento,
            ativo=True,
        )

    def test_register_reivindica_usuario_pre_cadastrado_tipo_policial(self):
        matricula = '30009959'
        seeded_user = User.objects.create_user(
            username=f'policial_{matricula}',
            email=f'policial.{matricula}@pcce.local',
            password='front',
            is_active=True,
        )
        policial = Policial.objects.create(
            usuario=seeded_user,
            matricula=matricula,
            nome='NOME ANTIGO',
            classe='Praça',
            cargo='Policial Civil',
            delegacia=self.delegacia,
            telefone='',
            email=seeded_user.email,
            ativo=True,
        )

        payload = {
            'username': 'beatriz.30009959',
            'email': 'beatriz.anacleto@pcce.com',
            'password': 'novaSenha123',
            'nome': 'Beatriz Maia Anacleto',
            'matricula': matricula,
            'telefone': '85999999999',
            'cargo': 'OIP',
            'classe': 'A',
            'delegacia': self.delegacia.nome,
            'departamento': self.departamento.sigla,
        }

        response = self.client.post('/api/auth/register/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(Policial.objects.count(), 1)

        seeded_user.refresh_from_db()
        policial.refresh_from_db()

        self.assertEqual(seeded_user.username, payload['username'])
        self.assertEqual(seeded_user.email, payload['email'])
        self.assertTrue(seeded_user.check_password(payload['password']))

        self.assertEqual(policial.usuario_id, seeded_user.id)
        self.assertEqual(policial.nome, payload['nome'])
        self.assertEqual(policial.email, payload['email'])
        self.assertEqual(policial.cargo, 'OIP')

    def test_register_retorna_400_para_matricula_ja_cadastrada_com_conta_real(self):
        matricula = '30123456'
        real_user = User.objects.create_user(
            username='usuario.real',
            email='usuario.real@pcce.com',
            password='senhaReal123',
            is_active=True,
        )
        Policial.objects.create(
            usuario=real_user,
            matricula=matricula,
            nome='Usuario Real',
            classe='Praça',
            cargo='Policial Civil',
            delegacia=self.delegacia,
            telefone='',
            email=real_user.email,
            ativo=True,
        )

        payload = {
            'username': 'tentativa.nova',
            'email': 'tentativa.nova@pcce.com',
            'password': 'novaSenha123',
            'nome': 'Tentativa Nova',
            'matricula': matricula,
            'telefone': '85988888888',
            'cargo': 'OIP',
            'classe': 'A',
            'delegacia': self.delegacia.nome,
            'departamento': self.departamento.sigla,
        }

        response = self.client.post('/api/auth/register/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'matricula já existe')
