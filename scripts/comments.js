class CommentsManager {
  constructor(type, itemId, itemName = null) {
    this.sortOrder = sessionStorage.getItem("commentsSort") || "newest";
    if (window.commentsManagerInstance) {
      return window.commentsManagerInstance;
    }

    toastr.options = {
      positionClass: "toast-bottom-right",
      timeOut: 3000,
      closeButton: true,
      progressBar: true,
    };

    this.type = type;
    this.itemId = itemId;
    this.itemName = itemName;
    this.currentPage = 1;
    this.commentsPerPage = 7;
    this.comments = [];
    this.currentEditingComment = null;
    this._isLoading = false;
    this._renderTimeout = null;

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
    const token = Cookies.get("token");

    if (!this.input || !this.submitBtn) {
      console.error("[Debug] Elements not found in checkLoginStatus");
      return false;
    }

    if (!token) {
      this.input.disabled = true;
      this.input.placeholder = "Please login to comment";
      this.submitBtn.textContent = "Login";
      this.submitBtn.classList.add("btn-secondary");
      this.submitBtn.classList.remove("btn-primary");
      // Don't disable the button when not logged in, so it can be clicked to redirect to login
      this.submitBtn.disabled = false;
      return false;
    }

    this.input.disabled = false;
    this.input.placeholder = "Write a comment...";
    this.submitBtn.textContent = "Submit";
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

    if (
      !this.form ||
      !this.input ||
      !this.submitBtn ||
      !this.commentsList ||
      !this.paginationControls ||
      !this.commentsHeader ||
      !editModalElement
    ) {
      console.error("[Debug] Required comment elements not found!");
      return false;
    }

    this.editModal = new bootstrap.Modal(editModalElement);

    // Initialize input state
    this.input.disabled = !this.checkLoginStatus();
    this.input.placeholder = this.checkLoginStatus()
      ? "Write a comment..."
      : "Login to comment";

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
        window.location.href = "/login";
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
    if (this._isLoading) {
      console.log("[Debug] Comments already loading, skipping");
      return;
    }

    console.log("[Debug] Starting loadComments");
    console.log("[Debug] Item details:", {
      type: this.type,
      itemId: this.itemId,
      itemName: this.itemName,
    });

    // Check if elements are initialized
    if (!this.commentsList || !this.paginationControls) {
      console.error("[Debug] Comments elements not initialized yet");
      if (!this.initializeElements()) {
        console.error("[Debug] Failed to initialize elements");
        return;
      }
    }

    try {
      console.log("[Debug] Verifying item existence");
      const itemResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
          this.itemName
        )}&type=${this.type}`
      );

      if (!itemResponse.ok) {
        console.log(
          "[Debug] Item verification failed, status:",
          itemResponse.status
        );
        // Fix: Use correct class selector with dot
        const commentsSection = document.querySelector(".comment-container");
        if (commentsSection) {
          console.log("[Debug] Hiding comments section");
          commentsSection.style.display = "none";
          window.commentsManagerInstance = null;
        } else {
          console.log("[Debug] Comments section not found");
        }
        return;
      }

      console.log("[Debug] Item verification successful");
    } catch (error) {
      console.error("[Debug] Error verifying item existence:", error);
      return;
    }

    this._isLoading = true;

    // Clear existing comments and update header first
    this.clearComments();

    // Show loading state
    this.commentsList.innerHTML = `
      <li class="list-group-item comments-loading">
        <div class="spinner mb-2"></div>
        <div>Loading comments...</div>
      </li>
    `;

    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/comments/get?type=${this.type}&id=${this.itemId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );

      // Handle 404 (no comments) separately
      if (response.status === 404) {
        this.commentsList.innerHTML = `
          <li class="list-group-item text-center" style="background-color: #212a31;">
            <div class="py-3">
              <i class="bi bi-chat-left-dots mb-2" style="font-size: 1.5rem; color: #6c757d;"></i>
              <p class="mb-0 text-muted">No comments yet</p>
              <p class="small text-muted mb-0">Be the first to share your thoughts!</p>
            </div>
          </li>
        `;
        this._isLoading = false;
        // Ensure pagination is hidden
        this.paginationControls.style.display = "none";
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch comments");

      const data = await response.json();
      this.comments = data;

      this.renderComments();
    } catch (error) {
      console.error("[CommentsManager] Error loading comments:", error);

      if (error.message === "rate_limit" || response?.status === 429) {
        this.commentsList.innerHTML = `
          <li class="list-group-item text-center text-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            You're being rate limited. Please wait a moment before trying again.
          </li>
        `;
        toastr.warning(
          "You're being rate limited. Please wait a moment before trying again.",
          "Rate Limit",
          {
            timeOut: 5000,
            closeButton: true,
            progressBar: true,
            positionClass: "toast-bottom-right",
          }
        );
      } else {
        this.commentsList.innerHTML = `
          <li class="list-group-item text-center text-danger">
            <i class="bi bi-exclamation-circle me-2"></i>
            Failed to load comments. Please try again.
          </li>
        `;
        if (!error.message.includes("404")) {
          toastr.error("Failed to load comments. Please try again.");
        }
      }
    } finally {
      this._isLoading = false;
    }
  }

  renderComments() {
    if (this._renderTimeout) {
      clearTimeout(this._renderTimeout);
    }

    // Show loading state immediately
    this.commentsList.innerHTML = `
    <li class="list-group-item comments-loading">
      <div class="spinner mb-2"></div>
      <div>Loading comments...</div>
    </li>
  `;

    this._renderTimeout = setTimeout(async () => {
      console.log("Starting renderComments...");
      this.commentsList.innerHTML = "";

      if (this.comments.length === 0) {
        this.commentsList.innerHTML = `
          <li class="list-group-item text-center" style="background-color: #212a31;">
              <div class="py-3">
                  <i class="bi bi-chat-left-dots mb-2" style="font-size: 1.5rem; color: #6c757d;"></i>
                  <p class="mb-0 text-muted">No comments yet</p>
                  <p class="small text-muted mb-0">Be the first to share your thoughts!</p>
              </div>
          </li>
        `;
        this.paginationControls.style.display = "none";
        return;
      }

      // Sort comments based on selection
      const commentsToRender = [...this.comments];
      if (this.sortOrder === "oldest") {
        commentsToRender.reverse();
      }

      // Calculate pagination indices
      const totalPages = Math.ceil(
        commentsToRender.length / this.commentsPerPage
      );
      const startIndex = (this.currentPage - 1) * this.commentsPerPage;
      const endIndex = startIndex + this.commentsPerPage;

      // Get comments for current page
      const commentsToShow = commentsToRender.slice(startIndex, endIndex);

      // Wait for all comments to render in sequence
      for (const comment of commentsToShow) {
        await this.renderCommentItem(comment);
      }

      // Handle pagination display
      if (totalPages > 1) {
        this.renderPagination(totalPages);
        this.paginationControls.style.display = "flex";
      } else {
        this.paginationControls.style.display = "none";
      }
    }, 50);
  }

  async renderCommentItem(comment) {
    const token = Cookies.get("token");
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

    // Check ownership
    if (token) {
      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`
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
    const fallbackAvatar = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      displayName
    )}&bold=true&format=svg`;

    const li = document.createElement("li");
    li.className = "list-group-item comment-item";
    li.dataset.commentId = comment.id;

    // Use the avatar from user details if available
    const avatarUrl = userDetails
      ? await window.checkAndSetAvatar(userDetails)
      : fallbackAvatar;

    li.innerHTML = `
    <div class="d-flex align-items-start">
        <img src="${avatarUrl}" 
            class="rounded-circle me-2" 
            width="40" 
            height="40"
            onerror="this.src='${fallbackAvatar}'"
            alt="${displayName}'s avatar">
        <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">
                        <a href="/users/${
                          comment.user_id
                        }" class="comment-author">${displayName}</a>
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
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <div class="comment-actions-menu d-none">
                            <button class="comment-action-item edit-comment">
                                <i class="bi bi-pencil me-2"></i>Edit
                            </button>
                            <button class="comment-action-item delete-comment delete">
                                <i class="bi bi-trash me-2"></i>Delete
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
        `https://api3.jailbreakchangelogs.xyz/users/get/?id=${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch user details");
      return await response.json();
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  }

  renderPagination(totalPages) {
    if (totalPages <= 1) {
      this.paginationControls.style.display = "none";
      return;
    }

    this.paginationControls.style.display = "flex";
    this.paginationControls.innerHTML = `
      <button class="btn btn-sm btn-primary pagination-btn me-2" 
              ${this.currentPage === 1 ? "disabled" : ""}>
        <i class="bi bi-chevron-left"></i>
      </button>
      <button class="btn btn-sm btn-primary pagination-btn ms-2" 
              ${this.currentPage === totalPages ? "disabled" : ""}>
        <i class="bi bi-chevron-right"></i>
      </button>
    `;

    const [prevBtn, nextBtn] =
      this.paginationControls.querySelectorAll("button");
    prevBtn.addEventListener("click", () =>
      this.changePage(this.currentPage - 1)
    );
    nextBtn.addEventListener("click", () =>
      this.changePage(this.currentPage + 1)
    );
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

    if (!content) {
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      console.error("[Debug] No token found, submission cancelled");
      return;
    }

    try {
      const userResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`
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
        "https://api3.jailbreakchangelogs.xyz/comments/add",
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
      await this.loadComments();
      toastr.success("Comment added successfully");
    } catch (error) {
      console.error("[Debug] Error in submitComment:", error);

      if (error.message === "rate_limit" || error.response?.status === 429) {
        toastr.warning(
          "You're being rate limited. Please wait a moment before trying again.",
          "Rate Limit",
          {
            timeOut: 5000,
            closeButton: true,
            progressBar: true,
            positionClass: "toast-bottom-right",
          }
        );
      } else {
        toastr.error("Failed to post comment. Please try again.");
      }
    }
  }

  async deleteComment(commentId) {
    const token = Cookies.get("token");
    if (!token) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      // First get user data to get the author
      const userResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`
      );

      if (!userResponse.ok) {
        throw new Error("Failed to get user data");
      }

      const userData = await userResponse.json();

      // Now send delete request with correct field names
      const response = await fetch(
        "https://api3.jailbreakchangelogs.xyz/comments/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({
            id: String(commentId),
            author: token,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete comment");

      toastr.success("Comment deleted successfully");
      await this.loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toastr.error("Failed to delete comment. Please try again.");
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

    const token = Cookies.get("token");
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
        "https://api3.jailbreakchangelogs.xyz/comments/edit",
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
      toastr.success("Comment edited successfully");
      await this.loadComments();
    } catch (error) {
      console.error("Error editing comment:", error);
      toastr.error("Failed to edit comment. Please try again.");
    }
  }
}
