from flask import Flask, request, jsonify
import spacy
import pdfminer.high_level
import docx2txt
import requests
import os
import re
import json
from flask_cors import CORS
import ollama
from dotenv import load_dotenv
import logging
from werkzeug.utils import secure_filename
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
from bs4 import BeautifulSoup

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Maximum file size (5MB)
MAX_CONTENT_LENGTH = 5 * 1024 * 1024
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'docx'}

nlp = spacy.load("en_core_web_sm")

# Define tech skills (case-insensitive match)
TECH_SKILLS = {
    skill.lower() for skill in [
        "Python", "Java", "JavaScript", "React", "Node.js", "MongoDB", "SQL", "AWS",
        "Docker", "Kubernetes", "Machine Learning", "Deep Learning", "NLP",
        "TensorFlow", "PyTorch", "Flask", "Django", "Golang", "Data Science",
        "Hadoop", "Spark", "Tableau", "Power BI"
    ]
}

# RapidAPI settings
API_KEY = "c7c9b7c14emsh640c8f57e77084fp1e56e3jsn1ca5f259a7cf"  # Original working key
API_URL = "https://jsearch.p.rapidapi.com/search"
HEADERS = {"X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": "jsearch.p.rapidapi.com"}

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
jwt = JWTManager(app)

# In-memory user storage (replace with database in production)
users = {}

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text(file_path):
    """Extract text from PDF or DOCX files."""
    try:
        if file_path.endswith(".pdf"):
            return pdfminer.high_level.extract_text(file_path)
        elif file_path.endswith(".docx"):
            return docx2txt.process(file_path)
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        raise
    return None

def extract_skills_experience(text):
    """Extract skills and experience from text."""
    try:
        doc = nlp(text)
        found_skills = {token.text.lower() for token in doc if token.pos_ in ["NOUN", "PROPN"]}
        matched_skills = sorted(found_skills.intersection(TECH_SKILLS))
        experience = re.findall(r"(\d{1,2}\s*\+?\s*years?)", text)
        logger.info(f"Extracted skills: {matched_skills}")
        logger.info(f"Extracted experience: {experience}")
        return {"skills": matched_skills, "experience": experience}
    except Exception as e:
        logger.error(f"Error extracting skills and experience: {e}")
        raise

def get_suitable_job(skills):
    """Use Ollama Mistral to determine a suitable job based on extracted skills."""
    if not skills:
        logger.warning("No skills provided for job recommendation")
        return None
    
    skills_str = ", ".join(skills)
    prompt = f"Based on the given technical skills ({skills}), provide only the most suitable job title without any explanation."
    logger.info(f"Generating job recommendation for skills: {skills_str}")

    try:
        response = ollama.chat(model="mistral", messages=[{"role": "user", "content": prompt}])
        job_title = response["message"]["content"]
        logger.info(f"Recommended job title: {job_title}")
        return job_title.strip()
    except Exception as e:
        logger.error(f"Error querying Ollama: {e}")
        return None

def fetch_suitable_job(search_params):
    try:
        jobs = []
        
        # 1. Fetch from RapidAPI jsearch
        print(f"Fetching jobs from RapidAPI with params: {search_params}")
        response = requests.get(
            API_URL,
            headers=HEADERS,
            params=search_params
        )
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data:
                for job in data["data"]:
                    jobs.append({
                        "title": job.get("job_title", ""),
                        "company": job.get("employer_name", ""),
                        "location": job.get("job_city", "") + ", " + job.get("job_state", ""),
                        "apply_link": job.get("job_apply_link", ""),
                        "job_id": job.get("job_id", ""),
                        "source": "RapidAPI"
                    })
        
        # 2. Fetch from LinkedIn
        print(f"Fetching jobs from LinkedIn with params: {search_params}")
        linkedin_response = requests.get(
            "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search",
            params=search_params,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        )
        
        if linkedin_response.status_code == 200:
            soup = BeautifulSoup(linkedin_response.text, "html.parser")
            for job in soup.find_all("div", class_="base-card"):
                try:
                    title = job.find("h3", class_="base-search-card__title").text.strip()
                    company = job.find("h4", class_="base-search-card__subtitle").text.strip()
                    location = job.find("span", class_="job-search-card__location").text.strip()
                    apply_link = job.find("a", class_="base-card__full-link")["href"]
                    job_id = apply_link.split("?")[0].split("/")[-1]
                    
                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": location,
                        "apply_link": apply_link,
                        "job_id": job_id,
                        "source": "LinkedIn"
                    })
                except Exception as e:
                    print(f"Error parsing LinkedIn job: {str(e)}")
                    continue
        
        # 3. Fetch from Indeed (using RapidAPI)
        print(f"Fetching jobs from Indeed with params: {search_params}")
        indeed_response = requests.get(
            "https://indeed12.p.rapidapi.com/jobs/search",
            headers={
                "X-RapidAPI-Key": API_KEY,
                "X-RapidAPI-Host": "indeed12.p.rapidapi.com"
            },
            params={
                "query": search_params["query"],
                "location": search_params.get("location", ""),
                "limit": "10"
            }
        )
        
        if indeed_response.status_code == 200:
            indeed_data = indeed_response.json()
            for job in indeed_data.get("jobs", []):
                jobs.append({
                    "title": job.get("title", ""),
                    "company": job.get("company", ""),
                    "location": job.get("location", ""),
                    "apply_link": job.get("link", ""),
                    "job_id": job.get("id", ""),
                    "source": "Indeed"
                })

        print(f"Successfully fetched {len(jobs)} jobs from all sources")
        return jobs

    except Exception as e:
        print(f"Error in fetch_suitable_job: {str(e)}")
        return []

