import FuelReceiptForm from './components/FuelReceiptForm';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] py-8 px-4">
      <header className="max-w-[780px] mx-auto mb-8 text-center">
        <h1 className="text-2xl font-bold text-[#1F2937]">
          Fuel Pump Receipt Generator
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Fill in the form and download a POS-sized thermal receipt PDF
        </p>
      </header>
      <FuelReceiptForm />
    </div>
  );
}
