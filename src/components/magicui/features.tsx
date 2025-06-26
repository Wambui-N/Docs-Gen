import { Wand2, FileText, Download, Shield, Zap, Users } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Wand2 className="h-8 w-8 text-primary" />,
      title: "AI-Powered Generation",
      description: "Generate professional document sections with advanced AI that understands your company's tone and style.",
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Template Management",
      description: "Create reusable templates for proposals, contracts, reports, and more. Maintain consistency across all documents.",
    },
    {
      icon: <Download className="h-8 w-8 text-primary" />,
      title: "Multiple Export Formats",
      description: "Export your completed documents as PDF or DOCX files, ready for sharing with clients and stakeholders.",
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Secure & Private",
      description: "Your company data and documents are encrypted and secure. We never share your information with third parties.",
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Token-Based Billing",
      description: "Pay only for what you use with our transparent token system. No hidden fees or surprise charges.",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Company-Focused",
      description: "Built for businesses. Each company gets its own workspace with customized AI training based on your content.",
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to generate professional documents
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform helps companies create consistent, professional documents 
            while maintaining their unique voice and style.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="bg-white rounded-lg p-8 shadow-sm border hover:shadow-md transition-shadow">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}