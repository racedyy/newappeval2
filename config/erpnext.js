module.exports = {
    baseURL: process.env.ERPNEXT_URL || 'http://erpnext.localhost',
    apiKey: process.env.ERPNEXT_API_KEY,
    apiSecret: process.env.ERPNEXT_API_SECRET,
    apiEndpoints: {
        getResource: (doctype) => `/api/resource/${doctype}`,
        getSingle: (doctype) => `/api/resource/${doctype}/${doctype}`,
        getList: (doctype) => `/api/resource/${doctype}?fields=["*"]`
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};
