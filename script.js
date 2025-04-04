// script.js
const botao = document.getElementById('botaoGirassol');

// Eventos para mobile e desktop
botao.addEventListener('click', iniciarAnimacao);
botao.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevenir double tap zoom
    iniciarAnimacao();
});

async function iniciarAnimacao() {
    const botaoContainer = document.getElementById('botaoContainer');
    const girassol = document.getElementById('girassol');
    const textoAnimado = document.getElementById('textoAnimado');
    const musica = document.getElementById('musica');

    // Toca a música diretamente dentro do evento
    musica.play().then(() => {
        musica.volume = 0.8;
    }).catch(() => {
        // Caso o navegador bloqueie, espera um toque adicional
        botao.addEventListener('touchstart', () => musica.play(), { once: true });
    });

    // Esconder botão
    botaoContainer.style.display = 'none';

    // Mostrar girassol
    girassol.style.display = 'block';
    girassol.classList.add('mostrar');

    // Animar pétalas
    document.querySelectorAll('.petala').forEach((petala, index) => {
        const angulo = petala.dataset.angulo;
        petala.style.setProperty('--angulo', `${angulo}deg`);
        petala.style.animation = `surgir 0.3s ease-out ${index * 0.04}s forwards`;
    });

    // Animar texto
    textoAnimado.textContent = '';
    const texto = "Você é especial pra mim! TE ADORO, LHEO, MANDA FOTO DO CU 💛";

    for (let i = 0; i < texto.length; i++) {
        textoAnimado.textContent += texto[i];
        await new Promise(resolve => setTimeout(resolve, 80));
    }

    // Remover cursor
    document.querySelector('.cursor').style.display = 'none';
}
