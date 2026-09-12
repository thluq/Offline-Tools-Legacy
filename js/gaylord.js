async function gerarEtiquetas() {
    const facility = document.getElementById('in-facility').value.trim() || "BRSP05";
    const startNum = parseInt(document.getElementById('in-start').value);
    const qty = 1;
    const container = document.getElementById('print-container');

    if (isNaN(startNum) || isNaN(qty) || qty <= 0) {
        alert("Por favor, insira valores válidos para numeração e quantidade.");
        return;
    }

    container.innerHTML = '';

    for (let i = 0; i < qty; i++) {
        const num = startNum + i;
        const gaylordId = `G${num}_${facility}`;

        const label = document.createElement('div');
        label.className = 'label-page';

        label.innerHTML = `
            <div class="label-logo-area">
                <img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/favicon.svg" alt="Meli">
            </div>

            <div class="label-title-bar">ID da GAYLORD - SALVADOS</div>

            <div class="label-id-bar">${gaylordId}</div>

            <div class="label-qr-area">
                <div id="qrcode-${i}"></div>
            </div>
        `;

        container.appendChild(label);

        new QRCode(document.getElementById(`qrcode-${i}`), {
            text: gaylordId,
            width: 220,
            height: 220,
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    setTimeout(() => {
        window.print();
    }, 800);
}

document.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && document.activeElement.tagName === "INPUT") {
        gerarEtiquetas();
    }
});
