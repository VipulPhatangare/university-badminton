// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobileNav');
const closeNav = document.querySelector('.close-nav');
const registerBtn = document.querySelectorAll('.register-btn');
const loginBtn = document.querySelectorAll('.login-btn');
const registerModal = document.getElementById('registerModal');
const loginModal = document.getElementById('loginModal');
const successModal = document.getElementById('successModal');
const closeModal = document.querySelectorAll('.close-modal');
const nextToStep2 = document.getElementById('nextToStep2');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const sendOtp = document.getElementById('sendOtp');
const verifiedText = document.getElementById('verifiedText');
const registrationForm = document.getElementById('registrationForm');
const successOk = document.getElementById('successOk');
const playerLoginToggle = document.getElementById('playerLoginToggle');
const adminLoginToggle = document.getElementById('adminLoginToggle');
const loginForm = document.getElementById('loginForm');
const signUpBtn = document.getElementById('signUpBtn');

const stdData = {};

// Mobile Navigation
menuToggle.addEventListener('click', () => {
    mobileNav.classList.add('open');
});

closeNav.addEventListener('click', () => {
    mobileNav.classList.remove('open');
});

// Register Modal
registerBtn.forEach(btn => {
    btn.addEventListener('click', () => {
        registerModal.classList.add('active');
    });
});

// Login Modal
loginBtn.forEach(btn => {
    btn.addEventListener('click', () => {
        loginModal.classList.add('active');
    });
});

// Close Modals - Only with close button
closeModal.forEach(btn => {
    btn.addEventListener('click', () => {
        registerModal.classList.remove('active');
        loginModal.classList.remove('active');
        successModal.classList.remove('active');
    });
});

// Prevent closing modal when clicking outside
const modalOverlays = document.querySelectorAll('.modal-overlay');
modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            e.stopPropagation();
        }
    });
});

// Form Steps
nextToStep2.addEventListener('click', () => {
    // Simple validation for step 1
    const fullName = document.getElementById('fullName').value;
    const prn = document.getElementById('prn').value;
    const phone = document.getElementById('phone').value;
    const branch = document.getElementById('branch').value;
    const year = document.getElementById('year').value;
    
    if (fullName && prn && phone && branch && year ) {
        step1.classList.remove('active');
        step2.classList.add('active');
    } else {
        showNotification('Please fill all fields before proceeding.', 'error');
    }
});

// OTP Verification
sendOtp.addEventListener('click', async() => {
    const email = document.getElementById('email').value;
    // console.log(email);
    if (email && (email.endsWith('@pccoepune.org') || email.endsWith('@sbpatilmba.com'))) {
        
        try {
           
            const response = await fetch('/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email})
            });

            const data = await response.json();
            
            if(data.isOptsent){
                showNotification(data.message, 'success');
                stdData.verify = false;
                document.getElementById('otp').disabled = false;
                document.getElementById('sendOtp').style.display = 'none';
                document.getElementById('verifyOtp').style.display = 'block';
                document.getElementById('resendOtp').style.display = 'block';
            } else {
                showNotification(data.message, 'error');
            }
           
        } catch (error) {
            showNotification('Error sending OTP. Please try again.', 'error');
        }

    } else {
        showNotification('Please enter a valid PCCOE email address.', 'error');
    }
});

document.getElementById('resendOtp').addEventListener('click',async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    // console.log(email);
    if (email && (email.endsWith('@pccoepune.org') || email.endsWith('@sbpatilmba.com'))) {
        
        try {
           
            const response = await fetch('/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email})
            });

            const data = await response.json();
            
            if(data.isOptsent){
                showNotification(data.message, 'success');
            } else {
                showNotification(data.message, 'error');
            }
           
        } catch (error) {
            showNotification('Error sending OTP. Please try again.', 'error');
        }

    } else {
        showNotification('Please enter a valid PCCOE or SB PATIL email address.', 'error');
    }
});

