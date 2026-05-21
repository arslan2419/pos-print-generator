import { useCallback, useMemo, useState } from 'react';
import { loadPersistedStation, savePersistedStation } from '../utils/stationStorage';

const PERSISTED_FIELDS = new Set([
  'fuelStationName',
  'fuelStationAddress',
  'logoDataUrl',
  'paymentMethod',
]);

function randomInvoice() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function todayDate() {
  return new Date().toISOString().split('T')[0];
}

function currentTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function createInitialForm() {
  const persisted = loadPersistedStation();
  return {
    fuelStationName: persisted?.fuelStationName ?? '',
    fuelStationAddress: persisted?.fuelStationAddress ?? '',
    paymentMethod: persisted?.paymentMethod ?? 'Cash',
    invoiceNumber: randomInvoice(),
    fuelRate: '',
    fuelBillDate: todayDate(),
    fuelBillTime: currentTime(),
    productType: 'Petrol',
    volume: '',
    vehicleNumber: '',
    logoDataUrl: persisted?.logoDataUrl ?? null,
  };
}

function persistStationFields(form) {
  savePersistedStation({
    fuelStationName: form.fuelStationName,
    fuelStationAddress: form.fuelStationAddress,
    logoDataUrl: form.logoDataUrl,
    paymentMethod: form.paymentMethod,
  });
}

export default function useFormState() {
  const [form, setForm] = useState(createInitialForm);
  const [errors, setErrors] = useState({});

  const totalAmount = useMemo(() => {
    const rate = parseFloat(form.fuelRate) || 0;
    const vol = parseFloat(form.volume) || 0;
    return rate * vol;
  }, [form.fuelRate, form.volume]);

  const updateField = useCallback((field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (PERSISTED_FIELDS.has(field)) {
        persistStationFields(next);
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setLogo = useCallback((dataUrl) => {
    updateField('logoDataUrl', dataUrl);
  }, [updateField]);

  const validate = useCallback(() => {
    const next = {};

    if (!form.fuelStationName.trim()) {
      next.fuelStationName = 'This field is required';
    }
    if (!form.fuelStationAddress.trim()) {
      next.fuelStationAddress = 'This field is required';
    }
    const rate = parseFloat(form.fuelRate);
    if (!form.fuelRate || isNaN(rate) || rate <= 0) {
      next.fuelRate = 'Enter a fuel rate greater than 0';
    }
    const vol = parseFloat(form.volume);
    if (!form.volume || isNaN(vol) || vol <= 0) {
      next.volume = 'Enter volume greater than 0';
    }
    if (!form.vehicleNumber.trim()) {
      next.vehicleNumber = 'This field is required';
    }

    setErrors(next);
    return { valid: Object.keys(next).length === 0, errors: next };
  }, [form]);

  const firstErrorField = useCallback((errorMap) => {
    const order = [
      'fuelStationName',
      'fuelStationAddress',
      'fuelRate',
      'volume',
      'vehicleNumber',
    ];
    return order.find((key) => errorMap[key]);
  }, []);

  return {
    form,
    errors,
    totalAmount,
    updateField,
    setLogo,
    validate,
    firstErrorField,
  };
}
