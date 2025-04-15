import { useState } from 'react';
import { 
    Box, 
    Button, 
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';

const JOB_ROLES = [
    "Software Engineer",
    "Data Scientist",
    "Product Manager",
    "UX Designer",
    "DevOps Engineer",
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Mobile Developer",
    "QA Engineer"
];

const CITIES = [
    "New York",
    "San Francisco",
    "Los Angeles",
    "Chicago",
    "Boston",
    "Seattle",
    "Austin",
    "Denver",
    "Atlanta",
    "Miami"
];

const COUNTRIES = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Australia",
    "Japan",
    "Singapore",
    "India",
    "Brazil"
];

const ResumeUpload = ({ onJobsFetched, onError, setLoading, loading }) => {
    const [file, setFile] = useState(null);
    const [role, setRole] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            onError('Please upload a PDF file');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            onError('Please select a resume file');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('role', role);
        formData.append('city', city);
        formData.append('country', country);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                onError('Please log in to upload your resume');
                return;
            }

            const response = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to upload resume');
            }

            const data = await response.json();
            onJobsFetched(data.jobs);
        } catch (error) {
            onError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                >
                    Upload Resume (PDF)
                    <input
                        type="file"
                        hidden
                        accept=".pdf"
                        onChange={handleFileChange}
                    />
                </Button>
                {file && (
                    <Typography variant="body2" color="text.secondary">
                        Selected file: {file.name}
                    </Typography>
                )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Job Role</InputLabel>
                    <Select
                        value={role}
                        label="Job Role"
                        onChange={(e) => setRole(e.target.value)}
                        startAdornment={<WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                        {JOB_ROLES.map((role) => (
                            <MenuItem key={role} value={role}>
                                {role}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>City</InputLabel>
                    <Select
                        value={city}
                        label="City"
                        onChange={(e) => setCity(e.target.value)}
                        startAdornment={<LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                        {CITIES.map((city) => (
                            <MenuItem key={city} value={city}>
                                {city}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Country</InputLabel>
                    <Select
                        value={country}
                        label="Country"
                        onChange={(e) => setCountry(e.target.value)}
                        startAdornment={<PublicIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                        {COUNTRIES.map((country) => (
                            <MenuItem key={country} value={country}>
                                {country}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Button
                type="submit"
                variant="contained"
                disabled={!file || loading}
                sx={{ mt: 2 }}
            >
                Find Jobs
            </Button>
        </Box>
    );
};

export default ResumeUpload; 