document.getElementById('verifyOtp').addEventListener('click', async() => {
    
    const otp = document.getElementById('otp').value;
    const email = document.getElementById('email').value;
    
    try {
        if (otp) {
            if (otp.length == 6) {
                const res = await fetch("/auth/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({email, otp}),
                });
                
                const data = await res.json();
                
                if(!data.isVerify){
                    showNotification(data.message, 'error');
                } else {
                    showNotification(data.message, 'success');
                    stdData.verify = true;
                    verifiedText.style.display = 'block';
                    signUpBtn.disabled = false;
                    document.getElementById('verifyOtp').style.display = 'none';
                    document.getElementById('resendOtp').style.display = 'none';
                    document.getElementById('otp').disabled = true;
                }
            } else {
                showNotification('Please enter a valid 6-digit OTP.', 'error');
            }
        } else {
            showNotification('Please enter the OTP you received.', 'error');
        }
    } catch (error) {
        console.log(error);
        showNotification('Error verifying OTP. Please try again.', 'error');
    }
});

// Registration Form Submission - Prevent default and handle manually
registrationForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Always prevent default form submission
    // We'll handle submission manually in the signUpBtn click handler
});

successOk.addEventListener('click', () => {
    successModal.classList.remove('active');
});

// Login Toggle
playerLoginToggle.addEventListener('click', () => {
    playerLoginToggle.classList.add('active');
    adminLoginToggle.classList.remove('active');
});

adminLoginToggle.addEventListener('click', () => {
    adminLoginToggle.classList.add('active');
    playerLoginToggle.classList.remove('active');
});

// Login Form Submission
loginForm.addEventListener('submit', async (e) => {
    
    try {
        e.preventDefault();
        const loginEmail = document.getElementById('loginEmail').value;
        const loginPassword = document.getElementById('loginPassword').value;

        let admin = playerLoginToggle.classList.contains('active');
        admin = !admin;
        if(loginPassword == ''){
            showNotification('Enter password.', 'error');
            return;
        }

        
        if (loginEmail && (loginEmail.endsWith('@pccoepune.org') || loginEmail.endsWith('@sbpatilmba.com'))){
            const res = await fetch("/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        loginEmail: loginEmail,
                        loginPassword: loginPassword,
                        admin: admin
                    }),
                });
                
                const data = await res.json();
                if(data.isLogin){
                    showNotification(data.message, 'success');
                    loginModal.classList.remove('active');
                    if(admin){
                        document.location.href = '/refree';
                    }else{
                        document.location.href = '/player';
                    }
                    
                }else{
                    showNotification(data.message, 'error');
                }

            
        }else{
            showNotification('Please enter a valid PCCOE or SB PATIL email address.', 'error');
            return;
        }
        

    } catch (error) {
        console.log(error);
    }
});

// Countdown Timer (simulated)
function updateCountdown() {
    const days = document.getElementById('days');
    const hours = document.getElementById('hours');
    const minutes = document.getElementById('minutes');
    const seconds = document.getElementById('seconds');
    
    // Set the competition start date to September 27, 2025
    const competitionDate = new Date('September 27, 2025 00:00:00');
    const now = new Date();
    
    // Calculate the time difference
    const timeDifference = competitionDate - now;
    
    // If the competition has already started
    if (timeDifference <= 0) {
        days.textContent = '00';
        hours.textContent = '00';
        minutes.textContent = '00';
        seconds.textContent = '00';
        return;
    }
    
    // Calculate days, hours, minutes, seconds
    const daysRemaining = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const secondsRemaining = Math.floor((timeDifference % (1000 * 60)) / 1000);
    
    // Update the countdown display
    days.textContent = daysRemaining.toString().padStart(2, '0');
    hours.textContent = hoursRemaining.toString().padStart(2, '0');
    minutes.textContent = minutesRemaining.toString().padStart(2, '0');
    seconds.textContent = secondsRemaining.toString().padStart(2, '0');
}

function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    }, 5000);
    
    // Also allow manual dismissal by clicking
    notification.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
}

