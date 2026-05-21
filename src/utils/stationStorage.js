const STORAGE_KEY = 'fuelReceipt_station';

export function loadPersistedStation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      fuelStationName: data.fuelStationName ?? '',
      fuelStationAddress: data.fuelStationAddress ?? '',
      logoDataUrl: data.logoDataUrl ?? null,
      paymentMethod: data.paymentMethod ?? 'Cash',
    };
  } catch {
    return null;
  }
}

export function savePersistedStation({
  fuelStationName,
  fuelStationAddress,
  logoDataUrl,
  paymentMethod,
}) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        fuelStationName,
        fuelStationAddress,
        logoDataUrl,
        paymentMethod,
      })
    );
  } catch {
    // Ignore quota / private-mode errors
  }
}
