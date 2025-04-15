import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    Grid,
    Chip
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';

const JobList = ({ jobs }) => {
    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                Recommended Jobs
            </Typography>
            <Grid container spacing={3}>
                {jobs.map((job) => (
                    <Grid item xs={12} key={job.job_id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6" component="div">
                                        {job.title}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body1" color="text.secondary">
                                        {job.company}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {job.location}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    href={job.apply_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Apply Now
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default JobList; 