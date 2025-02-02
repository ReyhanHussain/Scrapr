let timerInterval;
const words = ['trash', 'bin', 'junk', 'dump', 'waste'];
let isBoldActive = false;
let isItalicActive = false;
let currentColor = 'black';
let isPasswordVisible = false;
let isPasswordEnabled = false;
let isDisplayOn = true;

// Variables to track the initial state
let initialTextContent = '';
let initialFileName = '';
let isLinkGenerated = false; // Track if a link has been generated

// Apply formatting globally to the entire text editor
function applyFormatting(format) {
    const editor = document.getElementById('textEditor');
    if (format === 'bold') {
        isBoldActive = !isBoldActive;
        editor.style.fontWeight = isBoldActive ? 'bold' : 'normal';
        document.getElementById('boldBtn').classList.toggle('active', isBoldActive);
    } else if (format === 'italic') {
        isItalicActive = !isItalicActive;
        editor.style.fontStyle = isItalicActive ? 'italic' : 'normal';
        document.getElementById('italicBtn').classList.toggle('active', isItalicActive);
    }
    // Update retro display based on bold and italic states
    let message = '';
    if (isBoldActive && isItalicActive) {
        message = 'Text formatting changed to bold and italic.';
    } else if (isBoldActive) {
        message = 'Text formatting changed to bold.';
    } else if (isItalicActive) {
        message = 'Text formatting changed to italic.';
    } else {
        message = 'Text formatting reset to normal.';
    }
    displayMessage(message);
}

// Change font based on dropdown selection
function changeFont() {
    const font = document.getElementById('fontSelect').value;
    const editor = document.getElementById('textEditor');
    editor.style.fontFamily = font;
    displayMessage(`Font changed to "${font}".`);
}

// Change font size based on dropdown selection
function changeFontSize() {
    const fontSize = document.getElementById('fontSizeSelect').value;
    const editor = document.getElementById('textEditor');
    editor.style.fontSize = fontSize;
    displayMessage(`Font size changed to "${fontSize}".`);
}

function applyColor(color) {
    const editor = document.getElementById('textEditor');
    editor.style.color = color;
    currentColor = color;
    displayMessage(`Text color changed to "${color}".`);
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('passwordInput');
    const toggleBtn = document.getElementById('togglePass');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        toggleBtn.textContent = 'Hide';
        toggleBtn.classList.add('active');
        isPasswordVisible = true;
        displayMessage('Password visibility toggled to visible.');
    } else {
        passInput.type = 'password';
        toggleBtn.textContent = 'Show';
        toggleBtn.classList.remove('active');
        isPasswordVisible = false;
        displayMessage('Password visibility toggled to hidden.');
    }
}

function togglePasswordSection() {
    const passwordSection = document.getElementById('passwordSection');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const accessIndicator = document.getElementById('accessIndicator');

    if (isPasswordEnabled) {
        passwordSection.classList.remove('visible');
        toggleBtn.textContent = 'Enable Password';
        toggleBtn.classList.remove('active');
        isPasswordEnabled = false;
        accessIndicator.textContent = 'Public';
        accessIndicator.className = 'indicator public-indicator';
        displayMessage('Password protection disabled. Link is now public.');
    } else {
        passwordSection.classList.add('visible');
        toggleBtn.textContent = 'Disable Password';
        toggleBtn.classList.add('active');
        isPasswordEnabled = true;
        accessIndicator.textContent = 'Private';
        accessIndicator.className = 'indicator private-indicator';
        displayMessage('Password protection enabled. Link is now private.');
    }
}

document.getElementById('fileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file) {
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
            displayMessage('Error: Invalid file type. Only JPEG, PNG, and PDF files are allowed.', true);
            this.value = '';
            return;
        }
        if (file.size > maxSize) {
            displayMessage('Error: File size exceeds 5MB limit.', true);
            this.value = '';
            return;
        }
        document.getElementById('fileName').textContent = file.name;
        displayMessage(`File "${file.name}" selected.`);
    } else {
        document.getElementById('fileName').textContent = 'No file chosen...';
    }

    checkForChanges();
});

