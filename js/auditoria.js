/* ============================================
   AUDITORIA — OfflineTools MELI
   ============================================ */

let basePrevista = [];
let basePrevistaSet = new Set();
let bipsRealizados = new Set();
let bipsExtras = [];
let timeoutStatusTela;

/* --- Config QR --- */
const QR_PREFIXO = 'AUD1';
const QR_CHUNK_SIZE = 100;

/* --- Estado do import --- */
let importChunks = {};
let importAssinatura = '';
let debounceImport;

/* ============================================
   PAYLOAD QR — encode / decode
   ============================================ */

function calcularChecksum(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return String(Math.abs(hash) % 10000).padStart(4, '0');
}

function gerarChunksQR(ids) {
    const chunks = [];
    const total = ids.length;
    const totalChunks = Math.ceil(total / QR_CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
        const fatia = ids.slice(i * QR_CHUNK_SIZE, (i + 1) * QR_CHUNK_SIZE);
        const corpo = fatia.map(id => id.substring(1)).join('');
        const checksum = calcularChecksum(corpo);
        chunks.push(`${QR_PREFIXO}|${i + 1}/${totalChunks}|${total}|${corpo}|${checksum}`);
    }
    return chunks;
}

function decodificarChunkQR(raw) {
    const texto = (raw || '').trim();
    const partes = texto.split('|');

    if (partes.length !== 5 || partes[0] !== QR_PREFIXO) {
        return { ok: false, erro: 'Código não reconhecido como base de auditoria.' };
    }

    const paginacao = partes[1].split('/');
    const pagina = parseInt(paginacao[0]);
    const totalChunks = parseInt(paginacao[1]);
    const totalIds = parseInt(partes[2]);
    const corpo = partes[3];
    const checksum = partes[4];

    if (isNaN(pagina) || isNaN(totalChunks) || isNaN(totalIds) || pagina < 1 || pagina > totalChunks) {
        return { ok: false, erro: 'Paginação inválida.' };
    }
    if (corpo.length === 0 || corpo.length % 10 !== 0) {
        return { ok: false, erro: 'Leitura incompleta. Bipe novamente.' };
    }
    if (calcularChecksum(corpo) !== checksum) {
        return { ok: false, erro: 'Checksum inválido. Leitura corrompida.' };
    }

    const ids = [];
    for (let i = 0; i < corpo.length; i += 10) {
        ids.push('4' + corpo.substring(i, i + 10));
    }

    return { ok: true, pagina, totalChunks, totalIds, ids };
}

/* ============================================
   IMPORT — acumula chunks
   ============================================ */

function processarLeituraQR(raw) {
    const res = decodificarChunkQR(raw);

    if (!res.ok) {
        mostrarStatusImport(res.erro, 'erro');
        return;
    }

    const assinatura = `${res.totalChunks}|${res.totalIds}`;
    if (assinatura !== importAssinatura) {
        importChunks = {};
        importAssinatura = assinatura;
    }

    if (importChunks[res.pagina]) {
        mostrarStatusImport(
            `Parte ${res.pagina}/${res.totalChunks} já lida. Faltam: ${listarFaltantes(res.totalChunks)}`,
            'aviso'
        );
        return;
    }

    importChunks[res.pagina] = res.ids;
    const lidas = Object.keys(importChunks).length;

    if (lidas < res.totalChunks) {
        mostrarStatusImport(
            `Parte ${res.pagina}/${res.totalChunks} lida. Faltam: ${listarFaltantes(res.totalChunks)}`,
            'ok'
        );
        return;
    }

    // Todas as partes lidas — monta a base
    let todos = [];
    for (let i = 1; i <= res.totalChunks; i++) {
        todos = todos.concat(importChunks[i]);
    }

    const unicos = [...new Set(todos)];

    if (unicos.length !== res.totalIds) {
        mostrarStatusImport(
            `Divergência: esperado ${res.totalIds} IDs, montado ${unicos.length}. Gere o QR novamente.`,
            'erro'
        );
        importChunks = {};
        importAssinatura = '';
        return;
    }

    mostrarStatusImport(`Base completa: ${unicos.length} IDs. Iniciando...`, 'ok');
    document.getElementById('base-ids').value = unicos.join('\n');

    setTimeout(() => {
        fecharModalImport();
        iniciarAuditoria();
    }, 700);
}

