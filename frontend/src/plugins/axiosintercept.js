axios.interceptors.request.use(async config => {
    const token = await updateToken();
    console.log(token)
    config.headers.common['Authorization'] = `Bearer ${token}`;
    return config;
});