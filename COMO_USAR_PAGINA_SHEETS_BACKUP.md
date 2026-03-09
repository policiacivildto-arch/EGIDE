# Como usar a página HTML com Google Sheets + Backup

Arquivo criado: `pagina-sheets-backup.html`

## 1) Abrir a página

- Abra o arquivo `pagina-sheets-backup.html` no navegador.
- Você pode usar localmente mesmo (`file://`) para testar backup JSON.

## 2) Carregar dados do Google Sheets (somente leitura)

1. Na planilha, vá em **Arquivo > Compartilhar > Publicar na web**.
2. Publique a aba desejada como CSV.
3. Copie a URL CSV e cole no campo **URL pública CSV da planilha**.
4. Clique em **Carregar do CSV público**.

## 2.1) Abas auxiliares da sua planilha

### Aba `Delegacias` (controle de acesso)

Use esta aba para manter cadastro de acesso com colunas como:

- ACESSO
- MATRÍCULA
- EMAIL
- CÓDIGO
- STATUS
- DEPARTAMENTO

### Aba `CONTROLE_NOMINAL` (matrícula -> nome)

1. Publique a aba `CONTROLE_NOMINAL` como CSV.
2. Cole a URL no campo **URL CSV da aba CONTROLE_NOMINAL** da página.
3. Clique em **Carregar CONTROLE_NOMINAL**.
4. Ao preencher `Matrícula` na linha da operação, o `Nome policial` é puxado automaticamente.

### Campos da operação (na ordem da planilha)

1. matricula
2. nomePolicial
3. cargo
4. servicoPolicial (Ordinário ou Extra)
5. tipoAporte (Sem aporte ou Com aporte financeiro)
6. dataEntrada
7. horaEntrada
8. dataSaida
9. horaSaida
10. delegacia
11. plantaoDelegacia (Ordinária ou Extraordinária)
12. horarioDelegacia

## 3) Ler e gravar no Sheets (via Apps Script)

Crie um Apps Script vinculado à planilha com o código abaixo:

```javascript
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheets()[0]; // primeira aba

    const data = JSON.parse(e.postData.contents || '{}');

    if (data.action === 'readAll') {
      const values = sh.getDataRange().getValues();
      const rows = values.slice(1).map(r => ({
        cargo: String(r[0] || ''),
        servicoPolicial: String(r[1] || ''),
        tipoAporte: String(r[2] || ''),
        dataEntrada: String(r[3] || ''),
        horaEntrada: String(r[4] || ''),
        dataSaida: String(r[5] || ''),
        horaSaida: String(r[6] || ''),
        delegacia: String(r[7] || ''),
        plantaoDelegacia: String(r[8] || ''),
        horarioDelegacia: String(r[9] || ''),
      }));
      return json({ ok: true, rows });
    }

    if (data.action === 'replaceAll') {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      sh.clearContents();
      sh.getRange(1, 1, 1, 10).setValues([[
        'cargo',
        'servicoPolicial',
        'tipoAporte',
        'dataEntrada',
        'horaEntrada',
        'dataSaida',
        'horaSaida',
        'delegacia',
        'plantaoDelegacia',
        'horarioDelegacia',
      ]]);

      if (rows.length > 0) {
        const values = rows.map(r => [
          String(r.cargo || ''),
          String(r.servicoPolicial || ''),
          String(r.tipoAporte || ''),
          String(r.dataEntrada || ''),
          String(r.horaEntrada || ''),
          String(r.dataSaida || ''),
          String(r.horaSaida || ''),
          String(r.delegacia || ''),
          String(r.plantaoDelegacia || ''),
          String(r.horarioDelegacia || ''),
        ]);
        sh.getRange(2, 1, values.length, 10).setValues(values);
      }

      return json({ ok: true, message: 'Planilha atualizada', count: rows.length });
    }

    return json({ ok: false, message: 'Ação inválida' });
  } catch (err) {
    return json({ ok: false, message: err.message });
  }
}

function doGet() {
  return json({ ok: true, message: 'Use POST com action readAll ou replaceAll' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Depois:

1. Clique em **Implantar > Nova implantação**.
2. Tipo: **Aplicativo da Web**.
3. Execute como: sua conta.
4. Acesso: **Qualquer pessoa com o link**.
5. Copie a URL do Web App e cole no campo **Endpoint do Google Apps Script** da página.

## 4) Backup local

- Clique em **Baixar backup JSON** para salvar cópia local.
- Use **Restaurar backup JSON** para recuperar os dados no formulário.

## 5) Fluxo recomendado

1. Carregar CSV ou API.
2. Editar linhas na página.
3. Baixar backup JSON.
4. Enviar para Apps Script.
