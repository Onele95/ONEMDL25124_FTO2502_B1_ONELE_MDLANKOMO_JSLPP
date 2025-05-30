// scripts.js

import { fetchTasks, createTask, updateTask, deleteTask } from './apiHandler.js';

// Global array to hold current tasks, populated from the API
let tasks = [];

// Global variable to store the task currently being viewed/edited in the modal
let currentTaskInModal = null; // THIS IS CRUCIAL!

// --- DOM Element References for Task Detail Modal (Declared once globally for efficiency) ---
const taskDetailModal = document.getElementById("task-modal");
const closeTaskDetailModalBtn = document.getElementById("close-task-modal-btn");
const taskDetailTitleInput = document.getElementById("task-detail-title");
const taskDetailDescInput = document.getElementById("task-detail-desc");
const taskDetailStatusSelect = document.getElementById("task-detail-status");
const editTaskBtn = document.getElementById("edit-task-btn");
const saveTaskBtn = document.getElementById("save-task-btn");



// --- DOM Element References for Add New Task Modal ---
const addTaskBtn = document.getElementById('add-task-btn');
const addTaskModal = document.getElementById('add-task-modal');
const closeAddTaskModalBtn = document.getElementById('close-add-task-modal-btn');
const addTaskForm = document.getElementById('add-task-form');
// createNewTaskBtn is likely the form's submit button, so a direct const might not be strictly needed
// const createNewTaskBtn = document.getElementById('create-task-btn');

/**
 * Creates a single task DOM element.
 * @param {Object} task - Task data object.
 * @returns {HTMLElement} The created task div element.
 */
