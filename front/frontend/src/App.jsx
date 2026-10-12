import { useEffect, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:3000/api/teste';


function App() {
  const [testes, setTestes] = useState([]);
  const [nome, setNome] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // BUSCAR REGISTROS
  // ==========================================

  const buscarTestes = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Erro ao buscar registros');
      }

      const data = await response.json();

      setTestes(data);

    } catch (error) {
      console.error(error);

      alert('Erro ao carregar os registros');

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // EXECUTAR AO ABRIR A PÁGINA
  // ==========================================

  useEffect(() => {
    buscarTestes();
  }, []);


  // ==========================================
  // CADASTRAR
  // ==========================================

  const cadastrar = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      alert('Digite um nome');
      return;
    }

    try {
      const response = await fetch(API_URL, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          nome: nome
        })

      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro || 'Erro ao cadastrar'
        );
      }

      setNome('');

      buscarTestes();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }
  };


  // ==========================================
  // PREPARAR EDIÇÃO
  // ==========================================

  const editar = (teste) => {

    setNome(teste.nome);

    setEditandoId(teste.id);

  };


  // ==========================================
  // ATUALIZAR
  // ==========================================

  const atualizar = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      alert('Digite um nome');
      return;
    }

    if (!editandoId) {
      alert('ID inválido');
      return;
    }

    try {

      const response = await fetch(
        `${API_URL}/${editandoId}`,
        {

          method: 'PUT',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            nome: nome
          })

        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro || 'Erro ao atualizar'
        );
      }

      setNome('');

      setEditandoId(null);

      buscarTestes();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }
  };


  // ==========================================
  // CANCELAR EDIÇÃO
  // ==========================================

  const cancelarEdicao = () => {

    setNome('');

    setEditandoId(null);

  };


  // ==========================================
  // EXCLUIR
  // ==========================================

  const excluir = async (id_teste) => {

    if (!id_teste) {
      alert('ID inválido');
      return;
    }

    const confirmar = window.confirm(
      'Tem certeza que deseja excluir este registro?'
    );

    if (!confirmar) {
      return;
    }

    try {

      const response = await fetch(
        `${API_URL}/${id_teste}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro || 'Erro ao excluir'
        );
      }

      // Se estiver editando o registro que foi excluído,
      // limpa o formulário

      if (editandoId === id_teste) {
        setNome('');
        setEditandoId(null);
      }

      buscarTestes();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }
  };


  // ==========================================
  // INTERFACE
  // ==========================================

  return (

    <div className="app">


      {/* ======================================
          CABEÇALHO
      ====================================== */}

      <header className="header">

        <div>

          <h1>
            Gerenciamento
          </h1>

          <p>
            Cadastro de pessoas
          </p>

        </div>

      </header>


      {/* ======================================
          CONTEÚDO
      ====================================== */}

      <main className="container">


        {/* ====================================
            FORMULÁRIO
        ==================================== */}

        <section className="card">

          <h2>

            {editandoId
              ? 'Editar registro'
              : 'Novo registro'
            }

          </h2>


          <form
            onSubmit={
              editandoId
                ? atualizar
                : cadastrar
            }
            className="form"
          >


            <div className="input-group">

              <label htmlFor="nome">

                Nome

              </label>


              <input

                id="nome"

                type="text"

                placeholder="Digite o nome"

                value={nome}

                onChange={(e) =>
                  setNome(e.target.value)
                }

              />

            </div>


            <div className="buttons">


              <button
                type="submit"
                className="btn btn-primary"
              >

                {editandoId
                  ? 'Salvar alterações'
                  : 'Cadastrar'
                }

              </button>


              {editandoId && (

                <button

                  type="button"

                  className="btn btn-secondary"

                  onClick={cancelarEdicao}

                >

                  Cancelar

                </button>

              )}

            </div>

          </form>

        </section>


        {/* ====================================
            LISTA
        ==================================== */}

        <section className="card">


          <div className="list-header">


            <div>

              <h2>
                Registros
              </h2>

              <span>

                {testes.length} registro(s)

              </span>

            </div>


            <button

              className="btn btn-refresh"

              onClick={buscarTestes}

            >

              Atualizar

            </button>


          </div>


          {/* ==================================
              CARREGANDO
          ================================== */}

          {loading ? (

            <div className="message">

              Carregando...

            </div>

          ) : testes.length === 0 ? (

            // =================================
            // NENHUM REGISTRO
            // =================================

            <div className="message">

              Nenhum registro encontrado.

            </div>

          ) : (

            // =================================
            // TABELA
            // =================================

            <div className="table-container">

              <table>


                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Nome
                    </th>

                    <th>
                      Ações
                    </th>

                  </tr>

                </thead>


                <tbody>


                  {testes.map((teste) => (

                    <tr
                      key={teste.id}
                    >


                      <td>

                        {teste.id}

                      </td>


                      <td>

                        {teste.nome}

                      </td>


                      <td>


                        <div className="actions">


                          {/* ===================
                              EDITAR
                          =================== */}

                          <button

                            className="btn btn-edit"

                            onClick={() =>
                              editar(teste)
                            }

                          >

                            Editar

                          </button>


                          {/* ===================
                              EXCLUIR
                          =================== */}

                          <button

                            className="btn btn-delete"

                            onClick={() =>
                              excluir(
                                teste.id
                              )
                            }

                          >

                            Excluir

                          </button>


                        </div>


                      </td>


                    </tr>

                  ))}


                </tbody>


              </table>

            </div>

          )}


        </section>


      </main>


    </div>

  );
}

export default App;