// src/app.js

import { getTasks, createTask, updateTask, deleteTask } from './apiHandler.js'; // Import your API functions

/**
 * Creates a single task DOM element.
 * @param {Object} task - Task data object.
 * @param {string} task.title - Title of the task.
 * @param {string} task.id - Unique task ID.
 * @param {string} task.status - Status column: 'todo', 'doing', or 'done'.
 * @returns {HTMLElement} The created task div element.
 */
function createTaskElement(task) {
  const taskDiv = document.createElement("div");
  taskDiv.className = "task-div";
  taskDiv.textContent = task.title;
  taskDiv.dataset.taskId = task.id;

  taskDiv.addEventListener("click", () => {
    openTaskModal(task);
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
 * Renders all tasks from the provided array to the UI.
 * Groups tasks by status and appends them to their respective columns.
 * @param {Array<Object>} tasks - Array of task objects.
 */
function renderTasks(tasks) {
  clearExistingTasks(); // Clear existing tasks before rendering new ones
  tasks.forEach((task) => {
    const container = getTaskContainerByStatus(task.status);
    if (container) {
      const taskElement = createTaskElement(task);
      container.appendChild(taskElement);
    }
  });
}

/**
 * Opens the modal dialog with pre-filled task details.
 * @param {Object} task - The task object to display in the modal.
 */
function openTaskModal(task) {
  const modal = document.getElementById("task-modal");
  document.getElementById("task-title").value = task.title || '';
  document.getElementById("task-desc").value = task.description || '';
  document.getElementById("task-status").value = task.status || 'todo';
  modal.dataset.currentTaskId = task.id; // Store the task ID

  modal.showModal();
}

/**
 * Sets up modal close behavior for the task detail modal.
 */
function setupTaskModalCloseHandler() {
  const modal = document.getElementById("task-modal");
  const closeBtn = modal.querySelector(".close-btn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.close();
    });
  } else {
    console.error("Close button for task modal not found.");
  }

  // Event listener for saving changes
  const saveTaskChangesBtn = document.getElementById("save-task-changes-btn");
  if (saveTaskChangesBtn) {
    saveTaskChangesBtn.addEventListener("click", async () => {
      const taskId = modal.dataset.currentTaskId;
      const updatedTitle = document.getElementById("task-title").value;
      const updatedDescription = document.getElementById("task-desc").value;
      const updatedStatus = document.getElementById("task-status").value;

      if (!updatedTitle || !updatedStatus) {
        alert("Please ensure the task title and status are not empty.");
        return;
      }

      const updatedTask = {
        title: updatedTitle,
        description: updatedDescription,
        status: updatedStatus,
      };

      try {
        // Use the imported updateTask function
        await updateTask(taskId, updatedTask);
        console.log("Task updated successfully.");
        modal.close();
        fetchTasksAndRender(); // Re-render tasks to reflect changes
      } catch (error) {
        console.error("Error updating task:", error);
        alert(`Could not update task: ${error.message}`);
      }
    });
  } else {
    console.error("Save Changes button not found.");
  }

  // Event listener for deleting a task
  const deleteTaskBtn = document.getElementById("delete-task-btn");
  if (deleteTaskBtn) {
    deleteTaskBtn.addEventListener("click", async () => {
      const taskId = modal.dataset.currentTaskId;
      if (confirm("Are you sure you want to delete this task?")) {
        try {
          // Use the imported deleteTask function
          await deleteTask(taskId);
          console.log("Task deleted successfully.");
          modal.close();
          fetchTasksAndRender(); // Re-render tasks to reflect deletion
        } catch (error) {
          console.error("Error deleting task:", error);
          alert(`Could not delete task: ${error.message}`);
        }
      }
    });
  } else {
    console.error("Delete Task button not found.");
  }
}

/**
 * Sets up the add task modal functionality.
 */
function setupAddTaskModal() {
  const addTaskBtn = document.getElementById("add-task-btn");
  const addTaskModal = document.getElementById("add-task-modal");
  const closeAddTaskModalBtn = addTaskModal.querySelector(".close-btn");
  const addTaskForm = document.getElementById("add-task-form");

  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => {
      // Clear inputs when opening for a new task
      addTaskForm.querySelector('#new-task-title').value = '';
      addTaskForm.querySelector('#new-task-desc').value = '';
      addTaskForm.querySelector('#new-task-status').value = 'todo';

      addTaskModal.showModal();
    });
  } else {
    console.error("Add Task button not found. Ensure it has the ID 'add-task-btn'.");
  }

  if (closeAddTaskModalBtn) {
    closeAddTaskModalBtn.addEventListener("click", () => {
      addTaskModal.close();
    });
  } else {
    console.error("Close button for add task modal not found.");
  }

  const createTaskBtn = document.getElementById("create-task");
  if (createTaskBtn) {
    createTaskBtn.addEventListener('click', async (event) => {
      event.preventDefault(); // Prevent default form submission that might close modal

      const title = addTaskForm.querySelector('#new-task-title').value;
      const description = addTaskForm.querySelector('#new-task-desc').value;
      const status = addTaskForm.querySelector('#new-task-status').value;

      if (!title || !status) {
        alert("Please fill in at least the title and status for the new task.");
        return;
      }

      const newTask = {
        title,
        description,
        status
      };

      try {
        // Use the imported createTask function
        const addedTask = await createTask(newTask);
        console.log("Task added successfully:", addedTask);

        fetchTasksAndRender();
        addTaskModal.close();
      } catch (error) {
        console.error("Error adding task:", error);
        alert(`Could not add task: ${error.message}`);
      }
    });
  }
}