// Handle registration submission
signUpBtn.addEventListener('click', async() => {
    try {
        const name = document.getElementById('fullName').value;
        const prn = document.getElementById('prn').value;
        const phone = document.getElementById('phone').value;
        const branch = document.getElementById('branch').value;
        const year = document.getElementById('year').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const gender = document.getElementById('gender').value;

        // Validate all required fields
        if (!name || !prn || !phone || !branch || !year || !email || !password || !confirmPassword || !gender) {
            showNotification('Please fill all required fields.', 'error');
            return;
        }
        
        if(!stdData.verify){
            showNotification('Please verify your email first.', 'error');
            return;
        }
        
        if(password !== confirmPassword){
            showNotification('Passwords do not match.', 'error');
            return;
        }
        
        // Disable button during submission to prevent multiple clicks
        signUpBtn.disabled = true;
        signUpBtn.textContent = 'Processing...';
        
        stdData.password = password;
        stdData.name = name;
        stdData.phone = phone;
        stdData.branch = branch;
        stdData.prn = prn;
        stdData.year = year;
        stdData.email = email;
        stdData.gender = gender;
        stdData.singles = false;
        stdData.doubles = false;
        const response = await fetch("/signupData/storeData", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stdData),
        });
        
        const data = await response.json();
        
        if(data.success) {
            showNotification('Registration successful!', 'success');
            registerModal.classList.remove('active');
            successModal.classList.add('active');
            
            // Reset form
            registrationForm.reset();
            step2.classList.remove('active');
            step1.classList.add('active');
            verifiedText.style.display = 'none';
            document.getElementById('sendOtp').style.display = 'block';
            document.getElementById('verifyOtp').style.display = 'none';
            document.getElementById('resendOtp').style.display = 'none';
            document.getElementById('otp').disabled = true;

            document.location.href = '/player';

        } else {
            showNotification(data.message || 'Registration failed. Please try again.', 'error');
        }
        
    } catch (error) {
        console.log(error);
        showNotification('An error occurred during registration.', 'error');
    } finally {
        // Re-enable button regardless of outcome
        signUpBtn.disabled = false;
        signUpBtn.textContent = 'Sign Up';
    }
});

// DOM Elements for Forgot Password
const forgotPasswordLink = document.querySelector('.forgot-password-link');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const resetSuccess = document.getElementById('resetSuccess');
const goToLogin = document.getElementById('goToLogin');
const backToLogin = document.querySelector('.back-to-login');

// Open Forgot Password Modal
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('active');
    forgotPasswordModal.classList.add('active');
});

// Close Forgot Password Modal with close button
forgotPasswordModal.querySelector('.close-modal').addEventListener('click', () => {
    forgotPasswordModal.classList.remove('active');
    resetSuccess.style.display = 'none';
    forgotPasswordForm.style.display = 'block';
});

// Back to Login from Forgot Password
backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPasswordModal.classList.remove('active');
    loginModal.classList.add('active');
});

// Go to Login from Success Message
goToLogin.addEventListener('click', () => {
    forgotPasswordModal.classList.remove('active');
    loginModal.classList.add('active');
    resetSuccess.style.display = 'none';
    forgotPasswordForm.style.display = 'block';
});

// Handle Forgot Password Form Submission
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const resetEmail = document.getElementById('resetEmail').value;
    
    if (resetEmail && (resetEmail.endsWith('@pccoepune.org') || resetEmail.endsWith('@sbpatilmba.com'))) {
        const sendResetLink = document.getElementById('sendResetLink');
        sendResetLink.disabled = true;
        sendResetLink.textContent = 'Sending...';
        
        try {

            const response = await fetch("/auth/send-pass", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({resetEmail}),
            });

            const data = await response.json();
            if(data.isPassSend){
                // Show success message
                showNotification(data.message, 'success');
                forgotPasswordForm.style.display = 'none';
                resetSuccess.style.display = 'block';
            }else{
                showNotification(data.message, 'error');
            }
            
        } catch (error) {
            showNotification('Error sending reset link. Please try again.', 'error');
        } finally {
            sendResetLink.disabled = false;
            sendResetLink.textContent = 'Send Reset Link';
        }
    } else {
        showNotification('Please enter a valid PCCOE or SB PATIL email address.', 'error');
    }
});
// Password visibility toggles
const togglePassword = document.getElementById('togglePassword');
// const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');

// Toggle password visibility in signup form
togglePassword.addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle eye icon
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

// // Toggle confirm password visibility
// toggleConfirmPassword.addEventListener('click', function() {
//     const confirmInput = document.getElementById('confirmPassword');
//     const type = confirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
//     confirmInput.setAttribute('type', type);
    
//     // Toggle eye icon
//     this.querySelector('i').classList.toggle('fa-eye');
//     this.querySelector('i').classList.toggle('fa-eye-slash');
// });

// Toggle login password visibility
toggleLoginPassword.addEventListener('click', function() {
    const loginInput = document.getElementById('loginPassword');
    const type = loginInput.getAttribute('type') === 'password' ? 'text' : 'password';
    loginInput.setAttribute('type', type);
    
    // Toggle eye icon
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});



setInterval(updateCountdown, 1000);