/**
 * Formats an order ID to be clean and professional for the user interface.
 * - UUID-based temporary IDs (e.g. temp-862974ea-...) become "ORD-862974EA"
 * - Midtrans temporary IDs (e.g. temp-midtrans-1718974591) become "ORD-MT-974591"
 * - Numeric IDs (e.g. 68) get a '#' prefix (e.g. "#68")
 * - Already formatted IDs (e.g. starting with ORD- or #) are returned as is.
 * 
 * @param {string|number} id The order ID to format
 * @returns {string} The formatted display order ID
 */
export const formatDisplayOrderId = (id) => {
  if (!id) return "";
  const idStr = String(id);
  
  if (idStr.startsWith('temp-')) {
    const clean = idStr.replace('temp-', '');
    if (clean.startsWith('midtrans-')) {
      const ts = clean.replace('midtrans-', '');
      return `ORD-MT-${ts.slice(-6)}`;
    }
    const parts = clean.split('-');
    return `ORD-${parts[0].toUpperCase()}`;
  }
  
  if (idStr.startsWith('ORD-') || idStr.startsWith('#')) {
    return idStr;
  }
  
  return `#${idStr}`;
};
