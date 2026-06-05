document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const alertBox = document.getElementById('auth-alert');
    const loadingOverlay = document.getElementById('page-loading');
    
    // Connects to your established Google Apps Script Web App
    const webAppUrl = "https://script.google.com/macros/s/AKfycbzQHcl3RHOXFLHPvco_CoN28quRFDxzK_LvxTjhbHq4szfdD50sg-ukODvANkIKIBzs/exec";

    loginForm.addEventListener('submit', (e) => {
        // Halt form execution immediately to preserve the JS background thread
        e.preventDefault();
        e.stopImmediatePropagation();
        
        const staffId = document.getElementById('operator-id').value.trim();
        const pinCode = document.getElementById('secret-pin').value.trim();

        // Clear previous alert state
        alertBox.style.display = 'none';
        alertBox.textContent = '';

        // Trigger Loading Screen overlay
        loadingOverlay.classList.add('active');

        // Form payload matching our established system action architecture
        const payload = {
            action: 'login',
            staffId: staffId,
            pin: pinCode
        };

        // Hardened Cross-Origin request configuration
        fetch(webAppUrl, {
            method: 'POST',
            mode: 'cors',            // Force explicit CORS mode checking
            redirect: 'follow',      // Crucial: Instructs browser to follow Google's internal 302 redirection loop
            headers: {
                'Content-Type': 'text/plain' // Plain text keeps Google from triggering a blocked OPTIONS pre-flight check
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) throw new Error('Server connection error.');
            return response.json();
        })
        .then(result => {
            loadingOverlay.classList.remove('active');

            if (result.status === 'authenticated') {
                // Store session parameters securely in client memory
                localStorage.setItem('session_staff_id', result.staffId);
                localStorage.setItem('session_staff_name', result.staffName);
                
                // Redirect user to your principal dashboard view
                window.location.href = 'index.html'; 
            } else {
                // Expose authentication denial reasons safely
                alertBox.textContent = result.message || 'Invalid Staff ID or Security PIN combination.';
                alertBox.style.display = 'block';
            }
        })
        .catch(error => {
            loadingOverlay.classList.remove('active');
            console.error('Auth Error:', error);
            alertBox.textContent = 'Network communication failure or invalid configuration. Please verify connectivity.';
            alertBox.style.display = 'block';
        });
    });
});