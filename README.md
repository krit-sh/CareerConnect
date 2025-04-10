# CareerConnect - AI-Powered Job Recommendation System

A modern web application that uses AI to analyze resumes and recommend suitable job opportunities.

## Features

- Resume upload and analysis
- AI-powered job recommendations
- Real-time job search
- Interactive chat interface
- Modern and responsive UI

## Tech Stack

### Frontend
- React.js
- Material-UI
- Vite
- React Router

### Backend
- Python
- Flask
- OpenAI API
- RapidAPI (JSearch)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- RapidAPI account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/careerconnect.git
cd careerconnect
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Fill in your API keys and configuration

### Running Locally

1. Start the backend server:
```bash
cd backend
flask run
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

## Environment Variables

### Backend (.env)
```
RAPIDAPI_KEY=your_rapidapi_key
OPENAI_API_KEY=your_openai_key
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=1
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for the AI capabilities
- RapidAPI for the job search API
- Material-UI for the UI components 