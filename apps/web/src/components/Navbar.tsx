import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // For client-side routing
import CreateCompanyForm from "./CreateCompanyForm";
import { LoginForm } from "./LoginForm";
import { Button } from "./ui/button"; // Shadcn Button component

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false); // For mobile menu toggle
  const [signUpModalOpen, setSignUpModalOpen] = useState(false); // For Sign Up modal
  const [loginModalOpen, setLoginModalOpen] = useState(false); // For Login modal
  const navigate = useNavigate(); // For programmatic navigation

  // Handle navigation and close mobile menu
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false); // Close mobile menu after navigation
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            {/* Logo */}
            <div>
              <Link
                to="/"
                className="flex items-center py-4 px-2"
                onClick={() => handleNavigation("/")}
              >
                <span className="font-semibold text-gray-500 text-lg">
                  WorkPulse
                </span>
              </Link>
            </div>
            {/* Primary Nav */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
                onClick={() => handleNavigation("/")}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
                onClick={() => handleNavigation("/about")}
              >
                About
              </Link>
              <Link
                to="/service"
                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
                onClick={() => handleNavigation("/service")}
              >
                Services
              </Link>
              <Link
                to="/contact"
                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
                onClick={() => handleNavigation("/contact")}
              >
                Contact
              </Link>
            </div>
          </div>
          {/* Secondary Nav */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Login Button */}
            <Button
              onClick={() => setLoginModalOpen(true)} // Open Login modal
              className="py-2 px-4 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-300"
            >
              Login
            </Button>
            {/* Sign Up Button */}
            <Button
              onClick={() => setSignUpModalOpen(true)} // Open Sign Up modal
              className="py-2 px-4 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition duration-300"
            >
              Sign Up
            </Button>
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              className="outline-none mobile-menu-button"
              onClick={() => setIsOpen(!isOpen)}
            >
              <svg
                className="w-6 h-6 text-gray-500 hover:text-green-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } md:hidden transition-all duration-300 ease-in-out`}
      >
        <Link
          to="/"
          className="block py-2 px-4 text-sm hover:bg-green-500 hover:text-white"
          onClick={() => handleNavigation("/")}
        >
          Home
        </Link>
        <Link
          to="/about"
          className="block py-2 px-4 text-sm hover:bg-green-500 hover:text-white"
          onClick={() => handleNavigation("/about")}
        >
          About
        </Link>
        <Link
          to="/service"
          className="block py-2 px-4 text-sm hover:bg-green-500 hover:text-white"
          onClick={() => handleNavigation("/service")}
        >
          Services
        </Link>
        <Link
          to="/contact"
          className="block py-2 px-4 text-sm hover:bg-green-500 hover:text-white"
          onClick={() => handleNavigation("/contact")}
        >
          Contact
        </Link>
        <Button
          variant="ghost"
          className="block w-full py-2 px-4 text-sm hover:bg-green-500 hover:text-white text-left"
          onClick={() => {
            setLoginModalOpen(true);
            setIsOpen(false); // Close mobile menu when opening modal
          }}
        >
          Log In
        </Button>
        <Button
          variant="ghost"
          className="block w-full py-2 px-4 text-sm hover:bg-green-500 hover:text-white text-left"
          onClick={() => {
            setSignUpModalOpen(true);
            setIsOpen(false); // Close mobile menu when opening modal
          }}
        >
          Sign Up
        </Button>
      </div>

      {/* Modal Forms */}
      <CreateCompanyForm
        isOpen={signUpModalOpen}
        onClose={() => setSignUpModalOpen(false)}
      />
      <LoginForm
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
