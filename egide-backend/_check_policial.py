import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'egide_backend.settings')
django.setup()
from api.models import Policial
try:
    p = Policial.objects.get(matricula='30124618')
    print(f'ID: {p.id}')
    print(f'Nome: {p.nome}')
    print(f'Email: {p.email}')
    print(f'Matricula: {p.matricula}')
    print(f'Delegacia: {p.delegacia}')
    print(f'Cargo: {p.cargo}')
except Policial.DoesNotExist:
    print('Policial com matricula=30124618 nao encontrado')
