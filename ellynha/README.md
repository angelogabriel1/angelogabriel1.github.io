# Um presente para a Ellynha

Site estatico para Ikaelly, sem instalacao, bibliotecas ou fontes externas. Abra `index.html` com dois cliques para ver. Os textos sao uma primeira sugestao: personalize com lembrancas e palavras suas.

## Editar fotos, videos e mensagens

1. Abra `conteudo.js` no Bloco de Notas ou em um editor de codigo e salve em UTF-8.
2. Edite `carta`, `assinatura`, `desejos` e os demais textos entre aspas. Mantenha as virgulas e use `\"` se precisar de aspas dentro de uma frase.
3. Copie as fotos para `midia/`. Prefira JPG ou PNG, nomes sem espacos/acentos, com tamanho de ate cerca de 1600 pixels e arquivos leves.
4. Preencha `fotoCapa: "midia/capa.jpg"` e adicione itens em `fotos`, seguindo o exemplo comentado (retire `//`). Os caminhos diferenciam maiusculas e minusculas no GitHub Pages.
5. Adicione os videos em `videos`. Use MP4 com video H.264 e audio AAC para maior compatibilidade. `poster` e opcional. Videos ficam ocultos enquanto a lista estiver vazia. Nao ha reproducao automatica.

Voce pode adicionar os arquivos aos poucos ate 2 de dezembro. Salvar localmente atualiza a copia local; envie as mudancas para o GitHub para atualizar a versao online.

Os campos `planos`, `tituloCarinho` e `mensagemCarinho` controlam a lista de coisas para fazer juntos e o bilhete revelado pelo botao. Com uma unica foto, a lembranca aparece em destaque e sem cortar a imagem. Se adicionar mais fotos, a pagina volta a organizar uma galeria.

## GitHub Pages

1. Crie um repositorio no GitHub e envie `index.html`, `style.css`, `conteudo.js`, `site.js`, `.nojekyll` e a pasta `midia` para a raiz.
2. Em **Settings > Pages**, selecione **Deploy from a branch**, escolha a branch que recebeu os arquivos e a pasta **/(root)**, e salve.
3. Aguarde a publicacao e copie a URL exibida pelo GitHub. Teste essa URL no computador do trabalho.

Documentacao: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

O site publicado pode ser visto por outras pessoas com o link; publique apenas fotos, videos e mensagens que possam ficar acessiveis. Nao ha senha ou bloqueio por data. O agendamento apenas abre a pagina.

## Agendar no Windows 10 ou 11

De dois cliques em `scripts/agendar.cmd`. Cole a URL do GitHub Pages ou deixe vazia para abrir a copia local. Pressione Enter no horario para usar **02/12/2026 as 15:30**. O agendamento usa o fuso e relogio do computador onde for instalado.

Tambem pode executar no Windows PowerShell, a partir desta pasta:

```powershell
.\scripts\Agendar.ps1 -Destino 'https://SEU-USUARIO.github.io/SEU-REPOSITORIO/' -Quando '2026-12-02 15:30'
```

Para conferir os parametros sem criar uma tarefa:

```powershell
.\scripts\Agendar.ps1 -Simular
```

Para testar de verdade, execute com uma data alguns minutos no futuro e outro nome:

```powershell
.\scripts\Agendar.ps1 -Quando (Get-Date).AddMinutes(3).ToString('yyyy-MM-dd HH:mm') -NomeTarefa 'Teste-Ellynha'
```

O teste acima abre a copia local. Para testar o site online, acrescente `-Destino 'URL'`. Remova a tarefa de teste depois:

```powershell
Unregister-ScheduledTask -TaskName 'Teste-Ellynha' -Confirm:$false
```

Para cancelar o agendamento principal, use o mesmo comando com `Aniversario-Ellynha`. Nenhuma tarefa e criada apenas por baixar o projeto. O script recusa sobrescrever uma tarefa existente.

O computador precisa estar ligado, acordado, com o mesmo usuario conectado e tela desbloqueada para a surpresa ficar visivel. A versao online precisa de internet; a local funciona sem internet com as midias na pasta. O navegador padrao recebe a pagina, sem garantia de tela cheia ou de ficar por cima de todas as janelas. Politicas da empresa podem impedir scripts ou tarefas; nesse caso, combine a configuracao com o responsavel pelo computador.

## Windows 7

O site usa JavaScript ES5, arquivos relativos e CSS com alternativas simples, visando navegadores antigos, inclusive IE11. Pode abrir pelo `index.html` sem servidor. O sistema operacional sozinho nao garante compatibilidade: teste no navegador exato do trabalho, principalmente HTTPS do GitHub Pages e reproducao dos MP4. IE mais antigo que 11 nao e alvo. O script de agendamento foi preparado para Windows 10/11, conforme solicitado.

## Validacao

O projeto nao exige npm ou compilacao. A sintaxe dos scripts e a estrutura estaticas podem ser verificadas localmente; a compatibilidade real com Windows 7 e os codecs depende do teste no computador de destino.