function createTaskElement(task) {
  const taskDiv = document.createElement("div");
  taskDiv.className = "task-div";
  taskDiv.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description ? task.description.substring(0, 50) + (task.description.length > 50 ? '...' : '') : 'No description'}</p>
    `;
  taskDiv.dataset.taskId = task.id; // Store ID for later retrieval (from API)

  taskDiv.addEventListener("click", () => {
    openTaskDetailModal(task);
  });

  return taskDiv;
}

/**
 * Finds the task container element based on task status.
 * @param {string} status - The task status ('todo', 'doing', or 'done').
 * @returns {HTMLElement|null} The container element, or null if not found.
 */
function getTaskContainerByStatus(status) {
  const column = document.querySelector(`.column-div[data-status="${status}"]`);
  return column ? column.querySelector(".tasks-container") : null;
}

/**
 * Clears all existing task-divs from all task containers.
 */
function clearExistingTasks() {
  document.querySelectorAll(".tasks-container").forEach((container) => {
    container.innerHTML = "";
  });
}

/**
 * Renders all tasks from the 'tasks' array (global) to the UI.
 * Groups tasks by status and appends them to their respective columns.
 * Also updates the task counts in column headers.
 */
function renderTasks() {
    clearExistingTasks(); // Always clear existing tasks before re-rendering

    // Calculate counts for each status
    const todoCount = tasks.filter(task => task.status === 'todo').length;
    const doingCount = tasks.filter(task => task.status === 'doing').length;
    const doneCount = tasks.filter(task => task.status === 'done').length;

    // Update column header texts with current counts
    const todoHeader = document.getElementById('toDoText');
    const doingHeader = document.getElementById('doingText');
    const doneHeader = document.getElementById('doneText');

    if (todoHeader) todoHeader.textContent = `TODO (${todoCount})`;
    if (doingHeader) doingHeader.textContent = `DOING (${doingCount})`;
    if (doneHeader) doneHeader.textContent = `DONE (${doneCount})`;

    // Append tasks to their respective containers
    tasks.forEach((task) => {
        const container = getTaskContainerByStatus(task.status);
        if (container) {
            const taskElement = createTaskElement(task);
            container.appendChild(taskElement);
        }
    });
}

/**
 * Enables or disables editing fields in the task detail modal.
 * Also toggles visibility of Edit/Save buttons.
 * @param {boolean} enable - True to enable editing, false to disable.
 */
function toggleEditMode(enable) {
    // Use the globally defined DOM element references (taskDetailTitleInput, etc.)
    taskDetailTitleInput.readOnly = !enable;
    taskDetailDescInput.readOnly = !enable;
    taskDetailStatusSelect.disabled = !enable;

    if (enable) {
        editTaskBtn.style.display = 'none'; // Hide Edit
        saveTaskBtn.style.display = 'inline-block'; // Show Save
    } else {
        editTaskBtn.style.display = 'inline-block'; // Show Edit
        saveTaskBtn.style.display = 'none'; // Hide Save
    }
}

/**
 * Opens the task detail modal dialog with pre-filled task details.
 * @param {Object} task - The task object to display in the modal.
 */
function openTaskDetailModal(task) {
  currentTaskInModal = task; // Store the task that was clicked

  // Populate the fields using the globally defined references
  taskDetailTitleInput.value = task.title;
  taskDetailDescInput.value = task.description;
  taskDetailStatusSelect.value = task.status;

  // Set to view-only mode initially
  toggleEditMode(false);
  taskDetailModal.showModal();
}

/**
 * Handles saving changes made in the task detail modal to the API.
 */
async function handleSaveTaskChanges() { // Mark as async
    if (!currentTaskInModal) return; // Should not happen if modal was opened correctly

    const updatedTitle = taskDetailTitleInput.value.trim();
    const updatedDescription = taskDetailDescInput.value.trim();
    const updatedStatus = taskDetailStatusSelect.value;

    if (!updatedTitle) {
        alert('Task title cannot be empty. Please enter a title.');
        return;
    }

    // Create an object with the updated properties for the API call
    const taskToUpdate = {
        id: currentTaskInModal.id, // Ensure ID is part of the object for PUT request
        title: updatedTitle,
        description: updatedDescription,
        status: updatedStatus
    };

    // Call the API to update the specific task
    const result = await updateTask(taskToUpdate); // Await the API call

    if (result) {
        // If API update was successful, update the local tasks array
        const taskIndex = tasks.findIndex(t => t.id === currentTaskInModal.id);
        if (taskIndex > -1) {
            tasks[taskIndex].title = updatedTitle;
            tasks[taskIndex].description = updatedDescription;
            tasks[taskIndex].status = updatedStatus;
        }
        renderTasks();    // Re-render the board to reflect changes (and move tasks)
        taskDetailModal.close(); // Close modal after saving
    } else {
        alert("Failed to save task changes to the server. Please try again.");
    }
}

/**
 * Sets up all event listeners related to the task detail modal (close, edit, save).
 */
function setupTaskDetailModalHandlers() {
  if (closeTaskDetailModalBtn) {
    closeTaskDetailModalBtn.addEventListener("click", () => {
      taskDetailModal.close();
    });
  }

  if (editTaskBtn) {
      editTaskBtn.addEventListener('click', () => toggleEditMode(true));
  }

  // Listen for the form submission within the task detail modal
  // This will be triggered when the "Save Changes" button (type="submit") is clicked
  taskDetailModal.querySelector('#task-detail-form').addEventListener('submit', (event) => {
    if (event.submitter && event.submitter.id === 'save-task-btn') {
      event.preventDefault(); // Prevent default dialog close to handle logic first
      handleSaveTaskChanges();
    }
  });
}

// --- New Task Modal Functionality ---

/**
 * Opens the "Add New Task" modal and resets its form.
 */
function openAddTaskModal() {
    addTaskForm.reset(); // Clear any previously entered values
    // Set default status if desired, e.g., to 'todo'
    document.getElementById('add-task-status-select').value = 'todo';
    addTaskModal.showModal();
}

/**
 * Handles the submission of the "Add New Task" form.
 * Creates a new task via API, adds it to the global tasks array, and re-renders the board.
 * @param {Event} event - The form submission event.
 */
async function handleAddTaskFormSubmit(event) { // Mark as async
    event.preventDefault(); // Prevent the default form submission (which would reload the page)

    // Get values from the form inputs using their unique IDs
    const title = document.getElementById('add-task-title-input').value.trim();
    const description = document.getElementById('add-task-description-input').value.trim();
    const status = document.getElementById('add-task-status-select').value;

    // Basic validation
    if (!title) {
        alert('Task title cannot be empty. Please enter a title.');
        return;
    }

    // Create task data object to send to API (API will assign the ID)
    const newTaskData = { title, description, status };

    // Call the API to create the task
    const createdTask = await createTask(newTaskData); // Await the API call

    if (createdTask) {
        tasks.push(createdTask); // Add the API-returned task (which now has an ID) to the local array
        renderTasks();
        addTaskModal.close();
    } else {
        alert("Failed to create task on the server. Please check your API connection.");
    }
}

/**
 * Sets up all event listeners related to the "Add New Task" modal.
 */
function setupAddTaskModalHandlers() {
    if (addTaskBtn) { // Check if the button exists before adding listener
        addTaskBtn.addEventListener('click', openAddTaskModal);
    }
    if (closeAddTaskModalBtn) { // Check if the button exists
        closeAddTaskModalBtn.addEventListener('click', () => addTaskModal.close());
    }
    if (addTaskForm) { // Check if the form exists
        addTaskForm.addEventListener('submit', handleAddTaskFormSubmit);
    }
}

const themeButton = document.getElementById('themeButton');

const body = document.body;

// Toggles the dark theme on the body and saves the preference to localStorage
function toggleTheme() {
  // Toggle the dark-theme class on the body
  body.classList.toggle('dark-theme');
  // Store the current theme in local storage for persistence
  localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Event listener for the theme button
themeButton.addEventListener('click', toggleTheme);

// Check for saved theme on page load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {

  body.classList.add('dark-theme');
}

/**
 * Initializes the entire Kanban board application by fetching tasks from the API.
 * This is the main entry point after the DOM is loaded.
 */
async function initApp() { // Mark as async
    tasks = await fetchTasks(); // Fetch tasks from API

    // If API returns no tasks, the board will simply be empty.
    // The initialTasks fallback and saveTasks are no longer needed if API is the source of truth.
    // if (tasks.length === 0) {
    //     tasks = initialTasks;
    //     saveTasks(tasks);
    // }

    renderTasks();
    setupTaskDetailModalHandlers(); // Use the consolidated handler
    setupAddTaskModalHandlers();

    if (window.innerWidth <= 768) {
        setupMobileMenu();
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
      // Reset mobile menu state when resizing to desktop
      document.querySelector('.mobile-overlay').classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
      document.getElementById('side-bar-div').classList.remove('show-mobile');
    }
    });
}

// Attach the initApp function to the DOMContentLoaded event
// This ensures all HTML elements are available before the script tries to interact with them.
document.addEventListener("DOMContentLoaded", initApp);

// Add these to your scripts.js file

// DOM Elements
const sidebar = document.getElementById('side-bar-div');
const hideSidebarBtn = document.getElementById('hide-sidebar-btn');
const showSidebarBtn = document.getElementById('show-sidebar-btn');
const layout = document.getElementById('layout');
// Mobile menu functionality
const mobileLogo = document.getElementById('mobile-logo-toggle');
const mobileOverlay = document.createElement('div');
mobileOverlay.className = 'mobile-overlay';
document.body.appendChild(mobileOverlay);



// Event listeners
hideSidebarBtn.addEventListener('click', () => toggleSidebar(false));
showSidebarBtn.addEventListener('click', () => toggleSidebar(true));

// Initialize sidebar state (optional - you could load from localStorage)
const savedSidebarState = localStorage.getItem('sidebarVisible');
if (savedSidebarState === 'false') {
  toggleSidebar(false);
} else if (window.innerWidth <= 768) {
  // On mobile, start with sidebar hidden
  toggleSidebar(false);
}

// Update localStorage when sidebar state changes
hideSidebarBtn.addEventListener('click', () => {
  localStorage.setItem('sidebarVisible', 'false');
});

showSidebarBtn.addEventListener('click', () => {
  localStorage.setItem('sidebarVisible', 'true');
});


// Toggle sidebar visibility
function toggleSidebar(show) {
   const sidebar = document.getElementById('side-bar-div');
  const showSidebarBtn = document.getElementById('show-sidebar-btn');
  
  if (show) {
    sidebar.style.transform = 'translateX(0)';
    document.body.classList.remove('sidebar-hidden');
    showSidebarBtn.style.display = 'none';
  } else {
    sidebar.style.transform = 'translateX(-100%)';
    document.body.classList.add('sidebar-hidden');
    
    // Only show the floating show button on desktop
    if (window.innerWidth > 768) {
      showSidebarBtn.style.display = 'flex';
    }
  }
}

// Event listeners
hideSidebarBtn.addEventListener('click', () => toggleSidebar(false));
showSidebarBtn.addEventListener('click', () => toggleSidebar(true));


if (savedSidebarState === 'false') {
  toggleSidebar(false);
}

// Update localStorage when sidebar state changes
hideSidebarBtn.addEventListener('click', () => {
  localStorage.setItem('sidebarVisible', 'false');
});

showSidebarBtn.addEventListener('click', () => {
  localStorage.setItem('sidebarVisible', 'true');
});

// Handle window resize to ensure proper sidebar behavior
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    sidebar.style.display = 'flex';
    sidebar.classList.remove('show-mobile');
    mobileOverlay.classList.remove('active');
  } else {
    if (!layout.classList.contains('sidebar-hidden')) {
      sidebar.style.display = 'none';
    }
  }
});

// Mobile menu toggle functionality
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('side-bar-div');
  const mobileOverlay = document.createElement('div');
  mobileOverlay.className = 'mobile-overlay';
  document.body.appendChild(mobileOverlay);

  mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('show-mobile');
    mobileOverlay.classList.toggle('active');
    document.body.classList.toggle('mobile-menu-open');
  });

  mobileOverlay.addEventListener('click', () => {
    sidebar.classList.remove('show-mobile');
    mobileOverlay.classList.remove('active');
    document.body.classList.remove('mobile-menu-open');
  });
}