async function generateLink() {
    const passwordInput = document.getElementById('passwordInput');
    const shareLink = document.getElementById('shareLink');
    const accessIndicator = document.getElementById('accessIndicator');

    // Check if password is enabled
    if (isPasswordEnabled) {
        const password = passwordInput.value.trim();
        if (!validatePassword(password)) {
            displayMessage("Error: Password must be at least 6 characters long.", true);
            return;
        }
    }

    // Generate a random link if no link exists
    let link = shareLink.textContent.trim();
    if (link === 'https://trashify.link/') {
        const randWord = words[Math.floor(Math.random() * words.length)];
        const randNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        link = `https://trashify.link/${randWord}${randNum}`;
        shareLink.textContent = link;
    }

    try {
        // Save password to localStorage (temporary solution)
        await savePasswordToLocalStorage(link, isPasswordEnabled ? passwordInput.value : null);

        // Save initial text/file data to localStorage
        const textContent = document.getElementById('textEditor').textContent.trim();
        const uploadedFile = document.getElementById('fileInput').files[0];
        let links = JSON.parse(localStorage.getItem('links')) || {};
        let linkData = {};

        if (textContent) {
            linkData.text = textContent;
        }
        if (uploadedFile) {
            const reader = new FileReader();
            reader.onload = function (event) {
                linkData.file = event.target.result;
                links[link] = linkData;
                localStorage.setItem('links', JSON.stringify(links));
                displayMessage(`Link updated successfully: ${link}`);
            };
            reader.readAsDataURL(uploadedFile);
        } else {
            links[link] = linkData;
            localStorage.setItem('links', JSON.stringify(links));
            displayMessage(`Link updated successfully: ${link}`);
        }

        isLinkGenerated = true; // Mark that a link has been generated
        initialTextContent = textContent;
        initialFileName = document.getElementById('fileName').textContent;

        // Hide the "Save Changes" button initially
        document.getElementById('saveChangesButton').style.display = 'none';

        // Show the link box
        document.getElementById('linkBox').style.display = 'block';
        startTimer();
    } catch (error) {
        console.error('Error saving password:', error);
        displayMessage('Error: Failed to save password. Please try again.', true);
    }
}

// Event listener for text editor changes
document.getElementById('textEditor').addEventListener('input', () => {
    checkForChanges();
});

// Function to check for changes
function checkForChanges() {
    if (!isLinkGenerated) return; // Do nothing if no link has been generated

    const currentTextContent = document.getElementById('textEditor').textContent.trim();
    const currentFileName = document.getElementById('fileName').textContent;

    // Check if there are any changes compared to the initial state
    if (currentTextContent !== initialTextContent || currentFileName !== initialFileName) {
        const saveButton = document.getElementById('saveChangesButton');
        saveButton.style.display = 'inline-block'; // Show the button
        saveButton.classList.add('save-changes-animation'); // Add animation
        setTimeout(() => saveButton.classList.remove('save-changes-animation'), 500); // Remove animation after 0.5s
    } else {
        document.getElementById('saveChangesButton').style.display = 'none'; // Hide the button
    }
}

// Save Changes Button Click Handler
document.getElementById('saveChangesButton').addEventListener('click', async () => {
    const textContent = document.getElementById('textEditor').textContent.trim();
    const uploadedFile = document.getElementById('fileInput').files[0];
    const shareLink = document.getElementById('shareLink').textContent.trim();

    try {
        // Retrieve existing data from localStorage
        let links = JSON.parse(localStorage.getItem('links')) || {};
        let linkData = links[shareLink] || {};

        // Replace old text with new text
        if (textContent) {
            linkData.text = textContent;
        } else {
            delete linkData.text; // Remove text if empty
        }

        // Replace old file with new file
        if (uploadedFile) {
            const reader = new FileReader();
            reader.onload = function (event) {
                linkData.file = event.target.result;
                saveLinkData(links, shareLink, linkData); // Save updated data
            };
            reader.readAsDataURL(uploadedFile);
        } else {
            delete linkData.file; // Remove file if no file is uploaded
            saveLinkData(links, shareLink, linkData); // Save updated data
        }

        displayMessage('Changes saved successfully!');
    } catch (error) {
        console.error('Error saving changes:', error);
        displayMessage('Error: Failed to save changes. Please try again.', true);
    }
});

// Helper function to save link data to localStorage
function saveLinkData(links, shareLink, linkData) {
    links[shareLink] = linkData;
    localStorage.setItem('links', JSON.stringify(links));

    // Update the initial state to reflect the saved changes
    initialTextContent = document.getElementById('textEditor').textContent.trim();
    initialFileName = document.getElementById('fileName').textContent;

    // Hide the "Save Changes" button after saving
    document.getElementById('saveChangesButton').style.display = 'none';
}

function validatePassword(password) {
    if (password.length < 6) {
        displayMessage("Error: Password must be at least 6 characters long.", true);
        return false;
    }
    return true;
}

