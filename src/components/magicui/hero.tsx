import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center space-y-6 py-24 px-4">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          The future of document generation is here.
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Generate professional proposals, contracts, and reports with AI assistance. 
          Maintain your company's unique tone and style across all documents.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignUpButton mode="modal">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Free Trial
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Sign In
            </Button>
          </SignInButton>
        </div>
      </div>
      
      <div className="mt-16 max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <span className="text-lg">Create document templates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <span className="text-lg">Generate sections with AI</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <span className="text-lg">Export as PDF or DOCX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}