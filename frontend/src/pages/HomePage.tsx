import RegistrationForm from "../components/registration-form";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section with Sage Green Background */}
      <div style={{backgroundColor: 'hsl(var(--albergue-dark-green))'}} className="text-white py-12 px-8 rounded-lg mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Bienvenido Peregrino
          </h1>
          <p className="opacity-90 mb-6">
            Registro rápido y seguro para tu estancia en el Camino
          </p>
          
          {/* Stats Display */}
          <div className="flex justify-center items-center gap-8 text-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">24</div>
              <div className="text-sm opacity-80">Camas disponibles</div>
            </div>
            <div className="w-px h-12 opacity-60" style={{backgroundColor: 'hsl(var(--albergue-sage))'}}></div>
            <div className="text-center">
              <div className="text-2xl font-bold">15€</div>
              <div className="text-sm opacity-80">Por persona/noche</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Registration Form */}
      <RegistrationForm />
    </div>
  );
}