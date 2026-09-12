// regex
function extrairIDs(texto) {
    const matches = texto.match(/4\d{10}/g);
    if (!matches) return [];
    return [...new Set(matches)];
}

function concatenarIDs() {
    const rawText = document.getElementById('base-ids').value;
    const ids = extrairIDs(rawText);

    if (ids.length === 0) {
        mostrarToast('Nenhum ID válido encontrado.');
        return;
    }

    const allMatches = rawText.match(/4\d{10}/g) || [];
    const duplicatasRemovidas = allMatches.length - ids.length;

    const separador = document.getElementById('separador').value;
    const resultado = montarResultado(ids, separador);

    document.getElementById('stat-total').textContent = ids.length;

    const dupBadge = document.getElementById('stat-dup');
    if (duplicatasRemovidas > 0) {
        dupBadge.textContent = duplicatasRemovidas + ' removida' + (duplicatasRemovidas > 1 ? 's' : '');
        dupBadge.parentElement.classList.remove('hidden');
    } else {
        dupBadge.parentElement.classList.add('hidden');
    }

    const resultBox = document.getElementById('result-output');
    resultBox.innerHTML = formatarParaExibicao(ids, separador);
    resultBox.dataset.rawResult = resultado;
    resultBox.dataset.idCount = ids.length;

    document.getElementById('result-section').classList.remove('hidden');
    document.getElementById('result-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    mostrarToast(`${ids.length} IDs extraídos com sucesso!`);
}

function montarResultado(ids, separador) {
    if (separador === 'QUOTED_COMMA') {
        return ids.map(id => `'${id}'`).join(',');
    }
    return ids.join(separador);
}

function formatarParaExibicao(ids, separador) {
    if (separador === 'QUOTED_COMMA') {
        const idsFormatados = ids.map(id => `<span class="sql-id">'${id}'</span>`).join('<span class="sql-paren">,</span>');
        return idsFormatados;
    }
    if (separador === ',') {
        const idsFormatados = ids.map(id => `<span class="sql-id">${id}</span>`).join('<span class="sql-paren">, </span>');
        return `<span class="sql-keyword">IN</span> <span class="sql-paren">(</span>${idsFormatados}<span class="sql-paren">)</span>`;
    }
    return ids.map(id => `<span class="sql-id">${id}</span>`).join(`<span class="sql-paren">${separador}</span>`);
}

function copiarResultado() {
    const resultBox = document.getElementById('result-output');
    const raw = resultBox.dataset.rawResult;
    if (!raw) return;

    navigator.clipboard.writeText(raw).then(() => {
        const btn = document.getElementById('btn-copiar');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '✓ Copiado!';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = textoOriginal; btn.classList.remove('copied'); }, 2000);
        mostrarToast('Copiado para a área de transferência!');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = raw;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        mostrarToast('Copiado!');
    });
}

function baixarResultado() {
    const resultBox = document.getElementById('result-output');
    const raw = resultBox.dataset.rawResult;
    if (!raw) return;

    const blob = new Blob([raw], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ids_concatenados_${new Date().getTime()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function atualizarSeparador() {
    const resultBox = document.getElementById('result-output');
    const raw = resultBox.dataset.rawResult;
    if (!raw) return;

    const rawText = document.getElementById('base-ids').value;
    const ids = extrairIDs(rawText);
    const separador = document.getElementById('separador').value;

    resultBox.dataset.rawResult = montarResultado(ids, separador);
    resultBox.innerHTML = formatarParaExibicao(ids, separador);
}

function mostrarToast(mensagem) {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensagem;
    document.body.appendChild(toast);

    requestAnimationFrame(() => { toast.classList.add('show'); });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 2500);
}
