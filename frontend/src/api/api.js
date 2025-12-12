import axios from 'axios';

export const API_URL = 'http://localhost:8001';

export const api = axios.create({
    baseURL: API_URL,
});

export const getArticles = async (params = {}) => {
    // Custom serialization for arrays (FastAPI expects key=val&key=val2)
    const searchParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
        const val = params[key];
        if (val === null || val === undefined) return;

        if (Array.isArray(val)) {
            val.forEach(v => searchParams.append(key, v));
        } else {
            searchParams.append(key, val);
        }
    });

    const response = await api.get(`/article/?${searchParams.toString()}`);
    return response.data;
};

export const getFilterOptions = async () => {
    const response = await api.get('/article/filters');
    return response.data;
};

export const updateArticle = async (id, data) => {
    const response = await api.put(`/article/${id}`, data);
    return response.data;
};

export const updateImage = async (id, data) => {
    const response = await api.put(`/article/image/${id}`, data);
    return response.data;
};

export const updateImageContent = async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.put(`/article/image/${id}/content`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const processImage = async (id, action) => {
    // Process Image AI Tools
    const response = await axios.post(`${API_URL}/article/image/${id}/process`, null, {
        params: { action },
        responseType: 'blob'
    });
    return response.data;
};

export const createImage = async (articleId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/article/${articleId}/image`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};