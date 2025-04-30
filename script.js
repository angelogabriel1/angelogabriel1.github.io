document.getElementById('botaoGirassol').addEventListener('click', iniciarAnimacao);

function iniciarAnimacao() {
    const botao = document.getElementById('botaoContainer');
    const girassol = document.getElementById('girassol');
    const textoAnimado = document.getElementById('textoAnimado');
    const cursor = document.querySelector('.cursor');
    const musica = document.getElementById('musica');
    musica.play();
    musica.volume = 0.3
    
    botao.style.display = 'none';

    
    girassol.classList.add('mostrar');

    
    const petalas = document.querySelectorAll('.petala');
    petalas.forEach((petala, index) => {
        const angulo = petala.dataset.angulo;
        petala.style.setProperty('--angulo', `${angulo}deg`);
        petala.style.animation = `surgir 0.5s ease-out ${index * 0.05}s forwards`;
    });

    
    const textoCompleto = "Você é especial pra mim! TE AMO, JOANA!!💛";
    let indexDigitacao = 0;
    textoAnimado.textContent = '';
    cursor.style.display = 'inline';

    function digitar() {
        if (indexDigitacao < textoCompleto.length) {
            textoAnimado.textContent += textoCompleto.charAt(indexDigitacao);
            indexDigitacao++;
            setTimeout(digitar, 100);
        } else {
            cursor.style.display = 'none';
        }
    }

    
    setTimeout(digitar, 600);
}