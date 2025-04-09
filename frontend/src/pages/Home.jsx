import { useState } from 'react';
import { 
    Container, 
    Paper, 
    Typography, 
    Box,
    CircularProgress,
    Alert,
    Fade
} from '@mui/material';
import Navbar from '../components/Navbar';
import ResumeUpload from '../components/ResumeUpload';
import JobList from '../components/JobList';

const Home = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJobsFetched = (fetchedJobs) => {
        setJobs(fetchedJobs);
        setError('');
    };

    const handleError = (errorMessage) => {
        setError(errorMessage);
        setJobs([]);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Find Your Next Job
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" paragraph>
                        Upload your resume and we'll help you find the perfect job match.
                    </Typography>

                    {error && (
                        <Fade in={true}>
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        </Fade>
                    )}

                    <ResumeUpload 
                        onJobsFetched={handleJobsFetched}
                        onError={handleError}
                        setLoading={setLoading}
                        loading={loading}
                    />

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        jobs.length > 0 && <JobList jobs={jobs} />
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default Home; 