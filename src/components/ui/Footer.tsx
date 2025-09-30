import React from 'react';
import { Heart, Twitter, Instagram, Mail, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/10 py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-liberation-gold-divine font-bold mb-4">BLKOUT Newsroom</h3>
            <p className="text-gray-400 text-sm">
              Community-curated news for Black queer liberation. Stories that matter, selected by us, for us.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://blkout.vercel.app" className="text-gray-400 hover:text-liberation-gold-divine transition-colors">
                  Main Platform
                </a>
              </li>
              <li>
                <a href="https://blkout.vercel.app/about" className="text-gray-400 hover:text-liberation-gold-divine transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="https://blkout.vercel.app/governance" className="text-gray-400 hover:text-liberation-gold-divine transition-colors">
                  Governance
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button className="text-gray-400 hover:text-liberation-gold-divine transition-colors">
                  Curation Guidelines
                </button>
              </li>
              <li>
                <button className="text-gray-400 hover:text-liberation-gold-divine transition-colors">
                  Submit a Story
                </button>
              </li>
              <li>
                <button className="text-gray-400 hover:text-liberation-gold-divine transition-colors">
                  Community Standards
                </button>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex gap-4 mb-4">
              <a href="#" className="text-gray-400 hover:text-liberation-gold-divine transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-liberation-gold-divine transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="mailto:newsroom@blkout.uk" className="text-gray-400 hover:text-liberation-gold-divine transition-colors" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="text-gray-400 text-sm">
              newsroom@blkout.uk
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm flex items-center gap-2">
            Made with <Heart className="h-4 w-4 text-liberation-resistance-red" fill="currentColor" /> by the BLKOUT Community
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-liberation-gold-divine transition-colors">Privacy</a>
            <a href="#" className="hover:text-liberation-gold-divine transition-colors">Terms</a>
            <a href="#" className="hover:text-liberation-gold-divine transition-colors">Accessibility</a>
          </div>
          <p className="text-gray-500 text-sm">
            © {currentYear} BLKOUT. Liberation through technology.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
