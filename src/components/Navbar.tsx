'use client'; // This makes the component a client component
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className="hidden md:flex bg-darkGreen text-white p-4 justify-center"
        style={{ zIndex: 5000 }}
      >
        <ul className="flex space-x-6">
          <li>
            <button onClick={() => handleNavigation('/')} className="hover:text-brightRed">
              Home
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigation('/events/')} className="hover:text-brightRed">
              Events
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigation('/gallery/')} className="hover:text-brightRed">
              Gallery
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigation('/sevas/')} className="hover:text-brightRed">
              Daily Services
            </button>
          </li>
 
          <li>
            <button onClick={() => handleNavigation('/priests/')} className="hover:text-brightRed">
              Priest Services
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigation('/donate/')} className="hover:text-brightRed">
              Donations
            </button>
          </li>
          <li>
          <button onClick={() => window.location.href = '#Contact'} className="hover:text-brightRed">
          Contact
          </button>

          </li>
          <li>
            <button onClick={() => handleNavigation('/')} className="hover:text-brightRed">
              Login
            </button>
          </li>
        </ul>
      </nav>

            {/* Mobile Bottom Navbar */}
            <nav
        className="fixed bottom-0 left-0 right-0 bg-darkGreen text-white flex justify-around p-4 md:hidden"
        style={{ zIndex: 50 }}
      >
        <button
          onClick={() => handleNavigation('/')}
          className="flex flex-col items-center text-white hover:text-brightRed"
        >
          <i className="fas fa-home text-2xl"></i>
          <span className="text-sm">Home</span>
        </button>
        <button
          onClick={() => handleNavigation('/sevas/')}
          className="flex flex-col items-center text-white hover:text-brightRed"
        >
          <i className="fas fa-praying-hands text-2xl"></i>
          <span className="text-sm">Sevas</span>
        </button>
        <button
          onClick={() => handleNavigation('/events/')}
          className="flex flex-col items-center text-white hover:text-brightRed"
        >
          <i className="fas fa-calendar-alt text-2xl"></i>
          <span className="text-sm">Events</span>
        </button>
        <button
          onClick={() => handleNavigation('/priests/')}
          className="flex flex-col items-center text-white hover:text-brightRed"
        >
          <i className="fas fa-user text-2xl"></i>
          <span className="text-sm">Poojas</span>
        </button>
        <button
          onClick={() => handleNavigation('/gallery/')}
          className="flex flex-col items-center text-white hover:text-brightRed"
        >
          <i className="fas fa-images text-2xl"></i>
          <span className="text-sm">Gallery</span>
        </button>
        <a
          href="#Contact"
          className="flex flex-col items-center text-white hover:text-brightRed"
        >
          <i className="fas fa-envelope text-2xl"></i>
          <span className="text-sm">Contact</span>
        </a>
      </nav>

    </>
  );
}
