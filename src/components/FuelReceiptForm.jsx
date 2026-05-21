import { useRef, useState } from 'react';
import {
  Fuel,
  CreditCard,
  Receipt,
  User,
  Upload,
  Download,
} from 'lucide-react';
import FormSection from './FormSection';
import InputField from './InputField';
import SelectField from './SelectField';
import TextAreaField from './TextAreaField';
import LogoUploader from './LogoUploader';
import Toast from './Toast';
import useFormState from '../hooks/useFormState';
import { generatePDF } from '../utils/generatePDF';

const PAYMENT_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
];

const PRODUCT_OPTIONS = [
  { value: 'Petrol', label: 'Petrol' },
  { value: 'HiOctane', label: 'HiOctane' },
  { value: 'Diesel', label: 'Diesel' },
];

const FIELD_REFS = {
  fuelStationName: 'fuelStationName',
  fuelStationAddress: 'fuelStationAddress',
  fuelRate: 'fuelRate',
  volume: 'volume',
  vehicleNumber: 'vehicleNumber',
};

export default function FuelReceiptForm() {
  const {
    form,
    errors,
    totalAmount,
    updateField,
    setLogo,
    validate,
    firstErrorField,
  } = useFormState();

  const [toast, setToast] = useState(null);
  const fieldRefs = useRef({});

  const setRef = (name) => (el) => {
    if (el) fieldRefs.current[name] = el;
  };

  const handleGenerate = () => {
    const { valid, errors: validationErrors } = validate();
    if (!valid) {
      const first = firstErrorField(validationErrors);
      const el = fieldRefs.current[FIELD_REFS[first] || first];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    generatePDF(
      {
        ...form,
        fuelRate: String(form.fuelRate),
        volume: String(form.volume),
      },
      totalAmount
    );
    setToast({ message: 'Receipt downloaded successfully!', type: 'success' });
  };

  return (
    <>
      <form
        className="max-w-[780px] mx-auto flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate();
        }}
        noValidate
      >
        <FormSection
          icon={Fuel}
          title="Fuel Station Details"
          subtitle="Enter information about the fuel station"
        >
          <div ref={setRef('fuelStationName')}>
            <InputField
              label="Fuel Station Name"
              id="fuelStationName"
              value={form.fuelStationName}
              onChange={(e) => updateField('fuelStationName', e.target.value)}
              placeholder="Enter fuel station name"
              error={errors.fuelStationName}
              required
            />
          </div>
          <div className="mt-4" ref={setRef('fuelStationAddress')}>
            <TextAreaField
              label="Fuel Station Address"
              id="fuelStationAddress"
              value={form.fuelStationAddress}
              onChange={(e) =>
                updateField('fuelStationAddress', e.target.value)
              }
              placeholder="Enter fuel station address"
              error={errors.fuelStationAddress}
              required
            />
          </div>
        </FormSection>

        <FormSection
          icon={CreditCard}
          title="Payment Method"
          subtitle="Specify payment details and identifiers"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Payment Method"
              id="paymentMethod"
              value={form.paymentMethod}
              onChange={(e) => updateField('paymentMethod', e.target.value)}
              options={PAYMENT_OPTIONS}
            />
            <InputField
              label="Invoice Number"
              id="invoiceNumber"
              value={form.invoiceNumber}
              onChange={(e) => updateField('invoiceNumber', e.target.value)}
              placeholder="Enter invoice number"
            />
          </div>
        </FormSection>

        <FormSection
          icon={Receipt}
          title="Payment Details"
          subtitle="Enter fuel pricing and payment information"
        >
          <SelectField
            label="Product Type"
            id="productType"
            value={form.productType}
            onChange={(e) => updateField('productType', e.target.value)}
            options={PRODUCT_OPTIONS}
          />
          <div className="mt-4" ref={setRef('fuelRate')}>
            <InputField
              label="Fuel Rate"
              id="fuelRate"
              type="number"
              value={form.fuelRate}
              onChange={(e) => updateField('fuelRate', e.target.value)}
              placeholder="Rate per litre (Rs.)"
              error={errors.fuelRate}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <InputField
              label="Fuel Bill Date"
              id="fuelBillDate"
              type="date"
              value={form.fuelBillDate}
              onChange={(e) => updateField('fuelBillDate', e.target.value)}
            />
            <InputField
              label="Fuel Bill Time"
              id="fuelBillTime"
              type="time"
              value={form.fuelBillTime}
              onChange={(e) => updateField('fuelBillTime', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div ref={setRef('volume')}>
              <InputField
                label="Volume (LTR.)"
                id="volume"
                type="number"
                value={form.volume}
                onChange={(e) => updateField('volume', e.target.value)}
                placeholder="Enter litres"
                error={errors.volume}
                required
              />
            </div>
            <InputField
              label="Total Amount"
              id="totalAmount"
              type="number"
              value={totalAmount === 0 ? '0' : totalAmount.toFixed(2)}
              disabled
            />
          </div>
        </FormSection>

        <FormSection
          icon={User}
          title="Customer Details"
          subtitle="Enter information about the customer and vehicle"
        >
          <div ref={setRef('vehicleNumber')}>
            <InputField
              label="Vehicle Number"
              id="vehicleNumber"
              value={form.vehicleNumber}
              onChange={(e) => updateField('vehicleNumber', e.target.value)}
              placeholder="Enter vehicle registration number"
              error={errors.vehicleNumber}
              required
            />
          </div>
        </FormSection>

        <FormSection
          icon={Upload}
          title="Logo Details"
          subtitle="Add your fuel station logo"
        >
          <LogoUploader
            logoDataUrl={form.logoDataUrl}
            onLogoChange={setLogo}
          />
        </FormSection>

        <button
          type="submit"
          className="w-full h-12 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-base font-semibold rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Generate &amp; Download PDF
        </button>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
