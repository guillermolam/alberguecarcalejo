import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Mock reviews data
const reviewsData = {
  reviews: [
    {
      id: "1",
      author_name: "Maria González",
      rating: 5,
      text: "Excelente albergue! La hospitalidad de los hospitaleros es excepcional. Las instalaciones están muy limpias y la ubicación es perfecta para descansar después de una larga etapa desde Mérida.",
      date: "2024-03-15",
      source: "Google",
      verified: true,
      helpful_count: 12
    },
    {
      id: "2", 
      author_name: "Jean-Pierre Martin",
      rating: 4,
      text: "Très bon accueil et infrastructure moderne. La cuisine est bien équipée et l'ambiance entre pèlerins est formidable. Petit-déjeuner correct.",
      date: "2024-03-12",
      source: "Booking.com",
      verified: true,
      helpful_count: 8
    },
    {
      id: "3",
      author_name: "Carlos Ruiz",
      rating: 5,
      text: "Un oasis en el camino. Después de caminar desde Mérida bajo el sol, encontrar este albergue fue una bendición. Duchas calientes, camas cómodas y un trato familiar excepcional.",
      date: "2024-03-10",
      source: "Google",
      verified: true,
      helpful_count: 15
    },
    {
      id: "4",
      author_name: "Anne Williams",
      rating: 4,
      text: "Clean facilities and friendly staff. The dormitories are well organized and quiet during rest hours. Great value for money at €15 per night.",
      date: "2024-03-08",
      source: "Google",
      verified: true,
      helpful_count: 7
    },
    {
      id: "5",
      author_name: "Luigi Rossi",
      rating: 5,
      text: "Ospitalità incredibile! I gestori sono molto attenti alle esigenze dei pellegrini. Cucina attrezzata e atmosfera accogliente. Consigliatissimo!",
      date: "2024-03-05",
      source: "Booking.com",
      verified: true,
      helpful_count: 11
    },
    {
      id: "6",
      author_name: "Ana Fernández",
      rating: 4,
      text: "Muy buena experiencia. Las instalaciones están bien mantenidas y el ambiente es muy acogedor. La lavadora funciona perfectamente y hay buen espacio para secar la ropa.",
      date: "2024-03-03",
      source: "Google",
      verified: false,
      helpful_count: 5
    }
  ],
  total_count: 47,
  average_rating: 4.6,
  source_breakdown: {
    "Google": 28,
    "Booking.com": 19
  }
};

// Reviews endpoint
app.get('/api/reviews/all', (req, res) => {
  console.log('📝 Reviews API called');
  res.json(reviewsData);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Gateway API server running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Gateway API server running on port ${PORT}`);
  console.log(`📍 Reviews endpoint: http://0.0.0.0:${PORT}/api/reviews/all`);
});