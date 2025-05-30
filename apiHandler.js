// apiHandler.js



// This ensures URLs are formed correctly, e.g., 'https://jsl-kanban-api.vercel.app/some-task-id'
const API_BASE_URL = 'https://jsl-kanban-api.vercel.app'; // 

/**
 * Helper function to handle API response errors.
 * This checks if the HTTP response status is OK (2xx).
 * If not, it attempts to parse error data from the response body and throws an informative error.
 * @param {Response} response - The fetch API response object.
 * @returns {Promise<Response>} The response if OK, otherwise throws an error.
 */
async function handleResponse(response) {
    if (!response.ok) {
        let errorData = { message: response.statusText || 'Unknown error' };
        try {
            // Attempt to parse JSON error message from the response body
            const json = await response.json();
            if (json && (json.message || json.error)) {
                errorData.message = json.message || json.error;
            } else if (typeof json === 'string') {
                errorData.message = json; // Sometimes APIs return raw error strings
            }
        } catch (e) {
            // If response is not JSON or cannot be parsed, ignore and use default message
            console.warn("Could not parse error response as JSON:", e);
        }
        // Throw an error with the HTTP status and the extracted (or default) error message
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
    }
    // If the response is OK, return it for further processing (e.g., parsing JSON)
    return response;
}

/**
 * Fetches all tasks from the Kanban API.
 * Makes a GET request to the base URL `https://jsl-kanban-api.vercel.app`.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of task objects.
 * Returns an empty array if there's an error during the fetch operation or parsing.
 */
export async function fetchTasks() {
    try {
        // Fetch from the base URL to get all tasks
        const response = await fetch(API_BASE_URL);
        // Validate the HTTP response status using the helper function
        await handleResponse(response);
        // Parse the JSON data from the response body to get the tasks array
        const tasks = await response.json();
        return tasks;
    } catch (e) {
        console.error("Error fetching tasks from API:", e);
        // Return an empty array on error to prevent the application from crashing
        // and to allow the UI to render gracefully (e.g., an empty board or an error message).
        return [];
    }
}

/**
 * Creates a new task on the Kanban API.
 * Makes a POST request to the base URL `https://jsl-kanban-api.vercel.app`.
 * @param {Object} taskData - The new task object to send (e.g., {title: "New Task", description: "...", status: "todo"}).
 * The API is expected to assign a unique ID to the newly created task and return it.
 * @returns {Promise<Object|null>} A promise that resolves to the created task object (including its API-assigned ID),
 * or null if the creation fails (e.g., due to network error, server error, or validation failure).
 */
export async function createTask(taskData) {
    try {
        // Send a POST request to the base URL to create a new task
        const response = await fetch(API_BASE_URL, {
            method: 'POST', // Use POST method for creation
            headers: {
                'Content-Type': 'application/json', // Inform the server we are sending JSON
            },
            body: JSON.stringify(taskData), // Convert the JavaScript object to a JSON string
        });

        await handleResponse(response); // Validate the HTTP response status
        // Parse the JSON response, which should contain the newly created task object (with ID)
        const createdTask = await response.json();
        return createdTask; // Return the task object received from the API
    } catch (e) {
        console.error("Error creating task:", e);
        return null; // Return null to indicate failure
    }
}

/**
 * Updates an existing task on the Kanban API.
 * Makes a PUT request to `https://jsl-kanban-api.vercel.app/:id`.
 * @param {Object} task - The task object with updated details. This object MUST include `task.id`
 * so the API knows which task to update.
 * @returns {Promise<Object|null>} A promise that resolves to the updated task object (as returned by the API),
 * or null if the update fails.
 */
export async function updateTask(task) {
    // Basic validation: ensure a task ID is provided for the update
    if (!task.id) {
        console.error("Attempted to update task without an ID.");
        return null;
    }
    try {
        // Construct the URL by appending the task ID to the base URL.
        // Example: 'https://jsl-kanban-api.vercel.app/unique-task-id-123'
        const response = await fetch(`${API_BASE_URL}/${task.id}`, {
            method: 'PUT', // Use PUT method for updating an existing resource
            headers: {
                'Content-Type': 'application/json', // Inform the server we are sending JSON
            },
            body: JSON.stringify(task), // Send the entire task object (including updated fields)
        });

        await handleResponse(response); // Validate the HTTP response status
        // Parse the JSON response, which should contain the updated task object
        const updatedTask = await response.json();
        return updatedTask; // Return the task object received from the API
    } catch (e) {
        console.error(`Error updating task ${task.id}:`, e);
        return null; // Return null to indicate failure
    }
}

/**
 * Deletes a task from the Kanban API.
 * Makes a DELETE request to `https://jsl-kanban-api.vercel.app/:id`.
 * @param {string} taskId - The unique ID of the task to delete.
 * @returns {Promise<boolean>} A promise that resolves to `true` if deletion was successful,
 * or `false` otherwise.
 */
export async function deleteTask(taskId) {
    try {
        // Construct the URL by appending the task ID to the base URL for deletion
        // Example: 'https://jsl-kanban-api.vercel.app/unique-task-id-456'
        const response = await fetch(`${API_BASE_URL}/${taskId}`, {
            method: 'DELETE', // Use DELETE method for deletion
        });

        // Validate the HTTP response status. A successful DELETE often returns 204 No Content,
        // which `response.ok` will correctly evaluate as true.
        await handleResponse(response);
        // For a DELETE request, the API typically sends no content in the response body,
        // so no need to parse JSON here.
        return true; // Indicate successful deletion
    } catch (e) {
        console.error(`Error deleting task ${taskId}:`, e);
        return false; // Return false to indicate failure
    }
}