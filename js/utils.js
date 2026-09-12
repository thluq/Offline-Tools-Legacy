/* ============================================
   UTILS — OfflineTools MELI
   Funções compartilhadas entre ferramentas
   ============================================ */

/**
 * Lê arquivo importado e joga o conteúdo no textarea #base-ids.
 * Usado em: auditoria, concatenar.
 */
function lerArquivo(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('base-ids').value = e.target.result;
    };
    reader.readAsText(file);
}
