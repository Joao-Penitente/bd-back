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


app.get('/pessoa/:cpf', (req, res) => {
  const cpf = req.params.cpf;
  connection.query('CALL BuscarPessoaPorCPF(?)', [cpf], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }
    res.json(JSON.parse(fixedJson(results[0])));
  });
});

app.post('/pessoa', (req, res) => {
  const {cpf, numeroSUS, nome, nomeMae, data_nascimento, sexo, cor, escolaridade, estadoCivil, cep, rua, complemento, observacao, possuiPlano} = req.body

  if(!validarCPF(cpf)){
    console.log('CPF inválido');
    res.status(500).json({ message: 'CPF inválido.' });
    return;
  }

  connection.query('CALL InserirPessoa(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [cpf, numeroSUS, nome, nomeMae, data_nascimento, sexo, cor, escolaridade, estadoCivil, cep, rua, complemento, observacao, possuiPlano], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'Erro ao cadastrar pessoa.' });
      return;
    }
    res.status(201).json({ message: 'Pessoa cadastrada com sucesso.' });
  });
});

app.put('/pessoa', (req, res) => {
  const {cpf, numeroSUS, nome, nomeMae, data_nascimento, sexo, cor, escolaridade, estadoCivil, cep, rua, complemento, observacao, possuiPlano} = req.body
  connection.query('CALL AtualizarPessoa(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [cpf, numeroSUS, nome, nomeMae, data_nascimento, sexo, cor, escolaridade, estadoCivil, cep, rua, complemento, observacao, possuiPlano], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }

    res.status(200).json({ message: 'Pessoa atualizada com sucesso.' });
  });
});

app.get('/fabricante/:idFabricante', (req, res) => {
  const idFabricante = req.params.idFabricante;
  console.log(idFabricante);
  connection.query('CALL BuscarFabricante(?)', [idFabricante], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }

    res.json(JSON.parse(fixedJson(results[0])));
  });
});


app.post('/fabricante', (req, res) => {
  const {nomeFabricante, cnpjFabricante, codFabricante} = req.body
  connection.query('CALL InserirFabricante(?, ?, ?)', [nomeFabricante, cnpjFabricante, codFabricante], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao Cadastrar fabricante.' });
      return;
    }
    res.status(201).json({ message: 'Fabricante cadastrado com sucesso.' });
  });
});


app.post('/vacina', (req, res) => {
  const { codVacina, nomeVacina, descricao, tipo, numDoses, faixaEtaria} = req.body
  console.log(req.body)
  connection.query('CALL RegistrarVacina(?, ?, ?, ?, ?, ?)', [ codVacina, nomeVacina, descricao, tipo, numDoses, faixaEtaria ], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'Erro ao Cadastrar vacina.' });
      return;
    }
    res.status(201).json({ message: 'Vacina cadastrado com sucesso.' });
  });
});

app.put('/fabricante', (req, res) => {
  const {nomeFabricante, cnpjFabricante, codFabricante} = req.body
  console.log(cpf);
  connection.query('CALL AtualizarFabricante(?, ?, ?)', [nomeFabricante, cnpjFabricante, codFabricante], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }

    res.json(JSON.parse(fixedJson(results[0])));
  });
});

app.post('/lote', (req, res) => {
  const {codigoFabricante, codigoVacina, dataValidade, loteVacina, ingredientes, qtVacina} = req.body
  connection.query('CALL RegistrarLoteVacina(?, ?, ?, ?, ?, ?)', [codigoFabricante, codigoVacina, dataValidade, loteVacina, ingredientes, qtVacina], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao Cadastrar lote.' });
      return;
    }

    res.status(201).json({ message: 'Lote cadastrado com sucesso.' });
  });
});


app.post('/vacinacao', (req, res) => {
  const {cpf, loteVacina, dataVacinacao, doseAplicada} = req.body
  connection.query('CALL RegistrarVacinação(?, ?, ?, ?)', [cpf, loteVacina, dataVacinacao, doseAplicada], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }

    res.status(201).json({ message: 'Vacinação realizada com sucesso.' });
  });
});

app.get('/vacina/:cpf', (req, res) => {
  const cpf = req.params.cpf;
  console.log(cpf);
  connection.query('CALL BuscarVacinasPorCPF(?)', [cpf], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }
    res.json(results[0])
  });
});


app.get('/lote/:lote', (req, res) => {
  const lote = req.params.lote;
  console.log(lote);
  connection.query('CALL ObterVacinasPorLote(?)', [lote], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }
    res.json(results[0]);
  });
});


app.get('/vacinados', (req, res) => {
  connection.query('CALL ListarTodosVacinados()', (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }

    res.json(results[0]);
  });
});


app.get('/covid', (req, res) => {
  connection.query('CALL ListarVacinadosCovid()', (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Erro ao executar a consulta.' });
      return;
    }
    console.log
    res.json(results[0]);
  });
});
