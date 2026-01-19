import React from "react"

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-50 lg:hidden bg-gray-800 text-white p-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-200"
      aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
    >
      <div className="w-6 h-[18px] flex flex-col justify-between">
        <span
          className={`block h-0.5 w-full bg-white transition-all duration-300 ${
            isOpen ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-full bg-white transition-all duration-300 ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-full bg-white transition-all duration-300 ${
            isOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </div>
    </button>
  )
}

export default HamburgerButton
