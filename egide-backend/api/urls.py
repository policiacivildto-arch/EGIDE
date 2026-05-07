from rest_framework import routers
from .views import (
    DepartamentoViewSet, DelegaciaViewSet, PolicialViewSet, ViaturaViewSet, VagaViewSet,
    EquipeViewSet, OperacaoViewSet, ComboioViewSet, OperacaoPolicialViewSet,
    PagamentoViewSet, RelatorioComboioViewSet
)

router = routers.DefaultRouter()
router.register(r'departamentos', DepartamentoViewSet)
router.register(r'delegacias', DelegaciaViewSet)
router.register(r'policiais', PolicialViewSet)
router.register(r'viaturas', ViaturaViewSet)
router.register(r'vagas', VagaViewSet)
router.register(r'equipes', EquipeViewSet)
router.register(r'operacoes', OperacaoViewSet)
router.register(r'comboios', ComboioViewSet)
router.register(r'operacoes-policiais', OperacaoPolicialViewSet)
router.register(r'pagamentos', PagamentoViewSet)
router.register(r'convoy-reports', RelatorioComboioViewSet)

urlpatterns = router.urls
