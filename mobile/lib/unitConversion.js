export function isPackagedUnit(unitType) {
  return unitType === "CARTON";
}

// Convert a quantity entered in the product's natural unit (cartons, if
// packaged) into the base unit (pieces) the backend actually stores.
export function toBaseQuantity(displayQty, unitType, unitsPerPackage) {
  const n = Number(displayQty) || 0;
  if (isPackagedUnit(unitType) && Number(unitsPerPackage) > 0) {
    return n * Number(unitsPerPackage);
  }
  return n;
}

// Convert a stored base quantity (pieces) back into the product's natural
// unit, for pre-filling edit forms.
export function fromBaseQuantity(baseQty, unitType, unitsPerPackage) {
  const n = Number(baseQty) || 0;
  if (isPackagedUnit(unitType) && Number(unitsPerPackage) > 0) {
    return n / Number(unitsPerPackage);
  }
  return n;
}

// Friendly display string, e.g. "240 pcs (10 ctn)" for a packaged product,
// or "15 kg" for a plain one.
export function formatQuantity(baseQty, unitType, unitsPerPackage) {
  const n = Number(baseQty) || 0;
  if (isPackagedUnit(unitType) && Number(unitsPerPackage) > 0) {
    const cartons = n / Number(unitsPerPackage);
    const cartonLabel = Number.isInteger(cartons)
      ? cartons
      : cartons.toFixed(1);
    return `${n} pcs (${cartonLabel} ctn)`;
  }
  return `${n} ${unitType?.toLowerCase() ?? ""}`;
}
