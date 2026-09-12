async function gerarEtiquetas() {
    const facility = document.getElementById('in-facility').value.trim() || "XSP02";
    const startNum = parseInt(document.getElementById('in-start').value);
    const qty = parseInt(document.getElementById('in-qty').value);
    const container = document.getElementById('print-container');

    if (isNaN(startNum) || isNaN(qty) || qty <= 0) {
        alert("Por favor, insira valores válidos para numeração e quantidade.");
        return;
    }

    container.innerHTML = '';

    for (let i = 0; i < qty; i++) {
        const num = String(startNum + i).padStart(2, '0');
        const semIdText = `SEMID_${facility}_${num}`;

        const label = document.createElement('div');
        label.className = 'label-page';

        label.innerHTML = `
            <div class="label-logo-area">
                <img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/favicon.svg" alt="Meli">
            </div>

            <div class="label-title-bar">PACOTES SEM ID - SALVADOS</div>

            <div class="label-id-bar">${semIdText}</div>

            <div class="label-qr-area">
                <div id="qrcode-${i}"></div>
            </div>

            <div class="label-barcode-area">
                <svg id="barcode-${i}" class="barcode-canvas"></svg>
                <span class="label-barcode-text">${semIdText}</span>
            </div>
        `;

        container.appendChild(label);

        JsBarcode(`#barcode-${i}`, semIdText, {
            format: "CODE128",
            lineColor: "#000",
            width: 1.5,
            height: 55,
            displayValue: false,
            margin: 0
        });

        new QRCode(document.getElementById(`qrcode-${i}`), {
            text: semIdText,
            width: 180,
            height: 180,
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