function copyLink() {
    const shareLink = document.getElementById('shareLink').textContent;
    navigator.clipboard.writeText(shareLink).then(() => {
        displayMessage(`Link copied to clipboard: ${shareLink}`);
    }).catch(err => {
        console.error('Failed to copy link:', err);
        displayMessage('Error: Failed to copy link.', true);
    });
}

function deleteFile() {
    clearInterval(timerInterval);
    const passwordSection = document.getElementById('passwordSection');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('passwordInput');
    const accessIndicator = document.getElementById('accessIndicator');

    // Reset password section
    passwordSection.classList.remove('visible');
    togglePasswordBtn.disabled = false;
    passwordInput.disabled = false;
    passwordInput.value = '';
    isPasswordEnabled = false;
    togglePasswordBtn.textContent = 'Enable Password';
    togglePasswordBtn.classList.remove('active');

    // Reset public/private indicator
    accessIndicator.textContent = 'Public';
    accessIndicator.className = 'indicator public-indicator';

    // Hide the link box
    document.getElementById('linkBox').style.display = 'none';
    document.getElementById('shareLink').textContent = 'https://trashify.link/';
    document.getElementById('fileName').textContent = 'No file chosen...';
    document.getElementById('fileInput').value = '';
    document.getElementById('timer').textContent = '';

    // Clear saved data from localStorage
    const shareLink = document.getElementById('shareLink').textContent.trim();
    let links = JSON.parse(localStorage.getItem('links')) || {};
    delete links[shareLink];
    localStorage.setItem('links', JSON.stringify(links));

    // Reset link generation state
    isLinkGenerated = false;

    displayMessage('Link deleted. You can now create a new one.');
}

function startTimer() {
    clearInterval(timerInterval);
    let seconds = 7200; // 2 hours in seconds
    document.getElementById('timer').textContent = '';
    timerInterval = setInterval(() => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        document.getElementById('timer').textContent =
            `Expires in: ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        if (seconds-- <= 0) {
            clearInterval(timerInterval);
            deleteFile();
            displayMessage('Link expired and deleted.');
        }
    }, 1000);
}

// Temporary: Save password to localStorage (replace with Supabase later)
async function savePasswordToLocalStorage(url, password) {
    try {
        // Retrieve existing links from localStorage
        let links = JSON.parse(localStorage.getItem('links')) || {};

        // Update or add the link with its password
        links[url] = { ...links[url], password };

        // Save updated links back to localStorage
        localStorage.setItem('links', JSON.stringify(links));

        console.log(`Password for ${url} saved temporarily in localStorage.`);
    } catch (error) {
        console.error('Error saving password to localStorage:', error);
        throw new Error('Failed to save password temporarily.');
    }
}

// Retro Message Display Function
function displayMessage(message, isError = false) {
    if (!isDisplayOn) return; // Do not display messages if the display is turned off
    const messageDisplay = document.getElementById('messageDisplay');
    messageDisplay.textContent = message;
    messageDisplay.style.color = isError ? '#FF0000' : '#00FF00'; // Red for errors, green for success
}

// Toggle Retro Display On/Off
function toggleDisplay() {
    const toggleButton = document.getElementById('toggleDisplayButton');
    const messageDisplay = document.getElementById('messageDisplay');
    if (isDisplayOn) {
        // Power Off
        messageDisplay.textContent = '';
        messageDisplay.style.color = 'transparent'; // Hide text
        toggleButton.textContent = '⏼'; // Power-off symbol
        isDisplayOn = false;
    } else {
        // Power On
        toggleButton.textContent = '⏻'; // Power-on symbol
        messageDisplay.style.color = '#00FF00'; // Show text
        messageDisplay.textContent = 'Welcome back to ScrapR!  |Under-Development|'; // Welcome message
        isDisplayOn = true;
    }
}

// Check for unsaved changes before generating a new link or deleting the current link
function checkForUnsavedChanges() {
    if (!isLinkGenerated) return false;

    const currentTextContent = document.getElementById('textEditor').textContent.trim();
    const currentFileName = document.getElementById('fileName').textContent;

    if (currentTextContent !== initialTextContent || currentFileName !== initialFileName) {
        displayMessage('Error: Save Changes before proceeding.', true);
        return true; // Unsaved changes exist
    }
    return false; // No unsaved changes
}

// Override generateLink and deleteFile to check for unsaved changes
document.querySelector('.generate-link').onclick = function () {
    if (checkForUnsavedChanges()) return;
    generateLink();
};

document.querySelector('.link-box button:nth-child(2)').onclick = function () {
    if (checkForUnsavedChanges()) return;
    deleteFile();
};