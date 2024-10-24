// Login form validation
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// For login validation
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        
        // Check if user exists in localStorage
        const storedUser = localStorage.getItem(email);
        
        if (storedUser) {
            const user = JSON.parse(storedUser);
            
            if (user.password === password) {
                errorMessage.style.display = "none";
                alert("Login successful!");
                window.location.href = "index.html"; // Redirect to the main page
            } else {
                errorMessage.textContent = "Incorrect password.";
                errorMessage.style.display = "block";
            }
        } else {
            errorMessage.textContent = "No account found with this email.";
            errorMessage.style.display = "block";
        }
    });
}

// For signup validation
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorMessage = document.getElementById('signup-error-message');
        
        // Validate email and password
        if (!validateEmail(email)) {
            errorMessage.textContent = "Please enter a valid email.";
            errorMessage.style.display = "block";
        } else if (password.length < 6) {
            errorMessage.textContent = "Password must be at least 6 characters.";
            errorMessage.style.display = "block";
        } else if (password !== confirmPassword) {
            errorMessage.textContent = "Passwords do not match.";
            errorMessage.style.display = "block";
        } else {
            errorMessage.style.display = "none";

            // Store user details in localStorage
            const user = {
                email: email,
                password: password
            };

            localStorage.setItem(email, JSON.stringify(user));

            alert("Signup successful! You can now log in.");
            window.location.href = "login.html"; // Redirect to the login page
        }
    });
}

// Function to validate email
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
}
