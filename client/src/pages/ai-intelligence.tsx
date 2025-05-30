import CustomerIntelligencePanel from "@/components/customer-intelligence-panel";

export default function AIIntelligencePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            مرکز هوش مصنوعی Vertex AI
          </h1>
          <p className="text-gray-600">
            تحلیل پیشرفته رفتار مشتریان و پیش‌بینی ریسک ترک سرویس با قدرت هوش مصنوعی گوگل
          </p>
        </div>
        
        <CustomerIntelligencePanel />
      </div>
    </div>
  );
}