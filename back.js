const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'geraldo-server.ddns.net',
  port: 25580,
  user: 'root',
  password: '951753',
  database: 'Imuniza'
});


connection.connect((err) => {
  if (err) {
    console.message('Erro ao conectar: ', err);
    return;
  }
  console.log('Conexão bem-sucedida!');

});


function fixedJson(results) {
  const objetosCorrigidos = results.map(obj => {
    const infoArray = obj.Info.split(', ');
    const newObj = {};
    infoArray.forEach(info => {
      const [key, value] = info.split(': ');
      newObj[key] = value;
    });
    return newObj;
  });
  const jsonUnico = JSON.stringify(objetosCorrigidos);
  return jsonUnico;
}

//testar login
app.post('/login', (req,res) => {
  const {email, senha} = req.params;
  connection.query('CALL BuscarLogin(?,?)', [emaill,senha], (err, results) => {
    if(err){
      res.status(500).json({message: 'error ao realizar login'})
    }
    res.json(JSON.parse(fixedJson(results[0])))
  })
})

app.get('/vacinas/:lote', (req, res) => {
  const lote = req.params.lote;
  console.log(lote);
  connection.query('CALL ObterVacinasPorLote(?)', [lote], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }

    res.json(JSON.parse(fixedJson(results[0])));
  });
});

app.get('/fabricante/:idFabricante', (req, res) => {
  const idFabricante = req.params.idFabricante;
  console.log(idFabricante);
  connection.query('CALL BuscarFabricante(?)', [idFabricante], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }
    console.log(results);
    res.json(JSON.parse(fixedJson(results[0])));
  });
});



app.get('/morador/:nome', (req, res) => {
  const nome = req.params.nome;
  console.log(nome);
  connection.query('CALL ObterMoradorPorNome(?)', [nome], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }

    res.json(JSON.parse(fixedJson(results[0])));
  });
});

app.get('/pessoa/:CPF', (req, res) => {
  const CPF = req.params.CPF;
  console.log(CPF);
  connection.query('CALL ObterPessoaPorCPF(?)', [CPF], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }
    res.json(JSON.parse(fixedJson(results[0])));
  });
});

app.get('/vacinacao/:CPF', (req, res) => {
  const CPF = req.params.CPF;
  console.log(CPF);
  connection.query('CALL obterVacinasPorCPF(?)', [CPF], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }

    console.log(results[0]);
    res.json(JSON.parse(fixedJson(results[0])));
  });
});


app.post('/vacinas', (req, res) => {
  const {
    nome,
    fabricante,
    lote,
    quantidadeDoses,
    dataValidade
  } = req.body;
  console.log(req.body);
  const query = `
    SELECT CadastrarVacina(?,?,?,?,?)
  `;

  connection.query(
    query,
    [nome, fabricante, lote, quantidadeDoses, dataValidade],
    (err, result) => {
      if (err) {
        res.status(500).json({ message: 'Erro ao cadastrar vacina.' });
        return;
      }

      res.json({ message: 'Vacina cadastrada com sucesso!' });
    }
  );
});

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; // Verifica tamanho e CPFs inválidos

  let soma = 0, resto;
  
  for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf[i]) * (10 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  
  return resto === parseInt(cpf[10]);
}



app.post('/morador', (req, res) => {
  const {
    CPF,
    numeroSUS,
    nome,
    dataNascimento,
    nomeDaMae,
    sexo,
    endereco,
    plano,
    estadoCivil,
    escolaridade,
    cor,
  } = req.body;
  console.log(req.body);
  if(!validarCPF(CPF)){
    console.log('CPF inválido');
    res.status(500).json({ message: 'CPF inválido.' });
    return;
  }
  const query = `
    SELECT InserirMorador(? ,? ,? ,? ,? ,? ,?n ,? ,? ,? )
  `;
  
  connection.query(
    query,
    [CPF, numeroSUS, nome,dataNascimento, nomeDaMae, sexo, endereco, plano, estadoCivil, escolaridade, cor],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ message: 'Erro ao cadastrar Morador.' });
        return;
      }

      res.json({ message: 'Morador cadastrado com sucesso!' });
    }
  );
});

app.post('/vacinacao', (req, res) => {
  const {
    idVacina,
    CPFmorador,
    doseMinistrada
  } = req.body;
  console.log(req.body);
  const query = `
    SELECT CadastrarVacinaMorador(?,?,?)
  `;

  connection.query(
    query,
    [idVacina, CPFmorador, doseMinistrada],
    (err, result) => {
      if (err) {
        res.status(500).json({ message: 'Erro ao cadastrar Vacina ao Morador.' });
        return;
      }

      res.json({ message: 'Cadastrado com sucesso!' });
    }
  );
});
