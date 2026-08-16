const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        return null;
    }
}

async function handleTokenRefresh() {
    const refreshTokenValue = localStorage.getItem("refresh_token");
    if (!refreshTokenValue) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshTokenValue })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("token", data.accessToken);
            return data.accessToken;
        } else {
            // If refresh fails, clear everything
            localStorage.removeItem("token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("hrms_user");
            window.location.href = "/login";
            return null;
        }
    } catch (error) {
        console.error("Refresh Error:", error);
        return null;
    }
}

export const apiFetch = async (url: string, options: RequestInit = {}) => {
    let token = localStorage.getItem("token");

    if (token) {
        const decoded = parseJwt(token);
        if (decoded && decoded.exp) {
            const exp = decoded.exp * 1000;
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            const remaining = exp - now;

            // If expired or expiring in less than 5 minutes
            if (remaining < fiveMinutes) {
                const newToken = await handleTokenRefresh();
                if (newToken) token = newToken;
            }
        }
    }

    const headers: any = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (options.body instanceof FormData) {
        delete headers["Content-Type"];
    }

    if (token && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });
};

export default API_BASE_URL;