function listarFaltantes(totalChunks) {
    const faltam = [];
    for (let i = 1; i <= totalChunks; i++) {
        if (!importChunks[i]) faltam.push(i);
    }
    return faltam.join(', ');
}

function mostrarStatusImport(msg, tipo) {
    const el = document.getElementById('import-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'import-status import-' + tipo;
}

/* ============================================
   MODAL DE IMPORT
   ============================================ */

function abrirModalImport() {
    importChunks = {};
    importAssinatura = '';

    const modal = document.getElementById('modal-import');
    const input = document.getElementById('qrImportInput');
    if (!modal) return;

    modal.classList.remove('hidden');
    mostrarStatusImport('Aguardando leitura do QR...', 'neutro');

    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);

        input.onblur = () => {
            if (!modal.classList.contains('hidden')) {
                setTimeout(() => input.focus(), 10);
            }
        };

        // Coletor digita rápido e pode ou não mandar Enter no fim.
        // Enter processa na hora; senão, debounce de 150ms fecha a leitura.
        input.oninput = () => {
            clearTimeout(debounceImport);
            debounceImport = setTimeout(() => {
                const val = input.value.trim();
                if (val.length > 20) {
                    processarLeituraQR(val);
                    input.value = '';
                }
            }, 150);
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(debounceImport);
                const val = input.value.trim();
                if (val) processarLeituraQR(val);
                input.value = '';
            }
        };
    }
}

function fecharModalImport() {
    const modal = document.getElementById('modal-import');
    const input = document.getElementById('qrImportInput');
    if (!modal) return;

    modal.classList.add('hidden');
    if (input) {
        input.onblur = null;
        input.oninput = null;
        input.onkeydown = null;
        input.value = '';
    }
    clearTimeout(debounceImport);
}

/* ============================================
   EXPORTAÇÃO DO QR
   ============================================ */

function exportarQR() {
    const dropdown = document.getElementById('dropdown');
    if (dropdown) dropdown.classList.remove('show');

    if (!basePrevista.length) {
        alert('Nenhuma base carregada para exportar.');
        return;
    }

    const chunks = gerarChunksQR(basePrevista);
    const modal = document.getElementById('modal-export');
    const container = document.getElementById('qr-export-container');
    if (!modal || !container) return;

    container.innerHTML = '';

    chunks.forEach((payload, i) => {
        const bloco = document.createElement('div');
        bloco.className = 'qr-export-item';
        bloco.innerHTML = `
            <div class="qr-export-title">Parte ${i + 1} de ${chunks.length}</div>
            <div class="qr-box" id="qr-chunk-${i}"></div>
            <div class="qr-export-sub">${basePrevista.length} IDs no total</div>
        `;
        container.appendChild(bloco);

        new QRCode(document.getElementById(`qr-chunk-${i}`), {
            text: payload,
            width: 380,
            height: 380,
            correctLevel: QRCode.CorrectLevel.L
        });
    });

    modal.classList.remove('hidden');
}

function fecharModalExport() {
    const modal = document.getElementById('modal-export');
    if (modal) modal.classList.add('hidden');
    const input = document.getElementById('scanInput');
    const drawer = document.getElementById('drawer');
    if (input && drawer && !drawer.classList.contains('open')) {
        setTimeout(() => input.focus(), 50);
    }
}
            
/* ============================================
   DRAWER
   ============================================ */

function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    const input = document.getElementById('scanInput');
    if (!drawer) return;

    drawer.classList.toggle('open');
    if (!drawer.classList.contains('open') && input) {
        setTimeout(() => input.focus(), 50);
    }
}

/* ============================================
   TELA DE STATUS
   ============================================ */

