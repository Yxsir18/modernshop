import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Shield, AlertCircle, Users, Gavel } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-display font-extrabold shadow-lg shadow-gray-900/20 mb-6">
            M
          </div>
          <h1 className="font-display font-extrabold text-4xl text-gray-900 tracking-tight mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-600 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-8 sm:p-12 shadow-xl shadow-gray-200/50 space-y-8">
          
          {/* Introduction */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">1. Introduction</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Welcome to ModernShop. By accessing or using our services, you agree to be bound by these Terms of Service. 
              Please read them carefully before using our platform.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">2. Acceptance of Terms</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              By creating an account or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service 
              and our Privacy Policy. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          {/* User Accounts */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">3. User Accounts</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>• You must be at least 18 years old to create an account</p>
              <p>• You are responsible for maintaining the confidentiality of your account credentials</p>
              <p>• You agree to provide accurate and complete information during registration</p>
              <p>• You must notify us immediately of any unauthorized use of your account</p>
              <p>• We reserve the right to terminate accounts that violate these terms</p>
            </div>
          </section>

          {/* Products and Services */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">4. Products and Services</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>• All product descriptions and images are for illustrative purposes</p>
              <p>• We reserve the right to modify product prices and availability without notice</p>
              <p>• Colors may vary slightly due to monitor settings</p>
              <p>• We strive for accuracy but cannot guarantee that all information is error-free</p>
            </div>
          </section>

          {/* Orders and Payments */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">5. Orders and Payments</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>• All prices are displayed in the applicable currency</p>
              <p>• Payment must be received before order processing</p>
              <p>• We reserve the right to cancel orders due to stock unavailability</p>
              <p>• Refunds are processed according to our refund policy</p>
              <p>• You agree to provide valid payment information</p>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">6. Prohibited Activities</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>• Using the platform for any illegal purpose</p>
              <p>• Attempting to gain unauthorized access to our systems</p>
              <p>• Interfering with other users' use of the service</p>
              <p>• Submitting false or misleading information</p>
              <p>• Reverse engineering our software or systems</p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">7. Intellectual Property</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              All content on ModernShop, including but not limited to text, graphics, logos, images, and software, is the property of ModernShop 
              and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">8. Limitation of Liability</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              ModernShop shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. 
              Our total liability shall not exceed the amount you paid for the specific service or product.
            </p>
          </section>

          {/* Termination */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">9. Termination</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our sole discretion. 
              Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">10. Changes to Terms</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              We may update these Terms of Service from time to time. Continued use of the service after any changes constitutes acceptance of the new terms. 
              We will notify users of significant changes via email or through the platform.
            </p>
          </section>

          {/* Contact Information */}
          <section className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">11. Contact Us</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Email: support@modernshop.com<br />
              Address: ModernShop Headquarters, 123 Commerce Street, Business District
            </p>
          </section>

        </div>

        {/* Back to Register */}
        <div className="text-center mt-8">
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition-colors"
          >
            Back to Registration <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
