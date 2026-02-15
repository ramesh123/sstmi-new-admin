document.addEventListener('DOMContentLoaded', function() {
    // Function to sanitize user input
    function sanitizeInput(input) {
        return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Configure AWS SDK
    AWS.config.region = 'us-east-1';
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:48fde939-9161-476d-90e9-cfbade339256'
    });
    AWS.config.update({ customUserAgent: null });

    // Initialize Stripe
    // const stripe = Stripe('pk_test_51QAG83KOttRlqJR208HY8edS7yQ9nxO1duPpd7c6wVLzSlgKA5Q5r09vioVV5K6QEC9cQlEMG5YnrQ1qmjGYCHUS00F0BMY6wB');
    const stripe = Stripe('pk_live_51QAG83KOttRlqJR2SEJv5rPa0V6yqXMv8j9SW3O4KGkYIeAiUxj79hZJvsBr3IKE7Zfo25OEgDLjaMkt6qILRPX400pyo8ImED');

    async function initializeAWS() {
        try {
            await AWS.config.credentials.getPromise();
            // console.log("Got credentials", AWS.config.credentials.identityId);
        } catch (err) {
            console.error("Error getting credentials", err);
            if (err.code === 'ResourceNotFoundException') {
                console.log("Identity not found, clearing local storage and retrying");
                localStorage.clear();
                // Implement logic to retry with a new identity
            }
        }
    }

    async function makeSignedRequest(endpoint, method, body) {
        await AWS.config.credentials.getPromise();
    
        const request = new AWS.HttpRequest(endpoint, AWS.config.region);
        request.method = method;
        request.headers['Content-Type'] = 'application/json';
        request.headers['Host'] = new URL(endpoint).host;
        request.headers['X-Amz-Date'] = new Date().toISOString();
    
        if (body) {
            request.body = JSON.stringify(body);
        }
    
        const signer = new AWS.Signers.V4(request, 'execute-api');
        signer.addAuthorization(AWS.config.credentials, new Date());
    
        const response = await fetch(request.endpoint.href, {
            method: request.method,
            headers: request.headers,
            body: request.body
        });
    
        // console.log('Response status:', response.status);
    
        if (!response.ok) {
            // Parse and throw error with detailed message from the response body
            const errorBody = await response.json();
            const errorMessage = errorBody.message || `${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }
    
        // Parse the response JSON once here
        const responseBody = await response.json();
    
        return responseBody;
    }
    

    function setupCheckoutButton(button) {
        if (button) {
            const buttonText = button.querySelector('.button-text');
            const buttonLoading = button.querySelector('.button-loading');
    
            async function createCheckoutSession(event) {
                // Prevent default form action if button is inside a form
                event.preventDefault();
    
                try {
                    const donationAmount = parseFloat(document.getElementById('donation-amount').value);
                    const donationEmail = document.getElementById('donation-email').value;
                    const donationPurpose = document.getElementById('donation-purpose').value;
    
                    if (isNaN(donationAmount) || donationAmount <= 0) {
                        throw new Error('Please enter donation amount in the textbox');
                    }
                    
                    if (!donationEmail || donationEmail.trim() === '') {
                        throw new Error('Please enter a valid email address in the textbox');
                    }

                    button.disabled = true;
                    buttonText.style.display = 'none';
                    buttonLoading.style.display = 'inline';
    
                    const endpoint = 'https://pxvvmjjvo9.execute-api.us-east-1.amazonaws.com/prod/create-checkout-session';
                    const body = {
                        cognitoIdentityId: AWS.config.credentials.identityId,
                        amount: donationAmount * 100, // Convert to cents
                        email: donationEmail,
                        purpose: donationPurpose || 'General Donation',
                    };
    
                    const responseData = await makeSignedRequest(endpoint, 'POST', body);
    
                    // Parse the sessionId from the API response
                    const sessionId = JSON.parse(responseData.body).sessionId;
    
                    if (!sessionId) {
                        throw new Error('No session ID returned from the API');
                    }
    
                    // Redirect to Stripe Checkout
                    const result = await stripe.redirectToCheckout({ sessionId });
    
                    if (result.error) {
                        throw new Error(`Stripe error: ${result.error.message}`);
                    }
                } catch (error) {
                    console.error('Error during checkout:', error);
                    alert(`Error: ${error.message}`);
                } finally {
                    button.disabled = false;
                    buttonText.style.display = 'inline';
                    buttonLoading.style.display = 'none';
                }
            }
    
            button.addEventListener('click', createCheckoutSession);
        }
    }
    
    
    function setupSubscribeForm() {
        const subscribeForm = document.getElementById('subscribe-form');
        const messageDiv = document.getElementById('message');
        const submitButton = document.querySelector('.app-submit-button');
    
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
    
            // Change button to loading state
            submitButton.textContent = "Processing...";
            submitButton.disabled = true;

            
    
            // Request reCAPTCHA token
            grecaptcha.execute('6Lfgd58qAAAAAPV03W3LgVMhxu57mDL006Jr3Jhs', {action: 'submit'}).then(async function(token) {
                // Sanitize input values
                // console.log("reCAPTCHA Token:", token);
                const name = sanitizeInput(document.getElementById('name').value);
                const email = sanitizeInput(document.getElementById('email').value);
                const unsubscribe = document.getElementById('unsubscribe').checked;
    
                try {
                    const endpoint = 'https://gv2houqzgk.execute-api.us-east-1.amazonaws.com/prod/subscribe';
                    
                    // Include the reCAPTCHA token in the request body
                    const body = { 
                        name, 
                        email, 
                        subscribe: !unsubscribe,
                        token: token  // Pass the reCAPTCHA token
                    };
                    // console.log("Request Body with Token:", body);
                    // Make the signed request and handle the parsed JSON response
                    const response = await makeSignedRequest(endpoint, 'POST', body);

                    // Display the user-friendly message returned by Lambda
                    messageDiv.textContent = response.message;
                    messageDiv.style.color = 'green';
                    submitButton.textContent = "Success!";
                } catch (error) {
                    console.error('Submission error:', error);
    
                // Display error message from `makeSignedRequest`
                messageDiv.textContent = (error.message || error) || 'An error occurred. Please try again later.';
                messageDiv.style.color = 'red';
                submitButton.textContent = "Failed";
            } finally {
                // Reset the button and form after a short delay
                setTimeout(() => {
                    submitButton.textContent = "Update Preferences";
                    submitButton.disabled = false;
                    subscribeForm.reset();
                }, 2000);
            }
        });
    });
}
    // Initialize
    initializeAWS().then(() => {
        setupCheckoutButton(document.getElementById('checkout-button-desktop'));
        setupCheckoutButton(document.getElementById('checkout-button-mobile'));
        setupSubscribeForm();
    });
});
