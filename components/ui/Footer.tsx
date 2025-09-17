export default function Footer() {
  return (
        
      <footer id="contact" className=" bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-8 text-sm text-white/70">
          <div>
            <div className="text-white font-semibold">ZORY</div>
            <p className="mt-2 max-w-xs">Real Designer Bags, </p>
             <p className="mt-0 max-w-xs">Designed with artists across Europe.</p> 
          </div>
          {/* <div>
            <div className="text-white font-medium">Explore</div>
            <ul className="mt-2 space-y-1">
              <li><a href="#collection" className="hover:text-white">Collection</a></li>
              <li><a href="#designers" className="hover:text-white">Designers</a></li>
              <li><a href="#about" className="hover:text-white">About</a></li>
            </ul>
          </div> 
          {/* <div>
            <div className="text-white font-medium">Help</div>
            <ul className="mt-2 space-y-1">
              <li><a href="#" className="hover:text-white">Shipping</a></li>
              <li><a href="#" className="hover:text-white">Returns</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div> */}
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-white/50 flex items-center justify-between">
            <p>© {new Date().getFullYear()} Aira. All rights reserved.</p>
            <p>Made in monochrome.</p>
          </div>
        </div>
      </footer>
  );
}
