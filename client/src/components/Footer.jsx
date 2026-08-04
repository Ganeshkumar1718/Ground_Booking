import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, CalendarCheck, ShieldCheck, Zap, HeadphonesIcon, MapPin } from 'lucide-react';

export default function Footer() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) return null;

  return (
    <footer className="bg-[#0a0f16] border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 lg:gap-16">
        
        {/* Left Section: Map */}
        <div className="w-full md:w-1/4">
          <div className="w-full h-48 rounded-xl bg-[#111827] border border-white/10 relative overflow-hidden group">
            {/* Map Placeholder Image */}
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop" 
              alt="Map" 
              className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] to-transparent"></div>
            
            {/* Map Pins */}
            <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e]"></div>
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e] flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e]"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e]"></div>

            <div className="absolute bottom-3 left-3 flex items-center space-x-1 text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">
              <MapPin className="h-3 w-3 text-[#22c55e]" />
              <span>Chennai</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Features */}
        <div className="w-full md:w-2/4 grid grid-cols-2 md:grid-cols-4 gap-6 content-center">
           <div className="flex flex-col text-left">
              <CalendarCheck className="h-6 w-6 text-[#22c55e] mb-3" />
              <h4 className="text-white text-sm font-bold mb-1">Easy Booking</h4>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Book your ground in just a few clicks.</p>
           </div>
           <div className="flex flex-col text-left">
              <ShieldCheck className="h-6 w-6 text-[#22c55e] mb-3" />
              <h4 className="text-white text-sm font-bold mb-1">Secure Payment</h4>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">100% secure payments with multiple options.</p>
           </div>
           <div className="flex flex-col text-left">
              <Zap className="h-6 w-6 text-[#22c55e] mb-3" />
              <h4 className="text-white text-sm font-bold mb-1">Instant Confirmation</h4>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Get instant booking confirmation.</p>
           </div>
           <div className="flex flex-col text-left">
              <HeadphonesIcon className="h-6 w-6 text-[#22c55e] mb-3" />
              <h4 className="text-white text-sm font-bold mb-1">24/7 Support</h4>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">We're here to help you anytime.</p>
           </div>
        </div>

        {/* Right Section: Brand & Links */}
        <div className="w-full md:w-1/4 flex flex-col md:flex-row gap-8 justify-between">
          <div className="flex flex-col space-y-4 max-w-[150px]">
            <Link to="/" className="flex items-center space-x-2">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L2 30H9L16 16L23 30H30L16 2Z" fill="#22c55e"/>
                <path d="M16 16L9 30H16V16Z" fill="#16a34a"/>
              </svg>
              <span className="text-lg font-bold tracking-wide text-white">PlayArena</span>
            </Link>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
              Book the best sports grounds and play your best game.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#22c55e] hover:border-[#22c55e] text-gray-400 hover:text-black transition-all">
                <Facebook className="h-3 w-3" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#22c55e] hover:border-[#22c55e] text-gray-400 hover:text-black transition-all">
                <Instagram className="h-3 w-3" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#22c55e] hover:border-[#22c55e] text-gray-400 hover:text-black transition-all">
                <Twitter className="h-3 w-3" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#22c55e] hover:border-[#22c55e] text-gray-400 hover:text-black transition-all">
                <Youtube className="h-3 w-3" />
              </a>
            </div>
            <p className="text-[9px] text-gray-500 pt-2">© 2026 PlayArena. All rights reserved.</p>
          </div>

          <div className="flex gap-8">
            <div className="flex flex-col space-y-3">
              <h4 className="text-white text-xs font-bold mb-1">Quick Links</h4>
              <Link to="/" className="text-[11px] text-gray-400 hover:text-[#22c55e] transition-colors">Home</Link>
              <Link to="/explore" className="text-[11px] text-gray-400 hover:text-[#22c55e] transition-colors">Grounds</Link>
              <Link to="/user/bookings" className="text-[11px] text-gray-400 hover:text-[#22c55e] transition-colors">Bookings</Link>
              <Link to="/tournaments" className="text-[11px] text-gray-400 hover:text-[#22c55e] transition-colors">Tournaments</Link>
              <Link to="/contact" className="text-[11px] text-gray-400 hover:text-[#22c55e] transition-colors">Contact Us</Link>
            </div>
            
            <div className="flex flex-col space-y-3">
              <h4 className="text-white text-xs font-bold mb-1">Support</h4>
              <Link to="/help" className="text-[11px] text-gray-400 hover:text-[#22c55e] transition-colors">Help Center</Link>
              <Link to="/terms" className="text-[11px] text-gray-400 hover:text-[#22c55e] transition-colors">Terms & Conditions</Link>
              <Link to="/privacy" className="text-[11px] text-gray-400 hover:text-[#22c55e] transition-colors">Privacy Policy</Link>
              <Link to="/refund" className="text-[11px] text-gray-400 hover:text-[#22c55e] transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
