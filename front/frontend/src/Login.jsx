import { useState } from 'react';

// endereço do back onde ficam o login e o cadastro
const API_URL = 'http://localhost:3000/api';

// form vazio (igual o do cardapio) | serve pras 2 telas, o nome so é usado no cadastro
const FORM_VAZIO = {
  nome: '',
  email: '',
  senha: ''
};

// o onLogin é uma funcao q vem do App.jsx | quando o login der certo a gente chama ela passando o usuario
function Login({ onLogin }) {
  const [form, setForm] = useState(FORM_VAZIO);
  // false = tela de login | true = tela de cadastro
  const [cadastrando, setCadastrando] = useState(false);

  // mesma ideia do App.jsx, uma funcao so pra todos os campos usando o name do input
  const mudarCampo = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // troca entre login e cadastro e limpa o form
  const trocarTela = () => {
    setForm(FORM_VAZIO);
    setCadastrando(!cadastrando);
  };

  // serve pros dois | se ta cadastrando manda pra rota /cadastro, se n manda pra /login
  const enviar = async (e) => {
    e.preventDefault();

    // no cadastro precisa do nome tbm, no login so email e senha
    if (!form.email.trim() || !form.senha || (cadastrando && !form.nome.trim())) {
      alert('Preencha todos os campos');
      return;
    }

    const rota = cadastrando ? 'cadastro' : 'login';

    try {
      const response = await fetch(`${API_URL}/${rota}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao enviar');
      }

      if (cadastrando) {
        // cadastro deu certo | volta pra tela de login ja com o email preenchido
        alert('Cadastro feito! Agora faça o login');
        setForm({ ...FORM_VAZIO, email: form.email });
        setCadastrando(false);
      } else {
        // login deu certo | avisa o App.jsx quem entrou
        onLogin(data);
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🍔 Lanchonete do Renato</h1>
        <p>{cadastrando ? 'Crie sua conta' : 'Entre na sua conta'}</p>
      </header>

      <main className="login-container">
        <section className="card">
          <h2>{cadastrando ? 'Cadastro' : 'Login'}</h2>

          <form onSubmit={enviar} className="login-form">
            {/* o campo nome so aparece no cadastro */}
            {cadastrando && (
              <div className="input-group">
                <label htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={form.nome}
                  onChange={mudarCampo}
                />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={form.email}
                onChange={mudarCampo}
              />
            </div>

            {/* type password esconde oq ta sendo digitado */}
            <div className="input-group">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                name="senha"
                type="password"
                placeholder="********"
                value={form.senha}
                onChange={mudarCampo}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              {cadastrando ? 'Cadastrar' : 'Entrar'}
            </button>
          </form>

          {/* botao pra trocar entre as duas telas */}
          <button type="button" className="btn-link" onClick={trocarTela}>
            {cadastrando ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </section>
      </main>
    </div>
  );
}

export default Login;