@app.route("/upload", methods=["POST"])
@jwt_required()
def upload_resume():
    """Handle resume upload and fetch job recommendations based on a single best-fit job."""
    try:
        logger.info("Received upload request")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request content type: {request.content_type}")
        logger.info(f"Request files: {request.files}")
        logger.info(f"Request form: {request.form}")
        logger.info(f"Request headers: {dict(request.headers)}")
        
        if "resume" not in request.files:
            logger.error("No file uploaded")
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["resume"]
        if file.filename == "":
            logger.error("No selected file")
            return jsonify({"error": "No selected file"}), 400

        # Check file extension
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        logger.info(f"File extension: {file_extension}")
        if file_extension not in ALLOWED_EXTENSIONS:
            logger.error(f"Unsupported file format: {file.filename}")
            return jsonify({"error": "Unsupported file format. Only PDF and DOCX are allowed."}), 400

        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        logger.info(f"File size: {file_size} bytes")
        if file_size > MAX_CONTENT_LENGTH:
            logger.error(f"File too large: {file_size} bytes")
            return jsonify({"error": "File size must be less than 5MB"}), 400

        # Secure the filename
        filename = secure_filename(file.filename)
        logger.info(f"Processing file: {filename}")
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, filename)
        
        # Save the file
        file.save(file_path)
        logger.info(f"File saved to: {file_path}")

        try:
            text = extract_text(file_path)
            if not text:
                logger.error("Could not extract text from file")
                return jsonify({"error": "Could not extract text from the file. Please ensure the file is not corrupted."}), 400

            logger.info(f"Successfully extracted text from file, length: {len(text)}")
            extracted_data = extract_skills_experience(text)

            if not extracted_data["skills"]:
                logger.warning("No skills found in the resume")
                return jsonify({"error": "No relevant skills found in your resume. Please ensure your resume contains technical skills."}), 400

            # Get the first skill as the job role
            job_role = extracted_data["skills"][0] if extracted_data["skills"] else "Software Engineer"
            city = request.form.get("city", "").strip()
            country = request.form.get("country", "").strip()

            # Prepare search parameters
            search_params = {
                "query": job_role,
                "num_pages": 1
            }

            if city and city != "Remote":
                search_params["location"] = city
            elif country and country != "Remote":
                search_params["location"] = country

            jobs = fetch_suitable_job(search_params)
            logger.info(f"Found {len(jobs)} matching jobs")

            return jsonify({
                "resume_data": extracted_data,
                "jobs": jobs
            })
        finally:
            # Clean up the uploaded file
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info("Cleaned up uploaded file")

    except Exception as e:
        logger.error(f"Error processing upload: {e}")
        return jsonify({"error": "An unexpected error occurred while processing your resume. Please try again."}), 500

