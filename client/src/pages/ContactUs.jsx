import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Your message has been sent successfully. We will get back to you soon!');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-4">Contact <span className="text-[#22c55e]">Us</span></h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Have a question about booking a ground, organizing a tournament, or partnering with PlayArena? 
          We'd love to hear from you. Reach out to us using the details below or fill out the contact form.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-start gap-4 hover:border-[#22c55e]/50 transition-colors">
            <div className="bg-[#22c55e]/10 p-3 rounded-xl text-[#22c55e]">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Our Location</h3>
              <p className="text-slate-400 text-sm">
                123 PlayArena Hub, Tech Park Road,<br />
                Taramani, Chennai - 600113,<br />
                Tamil Nadu, India.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-start gap-4 hover:border-[#22c55e]/50 transition-colors">
            <div className="bg-[#22c55e]/10 p-3 rounded-xl text-[#22c55e]">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Phone Number</h3>
              <p className="text-slate-400 text-sm">
                +91 98765 43210<br />
                +91 12345 67890
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-start gap-4 hover:border-[#22c55e]/50 transition-colors">
            <div className="bg-[#22c55e]/10 p-3 rounded-xl text-[#22c55e]">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Email Address</h3>
              <p className="text-slate-400 text-sm">
                support@playarena.com<br />
                partnerships@playarena.com
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#22c55e] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#22c55e] transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="How can we help?"
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#22c55e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                <textarea
                  required
                  rows="5"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us everything..."
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#22c55e] transition-colors resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#22c55e] hover:bg-[#1eb053] text-black font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send className="h-5 w-5" /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
