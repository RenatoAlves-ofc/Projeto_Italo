import { useEffect, useState } from 'react';
import './App.css';

// endereço do back (a api) onde ficam os itens do cardapio
const API_URL = 'http://localhost:3000/api/cardapio';

// as categorias do cardapio | usa no select do form e pra separar os itens na tela
const CATEGORIAS = ['Lanches', 'Porções', 'Bebidas', 'Sobremesas'];

// forms vazio (para ficar mais facil de limpar os campos)
const FORM_VAZIO = {
  nome: '',
  descricao: '',
  preco: '',
  categoria: 'Lanches'
};

function App() { //as memorias do componente | serve pra guarda a lista de itens, pra guarda oq o usuario ta digitando no momento, pra colocar um novo item se for nulo ou modificar de acordo ocm o ID do item, loading pra mostrar q ta carregando enquanto nao responde
  const [itens, setItens] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);


// pra vusbar os itens do cardapio no backend (listagem) | async pq vai demorar  pra buscar o item no backend e nao deixar a tela trabada quando ta esperando a resposta
  const buscarItens = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL); // deu green e funciono

      if (!response.ok) {
        throw new Error('Erro ao buscar o cardápio'); // deu red e nao funcionou
      }

      // await pq ele vai esperar a resposta do back antes de continuar
      const data = await response.json();
      setItens(data);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar o cardápio');
    } finally {
      setLoading(false); // finally roda sempre, dando certo ou errado | tira o carregando da tela
    }
  };

  // roda o buscarItens uma vez so quando a pagina abre | o [] vazio no final é pra n ficar repetindo toda hora
  useEffect(() => {
    buscarItens();
  }, []);

  // em vez de criar uma funcao pra cada campo do form, cria uma só e usa o nome do input pra saber qual campo ta sendo alterado
  // o "e" é o evento que ta acontecendo no input, e.target.name é o nome do input que ta sendo alterado, e.target.value é o valor que ta sendo digitado
  const mudarCampo = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // salvar serve tanto pra cadastrar quanto pra editar | e.preventDefault é pra pagina n recarregar quando aperta o botao do form
  const salvar = async (e) => {
    e.preventDefault();

    // se n tiver nome ou preco nem manda pro back
    if (!form.nome.trim() || !form.preco) {
      alert('Preencha o nome e o preço');
      return;
    }

    // se tiver editandoId é pq ta editando, ai vai PUT com o id na url | se n tiver vai POST normal pra criar um item novo
    const url = editandoId ? `${API_URL}/${editandoId}` : API_URL;
    const metodo = editandoId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form) // JSON.stringify transforma o form em texto pra mandar pro back
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao salvar');
      }

      // deu certo entao limpa o form e busca a lista de novo pra aparecer o item novo/alterado
      cancelarEdicao();
      buscarItens();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // quando clica em editar joga os dados do item dentro do form | o || '' é pq a descricao pode vir vazia do banco
  const editar = (item) => {
    setForm({
      nome: item.nome,
      descricao: item.descricao || '',
      preco: item.preco,
      categoria: item.categoria
    });
    setEditandoId(item.id_item);
  };

  // volta o form pro vazio e sai do modo de edicao
  const cancelarEdicao = () => {
    setForm(FORM_VAZIO);
    setEditandoId(null);
  };

  // apaga o item pelo id_item
  const excluir = async (id_item) => {
    // window.confirm abre aquela caixinha de ok/cancelar | se clicar em cancelar para aqui e n apaga
    if (!window.confirm('Tem certeza que deseja excluir este item?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id_item}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao excluir');
      }

      // se tava editando o mesmo item q acabou de apagar, limpa o form
      if (editandoId === id_item) {
        cancelarEdicao();
      }

      buscarItens();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // transforma o preco q vem do banco (18.9) em dinheiro brasileiro (R$ 18,90)
  const formatarPreco = (valor) =>
    Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // daqui pra baixo é oq aparece na tela
  return (
    <div className="app">
      <header className="header">
        <h1>🍔 Lanchonete do Renato</h1>
        <p>Gerenciamento do cardápio</p>
      </header>

      <main className="container">
        {/* form de cadastrar e editar | o titulo muda dependendo se ta editando ou n */}
        <section className="card">
          <h2>{editandoId ? 'Editar item' : 'Novo item'}</h2>

          <form onSubmit={salvar} className="form">
            {/* cada input tem o name igual ao campo do form, é assim q o mudarCampo sabe qual campo mudar */}
            <div className="input-group">
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                name="nome"
                type="text"
                placeholder="Ex: X-Burger"
                value={form.nome}
                onChange={mudarCampo}
              />
            </div>

            <div className="input-group">
              <label htmlFor="descricao">Descrição</label>
              <input
                id="descricao"
                name="descricao"
                type="text"
                placeholder="Ex: Pão, carne e queijo"
                value={form.descricao}
                onChange={mudarCampo}
              />
            </div>

            {/* type number pra so aceitar numero | step 0.01 deixa colocar centavos */}
            <div className="input-group">
              <label htmlFor="preco">Preço (R$)</label>
              <input
                id="preco"
                name="preco"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.preco}
                onChange={mudarCampo}
              />
            </div>

            {/* o select pega as categorias da lista la de cima com o map, cada uma vira uma opcao */}
            <div className="input-group">
              <label htmlFor="categoria">Categoria</label>
              <select
                id="categoria"
                name="categoria"
                value={form.categoria}
                onChange={mudarCampo}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="buttons">
              <button type="submit" className="btn btn-primary">
                {editandoId ? 'Salvar alterações' : 'Cadastrar'}
              </button>

              {/* botao de cancelar so aparece quando ta editando */}
              {editandoId && (
                <button type="button" className="btn btn-secondary" onClick={cancelarEdicao}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* lista do cardapio */}
        <section className="card">
          <div className="list-header">
            <div>
              <h2>Cardápio</h2>
              <span>{itens.length} item(ns)</span>
            </div>

            <button className="btn btn-refresh" onClick={buscarItens}>
              Atualizar
            </button>
          </div>

          {/* se ta carregando mostra carregando | se n tem item mostra a msg | se tem item mostra o cardapio separado por categoria */}
          {loading ? (
            <div className="message">Carregando...</div>
          ) : itens.length === 0 ? (
            <div className="message">Nenhum item no cardápio.</div>
          ) : (
            CATEGORIAS.map((categoria) => {
              // filter pega so os itens q sao dessa categoria
              const itensDaCategoria = itens.filter((item) => item.categoria === categoria);

              // se a categoria n tiver nenhum item ela nem aparece
              if (itensDaCategoria.length === 0) return null;

              return (
                <div key={categoria} className="categoria">
                  <h3>{categoria}</h3>

                  {/* mostra cada item da categoria | key é pro react saber qual item é qual */}
                  {itensDaCategoria.map((item) => (
                    <div key={item.id_item} className="item">
                      <div className="item-info">
                        <strong>{item.nome}</strong>
                        <p>{item.descricao}</p>
                      </div>

                      <span className="preco">{formatarPreco(item.preco)}</span>

                      <div className="actions">
                        <button className="btn btn-edit" onClick={() => editar(item)}>
                          Editar
                        </button>
                        <button className="btn btn-delete" onClick={() => excluir(item.id_item)}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

export default App;