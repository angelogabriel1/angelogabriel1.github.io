# Banco Nacional de Questões - CNH do Brasil

Repositório para armazenar código de extração e estruturação de questões do Banco Nacional de Questões da CNH do Brasil em formato JSON.

## Motivação

Apesar de pública, as questões do Banco Nacional de Questões não estão facilmente acessíveis em formatos estruturados que possam ser utilizados por desenvolvedores e educadores, sendo apenas encontrada em formato PDF.

## Estrutura do Repositório

- `extract.py`: Script para extrair texto do arquivo PDF do Banco Nacional de Questões
- `generate_json.py`: Script para converter o texto extraído em um arquivo JSON estruturado
- `extracted_text.txt`: Arquivo de texto intermediário contendo o conteúdo extraído do PDF
- `questions.json`: Arquivo JSON final contendo as questões estruturadas

## Uso

1. Coloque o arquivo PDF do Banco Nacional de Questões na mesma pasta que os scripts. Se já não estiver, renomeie-o para `Banco Nacional de Questões.pdf` ou ajuste o código em `extract.py` para corresponder ao nome do arquivo.
2. Execute `extract.py` para extrair o texto do PDF.
   ```bash
   python extract.py
   ```
3. Execute `generate_json.py` para converter o texto extraído em JSON.
   ```bash
   python generate_json.py
   ```
4. O arquivo `questions.json` será gerado com as questões estruturadas.

## Problemas conhecidos

- A extração de texto pode não ser perfeita devido à formatação do PDF original. Há questões e comentários que utilizam duas ou mais linhas, o que pode causar problemas na extração. ~~O código atual não lida com esses casos.~~ Está implementado no código uma lógica para gerenciamento de casos de quebra de linha, que pode não funcionar corretamente.
