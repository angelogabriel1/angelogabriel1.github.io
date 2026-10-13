# Simuladinho pra Ikaelly

Site estático em português para preparação da primeira habilitação no Rio Grande do Norte. Não exige backend, chave de API, instalação ou etapa de build. Pode ser aberto pelo `index.html` ou hospedado no GitHub Pages.

## O que funciona

- 30 questões aleatórias, sem repetição na tentativa, com alternativas embaralhadas.
- 60 minutos e meta de 20 acertos, conforme Resolução CONTRAN 1.020/2025, arts. 33 e 34. Opção de tempo ampliado: 120 minutos.
- Imagens locais de placas, navegação entre questões e marcação para revisão.
- Encerramento automático, correção com explicações e filtro de erros.
- Retomada e histórico no localStorage. O tempo continua após fechar ou recarregar a página.
- Layout responsivo, operação por teclado, sem analytics nem cadastro.

## Limite importante sobre o RN

Não foi encontrado um banco oficial público exclusivo do DETRAN RN, nem confirmação oficial acessível da integração do RN com a versão específica desta base. O banco incluído é uma extração de terceiros do Banco Nacional de Questões da Senatran, versão 1.0 (2025). A regra nacional prevê esse banco para todos os Detrans; isso não confirma quais perguntas serão usadas em uma prova específica no RN.

O tempo configurado é o mínimo nacional, não uma duração local confirmada. O sorteio é uniforme entre os registros disponíveis; não promete reproduzir distribuição temática ou dificuldade da prova oficial.

Fontes:

- [Primeira habilitação · DETRAN RN](https://portal.detran.rn.gov.br/servicos/habilitacao/primeirahabilitacao)
- [Resolução CONTRAN 1.020/2025](https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao10202025.pdf)
- [Material complementar · CNH do Brasil](https://eadcnh.bsa.estaleiro.serpro.gov.br/cursos/673a6cc7e3bb091c6db844aa/material-complementar)
- [Registro bibliográfico oficial do banco](https://biblioteca.detran.rs.gov.br/cgi-bin/koha/opac-detail.pl?biblionumber=1861)
- [JSON de André Gama, licença CC0](https://github.com/andregamma/banco-nacional-de-questoes-cnh), commit `1067f40cfeee569b1e6a15a428cddca82bfc8549`, consultado em 13/10/2026.

## Banco e placas

Há 1.500 registros na extração original e 1.466 questões disponíveis, das quais 197 contêm imagens de placas. Foram excluídos 34 registros com referências de placas sem imagem disponível ou duplicatas exatas. A lista está em `data/excluded.json`. O conteúdo não foi auditado integralmente contra o PDF original: a extração pode conter erros de transcrição. O site informa isso ao usuário.

As imagens de 67 placas foram obtidas do Wikimedia Commons por meio da cópia do projeto Roundeprigous/simulado-cnh (commit `8cc0240e2a1cd22f4869ec6221c4c10dddb7158d`) e consultas diretas ao Commons. Cinco SVGs adicionais são ilustrações próprias de sinais padronizados (Pare, Dê a preferência, Sentido proibido e limites de 60/80 km/h). Para R-19 sem valor expresso, usa-se 60 km/h como exemplo. As imagens não são capturas da prova. Consulte `data/SIGN-CREDITS.txt` para atribuições e licenças.

O JSON original está versionado, e a cópia usada pelo navegador é `data/bank.js`. Não há chamada a uma API externa em cada prova: a base acompanha o site. Para substituir ou atualizar a base, mantenha a estrutura de `data/source-questions.json` e execute:

```powershell
node scripts/prepare-bank.mjs
node --test tests/core.test.cjs
```

O script não altera o texto das perguntas nem o gabarito. Valida alternativas, remove duplicatas exatas e exclui questões com imagens ausentes. O banco não se atualiza automaticamente.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie os arquivos deste diretório (incluindo `data/` e `placas/`).
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione sua branch (normalmente `main`) e a pasta **/ (root)**. Salve.
5. Aguarde a publicação; a página informará a URL `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

Os caminhos são relativos, compatíveis com Pages em subdiretório. `.nojekyll` evita processamento desnecessário. Não há repositório remoto configurado neste projeto ainda.

## Executar localmente

Abra `index.html` no navegador ou use:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Depois abra `http://127.0.0.1:8080/`. O navegador pode restringir o armazenamento ao abrir como arquivo; um servidor local ou GitHub Pages é mais previsível para a retomada.
