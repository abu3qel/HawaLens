import React, { useState, useContext } from "react";
import { Menu, X, Search, ShoppingCart } from "lucide-react";
import { AuthContext } from "./AuthContext";
import AuthModal from "./AuthModal";
import logo from "../assets/logo.png";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { currentUser, logout } = useContext(AuthContext);

  return (
    <header className="bg-white shadow-md w-full border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left: Logo */}
          <div className="flex items-center">
            <img src={logo} alt="IQAir Logo" className="h-20" />
          </div>

          {/* Navigation Links */}
          {/* <nav className="hidden md:flex space-x-6">
            {["Air Quality", "Air Monitors"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-green-500 hover:text-green-700 transition duration-200 font-medium"
              >
                {item}
              </a>
            ))}
          </nav> */}

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            {/* <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search"
                className="border border-gray-300 rounded-md px-3 py-1.5 pl-8 focus:ring-2 focus:ring-blue-300 text-black"
              />
              <Search className="absolute left-2 top-2 h-5 w-5 text-gray-400" />
            </div> */}

            {/* Auth Section */}
            {currentUser ? (
            <div className="flex items-center space-x-2">
            <span className="text-gray-700">Welcome, {currentUser.username}</span> {/* Fixed: Using username property */}
            <button
              onClick={logout}
              className="text-white hover:text-blue-500 transition duration-200"
            >
              Logout
            </button>
          </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-white hover:text-blue-500 transition duration-200"
              >
                Sign in
              </button>
            )}

            {/* Shopping Cart (if needed) */}
            {/* <ShoppingCart className="h-6 w-6 text-gray-700" /> */}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col space-y-2">
              {["Air Quality", "Air Monitors"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-green-500 hover:text-green-700 transition duration-200 font-medium px-2 py-1"
                >
                  {item}
                </a>
              ))}
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Search"
                  className="border border-gray-300 rounded-md px-3 py-1.5 pl-8 w-full focus:ring-2 focus:ring-blue-300 text-black"
                />
                <Search className="absolute left-2 top-2 h-5 w-5 text-gray-400" />
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </header>
  );
};

export default Header;
