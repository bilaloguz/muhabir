import axios from 'axios';

const API_URL = 'http://localhost:8000';

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