const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const createFetchWithAuth = (defaultWithoutAuth = false) => {
  return async (url: string, options: RequestInit = {}) => {
    // If defaultWithoutAuth is true, don't add Authorization header
    if (defaultWithoutAuth) {
      return fetch(`${SERVER_URL}${url}`, options);
    }

    // Otherwise, add Authorization header
    const token = localStorage.getItem("authToken");
    const headers: HeadersInit = {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    };

    const fullUrl = `${SERVER_URL}${url}`;

    try {
      const response = await fetch(fullUrl, { ...options, headers });

      // Log out if Unauthorized (401) is returned
      if (response.status === 401) {
        console.error("Unauthorized. Token may have expired. Logging out...");
        // Clear any stored tokens and user data as needed
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        // Redirect to login page or any other logout handling logic
        window.location.href = "/";
        return response;
      }

      return response;
    } catch (error) {
      console.error("Error during fetch:", error);
      throw error;
    }
  };
};

export const fetchApi = createFetchWithAuth();

export const fetchUnAuthApi = createFetchWithAuth(false);
