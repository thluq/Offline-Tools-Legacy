let qrcode;

document.addEventListener("DOMContentLoaded", () => {
    const qrElement = document.getElementById("qrcode");
    if (qrElement) {
        qrcode = new QRCode(qrElement, {
            width: 70,
            height: 70,
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    updateLabel();
});

function toggleOptionsMenu() {
    const menu = document.getElementById('options-menu');
    menu.classList.toggle('show');
}

window.onclick = function(event) {
    if (!event.target.matches('#unlock-btn')) {
        const dropdowns = document.getElementsByClassName("options-menu");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// Hash djb2 — evita expor senhas em texto claro
function hashSenha(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return hash;
}

const SENHAS_VALIDAS = [-537839990, 1281559840];

function promptForDeveloperMode() {
    const tentativa = prompt("Digite a senha de acesso para habilitar o Modo Desenvolvedor:");

    if (tentativa && SENHAS_VALIDAS.includes(hashSenha(tentativa))) {
        const areaBloqueada = document.getElementById('locked-fields');
        areaBloqueada.style.display = "block";
        areaBloqueada.style.pointerEvents = "auto";
        setTimeout(() => {
            areaBloqueada.style.opacity = "1";
            areaBloqueada.style.transition = "opacity 0.3s";
        }, 10);

        document.body.classList.add('dev-mode-on');
        updateLabel();

        alert("Modo Desenvolvedor habilitado! Campos liberados.");
    } else if (tentativa !== null) {
        alert("Senha incorreta. Acesso negado.");
    }
}

// Ícone de envio — checkboxes mutuamente exclusivos e opcionais
function handleRouteIcon(selected) {
    const routeN = document.getElementById('route-n');
    const routeS = document.getElementById('route-s');
    const routeMeliair = document.getElementById('route-meliair');

    if (selected === 'N' && routeN.checked) {
        routeS.checked = false;
        routeMeliair.checked = false;
    } else if (selected === 'S' && routeS.checked) {
        routeN.checked = false;
        routeMeliair.checked = false;
    } else if (selected === 'meliair' && routeMeliair.checked) {
        routeN.checked = false;
        routeS.checked = false;
    }

    updateLabel();
}

// Tipo de pacote — checkboxes mutuamente exclusivos e opcionais
function handlePackageType(selected) {
    ['cheapest', 'bulky', 'oversized'].forEach(t => {
        if (t !== selected) {
            const el = document.getElementById('pkg-' + t);
            if (el) el.checked = false;
        }
    });
    updateLabel();
}

function updateLabel() {
    const inHeader = document.getElementById('in-header-free');
    const inRecipient = document.getElementById('in-recipient-free');
    const inSSP = document.getElementById('in-ssp');
    const inFSP = document.getElementById('in-fsp');
    const inID = document.getElementById('in-id');
    const inCluster = document.getElementById('in-cluster');
    const inDate = document.getElementById('in-date');

    const headerText = inHeader ? inHeader.value : "";
    const recipientText = inRecipient ? inRecipient.value : "";
    const ssp = inSSP ? inSSP.value.trim() : "";
    const fsp = inFSP ? inFSP.value.trim() : "";
    const id = inID ? inID.value.trim() : "";
    const clusterNum = inCluster ? inCluster.value.trim() : "";
    const promiseDateValue = inDate ? inDate.value : "";

    const addressType = document.querySelector('input[name="address-type"]:checked')?.value || "R";

    const routeN = document.getElementById('route-n')?.checked;
    const routeS = document.getElementById('route-s')?.checked;
    const routeMeliair = document.getElementById('route-meliair')?.checked;
    const routeCircle = document.getElementById('out-route-icon');

    if (routeCircle) {
        if (routeMeliair) {
            routeCircle.innerHTML = '<img src="../icons/meliair.png" alt="MeliAir" style="width: 100%; height: 100%; object-fit: contain;">';
            routeCircle.classList.add('route-circle-img');
            routeCircle.style.display = '';
        } else if (routeN) {
            routeCircle.textContent = 'N';
            routeCircle.classList.remove('route-circle-img');
            routeCircle.style.display = '';
        } else if (routeS) {
            routeCircle.textContent = 'S';
            routeCircle.classList.remove('route-circle-img');
            routeCircle.style.display = '';
        } else {
            // Nenhum ícone selecionado — oculta o círculo
            routeCircle.textContent = '';
            routeCircle.classList.remove('route-circle-img');
            routeCircle.style.display = 'none';
        }
    }

    const isCheapest = document.getElementById('pkg-cheapest')?.checked || false;
    const isBulky = document.getElementById('pkg-bulky')?.checked || false;
    const pkgContainer = document.getElementById('package-icon-container');
    const pkgImg = document.getElementById('package-icon-img');

    if (pkgContainer && pkgImg) {
        const PKG_ICONS = {
            cheapest:  { src: '../icons/cheapest.png',  alt: 'Cheapest'  },
            bulky:     { src: '../icons/bulkyicon.png', alt: 'Bulky'     },
            oversized: { src: '../icons/oversized.png', alt: 'Oversized' }
        };

        const selecionado = Object.keys(PKG_ICONS)
            .find(t => document.getElementById('pkg-' + t)?.checked);

        if (selecionado) {
            pkgContainer.classList.remove('package-icon-hidden');
            pkgImg.src = PKG_ICONS[selecionado].src;
            pkgImg.alt = PKG_ICONS[selecionado].alt;
        } else {
            pkgContainer.classList.add('package-icon-hidden');
        }
    }
    const watermarkToggle = document.querySelector('input[name="watermark-toggle"]:checked')?.value || "on";
    const watermarkElement = document.querySelector('.origin-tag');
    if (watermarkElement) {
        watermarkElement.style.display = (watermarkToggle === "off") ? "none" : "block";
    }

    document.getElementById('out-header-free').innerText = headerText;
    document.getElementById('out-recipient-free').innerText = recipientText;
    document.getElementById('out-ssp').innerText = ssp || "SSP20";
    document.getElementById('out-fsp').innerText = fsp || "BRSP00";
    document.getElementById('out-address-type').innerText = addressType;

    const valFSP = fsp || "BRSP00";
    const valSSP = ssp || "SSP20";
    const valCluster = clusterNum || "--";
    document.getElementById('out-cluster-combined').innerHTML =
        `${valFSP} > ${valSSP} > <span class="cluster-number-bold">${valCluster}</span>`;

    const outDateElement = document.getElementById('out-date');
    const diasSemana = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

    if (!promiseDateValue) {
        const hoje = new Date();
        outDateElement.innerText = `${diasSemana[hoje.getDay()]} ${hoje.toLocaleDateString('pt-BR')}`;
    } else {
        const dateParts = promiseDateValue.split('-');
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        outDateElement.innerText = `${diasSemana[dateObj.getDay()]} ${dateObj.toLocaleDateString('pt-BR')}`;
    }

    /* --- Campos de modo desenvolvedor (auto-hide se vazio) --- */
    const devMode = document.body.classList.contains('dev-mode-on');

    const setDev = (outId, inId, prefixo = '', sufixo = '') => {
        const out = document.getElementById(outId);
        const inp = document.getElementById(inId);
        if (!out) return;
        const val = (devMode && inp) ? inp.value.trim() : '';
        out.textContent = val ? `${prefixo}${val}${sufixo}` : '';
    };

    setDev('out-nf',         'in-nf',         'NF: ');
    setDev('out-priority',   'in-priority');
    setDev('out-cutoff',     'in-cutoff');

   const badge = document.getElementById('out-priority-badge');
    if (badge) {
        const valPrio = document.getElementById('out-priority')?.textContent.trim();
        badge.style.display = (devMode && valPrio) ? 'flex' : 'none';
    }
    const cutoffEl = document.getElementById('out-cutoff');
    if (cutoffEl) {
        cutoffEl.style.display = cutoffEl.textContent.trim() ? 'inline' : 'none';
    }

    const textManual = document.getElementById('barcode-text-manual');

    if (id) {
        const barcodeEl = document.getElementById('barcode');
        if (barcodeEl) { barcodeEl.style.display = ''; barcodeEl.style.opacity = '1'; }
        JsBarcode("#barcode", id, {
            format: "CODE128",
            lineColor: "#000",
            width: 2.2,
            height: 85,
            displayValue: false,
            margin: 0
        });

        const startPart = id.substring(0, id.length - 5);
        const lastFive = id.substring(id.length - 5);
        textManual.innerHTML = `${startPart}<span class="id-last-five-highlight">${lastFive}</span>`;
        textManual.style.color = "#000";

        if (qrcode) { qrcode.clear(); qrcode.makeCode(id); }
    } else {
        // Sem ID: barcode placeholder com baixa opacidade
        const barcodeEl = document.getElementById('barcode');
        if (barcodeEl) { barcodeEl.style.display = ''; barcodeEl.style.opacity = '0.25'; }
        JsBarcode("#barcode", "41234567890", {
            format: "CODE128",
            lineColor: "#000",
            width: 2.2,
            height: 85,
            displayValue: false,
            margin: 0
        });

        textManual.innerHTML = `412345<span class="id-last-five-highlight">67890</span>`;
        textManual.style.color = "#ccc";

        if (qrcode) { qrcode.clear(); qrcode.makeCode("41234567890"); }
    }
}

