import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
    Tooltip,
    Divider,
    Chip,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    AppBar,
    Toolbar,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon as ListItemIconMui,
    FormControl,
    InputLabel,
    Select,
    useTheme,
    useMediaQuery
} from "@mui/material";
import {
    UploadFile as UploadFileIcon,
    Search as SearchIcon,
    Work as WorkIcon,
    LocationOn as LocationOnIcon,
    Info as InfoIcon,
    Chat as ChatIcon,
    Send as SendIcon,
    Close as CloseIcon,
    Menu as MenuIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    ArrowBack as ArrowBackIcon,
    Link as LinkIcon,
    OpenInNew as OpenInNewIcon
} from "@mui/icons-material";
import "./assets/home.css";

const JOB_ROLES = [
    "Software Engineer",
    "Data Scientist",
    "Product Manager",
    "UI/UX Designer",
    "DevOps Engineer",
    "Full Stack Developer",
    "Machine Learning Engineer",
    "Business Analyst",
    "Project Manager",
    "System Administrator"
];

const CITIES = [
    "New York",
    "San Francisco",
    "Seattle",
    "Boston",
    "Austin",
    "Chicago",
    "Los Angeles",
    "Denver",
    "Atlanta",
    "Remote"
];

const COUNTRIES = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Australia",
    "India",
    "Singapore",
    "Japan",
    "Remote"
];

