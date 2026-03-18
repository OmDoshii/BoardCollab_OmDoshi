/**
 * Simple OT / conflict resolution for canvas elements.
 *
 * Strategy: Last-write-wins per element ID + timestamp comparison.
 * If two users edit the same element simultaneously, the one with
 * the newer timestamp wins. New elements are always merged in.
 */

/**
 * Merge an incoming operation into the current elements array.
 * @param {Array}  elements   - current canvas elements
 * @param {Object} operation  - { type, element } where type = 'add'|'update'|'delete'
 * @returns {Array} updated elements
 */
function applyOperation(elements, operation) {
  const { type, element } = operation;

  if (type === 'add') {
    // Avoid duplicate if already added (network retry)
    const exists = elements.find(e => e.id === element.id);
    if (exists) return elements;
    return [...elements, element];
  }

  if (type === 'update') {
    return elements.map(e => {
      if (e.id !== element.id) return e;
      // Last-write-wins: keep whichever has newer timestamp
      if (e.timestamp && element.timestamp && e.timestamp > element.timestamp) return e;
      return { ...e, ...element };
    });
  }

  if (type === 'delete') {
    return elements.filter(e => e.id !== element.id);
  }

  if (type === 'clear') {
    return [];
  }

  return elements;
}

/**
 * Transform two concurrent operations so they can both be applied.
 * For our use-case (independent strokes), most ops are independent —
 * only same-element updates need resolution.
 */
function transform(opA, opB) {
  // If both are adding/modifying different elements, no conflict
  if (opA.element?.id !== opB.element?.id) return opA;

  // Same element conflict → keep newer timestamp
  if (opA.type === 'update' && opB.type === 'update') {
    const tsA = opA.element.timestamp || 0;
    const tsB = opB.element.timestamp || 0;
    return tsA >= tsB ? opA : opB;
  }

  // If one is delete, delete wins
  if (opB.type === 'delete') return opB;

  return opA;
}

module.exports = { applyOperation, transform };
