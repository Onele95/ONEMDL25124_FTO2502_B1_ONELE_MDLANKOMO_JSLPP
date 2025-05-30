// src/apiHandler.js

const BASE_URL = 'https://jsl-kanban-api.vercel.app';

/**
 * Generic function to make API requests.
 * @param {string} path - The specific API path (e.g., '/', '/:taskId').
 * @param {object} [options={}] - Fetch API options (method, headers, body, etc.).
 * @returns {Promise<any>} A promise that resolves with the parsed JSON data.
 * @throws {Error} If the network request fails or the API returns an error.
 */
async function makeApiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  try {
    const response = await fetch(url, options);
    const responseBody = await response.text(); // Read body once as text

    if (!response.ok) {
      let errorDetails = `API error: ${response.status} - ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseBody);
        errorDetails = `API error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`;
      } catch (jsonParseError) {
        errorDetails = `API error: ${response.status} - ${response.statusText}. Server responded with (not JSON): ${responseBody.substring(0, 200)}...`;
      }
      throw new Error(errorDetails);
    }

    // Attempt to parse JSON for successful responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return responseBody ? JSON.parse(responseBody) : {}; // Handle empty JSON responses
    } else {
      // If not JSON, return the text directly (e.g., for empty 204 No Content)
      return responseBody;
    }
  } catch (error) {
    console.error(`Network or parsing error for ${url}:`, error);
    throw new Error(`Could not connect to API or parse response for ${url}: ${error.message}`);
  }
}

/**
 * Fetches all tasks from the API.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of task objects.
 */
export async function getTasks() {
  console.log('Fetching tasks from API...');
  return makeApiRequest('/'); // Assuming '/' returns all tasks for GET
}

/**
 * Creates a new task via the API.
 * @param {Object} newTask - The task data to create.
 * @returns {Promise<Object>} A promise that resolves with the created task object (including its ID).
 */
export async function createTask(newTask) {
  console.log('Creating task via API:', newTask);
  return makeApiRequest('/', { // Assuming POST to '/' creates a new task
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newTask),
  });
}

/**
 * Updates an existing task via the API.
 * @param {string} taskId - The ID of the task to update.
 * @param {Object} updatedFields - The fields to update for the task.
 * @returns {Promise<Object>} A promise that resolves with the updated task object.
 */
export async function updateTask(taskId, updatedFields) {
  console.log('Updating task via API. ID:', taskId, 'Data:', updatedFields);
  return makeApiRequest(`/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedFields),
  });
}

/**
 * Deletes a task via the API.
 * @param {string} taskId - The ID of the task to delete.
 * @returns {Promise<void>} A promise that resolves when the task is successfully deleted.
 */
export async function deleteTask(taskId) {
  console.log('Deleting task via API. ID:', taskId);
  return makeApiRequest(`/${taskId}`, {
    method: 'DELETE',
  });
}