const Home = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [error, setError] = useState("");
    const [role, setRole] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [extractedSkills, setExtractedSkills] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobDetails, setJobDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [userName, setUserName] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData?.name) setUserName(userData.name);
    }, []);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
            if (fileExtension !== 'pdf' && fileExtension !== 'docx') {
                setError("Please upload a PDF or DOCX file");
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("File size must be less than 5MB");
                return;
            }
            setFile(selectedFile);
            setError("");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError("Please log in to upload your resume");
            return;
        }

        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("resume", file);
        formData.append("role", role);
        formData.append("city", city);
        formData.append("country", country);

        try {
            const response = await fetch("http://127.0.0.1:5000/upload", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setJobs(data.jobs || []);
                setExtractedSkills(data.resume_data?.skills || []);
            } else {
                setError(data.error || "Failed to process your resume");
            }
        } catch (error) {
            setError("Failed to connect to the server");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchJobs = async () => {
        if (!role) {
            setError("Please select a job role");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError("Please log in to search jobs");
            return;
        }

        setSearchLoading(true);
        setError("");

        try {
            const response = await fetch("http://127.0.0.1:5000/search-jobs", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role, city, country })
            });

            const data = await response.json();

            if (response.ok) {
                setJobs(data.jobs || []);
            } else {
                setError(data.error || "Failed to search jobs");
            }
        } catch (error) {
            setError("Failed to connect to the server");
        } finally {
            setSearchLoading(false);
        }
    };

    const handleJobDetails = async (jobId, applyLink) => {
        setDetailsLoading(true);
        setSelectedJob(jobId);
        try {
            const response = await fetch(`http://127.0.0.1:5000/job/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                if (data.data && data.data.length > 0) {
                    data.data[0].apply_url = applyLink;
                }
                setJobDetails(data);
            } else {
                setError(data.error || "Failed to fetch job details");
            }
        } catch (error) {
            setError("Failed to connect to the server");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const userMessage = newMessage.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setNewMessage("");
        setChatLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:5000/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();
            if (response.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else {
                setError(data.error || "Failed to get response from chatbot");
            }
        } catch (error) {
            setError("Failed to connect to the chatbot");
        } finally {
            setChatLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        setFile(null);
        setJobs([]);
        setError("");
        setRole("");
        setCity("");
        setCountry("");
        setExtractedSkills([]);
        setSelectedJob(null);
        setJobDetails(null);
        setMessages([]);
        setNewMessage("");
        navigate('/', { replace: true });
    };

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const drawer = (
        <Box>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Job Recommendations
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => navigate('/home')}>
                        <ListItemIconMui>
                            <WorkIcon />
                        </ListItemIconMui>
                        <ListItemText primary="Find Jobs" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => setChatOpen(true)}>
                        <ListItemIconMui>
                            <ChatIcon />
                        </ListItemIconMui>
                        <ListItemText primary="AI Assistant" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIconMui>
                            <LogoutIcon />
                        </ListItemIconMui>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="fixed" sx={{ 
                zIndex: theme.zIndex.drawer + 1,
                bgcolor: 'white',
                color: 'primary.main',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                        <Typography variant="h5" noWrap component="div" sx={{ 
                            flexGrow: 1,
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            CareerConnect
                        </Typography>
                    </Box>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2, ml: 'auto' }}>
                        <Tooltip title="Chat with AI Assistant">
                            <IconButton 
                                color="primary" 
                                onClick={() => setChatOpen(true)}
                                sx={{ 
                                    '&:hover': {
                                        bgcolor: 'primary.light',
                                        transform: 'scale(1.1)',
                                        transition: 'transform 0.2s'
                                    }
                                }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Tooltip>
                        <IconButton 
                            onClick={handleMenu} 
                            color="primary"
                            sx={{ 
                                '&:hover': {
                                    transform: 'scale(1.1)',
                                    transition: 'transform 0.2s'
                                }
                            }}
                        >
                            <Avatar sx={{ 
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark'
                                }
                            }}>
                                {userName ? userName[0].toUpperCase() : <PersonIcon />}
                            </Avatar>
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            PaperProps={{
                                sx: {
                                    mt: 1.5,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                }
                            }}
                        >
                            <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" color="primary" />
                                </ListItemIcon>
                                <ListItemText primary="Logout" />
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                variant={isMobile ? "temporary" : "permanent"}
                open={isMobile ? mobileOpen : true}
                onClose={() => setMobileOpen(false)}
                sx={{
                    width: 240,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 240,
                        boxSizing: 'border-box',
                    },
                }}
            >
                {drawer}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - 240px)` },
                    mt: '64px',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
                    minHeight: 'calc(100vh - 64px)'
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper elevation={3} sx={{ 
                                p: 4, 
                                borderRadius: 3,
                                background: 'white',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                '&:hover': {
                                    boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                                    transition: 'box-shadow 0.3s ease-in-out'
                                }
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="h4" component="h1" gutterBottom sx={{ 
                                            fontWeight: 'bold',
                                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            textAlign: 'center'
                                        }}>
                                            Find Your Dream Job
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary" paragraph sx={{ 
                                            textAlign: 'center',
                                            maxWidth: '600px'
                                        }}>
                                            Upload your resume and let CareerConnect help you find the perfect job match.
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <input
                                            type="file"
                                            accept=".pdf,.docx"
                                            onChange={handleFileChange}
                                            style={{ display: "none" }}
                                            id="resume-upload"
                                        />
                                        <label htmlFor="resume-upload">
                                            <Button
                                                component="span"
                                                variant="outlined"
                                                startIcon={<UploadFileIcon />}
                                                sx={{
                                                    border: "2px dashed",
                                                    borderColor: "primary.main",
                                                    color: "primary.main",
                                                    py: 2,
                                                    px: 4,
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        borderColor: "primary.dark",
                                                        bgcolor: "primary.light",
                                                        color: "primary.dark",
                                                        transform: 'scale(1.02)',
                                                        transition: 'transform 0.2s'
                                                    }
                                                }}
                                            >
                                                {file ? file.name : "Upload Resume (Optional)"}
                                            </Button>
                                        </label>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth>
                                                <InputLabel>Role</InputLabel>
                                                <Select
                                                    value={role}
                                                    label="Role"
                                                    onChange={(e) => setRole(e.target.value)}
                                                    startAdornment={<WorkIcon sx={{ mr: 1, color: "primary.main" }} />}
                                                    sx={{
                                                        '& .MuiSelect-select': {
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        },
                                                        '&:hover': {
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: 'primary.main'
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {JOB_ROLES.map((role) => (
                                                        <MenuItem key={role} value={role}>
                                                            {role}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth>
                                                <InputLabel>City</InputLabel>
                                                <Select
                                                    value={city}
                                                    label="City"
                                                    onChange={(e) => setCity(e.target.value)}
                                                    startAdornment={<LocationOnIcon sx={{ mr: 1, color: "primary.main" }} />}
                                                    sx={{
                                                        '& .MuiSelect-select': {
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        },
                                                        '&:hover': {
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: 'primary.main'
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {CITIES.map((city) => (
                                                        <MenuItem key={city} value={city}>
                                                            {city}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth>
                                                <InputLabel>Country</InputLabel>
                                                <Select
                                                    value={country}
                                                    label="Country"
                                                    onChange={(e) => setCountry(e.target.value)}
                                                    sx={{
                                                        '& .MuiSelect-select': {
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        },
                                                        '&:hover': {
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: 'primary.main'
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {COUNTRIES.map((country) => (
                                                        <MenuItem key={country} value={country}>
                                                            {country}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleUpload}
                                            disabled={loading || !file}
                                            startIcon={loading ? <CircularProgress size={20} /> : <UploadFileIcon />}
                                            sx={{ 
                                                px: 4,
                                                py: 1.5,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 'bold',
                                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                                                    transform: 'scale(1.02)',
                                                    transition: 'transform 0.2s'
                                                }
                                            }}
                                        >
                                            Upload & Find Jobs
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={handleSearchJobs}
                                            disabled={!role || searchLoading}
                                            startIcon={searchLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                                            sx={{ 
                                                px: 4,
                                                py: 1.5,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 'bold',
                                                borderColor: 'primary.main',
                                                color: 'primary.main',
                                                '&:hover': {
                                                    borderColor: 'primary.dark',
                                                    bgcolor: 'primary.light',
                                                    color: 'primary.dark',
                                                    transform: 'scale(1.02)',
                                                    transition: 'transform 0.2s'
                                                }
                                            }}
                                        >
                                            Search Jobs
                                        </Button>
                                    </Box>

                                    {error && (
                                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                                            {error}
                                        </Alert>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>

                        {extractedSkills.length > 0 && (
                            <Grid item xs={12}>
                                <Paper elevation={2} sx={{ 
                                    p: 3, 
                                    borderRadius: 3,
                                    background: 'white',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                }}>
                                    <Typography variant="h6" gutterBottom sx={{ 
                                        color: 'primary.main',
                                        fontWeight: 'bold'
                                    }}>
                                        Skills Found in Your Resume
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {extractedSkills.map((skill, index) => (
                                            <Chip
                                                key={index}
                                                label={skill}
                                                color="primary"
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        bgcolor: 'primary.light',
                                                        transform: 'scale(1.05)',
                                                        transition: 'transform 0.2s'
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Paper>
                            </Grid>
                        )}

                        {jobs.length > 0 && (
                            <Grid item xs={12}>
                                <Typography variant="h5" gutterBottom sx={{ 
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    mb: 3
                                }}>
                                    Matching Jobs
                                </Typography>
                                <Grid container spacing={3}>
                                    {jobs.map((job) => (
                                        <Grid item xs={12} key={job.job_id}>
                                            <Card sx={{ 
                                                borderRadius: 3,
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                                transition: 'all 0.3s ease-in-out',
                                                '&:hover': {
                                                    boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                                                    transform: 'translateY(-4px)'
                                                }
                                            }}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box>
                                                            <Typography variant="h6" gutterBottom sx={{ 
                                                                color: 'primary.main',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                {job.title}
                                                            </Typography>
                                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                                                {job.company}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {job.location}
                                                            </Typography>
                                                        </Box>
                                                        <Chip 
                                                            label={job.type || "Full-time"} 
                                                            color="primary" 
                                                            variant="outlined"
                                                            sx={{ 
                                                                borderRadius: 2,
                                                                '&:hover': {
                                                                    bgcolor: 'primary.light'
                                                                }
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant="body2" color="text.secondary" sx={{ 
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {job.description}
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                                    <Button
                                                        variant="outlined"
                                                        color="primary"
                                                        onClick={() => handleJobDetails(job.job_id, job.apply_link)}
                                                        disabled={detailsLoading && selectedJob === job.job_id}
                                                        startIcon={<InfoIcon />}
                                                        sx={{
                                                            borderRadius: 2,
                                                            '&:hover': {
                                                                bgcolor: 'primary.light',
                                                                transform: 'scale(1.05)',
                                                                transition: 'transform 0.2s'
                                                            }
                                                        }}
                                                    >
                                                        {detailsLoading && selectedJob === job.job_id ? (
                                                            <CircularProgress size={20} />
                                                        ) : (
                                                            "Get Details"
                                                        )}
                                                    </Button>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>
                        )}
                    </Grid>
                </Container>
            </Box>

            <Dialog
                open={Boolean(jobDetails)}
                onClose={() => setJobDetails(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: 6,
                    }
                }}
            >
                <DialogTitle sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Job Details
                    </Typography>
                    <IconButton 
                        onClick={() => setJobDetails(null)}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {jobDetails?.data?.[0] && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box sx={{ 
                                p: 2, 
                                bgcolor: 'grey.50', 
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'grey.200'
                            }}>
                                <Typography variant="h6" gutterBottom sx={{ 
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <InfoIcon />
                                    Description
                                </Typography>
                                <Typography variant="body1" paragraph sx={{ 
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.6,
                                    color: 'text.primary'
                                }}>
                                    {jobDetails.data[0].job_description || jobDetails.data[0].description || "No description available"}
                                </Typography>
                            </Box>

                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center',
                                mt: 2
                            }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={() => {
                                        const applyUrl = jobDetails.data[0].apply_url;
                                        if (applyUrl) {
                                            window.open(applyUrl, '_blank');
                                        } else {
                                            setError("No application URL available for this job");
                                        }
                                    }}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    Apply Now
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">AI Career Assistant</Typography>
                        <IconButton onClick={() => setChatOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ height: '400px', overflowY: 'auto', mb: 2 }}>
                        {messages.map((message, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                                    mb: 2
                                }}
                            >
                                <Box
                                    sx={{
                                        maxWidth: '80%',
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                                        color: message.role === 'user' ? 'white' : 'text.primary'
                                    }}
                                >
                                    <Typography variant="body1">
                                        {message.content}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                        {chatLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'grey.100'
                                    }}
                                >
                                    <CircularProgress size={20} />
                                </Box>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || chatLoading}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Home;