function atualizarTelaStatus(tipo, id = "") {
    const screen = document.getElementById('status-screen');
    const icon = document.getElementById('feedback-icon');
    const title = document.getElementById('feedback-title');
    const msg = document.getElementById('feedback-msg');

    if (!screen) return;

    screen.className = '';

    if (tipo === 'correto') {
        screen.classList.add('status-ok');
        icon.innerHTML = '<img src="../icons/icon-package.svg" style="filter: brightness(0) invert(1);">';
        title.innerText = "Correto";
        msg.innerText = id;
    } else if (tipo === 'amais') {
        screen.classList.add('status-warning');
        icon.innerHTML = '<img src="../icons/icon-package.svg" style="filter: brightness(0) invert(1);">';
        title.innerText = id.includes("DUPLICADO") ? "Duplicado" : "A Mais";
        msg.innerText = id;
    } else if (tipo === 'invalido') {
        screen.classList.add('status-error');
        icon.innerHTML = '<img src="../icons/icon-package.svg" style="filter: brightness(0) invert(1);">';
        title.innerText = "Inválido";
        msg.innerText = id;
    } else {
        screen.classList.add('status-screen-default');
        icon.innerHTML = '<img src="../icons/icon-package.svg">';
        title.innerText = "Escaneie o código";
        msg.innerText = "Aguardando bipagem...";
    }

    if (timeoutStatusTela) clearTimeout(timeoutStatusTela);

    if (tipo !== 'default') {
        timeoutStatusTela = setTimeout(() => {
            atualizarTelaStatus('default');
        }, 2000);
    }
}

/* ============================================
   BIPAGEM
   ============================================ */

function adicionarBip(idSujo) {
    const idLimpoMatch = idSujo.match(/4\d{10}/);
    let idFinal = idSujo;
    let tipoResult = 'invalido';

    if (idLimpoMatch) {
        const idLimpo = idLimpoMatch[0];
        idFinal = idLimpo;

        if (bipsRealizados.has(idLimpo)) {
            atualizarTelaStatus('amais', idLimpo + " (DUPLICADO)");
            return;
        }

        bipsRealizados.add(idLimpo);

        if (basePrevistaSet.has(idLimpo)) {
            tipoResult = 'correto';
        } else {
            bipsExtras.unshift({ id: idLimpo, tipo: 'A Mais', cor: '#ff9800' });
            tipoResult = 'amais';
        }
    } else {
        bipsExtras.unshift({ id: idSujo.substring(0, 11), tipo: 'Inválido', cor: '#f23d4f' });
        tipoResult = 'invalido';
    }

    atualizarTelaStatus(tipoResult, idFinal);
    renderizarListaCompleta();
    atualizarResumo();
    salvarSessao();
}

function atualizarResumo() {
    const total = basePrevista.length;
    let corretos = 0;
    bipsRealizados.forEach(id => { if (basePrevistaSet.has(id)) corretos++; });

    const el = document.getElementById('progresso-concluido');
    if (el) el.innerText = `${corretos}/${total}`;
}

function renderizarListaCompleta() {
    const container = document.getElementById('visualList');
    if (!container) return;

    const html = [];

    bipsExtras.forEach(e => {
        html.push(`
            <div class="bip-item">
                <span class="status-dot" style="background:${e.cor}">!</span>
                <div style="flex:1"><strong>${e.id}</strong><br><small style="color:#666">${e.tipo}</small></div>
            </div>`);
    });

    const concluidos = [];
    bipsRealizados.forEach(id => { if (basePrevistaSet.has(id)) concluidos.push(id); });
    concluidos.reverse().forEach(id => {
        html.push(`
            <div class="bip-item">
                <span class="status-dot" style="background:#00a650">✓</span>
                <div style="flex:1"><strong>${id}</strong></div>
            </div>`);
    });

    basePrevista.forEach(id => {
        if (!bipsRealizados.has(id)) {
            html.push(`
                <div class="bip-item" style="opacity:0.5">
                    <span class="status-dot" style="background:#ccc"></span>
                    <div style="flex:1"><strong>${id}</strong><br><small>Pendente</small></div>
                </div>`);
        }
    });

    container.innerHTML = html.join('');
}

