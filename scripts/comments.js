class CommentsManager {
  constructor(type, itemId, itemName = null) {
    this.sortOrder = sessionStorage.getItem("commentsSort") || "newest";
    if (window.commentsManagerInstance) {
      return window.commentsManagerInstance;
    }

    this.type = type;
    this.itemId = itemId;
    this.itemName = itemName;
    this.currentPage = 1;
    this.commentsPerPage = 7;
    this.comments = [];
    this.currentEditingComment = null;
    this._isLoading = false;
    this._renderTimeout = null;
    this.currentUserPremiumType = 0; // Default to free tier
    this.characterLimits = {
      0: 200,  // Free tier
      1: 400,  // Supporter tier 1
      2: 800,  // Supporter tier 2
      3: Infinity // Supporter tier 3 (unlimited)
    };

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (this.initializeElements()) {
          this.setupEventListeners();
        }
      });
    } else {
      if (this.initializeElements()) {
        this.setupEventListeners();
      }
    }

    window.commentsManagerInstance = this;
    return this;
  }

  checkLoginStatus() {
    const token = getCookie("token");

    if (!this.input || !this.submitBtn || !this.charCounter) {
      console.error("[Debug] Elements not found in checkLoginStatus");
      return false;
    }

    if (!token) {
      this.input.disabled = true;
      this.input.placeholder = "Please login to comment";
      this.submitBtn.textContent = "Login";
      this.submitBtn.classList.add("btn-secondary");
      this.submitBtn.classList.remove("btn-primary");
      this.charCounter.style.display = "none";
      this.submitBtn.disabled = false;
      return false;
    }

    // Get user's premium type when logged in
    fetch(`https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}`)
      .then(response => response.json())
      .then(userData => {
        this.currentUserPremiumType = userData.premiumtype || 0;
        const charLimit = this.characterLimits[this.currentUserPremiumType];
        document.getElementById('char-limit').textContent = charLimit === Infinity ? 'Unlimited' : charLimit;
        this.charCounter.style.display = "block";
      })
      .catch(error => {
        console.error("Error fetching user premium status:", error);
        this.currentUserPremiumType = 0;
      });

    this.input.disabled = false;
    this.input.placeholder = "Write a comment...";
    this.submitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<g fill="none">
		<path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" />
		<path fill="#fff" d="M20.235 5.686c.432-1.195-.726-2.353-1.921-1.92L3.709 9.048c-1.199.434-1.344 2.07-.241 2.709l4.662 2.699l4.163-4.163a1 1 0 0 1 1.414 1.414L9.544 15.87l2.7 4.662c.638 1.103 2.274.957 2.708-.241z" />
	</g>
</svg>
        Submit
    `;
    this.submitBtn.classList.add("btn-primary");
    this.submitBtn.classList.remove("btn-secondary");
    this.submitBtn.disabled = false; // Make sure to enable the submit button
    return true;
  }

  initializeElements() {
    this.form = document.getElementById("comment-form");
    this.sortSelect = document.getElementById("comment-sort");
    this.input = document.getElementById("commenter-text");
    this.submitBtn = document.getElementById("submit-comment");
    this.commentsList = document.getElementById("comments-list");
    this.paginationControls = document.getElementById("paginationControls");
    this.commentsHeader = document.getElementById("comment-header");

    const editModalElement = document.getElementById("editCommentModal");

    this.charCounter = document.getElementById("char-counter");
    const valid = this.form && this.input && this.submitBtn && this.commentsList && 
                 this.paginationControls && this.commentsHeader && editModalElement && 
                 this.charCounter;
    
    if (!valid) {
      console.error("[Debug] Required comment elements not found!");
      return false;
    }

    this.editModal = new bootstrap.Modal(editModalElement);

    // Initialize input state
    this.input.disabled = !this.checkLoginStatus();
    this.input.placeholder = this.checkLoginStatus()
      ? "Write a comment..."
      : "Login to comment";

    // Initialize char counter with current input value if any
    if (this.input && this.charCounter) {
      const currentLength = this.input.value.length;
      const charCount = document.getElementById('char-count');
      if (charCount) {
        charCount.textContent = currentLength;
        
        // Check if over limit
        const charLimit = this.characterLimits[this.currentUserPremiumType];
        if (currentLength > charLimit && charLimit !== Infinity) {
          charCount.style.color = '#dc3545';
          this.submitBtn.disabled = true;
          this.charCounter.classList.add('over-limit');
          
          let warning = document.querySelector('.char-limit-warning');
          if (!warning) {
            warning = document.createElement('div');
            warning.className = 'char-limit-warning text-danger small mt-1';
            warning.innerHTML = `You've exceeded the ${charLimit} character limit for your current Supporter tier. <a href="/supporting" class="text-primary">Upgrade your tier</a> for a higher limit!`;
            this.charCounter.after(warning);
          }
        } else {
          charCount.style.color = '';
          this.submitBtn.disabled = false;
          this.charCounter.classList.remove('over-limit');
          
          const warning = document.querySelector('.char-limit-warning');
          if (warning) warning.remove();
        }
      }
    }

    if (this.sortSelect) {
      this.sortSelect.value = this.sortOrder;
      this.sortSelect.addEventListener("change", () => {
        this.sortOrder = this.sortSelect.value;
        // Store the preference in sessionStorage
        sessionStorage.setItem("commentsSort", this.sortOrder);
        this.renderComments();
      });
    }

    return true;
  }

  setupEventListeners() {
    if (!this.form || !this.input || !this.submitBtn) {
      console.error(
        "[Debug] Cannot setup event listeners - elements not found"
      );
      return;
    }

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();

      const content = this.input.value.trim();

      if (!this.checkLoginStatus()) {
        const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
        loginModal.show();
        return;
      }

      if (!content) {
        return;
      }

      this.submitComment();
    });

    // Setup save edited comment button
    const saveEditBtn = document.getElementById("saveCommentEdit");
    if (saveEditBtn) {
      saveEditBtn.addEventListener("click", () => this.saveEditedComment());
    }

    // Add input event listener for character counter
    if (this.input) {
      this.input.addEventListener('input', () => {
        const currentLength = this.input.value.length;
        const charLimit = this.characterLimits[this.currentUserPremiumType];
        const charCount = document.getElementById('char-count');
        
        if (charCount) {
          charCount.textContent = currentLength;
          const charCounter = document.getElementById('char-counter');
          
          if (currentLength > charLimit && charLimit !== Infinity) {
            charCount.style.color = '#dc3545'; // Bootstrap danger color
            this.submitBtn.disabled = true;
            charCounter.classList.add('over-limit');
            
            // Show warning if over limit
            let warning = document.querySelector('.char-limit-warning');
            if (!warning) {
              warning = document.createElement('div');
              warning.className = 'char-limit-warning text-danger small mt-1';
              warning.innerHTML = `You've exceeded the ${charLimit} character limit for your current Supporter tier. <a href="/supporting" class="text-primary">Upgrade your tier</a> for a higher limit!`;
              charCounter.after(warning);
            }
          } else {
            charCount.style.color = ''; // Reset to default
            this.submitBtn.disabled = false;
            charCounter.classList.remove('over-limit');
            
            // Remove warning if under limit
            const warning = document.querySelector('.char-limit-warning');
            if (warning) warning.remove();
          }
        }
      });
    }

    // Initial login status check
    this.checkLoginStatus();
  }

  // In comments.js
  updateCommentsHeader() {
    if (!this.commentsHeader) return;

    let headerText;
    switch (this.type) {
      case "changelog":
        headerText = `Comments for Changelog #${this.itemId}`;
        break;
      case "season":
        headerText = `Comments for Season ${this.itemId}`;
        break;
      case "trade":
        headerText = `Comments for Trade #${this.itemId}`;
        break;
      default:
        // For items (vehicles, rims, etc.)
        if (this.itemName) {
          headerText = `Comments for ${this.itemName} [${
            this.type.charAt(0).toUpperCase() + this.type.slice(1)
          }]`;
        } else {
          headerText = `Comments for ${
            this.type.charAt(0).toUpperCase() + this.type.slice(1)
          } #${this.itemId}`;
        }
    }
    this.commentsHeader.textContent = headerText;
  }

  clearComments() {
    if (!this.commentsList || !this.paginationControls) {
      console.error("[Debug] Cannot clear comments - elements not initialized");
      return;
    }

    this.comments = [];
    this.currentPage = 1;
    this.commentsList.innerHTML = "";
    this.paginationControls.style.display = "none";
  }

  async loadComments() {
    if (this._isLoading) return;

    // Check if elements are initialized
    if (!this.commentsList || !this.paginationControls) {
      console.error("[Debug] Comments elements not initialized yet");
      if (!this.initializeElements()) {
        console.error("[Debug] Failed to initialize elements");
        return;
      }
    }

    // Only verify item existence for item types, not changelogs
    if (this.type !== "changelog" && this.itemName) {
      try {
        // Use the existing API response from item.js
        const itemResponse = await window.itemApiResponse;
        
        if (!itemResponse.ok) {
          const commentsSection = document.querySelector(".comment-container");
          if (commentsSection) {
            commentsSection.style.display = "none";
            window.commentsManagerInstance = null;
          }
          return;
        }
      } catch (error) {
        console.error("[Debug] Error verifying item existence:", error);
        return;
      }
    }

    this._isLoading = true;
    this.clearComments();

    // Show skeleton loaders immediately
    this.commentsList.innerHTML = Array(3)
      .fill()
      .map(
        () => `
        <li class="list-group-item skeleton-comment">
          <div class="d-flex">
            <div class="skeleton-avatar"></div>
            <div class="flex-grow-1 ms-3">
              <div class="skeleton-text short"></div>
              <div class="skeleton-text medium"></div>
              <div class="skeleton-text long"></div>
            </div>
          </div>
          <div class="skeleton-shimmer"></div>
        </li>
      `
      )
      .join("");

    try {
      const response = await fetch(
        `https://api.testing.jailbreakchangelogs.xyz/comments/get?type=${this.type}&id=${this.itemId}&nocache=true`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );

      if (response.status === 404) {
        this.commentsList.innerHTML = `
          <li class="list-group-item text-center border-0" style="background-color: transparent;">
            <div class="py-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M12 23a1 1 0 0 1-1-1v-3H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4.1l-3.7 3.71c-.2.18-.44.29-.7.29zm-9-8H1V3a2 2 0 0 1 2-2h16v2H3z"/></svg>
              <p class="mb-0 text-muted">No comments yet</p>
              <p class="small text-muted mb-0">Be the first to share your thoughts!</p>
            </div>
          </li>
        `;
        this.paginationControls.style.display = "none";
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch comments");

      const data = await response.json();
      this.comments = data;
      await this.renderComments();
    } catch (error) {
      console.error("[CommentsManager] Error loading comments:", error);
      // ...existing error handling code...
    } finally {
      this._isLoading = false;
    }
  }

  async renderComments() {
    if (this._renderTimeout) {
      clearTimeout(this._renderTimeout);
    }

    // Show skeleton loaders
    this.commentsList.innerHTML = Array(3)
      .fill()
      .map(
        () => `
        <li class="list-group-item skeleton-comment">
          <div class="d-flex">
            <div class="skeleton-avatar"></div>
            <div class="flex-grow-1 ms-3">
              <div class="skeleton-text short"></div>
              <div class="skeleton-text medium"></div>
              <div class="skeleton-text long"></div>
            </div>
          </div>
          <div class="skeleton-shimmer"></div>
        </li>
      `
      )
      .join("");

    try {
      // Sort comments based on date
      const commentsToRender = [...this.comments].sort((a, b) => {
        const dateA = parseInt(a.date);
        const dateB = parseInt(b.date);
        return this.sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });

      if (commentsToRender.length === 0) {
        this.commentsList.innerHTML = `
          <li class="list-group-item text-center border-0" style="background-color: transparent;">
            <div class="py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M12 23a1 1 0 0 1-1-1v-3H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4.1l-3.7 3.71c-.2.18-.44.29-.7.29zm-9-8H1V3a2 2 0 0 1 2-2h16v2H3z"/></svg>
              <p class="mb-0 text-muted">No comments yet</p>
              <p class="small text-muted mb-0">Be the first to share your thoughts!</p>
            </div>
          </li>
        `;
        this.paginationControls.style.display = "none";
        return;
      }

      // Calculate pagination
      const totalPages = Math.ceil(
        commentsToRender.length / this.commentsPerPage
      );
      const startIndex = (this.currentPage - 1) * this.commentsPerPage;
      const endIndex = startIndex + this.commentsPerPage;
      const commentsToShow = commentsToRender.slice(startIndex, endIndex);

      // Generate all comments HTML first
      const allCommentsHTML = await Promise.all(
        commentsToShow.map((comment) => this.generateCommentHTML(comment))
      );

      // Create a temporary div to parse HTML
      const temp = document.createElement("div");
      temp.innerHTML = allCommentsHTML.join("");

      // Clear skeleton loaders and add actual comments
      this.commentsList.innerHTML = "";

      // Process all comments at once
      const commentElements = temp.children;
      const fragment = document.createDocumentFragment();

      Array.from(commentElements).forEach((commentElement, index) => {
        const comment = commentsToShow[index];
        this.processCommentElement(commentElement, comment, fragment);
      });

      this.commentsList.appendChild(fragment);

      // Handle pagination
      if (totalPages > 1) {
        this.renderPagination(totalPages);
        this.paginationControls.style.display = "flex";
      } else {
        this.paginationControls.style.display = "none";
      }
    } catch (error) {
      console.error("Error rendering comments:", error);
      this.commentsList.innerHTML = `
        <li class="list-group-item text-center text-danger">
          Error loading comments. Please try again.
        </li>
      `;
    }
  }

  // Helper method to process individual comment elements
  processCommentElement(commentElement, comment, fragment) {
    const commentText = commentElement.querySelector(".comment-text");
    const showMoreBtn = commentElement.querySelector(".show-more-btn");

    if (commentText && showMoreBtn) {
      fragment.appendChild(commentElement);
      this.commentsList.appendChild(fragment);

      if (commentText.scrollHeight > 300) {
        commentText.classList.add("truncated");
        showMoreBtn.classList.add("visible");
      }

      showMoreBtn.addEventListener("click", () => {
        const isExpanded = commentText.classList.contains("expanded");
        commentText.classList.toggle("expanded");
        commentText.classList.toggle("truncated");
        showMoreBtn.textContent = isExpanded ? "Show more" : "Show less";
      });
    }

    if (commentElement.querySelector(".comment-actions")) {
      this.setupCommentActions(commentElement, comment);
    }
  }

  async generateCommentHTML(comment) {
    const token = getCookie("token");
    let isOwner = false;
    let userDetails = null;

    try {
      if (comment.user_id) {
        userDetails = await this.fetchUserDetails(comment.user_id);
      }

      if (token) {
        const response = await fetch(
          `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}`
        );
        if (response.ok) {
          const userData = await response.json();
          isOwner = userData.id === comment.user_id;
        }
      }
    } catch (error) {
      console.error("Error generating comment HTML:", error);
    }

    const isOwnerComment = await this.isTradeOwner(comment.user_id);
    const premiumType = userDetails?.premiumtype || 0;

    const displayName = userDetails && userDetails.global_name !== "None"
      ? userDetails.global_name
      : userDetails
      ? userDetails.username
      : comment.author;

    let premiumBadge = '';
    if (premiumType > 0) {
      premiumBadge = `<a href="/supporting" class="premium-badge tier-${premiumType}">Tier ${premiumType}</a>`;
    }

    const userNameElement = userDetails?.isDeleted
      ? `<span class="comment-author text-muted">${displayName}</span>`
      : `<a href="/users/${comment.user_id}" class="comment-author">
          ${displayName}
          ${premiumBadge}
          ${isOwnerComment ? '<span class="op-badge">OP</span>' : ""}
         </a>`;

    const formatDate = (timestamp) => {
      return new Date(timestamp * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    };

    const displayDate = comment.edited_at
      ? `Last edited ${formatDate(comment.edited_at)}`
      : formatDate(comment.date);

    const fallbackAvatar = "assets/default-avatar.png";
    const avatarUrl = userDetails?.isDeleted 
      ? fallbackAvatar 
      : await window.checkAndSetAvatar(userDetails);

    const avatarElement = userDetails?.isDeleted
      ? `<div class="rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; background: #134d64;">${userDetails.avatar}</div>`
      : `<img src="${avatarUrl}" 
          class="rounded-circle me-2" 
          width="40" 
          height="40"
          onerror="this.src='${fallbackAvatar}'"
          alt="${displayName}'s avatar">`;

    return `
      <li class="list-group-item comment-item" data-comment-id="${comment.id}" data-premium="${premiumType}">
        <div class="d-flex align-items-start">
          ${avatarElement}
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-0">
                  ${userNameElement}
                </h6>
                <small class="text-muted">
                  ${displayDate}
                </small>
              </div>
              ${isOwner
                ? `<div class="comment-actions">
                    <button class="comment-actions-toggle" aria-label="Comment actions">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                        <rect width="16" height="16" fill="none" />
                        <path fill="currentColor" d="M9.5 13a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0" />
                      </svg>
                    </button>
                    <div class="comment-actions-menu d-none">
                      <button class="comment-action-item edit-comment">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                          <rect width="24" height="24" fill="none" />
                          <path fill="currentColor" d="m14.06 9.02l.92.92L5.92 19H5v-.92zM17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83l3.75 3.75l1.83-1.83a.996.996 0 0 0 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94z" />
                        </svg>Edit
                      </button>
                      <button class="comment-action-item delete-comment delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                          <rect width="24" height="24" fill="none" />
                          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                        </svg>Delete
                      </button>
                    </div>
                  </div>`
                : ""
              }
            </div>
            <div class="comment-content">
              <p class="comment-text mb-0">${this.escapeHtml(comment.content)}</p>
              <button class="show-more-btn">Show more</button>
            </div>
          </div>
        </div>
      </li>
    `;
  }

  generateActionButtons() {
    return `
      <div class="comment-actions">
        <button class="comment-actions-toggle" aria-label="Comment actions">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <rect width="16" height="16" fill="none" />
            <path fill="currentColor" d="M9.5 13a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0" />
          </svg>
        </button>
        <div class="comment-actions-menu d-none">
          <button class="comment-action-item edit-comment">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <rect width="24" height="24" fill="none" />
              <path fill="currentColor" d="m14.06 9.02l.92.92L5.92 19H5v-.92zM17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83l3.75 3.75l1.83-1.83a.996.996 0 0 0 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94z" />
            </svg>Edit
          </button>
          <button class="comment-action-item delete-comment delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <rect width="24" height="24" fill="none" />
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
            </svg>Delete
          </button>
        </div>
      </div>
    `;
  }

  async renderCommentItem(comment) {
    const token = getCookie("token");
    let isOwner = false;

    // First, get user details before creating any HTML
    let userDetails = null;
    if (comment.user_id) {
      try {
        userDetails = await this.fetchUserDetails(comment.user_id);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }

    // Determine display name from user details
    const displayName =
      userDetails && userDetails.global_name !== "None"
        ? userDetails.global_name
        : userDetails
        ? userDetails.username
        : comment.author;

    const userNameElement = userDetails?.isDeleted
      ? `<span class="comment-author text-muted">${displayName}</span>`
      : `<a href="/users/${comment.user_id}" class="comment-author">${displayName}</a>`;

    // Check ownership
    if (token) {
      try {
        const response = await fetch(
          `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}`
        );
        if (response.ok) {
          const userData = await response.json();
          isOwner = userData.id === comment.user_id;
        }
      } catch (error) {
        console.error("Error verifying comment ownership:", error);
      }
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    };

    const displayDate = comment.edited_at
      ? `Last edited ${formatDate(comment.edited_at)}`
      : formatDate(comment.date);

    // Use displayName for the fallback avatar
    const fallbackAvatar = "assets/default-avatar.png";

    const li = document.createElement("li");
    li.className = "list-group-item comment-item";
    li.dataset.commentId = comment.id;

    // Handle deleted user avatar differently
    const avatarElement = userDetails?.isDeleted
      ? `<div class="rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; background: #134d64;">${userDetails.avatar}</div>`
      : `<img src="${await window.checkAndSetAvatar(userDetails)}" 
          class="rounded-circle me-2" 
          width="40" 
          height="40"
          onerror="this.src='${fallbackAvatar}'"
          alt="${displayName}'s avatar">`;

    li.innerHTML = `
    <div class="d-flex align-items-start">
        ${avatarElement}
        <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">
                     ${userNameElement}
                    </h6>
                    <small class="text-muted">
                        ${displayDate}
                    </small>
                </div>
                ${
                  isOwner
                    ? `
                    <div class="comment-actions">
                        <button class="comment-actions-toggle" aria-label="Comment actions">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<path fill="currentColor" d="M9.5 13a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0" />
</svg>
                        </button>
                        <div class="comment-actions-menu d-none">
                            <button class="comment-action-item edit-comment">
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="m14.06 9.02l.92.92L5.92 19H5v-.92zM17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83l3.75 3.75l1.83-1.83a.996.996 0 0 0 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94z" />
</svg>Edit
                            </button>
                            <button class="comment-action-item delete-comment delete">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
</svg>Delete
                            </button>
                        </div>
                    </div>
                `
                    : ""
                }
            </div>
            <div class="comment-content">
                <p class="comment-text mb-0">${this.escapeHtml(
                  comment.content
                )}</p>
                <button class="show-more-btn">Show more</button>
            </div>
        </div>
    </div>
    `;

    // Rest of the code for comment text and show more button...
    const commentText = li.querySelector(".comment-text");
    const showMoreBtn = li.querySelector(".show-more-btn");

    setTimeout(() => {
      if (commentText.scrollHeight > 300) {
        commentText.classList.add("truncated");
        showMoreBtn.classList.add("visible");
      }
    }, 10);

    showMoreBtn.addEventListener("click", () => {
      const isExpanded = commentText.classList.contains("expanded");
      commentText.classList.toggle("expanded");
      commentText.classList.toggle("truncated");
      showMoreBtn.textContent = isExpanded ? "Show more" : "Show less";
    });

    if (isOwner) {
      this.setupCommentActions(li, comment);
    }

    this.commentsList.appendChild(li);
  }

  async fetchUserDetails(userId) {
    try {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/get/?id=${userId}`
      );

      // If user is not found (404), return default deleted user data
      if (response.status === 404) {
        return {
          username: "Deleted User",
          global_name: "Deleted User",
          id: userId,
          avatar: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 32 32">
	<rect width="32" height="32" fill="none" />
	<path fill="none" d="M8.007 24.93A4.996 4.996 0 0 1 13 20h6a4.996 4.996 0 0 1 4.993 4.93a11.94 11.94 0 0 1-15.986 0M20.5 12.5A4.5 4.5 0 1 1 16 8a4.5 4.5 0 0 1 4.5 4.5" />
	<path fill="currentColor" d="M26.749 24.93A13.99 13.99 0 1 0 2 16a13.9 13.9 0 0 0 3.251 8.93l-.02.017c.07.084.15.156.222.239c.09.103.187.2.28.3q.418.457.87.87q.14.124.28.242q.48.415.99.782c.044.03.084.069.128.1v-.012a13.9 13.9 0 0 0 16 0v.012c.044-.031.083-.07.128-.1q.51-.368.99-.782q.14-.119.28-.242q.451-.413.87-.87c.093-.1.189-.197.28-.3c.071-.083.152-.155.222-.239l-.02-.017zM8.007 24.93A4.996 4.996 0 0 1 13 20h6a4.996 4.996 0 0 1 4.993 4.93a11.94 11.94 0 0 1-15.986 0M20.5 12.5A4.5 4.5 0 1 1 16 8a4.5 4.5 0 0 1 4.5 4.5" />
</svg>`,
          isDeleted: true,
        };
      }

      if (!response.ok) throw new Error("Failed to fetch user details");
      return await response.json();
    } catch (error) {
      console.error("Error fetching user details:", error);
      return;
    }
  }

  renderPagination(totalPages) {
    if (totalPages <= 1) {
      this.paginationControls.style.display = "none";
      return;
    }

    this.paginationControls.style.display = "flex";

    // Create an array of page numbers to show
    let pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    if (totalPages <= maxVisiblePages) {
      // If total pages is less than max visible, show all pages
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Calculate range of pages to show
      let start = Math.max(this.currentPage - halfVisible, 1);
      let end = Math.min(start + maxVisiblePages - 1, totalPages);

      // Adjust start if we're near the end
      if (end === totalPages) {
        start = Math.max(end - maxVisiblePages + 1, 1);
      }

      // Generate page numbers
      pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

      // Add ellipsis if needed
      if (start > 1) {
        pages.unshift(1);
        if (start > 2) pages.splice(1, 0, "...");
      }
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    // Generate pagination HTML
    this.paginationControls.innerHTML = `
      <button class="btn btn-sm btn-primary pagination-btn me-2" 
              ${this.currentPage === 1 ? "disabled" : ""}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="none" />
          <path fill="currentColor" d="m14 18l-6-6l6-6l1.4 1.4l-4.6 4.6l4.6 4.6z" />
        </svg>
      </button>
      ${pages
        .map((page) => {
          if (page === "...") {
            return `<span class="px-2">...</span>`;
          }
          return `
          <button class="btn btn-sm ${
            this.currentPage === page ? "btn-primary" : "btn-outline-primary"
          } mx-1"
                  ${this.currentPage === page ? "disabled" : ""}>
            ${page}
          </button>
        `;
        })
        .join("")}
      <button class="btn btn-sm btn-primary pagination-btn ms-2" 
              ${this.currentPage === totalPages ? "disabled" : ""}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="none" />
          <path fill="currentColor" d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z" />
        </svg>
      </button>
    `;

    // Add event listeners
    const [prevBtn, ...pageButtons] =
      this.paginationControls.querySelectorAll("button");
    const nextBtn = pageButtons.pop();

    prevBtn.addEventListener("click", () =>
      this.changePage(this.currentPage - 1)
    );
    nextBtn.addEventListener("click", () =>
      this.changePage(this.currentPage + 1)
    );

    pageButtons.forEach((btn) => {
      const pageNum = parseInt(btn.textContent);
      if (!isNaN(pageNum)) {
        btn.addEventListener("click", () => this.changePage(pageNum));
      }
    });
  }

  changePage(newPage) {
    if (
      newPage < 1 ||
      newPage > Math.ceil(this.comments.length / this.commentsPerPage)
    ) {
      return;
    }
    this.currentPage = newPage;
    this.renderComments();
  }
  setupCommentActions(commentElement, comment) {
    const toggleBtn = commentElement.querySelector(".comment-actions-toggle");
    const menu = commentElement.querySelector(".comment-actions-menu");
    const editBtn = commentElement.querySelector(".edit-comment");
    const deleteBtn = commentElement.querySelector(".delete-comment");

    if (!toggleBtn || !menu || !editBtn || !deleteBtn) {
      console.warn(
        "[Debug] Missing some action elements for comment:",
        comment.id
      );
      return;
    }

    // Close all other menus when clicking a toggle button
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // First close all other menus
      document
        .querySelectorAll(".comment-actions-menu")
        .forEach((otherMenu) => {
          if (otherMenu !== menu) {
            otherMenu.classList.add("d-none");
          }
        });

      // Then toggle this menu
      menu.classList.toggle("d-none");
    });

    // Close menu when clicking anywhere else
    document.addEventListener("click", () => {
      menu.classList.add("d-none");
    });

    if (editBtn) {
      editBtn.addEventListener("click", () => this.editComment(comment));
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => this.deleteComment(comment.id));
    }
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async submitComment() {
    if (!this.input) {
      console.error("[Debug] Input element not found");
      return;
    }

    const content = this.input.value.trim();
    const charLimit = this.characterLimits[this.currentUserPremiumType];
    
    if (content.length > charLimit && charLimit !== Infinity) {
      notyf.error(`Your comment exceeds the ${charLimit} character limit for your current Supporter tier. Visit /supporting to upgrade your tier!`);
      return;
    }

    const token = getCookie("token");
    if (!token) {
      console.error("[Debug] No token found, submission cancelled");
      return;
    }

    try {
      const userResponse = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}`
      );

      if (!userResponse.ok) {
        console.error("[Debug] Failed to get user data:", userResponse.status);
        throw new Error("Failed to get user data");
      }
      const userData = await userResponse.json();

      const commentData = {
        author: userData.username,
        content: content,
        item_id: this.itemId,
        item_type: this.type,
        user_id: userData.id,
        owner: token,
      };

      const response = await fetch(
        "https://api.testing.jailbreakchangelogs.xyz/comments/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify(commentData),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("rate_limit");
        }
        throw new Error("Failed to submit comment");
      }

      this.input.value = "";
      // Reset character counter
      const charCount = document.getElementById('char-count');
      if (charCount) {
        charCount.textContent = "0";
        charCount.style.color = ''; // Reset color
        this.charCounter.classList.remove('over-limit');
        const warning = document.querySelector('.char-limit-warning');
        if (warning) warning.remove();
      }
      await this.loadComments();
      notyf.success("Comment added successfully");
    } catch (error) {
      console.error("[Debug] Error in submitComment:", error);

      if (error.message === "rate_limit" || error.response?.status === 429) {
        notyf.warning(
          "You're being rate limited. Please wait a moment before trying again.",
          "Rate Limit"
        );
      } else {
        notyf.error("Failed to post comment. Please try again.");
      }
    }
  }

  async deleteComment(commentId) {
    const token = getCookie("token");
    if (!token) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      // First get user data to get the author
      const userResponse = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}`
      );

      if (!userResponse.ok) {
        throw new Error("Failed to get user data");
      }

      const userData = await userResponse.json();

      // Now send delete request with correct field names
      const response = await fetch(
        "https://api.testing.jailbreakchangelogs.xyz/comments/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({
            id: String(commentId),
            owner: token,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete comment");

      notyf.success("Comment deleted successfully");
      await this.loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      notyf.error("Failed to delete comment. Please try again.");
    }
  }

  editComment(comment) {
    if (!this.editModal) {
      console.error("[Debug] Edit modal not initialized");
      return;
    }

    const editCommentText = document.getElementById("editCommentText");
    if (!editCommentText) {
      console.error("[Debug] Edit comment text area not found");
      return;
    }

    this.currentEditingComment = comment;
    editCommentText.value = comment.content;
    this.editModal.show();
  }

  async saveEditedComment() {
    if (!this.currentEditingComment) return;
    if (!this.editModal) {
      console.error("[Debug] Edit modal not initialized");
      return;
    }

    const token = getCookie("token");
    if (!token) return;

    const editCommentText = document.getElementById("editCommentText");
    if (!editCommentText) {
      console.error("[Debug] Edit comment text area not found");
      return;
    }

    const newContent = document.getElementById("editCommentText").value.trim();
    if (!newContent) return;

    try {
      const response = await fetch(
        "https://api.testing.jailbreakchangelogs.xyz/comments/edit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({
            id: this.currentEditingComment.id,
            content: newContent,
            author: token,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to edit comment");

      this.editModal.hide();
      notyf.success("Comment edited successfully");
      await this.loadComments();
    } catch (error) {
      console.error("Error editing comment:", error);
      notyf.error("Failed to edit comment. Please try again.");
    }
  }

  async isTradeOwner(userId) {
    if (this.type !== "trade") return false;

    try {
      const tradeResponse = await fetch(
        `https://api.testing.jailbreakchangelogs.xyz/trades/get?id=${this.itemId}`
      );
      if (!tradeResponse.ok) return false;

      const tradeData = await tradeResponse.json();
      return tradeData.author === userId;
    } catch (error) {
      console.error("Error checking trade ownership:", error);
      return false;
    }
  }
}
