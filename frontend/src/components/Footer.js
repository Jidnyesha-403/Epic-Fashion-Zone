import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-indigo-950 text-stone-50 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_ethnic-treasures-12/artifacts/0qjx6l1g_Screenshot_20250308_115550_WhatsApp.jpg" 
              alt="Epic Fashion Zone Logo" 
              className="h-10 w-10 object-contain"
            />
            <div>
              <h3 className="font-playfair text-2xl font-bold">Epic Fashion Zone</h3>
            </div>
          </div>
          <p className="text-stone-300 text-sm leading-relaxed">
            Authentic handloom sarees and traditional handicrafts, crafted with love and heritage.
          </p>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-widest">Quick Links</h4>
            <div className="flex flex-col space-y-2">
              <Link to="/products" className="text-stone-300 hover:text-orange-400 transition-colors text-sm">Shop All</Link>
              <Link to="/products?category=Sarees" className="text-stone-300 hover:text-orange-400 transition-colors text-sm">Sarees</Link>
              <Link to="/products?category=Handicrafts" className="text-stone-300 hover:text-orange-400 transition-colors text-sm">Handicrafts</Link>
              <Link to="/wishlist" className="text-stone-300 hover:text-orange-400 transition-colors text-sm">Wishlist</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-widest">Contact</h4>
            <div className="flex flex-col space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-1 text-orange-400" />
                <p className="text-stone-300 text-sm">17, Dhandai Nagar, Gondur Road, Dhule, Maharashtra 424002</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-orange-400" />
                <p className="text-stone-300 text-sm">+91 94204 43520</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-orange-400" />
                <p className="text-stone-300 text-sm">shital77ahirrao@gmail.com</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-widest">Visit Our Store</h4>
            <div className="bg-stone-800 rounded-lg overflow-hidden mb-4 h-32">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3731.5!2d74.7772!3d20.9014!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdec5e3b4e8f7a1%3A0x1!2sDhule%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title="Store Location"
              ></iframe>
            </div>
            <a
              href="https://wa.me/919420443520"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              data-testid="whatsapp-button"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 text-center">
          <p className="text-stone-400 text-sm">
            © 2026 Epic Fashion Zone. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
