

document.addEventListener('DOMContentLoaded', function() {
    const permissions = JSON.parse(settings)
    const udata = JSON.parse(userData)
    const recent_comments_tab = document.getElementById('recent-comments-tab');
    const userDateBio = document.getElementById('description-updated-date');
    const recent_comments_button = document.getElementById('recent-comments-button');

    // Lol! these are backwards, true = false, false = true
    if (permissions.show_recent_comments === true) {
        recent_comments_tab.remove();
        recent_comments_button.remove();
    }
    const input = document.getElementById('bannerInput');
    const loggedinuserId = sessionStorage.getItem('userid');
    const pathSegments = window.location.pathname.split("/");
    const userId = pathSegments[pathSegments.length - 1];
    const card_pagination = document.getElementById('card-pagination');
    const userBanner = document.getElementById('banner');
    if (permissions.profile_public === true && loggedinuserId !== userId) {
        window.location.href = '/users'
    }
    let banner
    function decimalToHex(decimal) {
        // Convert the decimal number to hex and pad with leading zeros if necessary
        const hex = decimal.toString(16).toUpperCase().padStart(6, '0');
    
        // Return the hex color with a # prefix
        return `#${hex}`;
    }
    async function fetchUserBanner(userId) {
        try {
            
            let image
            if (permissions.banner_discord === true) {
                image = `https://cdn.discordapp.com/banners/${userId}/${udata.banner}.png`;
            } else {
                const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/background/get?user=${userId}`); // Replace with actual URL
    
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
        
                const bannerData = await response.json();
                image = bannerData.image_url;
            }

            userBanner.src = image;
            banner = image;
            // Process and display the banner data here, e.g.:
            // document.getElementById('banner').src = bannerData.image_url;
        } catch (error) {
            console.error('Error fetching banner:', error);
        }
    }
    async function fetchUserBio(userId) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/description/get?user=${userId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    userBio.textContent = "";
                } else {
                    userBio.textContent = "Error fetching description.";
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            await fetchUserBanner(userId);
            
            const user = await response.json();
            const timestamp = user.last_updated || 0;
            const date = formatDate(timestamp);
            const description = user.description || "No description available."; // Fallback message
    
            // Regular expression to match URLs starting with "https://"
            const urlRegex = /https:\/\/[^\s]+/g;
            let resultHtml = "";
            let lastIndex = 0;
            
            // Split the description by newlines
            const lines = description.split('\n');
    
            lines.forEach(line => {
                const matches = line.match(urlRegex);
                if (matches) {
                    // Iterate through the matches to build the result
                    matches.forEach((url) => {
                        // Find the start index of the current URL
                        const urlIndex = line.indexOf(url);
                        // Extract text before the current URL
                        const textBeforeLink = line.slice(0, urlIndex).trim();
                        
                        // Add the text before the URL to the result
                        if (textBeforeLink) {
                            resultHtml += `${textBeforeLink} `;
                        }
                        
                        // Add the link element
                        resultHtml += `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a> `;
                        
                        // Remove the processed part of the line for the next loop
                        line = line.slice(urlIndex + url.length);
                    });
                }
                // Add any remaining text after the last URL
                if (line.trim()) {
                    resultHtml += line.trim(); // Add the remaining text from the line
                }
                resultHtml += '<br>'; // Add a line break after each line
            });
    
            resultHtml = resultHtml.replace(/(<br\s*\/?>\s*){2,}$/, '<br>');

            // Set the user bio with the cleaned-up result
            editbio_button.innerHTML = '<i class="bi bi-pencil-fill"></i>'
            savebio_button.style.display = 'none';
            savebio_button.innerHTML = '<i class="bi bi-save"></i>'
            if (loggedinuserId === userId) {
                editbio_button.style.display = 'inline-block';
            }
            userDateBio.textContent = `${date}`;
            userBio.innerHTML = resultHtml.trim();
            savebio_button.disabled = false;
            editbio_button.disabled = false;
        } catch (error) {
            console.error('Error:', error);
            userBio.textContent = 'Error fetching user bio.';
        }
    }
    function getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return "th"; // Covers 11th to 19th
        switch (day % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      }
    
    function formatDate(unixTimestamp) {
        // Check if timestamp is in seconds or milliseconds
        const isMilliseconds = unixTimestamp.toString().length > 10;
        const timestamp = isMilliseconds ? unixTimestamp : unixTimestamp * 1000;
    
        const date = new Date(timestamp);
    
        const options = {
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        };
    
        let formattedDate = date.toLocaleString("en-US", options);
    
        // Get the day of the month with the appropriate ordinal suffix
        const day = date.getDate();
        const ordinalSuffix = getOrdinalSuffix(day);
        formattedDate = formattedDate.replace(day, `${day}${ordinalSuffix}`);
    
        return formattedDate;
      }
    async function fetchSeasonRewards(season) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/rewards/get?season=${season}`);
            if (!response.ok) {
                if (response.status === 404) {
                    return "No rewards found for this season.";
                }
                else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            const rewards = await response.json();
            return rewards
        } catch (error) {
            console.error('Error:', error);
            return 'Error fetching season rewards.';
        }
    }

    async function fetchCommentItem(comment) {
        try {
            if (comment.item_type === "changelog") {
                url = `https://api.jailbreakchangelogs.xyz/changelogs/get?id=${comment.item_id}`;
            } else if (comment.item_type === "season") {
                url = `https://api.jailbreakchangelogs.xyz/seasons/get?season=${comment.item_id}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    return " ";
                }
                else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            const result = await response.json();
            return result
        } catch (error) {
            console.error('Error:', error);
            return 'Error fetching comment title.';
        }
    }
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    function renderPaginationControls(totalPages) {
        const paginationContainer = document.getElementById("paginationControls");
        paginationContainer.innerHTML = ""; // Clear existing controls
    
        // Create left arrow button
        const leftArrow = document.createElement("button");
        leftArrow.textContent = "<";
        leftArrow.classList.add("btn", "btn-outline-primary", "m-1");
        leftArrow.disabled = currentPage === 1; // Disable if on the first page
        leftArrow.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                fetchUserComments(userId); // Fetch comments for the current page
            }
        });
        paginationContainer.appendChild(leftArrow);
    
        // Page number input
        const pageInput = document.createElement("input");
        pageInput.type = "number";
        pageInput.value = currentPage;
        pageInput.min = 1;
        pageInput.max = totalPages;
        pageInput.classList.add("form-control", "mx-1");
        pageInput.style.width = "60px"; // Set width for input
        pageInput.addEventListener("change", () => {
            const newPage = parseInt(pageInput.value);
            if (newPage >= 1 && newPage <= totalPages) {
                currentPage = newPage;
                fetchUserComments(userId); // Fetch comments for the new page
            } else {
                pageInput.value = currentPage; // Reset input if invalid
            }
        });
        paginationContainer.appendChild(pageInput);
    
        // Create right arrow button
        const rightArrow = document.createElement("button");
        rightArrow.textContent = ">";
        rightArrow.classList.add("btn", "btn-outline-primary", "m-1");
        rightArrow.disabled = currentPage === totalPages; // Disable if on the last page
        rightArrow.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchUserComments(userId); // Fetch comments for the current page
            }
        });
        paginationContainer.appendChild(rightArrow);
    }

    let currentPage = 1;
    const commentsPerPage = 3;
    
    async function fetchUserComments(userId) {
        const recentComments = document.getElementById('comments-list'); // Ensure this is the correct ID
        let loadingSpinner = document.getElementById('loading-spinner');
        recentComments.innerHTML = ""; // Clear existing comments
        recentComments.innerHTML = '<span id="loading-spinner" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>';
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/comments/get/user?author=${userId}`);
    
            if (!response.ok) {
                if (response.status === 404) {
                    recentComments.innerHTML = "<div>No recent comments.</div>"; // Use innerHTML for the list
                } else {
                    recentComments.innerHTML = "<div>Error fetching comments.</div>"; // Update the message for other errors
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return; // Exit the function if there is an error
            }
    
            const comments = await response.json(); // Assuming the API returns a JSON array of comments
            const totalComments = comments.length; // Get the total number of comments
            if (!totalComments) {
                recentComments.innerHTML = "<div>No recent comments.</div>"; // No comments found
                return;
            }
            const totalPages = Math.ceil(totalComments / commentsPerPage); // Calculate total pages
    
            // Clear existing comments
            
             // Render pagination controls
    
            // Slice the comments array for the current page
            const startIndex = (currentPage - 1) * commentsPerPage;
            const paginatedComments = comments.slice(startIndex, startIndex + commentsPerPage);
    
            // Check if comments are available
            if (paginatedComments.length === 0) {
                recentComments.innerHTML = "<div>No comments found.</div>"; // Message if no comments
                return;
            }
            const comments_to_add = []; // Array to store elements to add to the DOM
    
            // Iterate over paginated comments and create elements to display
            for (const comment of paginatedComments) { // Use for...of to allow await
                const item = await fetchCommentItem(comment); // Await the fetchCommentItem
                const formattedDate = formatDate(comment.date);
                const commentElement = document.createElement('div');
                let url; // Placeholder URL for season rewards
                if (comment.item_type === "season") {
                    let rewards = await fetchSeasonRewards(comment.item_id); // Await the fetchSeasonRewards
                    if (!Array.isArray(rewards)) {
                        if (typeof rewards === 'object' && rewards !== null) {
                            rewards = Object.values(rewards); // Convert object properties to an array
                        } else {
                            rewards = []; // Initialize as empty array if rewards is null or undefined
                        }
                    }
                    
            
                    const level10Reward = rewards.find(reward => reward.requirement === "Level 10");
                    url = level10Reward.link
                }

                const image_url = item.image_url || url; // Placeholder image URL
                commentElement.className = 'list-group-item';
                // the actual comments
                commentElement.innerHTML = `
<div class="card mb-3 comment-card">
    <div class="card-body">
        <div class="comment-container">
            <div class="comment-image-container d-none d-md-block">
                <img src="${image_url}" alt="Comment Image" class="comment-image"/>
            </div>
            <div class="comment-content-container">
                <div class="comment-header">
                    <h6 class="card-title">${capitalizeFirstLetter(comment.item_type)} ${comment.item_id}</h6>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <h5 class="card-subtitle fw-bold">${item.title}</h5>
                <p class="card-text comment-text">${comment.content}</p>
                <a href="/${comment.item_type}s/${comment.item_id}" class="btn btn-outline-primary btn-sm">
                    View ${capitalizeFirstLetter(comment.item_type)}
                </a>
            </div>
        </div>
    </div>
</div>
`;

                comments_to_add.push(commentElement); // Add the new comment to the array
            }
            // Add all comments to the DOM
            recentComments.innerHTML = ""; 
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = card_pagination.innerHTML;
            const spans = tempDiv.getElementsByTagName('span');
            while (spans.length > 0) {
                spans[0].parentNode.removeChild(spans[0]);
            }
            card_pagination.innerHTML = tempDiv.innerHTML; // Clear existing pagination controls
            renderPaginationControls(totalPages);
            recentComments.append(...comments_to_add); // Use spread operator to add multiple elements at once
    
        } catch (error) {
            console.error('Error fetching comments:', error);
            recentComments.innerHTML = "<div>Internal Server Error.</div>"; // Display error message
        } finally {
            loadingSpinner.remove(); // Hide the loading spinner after the fetch operation
        }
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
      const follow_button = document.getElementById('follow-button');
      async function updateUserCounts(userId) {
        try {
            let followersLoading = document.getElementById('followers-loading');
            if (!followersLoading) {
              followersLoading = document.createElement('span');
              followersLoading.className = 'loading-icon';
              followersLoading.id = 'followers-loading';
              followersLoading.innerHTML = '<span class="loading-icon" id="followers-loading"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span></span>'; // Replace with your loading icon
              document.getElementById('followers').prepend(followersLoading);
            }
        
            let followingLoading = document.getElementById('following-loading');
            if (!followingLoading) {
              followingLoading = document.createElement('span');
              followingLoading.className = 'loading-icon';
              followingLoading.id = 'following-loading';
              followingLoading.innerHTML = '<span class="loading-icon" id="followers-loading"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span></span>'; // Replace with your loading icon
              document.getElementById('following').prepend(followingLoading);
            }
            if (userId === "659865209741246514" || userId === "1019539798383398946") {
                
                const crown = document.getElementById('crown');
                crown.style.display = 'inline-block';
            }
        
            // Show loading icons
            followersLoading.style.display = 'inline';
            followingLoading.style.display = 'inline';
          // Await the fetching of user following and followers
          const followingArray = await fetchUserFollowing(userId); 
          const followersArray = await fetchUserFollowers(userId); 
      
          const isFollowing = followersArray.some(follower => follower.follower_id === loggedinuserId);
          follow_button.textContent = isFollowing? "Unfollow" : "Follow";
      
          // Check if they are valid arrays
          const followingCount = Array.isArray(followingArray) ? followingArray.length : 0; 
          const followersCount = Array.isArray(followersArray) ? followersArray.length : 0; 
      
          // Update the DOM elements with the counts

          const following = document.getElementById('following');
          const followers = document.getElementById('followers');
          
          // Create <a> tags for Following
          const followingLink = document.createElement('a');
          if (permissions.hide_following === false) {
            followingLink.href = `/users/${userId}/following`; // Link to the following page
          }
          followingLink.textContent = `${followingCount} Following`; // Set the text for following
          followingLink.classList.add('text-decoration-none', 'text-muted', 'text-bold'); // Add classes for styling
          
          // Create <a> tags for Followers
          const followersLink = document.createElement('a');
          if (permissions.hide_followers === false) {
            followersLink.href = `/users/${userId}/followers`; // Link to the followers page
          }
          followersLink.textContent = `${followersCount} Followers`; // Set the text for followers
          followersLink.classList.add('text-decoration-none', 'text-muted', 'text-bold'); // Add classes for styling
          
          // Clear existing content and append links
          following.innerHTML = ''; // Clear existing content
          following.appendChild(followingLink); // Add the link to following
          followers.innerHTML = ''; // Clear existing content
          followers.appendChild(followersLink); // Add the link to followers
      
          // Hide loading icons
      
        } catch (error) {
          console.error('Error updating user counts:', error);
        }
      }




    const settings_button = document.getElementById('settings-button');
    const editbio_button = document.getElementById('edit-bio-button');
    editbio_button.innerHTML = '<span class="loading-icon" id="followers-loading"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span></span>'
    editbio_button.disabled = true;
    const message_button = document.getElementById('message-button');
    const about_button = document.getElementById('about-button');
    if (loggedinuserId === userId) {
        message_button.style.display = 'none';
        follow_button.style.display = 'none';
        settings_button.style.display = 'inline-block';
        editbio_button.style.display = 'inline-block';
    } else {
        settings_button.style.display = 'none';
        editbio_button.style.display = 'none';
    }
    const userBio = document.getElementById('userBio');
    const character_count = document.getElementById('character-count');
    fetchUserBio(userId)
    userAvatar = document.getElementById('user-avatar');
    if (!udata.accent_color) {
        userAvatar.style.border = '4px solid #000'; // Default blue border color
    } else {
        const hexColor = decimalToHex(udata.accent_color);
        userAvatar.style.border = `4px solid ${hexColor}`;
    }
    const savebio_button = document.getElementById('save-bio-button');
    const cancel_button = document.getElementById('canceledit');
    updateUserCounts(userId);
    editbio_button.addEventListener('click', function() {
        editbio_button.style.display = 'none';
        savebio_button.style.display = 'inline-block';
        cancel_button.style.display = 'inline-block';
        const descriptionBox = document.getElementById('description-box');
        userDateBio.textContent = '';
        character_count.textContent = '0/500'; // Reset character count

        // Clear previous content
        userBio.style.display = 'none';
        const icon = editbio_button.querySelector('i'); // Get the icon element
        
        // Create a text input
        const textInput = document.createElement('textarea');
        textInput.style.marginTop = '0px';
        textInput.placeholder = 'Enter your bio here...'; // Placeholder text
        textInput.style.minHeight = '150px';
        textInput.style.resize = 'none';
        textInput.style.width = '100%';
        textInput.value = userBio.innerHTML
        .replace(/<br>/g, '\n')
        .replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '$1') // Set the value of the text input to the current bio with newlines
        textInput.className = 'form-control'; // Bootstrap class for styling
        const space = document.createElement('br'); // Line break for better formatting
        textInput.addEventListener('input', function() {
            const characterCount = document.getElementById('character-count');
            characterCount.textContent = `${textInput.value.length}/500`; // Update character count
        });
    
        // Append the input to the description box
        descriptionBox.appendChild(space);
        descriptionBox.appendChild(textInput);
        savebio_button.addEventListener('click', async function() {
            try {
                savebio_button.innerHTML = '<span class="loading-icon" id="followers-loading"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span></span>'
                savebio_button.disabled = true;
                const characterCount = document.getElementById('character-count');
                characterCount.textContent = '';
                
                const description = textInput.value;
                if (description.length > 500) {
                    AlertToast("Bio cannot exceed 500 characters. Please try again.");
                    return;
                }
                console.log('Updating bio:', description);
                const user = getCookie('token');
                const body = JSON.stringify({ user, description });
                console.log('body:', body);
                const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/description/update`, {
                    method: 'POST', // Specify the method, e.g., POST
                    headers: {
                        'Content-Type': 'application/json', // Set content type to JSON
                    },
                    body: body, // Pass the body here
                });
    
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
    

            } catch (error) {
                console.error('Error:', error);
                userBio.style.display = 'block';
                textInput.remove();
                space.remove();
                alert('Failed to update bio. Please try again.');
                window.location.reload();
            } finally {
                userBio.style.display = 'block';
                textInput.remove();
                space.remove();
                window.location.reload(); // Refresh the page to reflect the updated bio
            }
        });
        cancel_button.addEventListener('click', function() {
            window.location.reload();
        });
    });
    const description_tab = document.getElementById('description-tab');
    recent_comments_button.addEventListener('click', function () {
        const recentComments = document.getElementById('comments-list');
        // Remove 'active' class from About button and reset aria-selected
        about_button.classList.remove('active');
        about_button.setAttribute('aria-selected', 'false');
        const loading_spinner = document.getElementById('loading-spinner');
        if (!loading_spinner) {
            card_pagination.innerHTML += '<span id="loading-spinner" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>';
            recentComments.innerHTML = '<span id="loading-spinner" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>';
        }
        card_pagination.style.display = 'block'; // Reset pagination controls
        description_tab.style.display = 'none';
        recent_comments_tab.style.display = 'block'; // Show recent comments tab
        fetchUserComments(userId); // Fetch recent comments

        // Add 'active' class to Recent Comments button and update aria-selected
        recent_comments_button.classList.add('active');
        recent_comments_button.setAttribute('aria-selected', 'true');

        // Optional: Any additional functionality you want to perform when this button is clicked
    });
    about_button.addEventListener('click', function () {
        const recentComments = document.getElementById('comments-list');
        // Remove 'active' class from Recent Comments button and reset aria-selected
        if (document.getElementById('paginationControls')) {
            document.getElementById('paginationControls').innerHTML = ''; // Reset pagination controls
        }
        recent_comments_button.classList.remove('active');
        recentComments.innerHTML = ''; // Reset recent comments
        recent_comments_button.setAttribute('aria-selected', 'false');
        if (card_pagination) {
            card_pagination.style.display = 'none';
        }
        recent_comments_tab.style.display = 'none'; // Reset recent comments tab
        description_tab.style.display = 'block'; // Show description tab

        // Add 'active' class to About button and update aria-selected
        about_button.classList.add('active');
        about_button.setAttribute('aria-selected', 'true');

        // Optional: Any additional functionality you want to perform when this button is clicked
    });
    async function fetchUserFollowers(userId) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/followers/get?user=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const followers = await response.json();
            return followers;
        } catch (error) {
            console.error('Error fetching followers:', error);
        }
    }
    async function fetchUserFollowing(userId) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/following/get?user=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const following = await response.json();
            return following;
        } catch (error) {
            console.error('Error fetching following:', error);
        }
    }
    function alreadyFollowingToast(message) {
        toastr.error(message, "Follow", {
          positionClass: "toast-bottom-right", // Position at the bottom right
          timeOut: 3000, // Toast will disappear after 3 seconds
          closeButton: true, // Add a close button
          progressBar: true, // Show a progress bar
        });
      }
    function FollowToast(message) {
        toastr.success(message, "Follow", {
          positionClass: "toast-bottom-right", // Position at the bottom right
          timeOut: 3000, // Toast will disappear after 3 seconds
          closeButton: true, // Add a close button
          progressBar: true, // Show a progress bar
        });
      }
      function NotFollowingToast(message) {
        toastr.error(message, "Error", {
          positionClass: "toast-bottom-right", // Position at the bottom right
          timeOut: 3000, // Toast will disappear after 3 seconds
          closeButton: true, // Add a close button
          progressBar: true, // Show a progress bar
        });
      }
    async function addFollow(userId) {
        try {
            const user = getCookie('token');
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/followers/add`, {
                method: 'POST', // Specify the method, e.g., POST
                headers: {
                    'Content-Type': 'application/json', // Set content type to JSON
                },
                body: JSON.stringify({ follower: user, following: userId }), // Pass the body here
            });
            if (!response.ok) {
                if (response.status === 409) {
                    alreadyFollowingToast('You are already following this user.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            updateUserCounts(userId); // Update user counts after adding follow
        } catch (error) {
            console.error('Error adding follow:', error);
        }
    }
    async function removeFollow(userId) {
        try {
            const user = getCookie('token');
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/followers/remove`, {
                method: 'DELETE', // Specify the method, e.g., POST
                headers: {
                    'Content-Type': 'application/json', // Set content type to JSON
                },
                body: JSON.stringify({ follower: user, following: userId }), // Pass the body here
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            updateUserCounts(userId); // Update user counts after removing follow
        } catch (error) {
            console.error('Error removing follow:', error);
        }
    }
    follow_button.addEventListener('click', function() {
        const user = getCookie('token');
    
        if (!user) {
            // User is not logged in
            NotFollowingToast("You are not logged in to perform this action.");
            return;
        }
        if (follow_button.textContent === 'Follow') {
            addFollow(userId);
            FollowToast("User followed successfully.");
            follow_button.textContent = 'Unfollow';
        } else {
            removeFollow(userId);
            FollowToast("User unfollowed successfully.");
            follow_button.textContent = 'Follow';
        }
    });
    function AlertToast(message) {
        toastr.info(message, "Alert", {
          positionClass: "toast-bottom-right", // Position at the bottom right
          timeOut: 3000, // Toast will disappear after 3 seconds
          closeButton: true, // Add a close button
          progressBar: true, // Show a progress bar
        });
      }
      function SuccessToast(message) {
        toastr.success(message, "Alert", {
          positionClass: "toast-bottom-right", // Position at the bottom right
          timeOut: 3000, // Toast will disappear after 3 seconds
          closeButton: true, // Add a close button
          progressBar: true, // Show a progress bar
        });
      }

      crown.addEventListener('click', function() {
        fetch(`/owner/check/${userId}`, {
            method: 'GET', // Specify the method, e.g., GET
            headers: {
                'Content-Type': 'application/json', // Set content type to JSON
            }
        })
        .then(response => {
            
    
            if (response.status === 200) {
                AlertToast("This user created Jailbreak Changelogs!");
            } else {
                SuccessToast('The only owners of Jailbreak Changelogs are <a href="/users/659865209741246514" target="_blank" rel="noopener noreferrer">@Jakobiis</a> and <a href="/users/1019539798383398946" target="_blank" rel="noopener noreferrer">@Jalenzz</a>');
                AlertToast("This crown is given out to the creators of Jailbreak Changelogs! Unfortunately, this user is not one of them 🤣");
            }
        })
        .catch(error => {
            console.error('Error fetching owner status:', error);
            AlertToast("There was an error checking the owner's status.");
        });
    });
    const profile_public_button = document.getElementById('profile-public-button');
    const show_comments_button = document.getElementById('show-comments-button');
    const hide_following_button = document.getElementById('hide-following-button');
    const hide_followers_button = document.getElementById('hide-followers-button');
    const use_discord_banner_button = document.getElementById('usediscordBanner');
    const bannerInput = document.getElementById('input-for-banner');
    settings_button.addEventListener('click', function() {
        const settingsModal = document.getElementById('settingsModal');
        settingsModal.style.display = 'block';
        profile_public_button.classList.remove('btn-danger', 'btn-success');
        show_comments_button.classList.remove('btn-danger', 'btn-success');
        hide_following_button.classList.remove('btn-danger', 'btn-success');
        hide_followers_button.classList.remove('btn-danger', 'btn-success');
        use_discord_banner_button.classList.remove('btn-danger', 'btn-success');

        profile_public_button.classList.add('btn-secondary');
        show_comments_button.classList.add('btn-secondary');
        hide_following_button.classList.add('btn-secondary');
        hide_followers_button.classList.add('btn-secondary');
        use_discord_banner_button.classList.add('btn-secondary');

     
        

        profile_public_button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>'
        show_comments_button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>'
        hide_following_button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>'
        hide_followers_button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>'
        use_discord_banner_button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>'
        loadProfileSettings();
    });
    async function loadProfileSettings() {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/settings?user=${loggedinuserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const settings = await response.json();
    
            // Process each setting
            for (const [key, value] of Object.entries(settings)) {
                switch (key) {
                    case 'hide_followers':
                        const hideFollowersIcon = document.createElement('i');
                        hideFollowersIcon.classList.add('bi', value ? 'bi-x-lg' : 'bi-check-lg');
            
                        hide_followers_button.classList.remove('btn-danger', 'btn-success'); // Clear previous button classes
                        hide_followers_button.classList.add('btn', value ? 'btn-danger' : 'btn-success');
                        hide_followers_button.innerHTML = hideFollowersIcon.outerHTML; // Update button with the icon
                        break;
                        case 'hide_following':
                            // Logic for hide_following
                            const hideFollowingIcon = document.createElement('i');
                            hideFollowingIcon.classList.add('bi', value ? 'bi-x-lg' : 'bi-check-lg'); // Set the icon based on the value
                        
                            hide_following_button.classList.remove('btn-danger', 'btn-success'); // Clear previous button classes
                            hide_following_button.classList.add('btn', value ? 'btn-danger' : 'btn-success'); // Update button class based on value
                            hide_following_button.innerHTML = hideFollowingIcon.outerHTML; // Update button with the icon
                            break;
                            case 'profile_public':
                                // Logic for profile_public
                                const profilePublicIcon = document.createElement('i');
                                profilePublicIcon.classList.add('bi', value ? 'bi-check-lg' : 'bi-x-lg'); // Set icon based on public/private status
                            
                                profile_public_button.classList.remove('btn-danger', 'btn-success'); // Clear previous button classes
                                profile_public_button.classList.add('btn', value ? 'btn-success' : 'btn-danger'); // Update button class based on value
                                profile_public_button.innerHTML = profilePublicIcon.outerHTML; // Update button with the icon
                                break;
                                case 'show_recent_comments':
                                    // Logic for show_recent_comments
                                    const recentCommentsIcon = document.createElement('i');
                                    recentCommentsIcon.classList.add('bi', value ? 'bi-check-lg' : 'bi-x-lg'); // Set icon based on the value
                                
                                    show_comments_button.classList.remove('btn-danger', 'btn-success'); // Clear previous button classes
                                    show_comments_button.classList.add('btn', value ? 'btn-success' : 'btn-danger'); // Update button class based on value
                                    show_comments_button.innerHTML = recentCommentsIcon.outerHTML; // Update button with the icon
                                    break;
                                case 'banner_discord':
                                    // Logic for banner_discord
                                    const bannerDiscordIcon = document.createElement('i');
                                    const BannerInputHeader = document.createElement('BannerInputHeader');
                                    bannerDiscordIcon.classList.add('bi', value ? 'bi-x-lg' : 'bi-check-lg'); // Set icon based on the value
                                    bannerInput.style.display = value? 'block' : 'none'; // Show or hide the input field based on the value
                                    input.value = banner

                                    use_discord_banner_button.classList.remove('btn-danger', 'btn-success'); // Clear previous button classes
                                    use_discord_banner_button.classList.add('btn', value ? 'btn-danger' : 'btn-success'); // Update button class based on value
                                    use_discord_banner_button.innerHTML = bannerDiscordIcon.outerHTML; // Update button with the icon
                                    break;

                                    

                    default:
                        break;
                }
            }
        } catch (error) {
            console.error('Error loading profile settings:', error);
        }
    }
    
    profile_public_button.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent form submission or button's default behavior
        const profilePublicIcon = profile_public_button.querySelector('i');
    
        // Toggle the icon class
        if (profilePublicIcon.classList.contains('bi-x-lg')) {
            profile_public_button.classList.remove('btn-danger');
            profilePublicIcon.classList.remove('bi-x-lg');
            profile_public_button.classList.add('btn-success');
            profilePublicIcon.classList.add('bi-check-lg');
        } else {
            profilePublicIcon.classList.remove('bi-check-lg');
            profile_public_button.classList.remove('btn-success');
            profile_public_button.classList.add('btn-danger');
            profilePublicIcon.classList.add('bi-x-lg');
        }
    }); 
    use_discord_banner_button.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent form submission or button's default behavior
        const bannerDiscordIcon = use_discord_banner_button.querySelector('i');

        // Toggle the icon class
        if (bannerDiscordIcon.classList.contains('bi-check-lg')) {
            bannerInput.style.display = 'block';
            use_discord_banner_button.classList.remove('btn-success');
            bannerDiscordIcon.classList.remove('bi-check-lg');
            use_discord_banner_button.classList.add('btn-danger');
            bannerDiscordIcon.classList.add('bi-x-lg');
        } else {
            bannerInput.style.display = 'none';
            bannerInput.value = '';
            bannerDiscordIcon.classList.remove('bi-x-lg');
            use_discord_banner_button.classList.remove('btn-danger');
            use_discord_banner_button.classList.add('btn-success');
            bannerDiscordIcon.classList.add('bi-check-lg');
        }
    });


    hide_followers_button.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent form submission or button's default behavior
        const hideFollowersIcon = hide_followers_button.querySelector('i');
    
        // Toggle the icon class
        if (hideFollowersIcon.classList.contains('bi-check-lg')) {
            hide_followers_button.classList.remove('btn-success');
            hideFollowersIcon.classList.remove('bi-check-lg');
            hide_followers_button.classList.add('btn-danger');
            hideFollowersIcon.classList.add('bi-x-lg');
        } else {
            hideFollowersIcon.classList.remove('bi-x-lg');
            hide_followers_button.classList.remove('btn-danger');
            hide_followers_button.classList.add('btn-success');
            hideFollowersIcon.classList.add('bi-check-lg');
        }
    });
    hide_following_button.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent form submission or button's default behavior
        const hideFollowingIcon = hide_following_button.querySelector('i');
    
        // Toggle the icon class
        if (hideFollowingIcon.classList.contains('bi-check-lg')) {
            hide_following_button.classList.remove('btn-success');
            hideFollowingIcon.classList.remove('bi-check-lg');
            hide_following_button.classList.add('btn-danger');
            hideFollowingIcon.classList.add('bi-x-lg');
        } else {
            hideFollowingIcon.classList.remove('bi-x-lg');
            hide_following_button.classList.remove('btn-danger');
            hide_following_button.classList.add('btn-success');
            hideFollowingIcon.classList.add('bi-check-lg');
        }
    });
    show_comments_button.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent form submission or button's default behavior
        const recentCommentsIcon = show_comments_button.querySelector('i');
    
        // Toggle the icon class
        if (recentCommentsIcon.classList.contains('bi-x-lg')) {
            show_comments_button.classList.remove('btn-danger');
            recentCommentsIcon.classList.remove('bi-x-lg');
            show_comments_button.classList.add('btn-success');
            recentCommentsIcon.classList.add('bi-check-lg');
        } else {
            recentCommentsIcon.classList.remove('bi-check-lg');
            show_comments_button.classList.remove('btn-success');
            show_comments_button.classList.add('btn-danger');
            recentCommentsIcon.classList.add('bi-x-lg');
        }
    });
    async function validateImageURL(url) {
        try {
            const proxyUrl = `https://proxy.wyzie.ru/${url}`;    
            // Make the fetch request to the proxy with 'HEAD' method
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Origin': '' // This may be optional, depending on your proxy configuration
                }
            });
    
            if (response.ok) {
                return url; // The URL is valid
            } else {
                return 'None'; // The URL is invalid
            }
        } catch (error) {
            console.log('Error fetching the URL:', error);
            return 'None'; // Error or invalid URL
        }
    }
    document.getElementById('open-chat-button').addEventListener('click', function() {
        document.getElementById('chat-popup').style.display = 'flex';
        document.getElementById('open-chat-button').style.display = 'none';
    });
    
    document.getElementById('close-chat-popup').addEventListener('click', function() {
        document.getElementById('chat-popup').style.display = 'none';
        document.getElementById('open-chat-button').style.display = 'block';
    });
    
    document.getElementById('send-chat-message').addEventListener('click', function() {
        sendMessage();
    });
    
    document.getElementById('chat-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    const save_settings_button = document.getElementById('settings-submit');
    const save_settings_loading = document.getElementById('settings-loading');
    save_settings_button.addEventListener('click', async function(event) {
        event.preventDefault(); // Prevent form submission
        save_settings_loading.style.display = 'block';
        save_settings_button.disabled = true;
    
        // Assemble the request body with boolean values
        const settingsBody = {
            profile_public: profile_public_button.querySelector('i').classList.contains('bi-check-lg'), // true or false
            hide_followers: !hide_followers_button.querySelector('i').classList.contains('bi-check-lg'), // true or false
            hide_following: !hide_following_button.querySelector('i').classList.contains('bi-check-lg'), // true or false
            show_recent_comments: show_comments_button.querySelector('i').classList.contains('bi-check-lg'), // true or false
            banner_discord: !use_discord_banner_button.querySelector('i').classList.contains('bi-check-lg'), // true or false
        };
    
        const token = getCookie('token');
    
        // Send the request to the server
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/settings/update?user=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settingsBody),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
    
            let image = String(input.value); 
            let validImage
            if (image) {
                validImage = await validateImageURL(image);
            }
            
            if (validImage !== 'None') {
                image = validImage;
            } else {
                const discord_banner_button = use_discord_banner_button.querySelector('i').classList.contains('bi-check-lg');
                if (discord_banner_button) {
                    image = 'NONE';
                } else {
                    image = 'INVALID';
                    AlertToast('Invalid image URL. Please enter a valid image URL.');
                }
            }
    
            if (image === 'INVALID') {
                return; // Exit if the image is invalid
            }
    
            const url = `https://api.jailbreakchangelogs.xyz/users/background/update?user=${token}&image=${image}`;
            
            const backgroundResponse = await fetch(url, {
                method: 'POST',
            });
    
            if (!backgroundResponse.ok) {
                throw new Error(`HTTP error! status: ${backgroundResponse.status}`);
            }
    
            const backgroundData = await backgroundResponse.json();
            save_settings_loading.style.display = 'none';
            save_settings_button.disabled = false;
            settings_modal.style.display = 'none';
            SuccessToast('Settings saved successfully!');
            window.location.reload(); // Refresh the page to reflect the new settings
    
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    });

    const close_settings_button = document.getElementById('close-settings');
    const settings_modal = document.getElementById('settingsModal');
    close_settings_button.addEventListener('click', function() {
        settings_modal.style.display = 'none';
    });
});