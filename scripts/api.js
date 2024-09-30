function keyCreated(message) {
    toastr.success(message, "API key created!", {
        positionClass: "toast-bottom-right", // Position at the bottom right
        timeOut: 3000, // Toast will disappear after 3 seconds
        closeButton: true, // Add a close button
        progressBar: true, // Show a progress bar
    });
}

function error(message) {
    toastr.error(message, "Error creating key.", {
        positionClass: "toast-bottom-right", // Position at the bottom right
        timeOut: 3000, // Toast will disappear after 3 seconds
        closeButton: true, // Add a close button
        progressBar: true, // Show a progress bar
    });
}

document.addEventListener('DOMContentLoaded', async function(event) {
    // Fetch existing API keys
    const existingKeys = await fetchExistingKeys(); // Make this async
    existingKeys.forEach(key => {
        const row = `
            <tr>
                <td>${key.key}</td>
                <td>${key.name}</td>
                <td>${key.description}</td>
                <td>${key.createdAt}</td>
            </tr>
        `;
        document.getElementById('apiKeyList').innerHTML += row;
    });

    const apiKeys = []; // Store API keys

    document.getElementById('createKeyButton').addEventListener('click', async () => {
        const name = document.getElementById('keyName').value;
        const description = document.getElementById('keyDescription').value;

        if (name && description) {
            // Simulate API call
            const newKey = {
                key: `jbc-${Math.random().toString(36).substr(2, 8)}`, // Simulating key generation
                name: name,
                description: description,
                createdAt: new Date().toLocaleString()
            };

            apiKeys.push(newKey);
            updateApiKeyList();
            keyCreated('API key successfully created!'); // Call keyCreated here
            $('#createKeyModal').modal('hide'); // Hide the modal
        } else {
            error('Please fill in both name and description.');
        }
    });

    async function fetchExistingKeys() {
        try {
            const response = await fetch('https://api.example.com/api-keys');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching existing keys:', error);
            return [];
        }
    }

    function updateApiKeyList() {
        const apiKeyList = document.getElementById('apiKeyList');
        apiKeyList.innerHTML = ''; // Clear existing keys
        apiKeys.forEach(apiKey => {
            const row = `
                <tr>
                    <td>${apiKey.key}</td>
                    <td>${apiKey.name}</td>
                    <td>${apiKey.description}</td>
                    <td>${apiKey.createdAt}</td>
                </tr>
            `;
            apiKeyList.innerHTML += row; // Append new row
        });
    }
});
