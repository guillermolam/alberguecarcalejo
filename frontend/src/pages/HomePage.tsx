import RegistrationForm from "../components/registration-form";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section with Green Background */}
      <div className="bg-gradient-to-br from-green-700 to-green-800 text-white py-12 px-8 rounded-lg mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Bienvenido Peregrino
          </h1>
          <p className="text-green-100 mb-6">
            Registro rápido y seguro para tu estancia en el Camino
          </p>
          
          {/* Stats Display */}
          <div className="flex justify-center items-center gap-8 text-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">24</div>
              <div className="text-sm text-green-100">Camas disponibles</div>
            </div>
            <div className="w-px h-12 bg-green-600"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">15€</div>
              <div className="text-sm text-green-100">Por persona/noche</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Registration Form */}
      <RegistrationForm />
    </div>
  );
}