@app.route("/job/<job_id>", methods=["GET"])
@jwt_required()
def get_job_details(job_id):
    """Get detailed information about a specific job."""
    try:
        # Clean the job ID if it has base64 padding
        if job_id.endswith("=="):
            cleaned_job_id = job_id[:-2]
        else:
            cleaned_job_id = job_id

        job_links = []
        job_details = {}

        # Get job details from RapidAPI
        url = "https://jsearch.p.rapidapi.com/job-details"
        querystring = {"job_id": cleaned_job_id}
        headers = {
            "X-RapidAPI-Key": API_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }
        
        response = requests.get(url, headers=headers, params=querystring)
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data and len(data["data"]) > 0:
                job_details = data["data"][0]
                if job_details.get("job_apply_link"):
                    job_links.append({
                        "source": "RapidAPI",
                        "url": job_details.get("job_apply_link")
                    })
        
        # Try LinkedIn
        linkedin_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{cleaned_job_id}"
        linkedin_response = requests.get(
            linkedin_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        )
        
        if linkedin_response.status_code == 200:
            soup = BeautifulSoup(linkedin_response.text, "html.parser")
            
            # Extract description
            desc_elem = soup.find("div", class_="show-more-less-html__markup")
            if desc_elem:
                job_details["job_description"] = desc_elem.text.strip()
            
            # Extract skills
            skills_elem = soup.find("div", class_="job-details-jobs-unified-top-card__job-insight")
            if skills_elem:
                job_details["job_required_skills"] = skills_elem.text.strip()
            
            # Extract salary
            salary_elem = soup.find("div", class_="job-details-jobs-unified-top-card__job-insight--highlight")
            if salary_elem:
                job_details["job_salary"] = salary_elem.text.strip()
            
            # Extract apply URL
            apply_elem = soup.find("a", class_="apply-button")
            if apply_elem and apply_elem.get("href"):
                job_links.append({
                    "source": "LinkedIn",
                    "url": apply_elem.get("href")
                })
        
        # Try Indeed
        indeed_url = "https://indeed12.p.rapidapi.com/jobs/detail"
        indeed_response = requests.get(
            indeed_url,
            headers={
                "X-RapidAPI-Key": API_KEY,
                "X-RapidAPI-Host": "indeed12.p.rapidapi.com"
            },
            params={"job_id": cleaned_job_id}
        )
        
        if indeed_response.status_code == 200:
            indeed_data = indeed_response.json()
            if not job_details.get("job_description"):
                job_details["job_description"] = indeed_data.get("description", "")
            if not job_details.get("job_required_skills"):
                job_details["job_required_skills"] = indeed_data.get("skills", "")
            if not job_details.get("job_salary"):
                job_details["job_salary"] = indeed_data.get("salary", "")
            
            if indeed_data.get("link"):
                job_links.append({
                    "source": "Indeed",
                    "url": indeed_data.get("link")
                })

        # Add job links to the response
        job_details["job_links"] = job_links
        
        return jsonify({
            "data": [job_details]
        })

    except Exception as e:
        print(f"Error fetching job details: {str(e)}")
        return jsonify({"error": "Failed to fetch job details"}), 500

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    email = data['email']
    password = data['password']
    name = data['name']
    
    if email in users:
        return jsonify({'error': 'Email already registered'}), 400
    
    # Hash the password
    hashed_password = generate_password_hash(password)
    
    # Store user data
    users[email] = {
        'name': name,
        'password': hashed_password
    }
    
    # Create access token
    access_token = create_access_token(identity=email)
    
    return jsonify({
        'token': access_token,
        'user': {
            'email': email,
            'name': name
        }
    }), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    email = data['email']
    password = data['password']
    
    if email not in users:
        return jsonify({'error': 'User not found'}), 404
    
    user = users[email]
    
    if not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid password'}), 401
    
    # Create access token
    access_token = create_access_token(identity=email)
    
    return jsonify({
        'token': access_token,
        'user': {
            'email': email,
            'name': user['name']
        }
    }), 200

@app.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'email': current_user_email,
        'name': user['name']
    }), 200

@app.route("/search-jobs", methods=["POST"])
@jwt_required()
def search_jobs():
    """Search jobs based on role, city, and country without requiring a resume."""
    try:
        data = request.get_json()
        role = data.get("role")
        city = data.get("city")
        country = data.get("country")

        if not role:
            return jsonify({"error": "Please provide a job role"}), 400

        # Use the role directly for job search
        search_params = {
            "query": role,
            "num_pages": 1
        }

        if city and city != "Remote":
            search_params["location"] = city
        elif country and country != "Remote":
            search_params["location"] = country

        print(f"Searching jobs with params: {search_params}")
        jobs = fetch_suitable_job(search_params)
        print(f"Found {len(jobs)} jobs")

        return jsonify({"jobs": jobs})

    except Exception as e:
        print(f"Error in search_jobs: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    """Handle chat messages using Ollama Mistral."""
    try:
        data = request.get_json()
        message = data.get("message")
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
            
        # Use Ollama Mistral to generate a response
        response = ollama.chat(
            model="mistral",
            messages=[{"role": "user", "content": message}]
        )
        
        return jsonify({
            "response": response["message"]["content"]
        })
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": "Failed to process chat message"}), 500

if __name__ == "__main__":
    app.run(debug=True)