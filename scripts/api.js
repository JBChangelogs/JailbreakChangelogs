const userid = sessionStorage.getItem("userid");

function keyCreated(message) {
    toastr.success(message, "API key created!", {
        positionClass: "toast-bottom-right", // Position at the bottom right
        timeOut: 3000, // Toast will disappear after 3 seconds
        closeButton: true, // Add a close button
        progressBar: true, // Show a progress bar
    });
}

function throw_error(message) {
    toastr.error(message, "Error creating key.", {
        positionClass: "toast-bottom-right", // Position at the bottom right
        timeOut: 3000, // Toast will disappear after 3 seconds
        closeButton: true, // Add a close button
        progressBar: true, // Show a progress bar
    });
}

function getCookie(name) {
    let cookieArr = document.cookie.split(";");
    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");
        if (name === cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }
    return null;
}

const token = getCookie("token");


    if (!token) {
        localStorage.setItem(
            "redirectAfterLogin",
            "/api.html"
          ); // Store the redirect URL in local storage
          window.location.href = "/login.html"; // Redirect to login page
    }

function formatDate(date) {
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatKey(key) {
    return key.length > 8 ? key.slice(0, 8) + '...' : key; // Show first 8 characters and add '...' if longer
}

document.addEventListener('DOMContentLoaded', async function(event) {
    const apiKeys = []; // Store API keys
    const token = getCookie("token");

    // Fetch existing API keys
    const existingKeysResponse = await fetchExistingKeys(); // Fetch existing keys

    // Check if the response contains the 'keys' property and is an array
    if (existingKeysResponse.keys && Array.isArray(existingKeysResponse.keys)) {
        existingKeysResponse.keys.forEach(key => {
            const createdAtDate = new Date(key.created_at * 1000); // Convert Unix timestamp to Date object
            const formattedDate = formatDate(createdAtDate); // Format the date
            const formattedKey = formatKey(key.key); // Format the API key
            const row = `
                <tr>
                    <td class="small-button-cell">
                    <button class="btn btn-danger delete-button" data-key="${key.key}" style="margin-left: auto;">Delete</button>
                    <button class="btn btn-secondary copy-button" data-key="${key.key}" style="margin-left: auto;">Copy</button>
                    </td>
                    <td class"medium-button-cell">
                        <span>${formattedKey}</span> <!-- Display the formatted key -->
                    </td>                    <td>${key.name}</td>
                    <td>${key.description}</td>
                    <td>${formattedDate}</td> <!-- Use created_at instead of createdAt -->
                </tr>
            `;
            document.getElementById('apiKeyList').innerHTML += row;
        });
    } else {
        console.error('Fetched existingKeys is not an array:', existingKeysResponse);
    }

    // Set up the create key button event listener
    document.getElementById('createKeyButton').addEventListener('click', async () => {
        const name = document.getElementById('keyName').value;
        const description = document.getElementById('keyDescription').value;
        if (description.length > 35) {
            throw_error('Description must be 35 characters or less.'); // Show error message
            return; // Exit the function early
        }
        const permissions = [];
        if (document.getElementById('permChangelog').checked) {
            permissions.push('changelog');
        }
        if (document.getElementById('permSeasons').checked) {
            permissions.push('seasons');
        }
        if (document.getElementById('permComments').checked) {
            permissions.push('comments');
        }
        if (permissions.length === 0) {
            throw_error('Please select at least one permission.');
            return; // Exit the function if there's no permission
        }
    
        if (name && description) {
            try {
                const response = await fetch('https://api.jailbreakchangelogs.xyz/keys/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        owner: token, // Your token here
                        name: name,
                        description: description,
                        permissions: permissions, // Sending permissions as an array
                    }),
                });
    if (permissions.length === 0) {
        throw_error('Please select at least one permission.');
        return; // Exit the function if there's no permission
    }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                if (response.status === 200) {
                    const result = await response.json(); // Parse the JSON response
                    console.log(result);
                    const newKey = result.key; // Assuming the response contains the created key

                    // Add the new key to your API key list and update the UI
                    apiKeys.push({
                        key: newKey, // Include the newly created key's details
                        name: name,
                        description: description,
                        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '), // Current time as created_at
                        permissions: permissions, // Assuming permissions should also be included
                    });
                    await updateApiKeyList(); // Function to update the UI with the new list of keys

                    // Show success message and close the modal
                    keyCreated('API key successfully created!');
                    $('#createKeyModal').modal('hide');
                }

            } catch (error) {
                console.error('Error creating API key:', error);
                throw_error(`Failed to create API key: ${error.message}`); // Show error message to the user
            }
        } else {
            throw_error('Please fill in both name and description.');
        }
    });

    async function fetchExistingKeys() {
        try {
            const token = getCookie("token");
            const response = await fetch('https://api.jailbreakchangelogs.xyz/keys/get?author=' + token);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json(); // Return the whole response object
        } catch (error) {
            console.error('Error fetching existing keys:', error);
            return { keys: [] }; // Return an empty keys array in case of error
        }
    }

    async function updateApiKeyList() {
        const apiKeyList = document.getElementById('apiKeyList');
        apiKeyList.innerHTML = ''; // Clear existing keys
        const existingKeysResponse = await fetchExistingKeys(); // Await the fetching of existing keys
    
        if (existingKeysResponse.keys && Array.isArray(existingKeysResponse.keys)) {
            existingKeysResponse.keys.forEach(apiKey => {
                const createdAtDate = new Date(apiKey.created_at * 1000); // Convert Unix timestamp to Date object
                const formattedDate = formatDate(createdAtDate); // Format the date
                const formattedKey = formatKey(apiKey.key); // Format the API key
                const row = `
                    <tr>
                                        <td class="small-button-cell">
                    <button class="btn btn-danger delete-button" data-key="${apiKey.key}" style="margin-left: auto;">Delete</button>
                    <button class="btn btn-secondary copy-button" data-key="${apiKey.key}" style="margin-left: auto;">Copy</button>
                    </td>
                        <td>${formattedKey}</td>
                        <td>${apiKey.name}</td>
                        <td>${apiKey.description}</td>
                        <td>${formattedDate}</td> <!-- Use created_at -->
                    </tr>
                `;
                apiKeyList.innerHTML += row; // Append new row
            });
        } else {
            console.error('Fetched existingKeys is not an array:', existingKeysResponse);
        }
    }
    document.getElementById('apiKeyList').addEventListener('click', function(event) {
        if (event.target.classList.contains('copy-button')) {
            const apiKey = event.target.getAttribute('data-key'); // Get the API key from the button's data attribute
            navigator.clipboard.writeText(apiKey) // Copy the key to the clipboard
                .then(() => {
                    toastr.success('API key copied to clipboard!', 'Success', {
                        positionClass: "toast-bottom-right",
                        timeOut: 3000,
                        closeButton: true,
                        progressBar: true,
                    });
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                    throw_error('Failed to copy API key.'); // Handle error
                });
        }
    });
    document.getElementById('apiKeyList').addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-button')) {
            const keyToDelete = event.target.getAttribute('data-key');
            
            // Confirm deletion
            if (confirm(`Are you sure you want to delete the key: ${keyToDelete}?`)) {
                try {
                    const response = await fetch(`https://api.jailbreakchangelogs.xyz/keys/delete?key=` + keyToDelete, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
    
                    // Remove the key from the UI
                    await updateApiKeyList(); // Function to refresh the API key list
    
                    // Show success message
                    toastr.success('API key deleted successfully!', 'Success', {
                        positionClass: "toast-bottom-right",
                        timeOut: 3000,
                        closeButton: true,
                        progressBar: true,
                    });
                } catch (error) {
                    console.error('Error deleting API key:', error);
                    toastr.error(`Failed to delete API key: ${error.message}`, 'Error', {
                        positionClass: "toast-bottom-right",
                        timeOut: 3000,
                        closeButton: true,
                        progressBar: true,
                    });
                }
            }
        }
    });
});
