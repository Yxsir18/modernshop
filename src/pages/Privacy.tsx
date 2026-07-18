import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Shield, AlertCircle, Users, Eye, Lock, Database } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-display font-extrabold shadow-lg shadow-gray-900/20 mb-6">
            M
          </div>
          <h1 className="font-display font-extrabold text-4xl text-gray-900 tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-600 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-8 sm:p-12 shadow-xl shadow-gray-200/50 space-y-8">
          
          {/* Introduction */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">1. Introduction</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              ModernShop ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">2. Information We Collect</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p><strong>Personal Information:</strong> Name, email address, phone number, shipping address, billing information</p>
              <p><strong>Account Information:</strong> Username, password (encrypted), profile photo, referral code</p>
              <p><strong>Order Information:</strong> Purchase history, wishlist items, cart contents</p>
              <p><strong>Usage Data:</strong> Pages visited, time spent, click patterns, device information</p>
              <p><strong>Communication Data:</strong> Emails, chat messages, customer support interactions</p>
            </div>
          </section>

          {/* How We Collect Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">3. How We Collect Information</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>• When you create an account or register for our services</p>
              <p>• When you make a purchase or browse our catalog</p>
              <p>• When you communicate with customer support</p>
              <p>• Through cookies and similar tracking technologies</p>
              <p>• When you subscribe to our newsletter</p>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">4. How We Use Your Information</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>• To process and fulfill your orders</p>
              <p>• To provide customer support and respond to inquiries</p>
              <p>• To send you transactional emails and order updates</p>
              <p>• To personalize your shopping experience</p>
              <p>• To improve our products and services</p>
              <p>• To send marketing communications (with your consent)</p>
              <p>• To detect and prevent fraud or abuse</p>
              <p>• To comply with legal obligations</p>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">5. Information Sharing</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p><strong>Service Providers:</strong> We may share information with third parties who perform services on our behalf (payment processors, shipping carriers, etc.)</p>
              <p><strong>Business Transfers:</strong> Information may be transferred in connection with a merger, acquisition, or sale of assets</p>
              <p><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights</p>
              <p><strong>With Your Consent:</strong> We may share information with your explicit consent</p>
              <p className="font-semibold text-gray-900">We do not sell your personal information to third parties for marketing purposes.</p>
            </div>
          </section>

          {/* Data Security */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">6. Data Security</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. These include encryption, secure servers, and regular security audits. However, no method of 
              transmission over the internet is 100% secure.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">7. Cookies and Tracking</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>• We use cookies to enhance your browsing experience and analyze site traffic</p>
              <p>• Essential cookies are required for basic site functionality</p>
              <p>• Analytics cookies help us understand how you use our services</p>
              <p>• Marketing cookies (with your consent) enable personalized advertising</p>
              <p>• You can manage cookie preferences through your browser settings</p>
            </div>
          </section>

          {/* Your Rights */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">8. Your Rights</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>• <strong>Access:</strong> Request a copy of your personal data</p>
              <p>• <strong>Correction:</strong> Update inaccurate or incomplete information</p>
              <p>• <strong>Deletion:</strong> Request deletion of your personal data</p>
              <p>• <strong>Portability:</strong> Receive your data in a structured format</p>
              <p>• <strong>Objection:</strong> Object to processing of your data</p>
              <p>• <strong>Restriction:</strong> Limit how we process your data</p>
              <p>• <strong>Withdraw Consent:</strong> Revoke consent for marketing communications</p>
            </div>
          </section>

          {/* Data Retention */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">9. Data Retention</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. 
              Account data is retained until you request deletion. Order and transaction data may be retained for legal and accounting purposes.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">10. Children's Privacy</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. 
              If we become aware that we have collected such information, we will take steps to delete it.
            </p>
          </section>

          {/* International Data Transfers */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">11. International Data Transfers</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate 
              safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">12. Changes to This Policy</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our 
              website and sending you an email notification. Your continued use of our services after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-black" />
              <h2 className="font-display font-extrabold text-xl text-gray-900">13. Contact Us</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy or your personal data, please contact us at:
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Email: privacy@modernshop.com<br />
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