/* ============================================
   PERSISTÊNCIA (recupera se a aba fechar)
   ============================================ */

const STORAGE_KEY = 'auditoria_sessao';

function salvarSessao() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            basePrevista,
            bipsRealizados: Array.from(bipsRealizados),
            bipsExtras,
            ts: Date.now()
        }));
    } catch (e) { /* storage cheio ou bloqueado — segue sem persistir */ }
}

function limparSessao() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

function recuperarSessao() {
    let dados;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        dados = JSON.parse(raw);
    } catch (e) { return; }

    if (!dados || !dados.basePrevista || !dados.basePrevista.length) return;

    const horas = Math.floor((Date.now() - dados.ts) / 3600000);
    const qtdBipada = (dados.bipsRealizados || []).length;
    const quando = horas < 1 ? 'há menos de 1h' : `há ~${horas}h`;

    const ok = confirm(
        `Existe uma auditoria em andamento (${quando}):\n` +
        `${dados.basePrevista.length} IDs na base, ${qtdBipada} já bipados.\n\n` +
        `Deseja continuar de onde parou?`
    );

    if (!ok) { limparSessao(); return; }

    basePrevista = dados.basePrevista;
    basePrevistaSet = new Set(basePrevista);
    bipsRealizados = new Set(dados.bipsRealizados || []);
    bipsExtras = dados.bipsExtras || [];

    document.getElementById('step-config').classList.add('hidden');
    document.getElementById('step-audit').classList.remove('hidden');
    document.getElementById('header-menu').classList.remove('hidden');

    atualizarTelaStatus('default');
    renderizarListaCompleta();
    atualizarResumo();
    manterFoco();
}

document.addEventListener('DOMContentLoaded', recuperarSessao);

/* ============================================
   FLUXO PRINCIPAL
   ============================================ */

function iniciarAuditoria() {
    const rawText = document.getElementById('base-ids').value;
    const idsExtraidos = rawText.match(/4\d{10}/g);

    if (!idsExtraidos) return alert("Erro: Nenhum ID válido encontrado.");

    basePrevista = [...new Set(idsExtraidos)];
    basePrevistaSet = new Set(basePrevista);
    bipsRealizados = new Set();
    bipsExtras = [];

    document.getElementById('step-config').classList.add('hidden');
    document.getElementById('step-audit').classList.remove('hidden');
    document.getElementById('header-menu').classList.remove('hidden');

    atualizarTelaStatus('default');
    renderizarListaCompleta();
    atualizarResumo();
    manterFoco();
    salvarSessao();
}

function manterFoco() {
    const input = document.getElementById('scanInput');
    const drawer = document.getElementById('drawer');
    if (!input) return;

    input.focus();

    input.onblur = () => {
        const modalExport = document.getElementById('modal-export');
        const modalAberto = modalExport && !modalExport.classList.contains('hidden');
        if (drawer && !drawer.classList.contains('open') && !modalAberto) {
            setTimeout(() => input.focus(), 10);
        }
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            if (input.value.trim()) adicionarBip(input.value.trim());
            input.value = '';
        }
    };
}

function toggleMenu(event) {
    event.stopPropagation();
    const dd = document.getElementById('dropdown');
    if (dd) dd.classList.toggle('show');
}

window.onclick = (e) => {
    if (!e.target.matches('.dots-btn')) {
        const dd = document.getElementById('dropdown');
        if (dd) dd.classList.remove('show');
    }
};

function voltarParaConfig() {
    limparSessao();
    location.reload();
}

/* ============================================
   EXPORTAÇÃO CSV
   ============================================ */

function exportarCSV() {
    let csv = "ID;Status\n";

    bipsExtras.forEach(e => { csv += `${e.id};${e.tipo}\n`; });

    bipsRealizados.forEach(id => {
        if (basePrevistaSet.has(id)) csv += `${id};Correto\n`;
    });

    basePrevista.forEach(id => {
        if (!bipsRealizados.has(id)) csv += `${id};Pendente\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}