/**
 * Sets up the theme toggle functionality.
 */
function setupThemeToggle() {
  const themeButton = document.querySelector('.theme-btn');
  const body = document.body;

  const currentTheme = localStorage.getItem('theme');
  if (currentTheme) {
    body.classList.add(currentTheme);
  } else {
    body.classList.add('light-mode');
    localStorage.setItem('theme', 'light-mode');
  }

  if (themeButton) {
    themeButton.addEventListener('click', () => {
      if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light-mode');
      } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark-mode');
      }
    });
  } else {
    console.error("Theme button element not found. Ensure it has the class 'theme-btn'.");
  }
}

/**
 * Sets up the sidebar toggle functionality.
 */
function setupSidebarToggle() {
    const sideBar = document.getElementById('side-bar-div');
    const hideSidebarBtn = document.querySelector('.hide-sidebar-btn');
    const showSidebarBtn = document.querySelector('.show-sidebar-btn');
    const body = document.body;

    const isSidebarHidden = localStorage.getItem('sidebarHidden') === 'true';
    if (isSidebarHidden) {
        body.classList.add('sidebar-hidden');
        if (showSidebarBtn) {
            showSidebarBtn.classList.add('visible');
        }
    }

    if (hideSidebarBtn) {
        hideSidebarBtn.addEventListener('click', () => {
            body.classList.add('sidebar-hidden');
            if (showSidebarBtn) {
                showSidebarBtn.classList.add('visible');
            }
            localStorage.setItem('sidebarHidden', 'true');
        });
    } else {
        console.error("Hide sidebar button not found. Ensure it has the class 'hide-sidebar-btn'.");
    }

    if (showSidebarBtn) {
        showSidebarBtn.addEventListener('click', () => {
            body.classList.remove('sidebar-hidden');
            showSidebarBtn.classList.remove('visible');
            localStorage.setItem('sidebarHidden', 'false');
        });
    } else {
        console.error("Show sidebar button not found. Ensure it has the class 'show-sidebar-btn'.");
    }
}

/**
 * Fetches tasks from the API and renders them.
 */
async function fetchTasksAndRender() {
  const loadingIndicator = document.getElementById('loading-indicator');
  const mainContent = document.querySelector('main.card-column-main');
  const errorDisplay = document.getElementById('error-message');

  loadingIndicator.style.display = 'block'; // Show loading indicator
  mainContent.style.display = 'none'; // Hide main content
  errorDisplay.style.display = 'none'; // Hide error message

  try {
    // Use the imported getTasks function
    const tasks = await getTasks();
    renderTasks(tasks);

    loadingIndicator.style.display = 'none'; // Hide loading indicator
    mainContent.style.display = 'flex'; // Show main content
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    loadingIndicator.style.display = 'none'; // Hide loading indicator
    errorDisplay.textContent = `Error: ${error.message}`;
    errorDisplay.style.display = 'block'; // Show error message
  }
}

/**
 * Initializes the task board, modals, theme, and sidebar handlers.
 */
function initTaskBoard() {
  // Add loading indicator and error message elements if they don't already exist
  let loadingIndicator = document.getElementById('loading-indicator');
  let errorDisplay = document.getElementById('error-message');

  if (!loadingIndicator) {
      const layout = document.getElementById('layout'); // Assuming a 'layout' div wraps your content
      if (layout) {
          layout.insertAdjacentHTML('beforeend', `
            <div id="loading-indicator" style="display:none; position:absolute; top:50%; left:50%; transform: translate(-50%, -50%);">Loading...</div>
            <div id="error-message" style="display:none; color:red; position:absolute; top:50%; left:50%; transform: translate(-50%, -50%);"></div>
          `);
      } else {
          // Fallback if no layout div (e.g., append to body)
          document.body.insertAdjacentHTML('beforeend', `
            <div id="loading-indicator" style="display:none; position:absolute; top:50%; left:50%; transform: translate(-50%, -50%);">Loading...</div>
            <div id="error-message" style="display:none; color:red; position:absolute; top:50%; left:50%; transform: translate(-50%, -50%);"></div>
          `);
      }
      loadingIndicator = document.getElementById('loading-indicator');
      errorDisplay = document.getElementById('error-message');
  }

  fetchTasksAndRender(); // Fetch and render tasks from the API
  setupTaskModalCloseHandler();
  setupAddTaskModal();
  setupThemeToggle();
  setupSidebarToggle();
}

// Wait until DOM is fully loaded, then initialize everything
document.addEventListener("DOMContentLoaded", initTaskBoard);