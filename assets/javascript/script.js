// Job data (could be fetched from an API)
const jobs = [
    { title: "Frontend Developer", type: "developer", description: "Work on UI components and client-side functionality." },
    { title: "Backend Developer", type: "developer", description: "Design APIs and databases for robust applications." },
    { title: "UI/UX Designer", type: "designer", description: "Design user-friendly interfaces with attention to detail." },
    { title: "Project Manager", type: "manager", description: "Manage project teams and timelines for success." },
    { title: "Graphic Designer", type: "designer", description: "Create visual designs and branding for businesses." }
];

// Function to display jobs
function displayJobs(filteredJobs) {
    const jobList = document.getElementById('job-list');
    jobList.innerHTML = '';

    filteredJobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.classList.add('job-card');
        
        jobCard.innerHTML = `
            <div class="job-title">${job.title}</div>
            <div class="job-type">${job.type}</div>
            <div class="job-description">${job.description}</div>
        `;
        
        jobList.appendChild(jobCard);
    });
}

// Initial display of all jobs
displayJobs(jobs);

// Filter jobs based on selected type
document.getElementById('job-type').addEventListener('change', function () {
    const selectedType = this.value;

    const filteredJobs = selectedType === 'all' 
        ? jobs 
        : jobs.filter(job => job.type === selectedType);

    displayJobs(filteredJobs);
});

// Search job titles
document.getElementById('search').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    
    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm)
    );
    
    displayJobs(filteredJobs);
});
