import React, { useState, useEffect } from 'react';
import { departamentosEventoApi } from '../../../../services/eventosApi';
import { departamentosApi } from '../../../../services/djangoApi';

const CadastrarDepartamento = ({ eventoId, departamento, onClose, onSuccess }) => {
  const [departamentos, setDepartamentos] = useState([]);
  const [formData, setFormData] = useState({
    evento: eventoId,
    departamento: '',
    delegacia: '',
    tipo_servico: 'ORDINARIO',
    tipo_policial: 'OIP',
    quantidade_policiais: '',
    com_aporte_financeiro: false,
    horario_inicio_delegacia: '08:00',
    horario_fim_delegacia: '18:00',
    observacoes: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarDepartamentos();
    if (departamento) {
      setFormData({
        ...departamento,
        evento: eventoId,
      });
    }
  }, [departamento, eventoId]);

  const carregarDepartamentos = async () => {
    try {
      const data = await departamentosApi.listar();
      setDepartamentos(data);
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      if (departamento) {
        await departamentosEventoApi.atualizar(departamento.id, formData);
      } else {
        await departamentosEventoApi.criar(formData);
      }
      onSuccess();
    } catch (err) {
      setErro('Erro ao salvar: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {departamento ? 'Editar Departamento' : 'Cadastrar Departamento no Evento'}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Fase 1: Informar quantidade de policiais e configurações gerais
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {erro && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {erro}
            </div>
          )}

          <div className="space-y-6">
            {/* Seção 1: Identificação */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">1. Identificação do Departamento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento *
                  </label>
                  <select
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {departamentos.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.nome} ({dep.sigla})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delegacia (opcional)
                  </label>
                  <input
                    type="text"
                    name="delegacia"
                    value={formData.delegacia}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 1ª Delegacia"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Tipo de Serviço */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">2. Tipo de Serviço e Policial</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Serviço *
                  </label>
                  <select
                    name="tipo_servico"
                    value={formData.tipo_servico}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ORDINARIO">Serviço Ordinário</option>
                    <option value="EXTRAORDINARIO">Serviço Extraordinário</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Policial *
                  </label>
                  <select
                    name="tipo_policial"
                    value={formData.tipo_policial}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OIP">OIP - Oficiais de Plantão</option>
                    <option value="DPC">DPC - Delegado de Polícia Civil</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seção 3: Quantidade e Aporte */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">3. Quantidade e Financeiro</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade de Policiais *
                  </label>
                  <input
                    type="number"
                    name="quantidade_policiais"
                    value={formData.quantidade_policiais}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantidade total de policiais que irão trabalhar neste evento
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aporte Financeiro
                  </label>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      name="com_aporte_financeiro"
                      checked={formData.com_aporte_financeiro}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-gray-700">
                      Esta operação terá aporte financeiro
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Marque se haverá pagamento adicional para os policiais
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 4: Horários */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                4. Horário de Funcionamento da Delegacia/Departamento
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    name="horario_inicio_delegacia"
                    value={formData.horario_inicio_delegacia}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário de Término *
                  </label>
                  <input
                    type="time"
                    name="horario_fim_delegacia"
                    value={formData.horario_fim_delegacia}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Estes horários serão usados como padrão inicial para as escalas individuais
              </p>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Informações adicionais sobre a participação deste departamento..."
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Após salvar, você poderá definir as escalas individuais dos policiais
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {salvando ? 'Salvando...' : (departamento ? 'Atualizar' : 'Cadastrar')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastrarDepartamento;
