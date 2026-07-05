/**
 * Escapes HTML special characters to prevent XSS in email templates.
 * @param {string} str
 * @returns {string}
 */
function htmlEscape(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { htmlEscape };
