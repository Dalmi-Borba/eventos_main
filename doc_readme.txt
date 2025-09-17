| Campo (chave JSON) | Tipo     | Descrição                                                     |                                           |
| ------------------ | -------- | ------------------------------------------------------------- | ----------------------------------------- |
| `_id`              | `string` | ID único do documento (pode ser o CPF, ou um UUID)            |                                           |
| `NOME DO USUARIO`  | `string` | Nome completo do participante                                 |                                           |
| `CPF`              | `string` | CPF (ou outro identificador nacional)                         |                                           |
| `CLUBE DE ORIGEM`  | `string` | Nome do clube (usado para busca/autocomplete)                 |                                           |
| `CHECKOUT`         | \`'Y'    | 'N'\`                                                         | Flag de check-in (`N`) ou check-out (`Y`) |
| `_rev`             | `string` | (gerado automaticamente pelo CouchDB para controle de versão) |                                           |





sudo apt update
sudo apt install couchdb


http://127.0.0.1:5984/_utils/


curl -X POST http://admin:admin@127.0.0.1:5984/eventos/_bulk_docs \
  -H "Content-Type: application/json" \
  -d @importar.json


exemplo de importação:
{
  "docs": [
    {
      "_id": "11111111111",
      "NOME DO USUARIO": "Maria Silva",
      "CPF": "11111111111",
      "CLUBE DE ORIGEM": "Clube Alpha",
      "CHECKOUT": "N"
    },
    {
      "_id": "22222222222",
      "NOME DO USUARIO": "João Souza",
      "CPF": "22222222222",
      "CLUBE DE ORIGEM": "Clube Beta",
      "CHECKOUT": "Y"
    }
  ]
}
