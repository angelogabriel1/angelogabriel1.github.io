(function () {
  'use strict';
  var c = window.ANIVERSARIO || {};
  function text(id, value) { if (typeof value === 'string') { document.getElementById(id).textContent = value; } }
  function el(tag, className, value) { var node = document.createElement(tag); if (className) { node.className = className; } if (value) { node.textContent = value; } return node; }
  function safeFile(path) { return typeof path === 'string' && /^midia\/[a-zA-Z0-9_./-]+$/.test(path) && path.indexOf('..') === -1; }
  function photo(path, alt) { var img = el('img'); img.src = path; img.alt = alt || ''; img.onerror = function () { var fallback = el('p', 'missing', 'Essa foto ainda não chegou. ♡'); if (img.parentNode) { img.parentNode.replaceChild(fallback, img); } }; return img; }
  if (c.nome) { text('greeting', 'Ei, ' + c.nome + '.'); document.title = 'Feliz aniversário, ' + c.nome; }
  text('intro', c.introducao); text('cover-caption', c.legendaCapa); text('signature', c.assinatura); text('closing', c.encerramento);
  if (safeFile(c.fotoCapa)) { var cover = document.getElementById('cover-image'); cover.innerHTML = ''; cover.appendChild(photo(c.fotoCapa, 'Uma lembrança especial')); }
  if (c.carta && c.carta.length) { var letter = document.getElementById('letter-text'); letter.innerHTML = ''; for (var i = 0; i < c.carta.length; i++) { letter.appendChild(el('p', '', c.carta[i])); } }
  var photos = document.getElementById('photos'); var items = c.fotos || [];
  for (var j = 0; j < items.length; j++) { if (!safeFile(items[j].arquivo)) { continue; } var figure = el('figure', 'photo'); figure.appendChild(photo(items[j].arquivo, items[j].alt || items[j].legenda)); figure.appendChild(el('figcaption', '', items[j].legenda)); photos.appendChild(figure); }
  if (photos.children.length === 1) { photos.className += ' single-photo'; }
  if (!photos.children.length) { document.getElementById('lembrancas').style.display = 'none'; }
  var plans = c.planos || []; var planList = document.getElementById('plans');
  for (var p = 0; p < plans.length; p++) { planList.appendChild(el('li', '', plans[p])); }
  if (!plans.length) { document.getElementById('planos').style.display = 'none'; }
  text('comfort-title', c.tituloCarinho);
  var comfortText = document.getElementById('comfort-text'); var messages = c.mensagemCarinho || [];
  if (messages.length) { comfortText.innerHTML = ''; for (var m = 0; m < messages.length; m++) { comfortText.appendChild(el('p', '', messages[m])); } }
  var comfortButton = document.getElementById('comfort-button'); var comfortMessage = document.getElementById('comfort-message');
  comfortMessage.hidden = true; comfortButton.hidden = false;
  comfortButton.onclick = function () {
    var opening = comfortButton.getAttribute('aria-expanded') !== 'true';
    comfortButton.setAttribute('aria-expanded', opening ? 'true' : 'false');
    comfortMessage.hidden = !opening;
    comfortButton.textContent = opening ? 'Guardar o recadinho ♡' : 'Abre quando precisar de um carinho ♡';
    if (opening) { comfortMessage.focus(); }
  };
  var notes = c.desejos || []; for (var n = 0; n < notes.length; n++) { var note = el('div', 'note'); note.appendChild(el('span', 'note-number', '0' + (n + 1))); note.appendChild(el('p', '', notes[n])); document.getElementById('notes').appendChild(note); }
  var videos = c.videos || []; var container = document.getElementById('videos');
  for (var v = 0; v < videos.length; v++) { if (!safeFile(videos[v].arquivo)) { continue; } var article = el('article', 'video'); article.appendChild(el('h3', '', videos[v].titulo)); var video = el('video'); video.controls = true; video.preload = 'none'; if (safeFile(videos[v].poster)) { video.poster = videos[v].poster; } var source = el('source'); source.src = videos[v].arquivo; source.type = 'video/mp4'; video.appendChild(source); var link = el('a', '', 'Abrir vídeo'); link.href = videos[v].arquivo; video.appendChild(link); article.appendChild(video); var direct = el('a', 'video-link', 'Abrir o arquivo de vídeo'); direct.href = videos[v].arquivo; article.appendChild(direct); container.appendChild(article); }
  if (!container.children.length) { document.getElementById('videos-section').style.display = 'none'; }
}());
