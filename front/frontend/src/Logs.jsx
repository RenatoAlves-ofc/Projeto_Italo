import { useEffect, useState } from 'react';

// endereço da api onde ficam os logs
const API_LOGS = 'http://localhost:3000/api/logs';

// todas as acoes q a api anota | usa no select do filtro
const ACOES = ['login', 'login falhou', 'logout', 'cadastro', 'criar item', 'editar item', 'excluir item'];

// cor de cada acao | o nome vira uma classe do css (badge-verde, badge-vermelho...)
const COR_DA_ACAO = {
  'login': 'verde',
  'login falhou': 'vermelho',
  'logout': 'cinza',
  'cadastro': 'azul',
  'criar item': 'verde',
  'editar item': 'amarelo',
  'excluir item': 'vermelho'
};

// o chamarApi vem do App.jsx | ele ja manda o token no header, sem o token a api n deixa ver os logs
function Logs({ chamarApi }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  // oq o admin escolheu nos filtros | texto vazio quer dizer "sem filtro"
  const [filtroAcao, setFiltroAcao] = useState('');
  const [busca, setBusca] = useState('');

  // busca os logs na api | mesma ideia do buscarItens do cardapio
  const buscarLogs = async () => {
    try {
      setLoading(true);
      const response = await chamarApi(API_LOGS);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao buscar os logs');
      }

      setLogs(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // busca uma vez quando o painel abre
  useEffect(() => {
    buscarLogs();
  }, []);

  // filter deixa so os logs q passam nos 2 filtros | o includes procura o texto digitado dentro do nome ou do detalhe
  // o || '' é pq o nome e o detalhe podem vir null do banco (ex: login com email q n existe)
  const logsFiltrados = logs.filter((log) => {
    const textoDoLog = `${log.nome || ''} ${log.detalhe || ''}`.toLowerCase();

    const passaNaAcao = filtroAcao === '' || log.acao === filtroAcao;
    const passaNaBusca = textoDoLog.includes(busca.toLowerCase());

    return passaNaAcao && passaNaBusca;
  });

  // transforma a data do banco em data e hora do brasil (25/11/2026 17:30:00)
  const formatarData = (data) => new Date(data).toLocaleString('pt-BR');

  return (
    <main className="container">
      <section className="card">
        <div className="list-header">
          <div>
            <h2>Painel admin | Logs</h2>
            <span>{logsFiltrados.length} log(s)</span>
          </div>

          <button className="btn btn-refresh" onClick={buscarLogs}>
            Atualizar
          </button>
        </div>

        {/* filtros | cada campo muda um estado e o logsFiltrados ali em cima recalcula a lista sozinho */}
        <div className="filtros">
          <div className="input-group">
            <label htmlFor="filtroAcao">Ação</label>
            <select
              id="filtroAcao"
              value={filtroAcao}
              onChange={(e) => setFiltroAcao(e.target.value)}
            >
              <option value="">Todas</option>
              {ACOES.map((acao) => (
                <option key={acao} value={acao}>{acao}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="busca">Buscar</label>
            <input
              id="busca"
              type="text"
              placeholder="nome do usuário ou detalhe"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* carregando, lista vazia ou a tabela | mesma logica do cardapio */}
        {loading ? (
          <div className="message">Carregando...</div>
        ) : logsFiltrados.length === 0 ? (
          <div className="message">Nenhum log encontrado.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data e hora</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Detalhe</th>
                </tr>
              </thead>

              <tbody>
                {logsFiltrados.map((log) => (
                  <tr key={log.id_log}>
                    <td>{formatarData(log.data_hora)}</td>
                    {/* sem nome = log sem usuario (ou usuario apagado), mostra um traço */}
                    <td>{log.nome || '—'}</td>
                    <td>
                      <span className={`badge badge-${COR_DA_ACAO[log.acao] || 'cinza'}`}>
                        {log.acao}
                      </span>
                    </td>
                    <td>{log.detalhe || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Logs;