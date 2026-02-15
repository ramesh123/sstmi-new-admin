export default function TopInfo() {
  return (
    <header className="bg-headerBg text-white py-2 px-4">
      <div className="container mx-auto max-w-7xl flex justify-between items-center">
        {/* Left Column: Logo */}
        <div className="flex items-center space-x-2">
          <img
            src="https://sstmi-website.s3.us-east-1.amazonaws.com/assets/logo/logo-mobile.png"
            alt="Sri Subramanya Swamy Cultural Center Logo"
            className="w-8 h-auto sm:w-10 md:w-12"
          />
        </div>

        {/* Right Column */}
        <div className="text-right flex flex-col bg-gradient-to-r from-darkRed to-brightRed bg-clip-text text-transparent text-shadow-md leading-tight">
          <span className="text-sm font-bold sm:text-base md:text-lg lg:text-xl">Sri Subramanya Swamy Cultural Center</span>
          <span className="text-xs sm:text-sm md:text-base">501(C)(3) Non-profit Organization</span>
        </div>
      </div>
    </header>
  );
}
