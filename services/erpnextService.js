const axios = require('axios');
const erpConfig = require('../config/erpnext');

class ERPNextService {
    constructor() {
        console.log('Initializing ERPNext Service with config:', {
            baseURL: erpConfig.baseURL,
            apiKey: erpConfig.apiKey ? '***' : 'not set',
            apiSecret: erpConfig.apiSecret ? '***' : 'not set'
        });

        this.api = axios.create({
            baseURL: erpConfig.baseURL,
            headers: {
                ...erpConfig.headers,
                'Authorization': `token ${erpConfig.apiKey}:${erpConfig.apiSecret}`
            },
            timeout: 5000 // 5 seconds timeout
        });

        // Add request interceptor for logging
        this.api.interceptors.request.use(request => {
            console.log('Making request:', {
                method: request.method,
                url: request.url,
                baseURL: request.baseURL,
                headers: {
                    ...request.headers,
                    Authorization: 'token ***' // Hide sensitive data
                }
            });
            return request;
        });

        // Add response interceptor for logging
        this.api.interceptors.response.use(
            response => {
                console.log('Received response:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data
                });
                return response;
            },
            error => {
                console.error('API Error:', {
                    message: error.message,
                    code: error.code,
                    config: {
                        url: error.config?.url,
                        baseURL: error.config?.baseURL,
                        method: error.config?.method
                    },
                    response: error.response ? {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    } : 'No response'
                });
                throw error;
            }
        );
    }

    async makeRequest(method, endpoint, options = {}) {
        try {
            const config = {
                method,
                url: endpoint,
                baseURL: this.api.defaults.baseURL,
                headers: {
                    ...this.api.defaults.headers,
                    'Authorization': `token ${erpConfig.apiKey}:${erpConfig.apiSecret}`
                },
                ...options
            };

            console.log('Making request:', {
                method: config.method,
                url: config.url,
                baseURL: config.baseURL,
                headers: {
                    ...config.headers,
                    'Authorization': 'token ***'
                }
            });

            const response = await axios(config);
            return response;
        } catch (error) {
            console.error('API Error:', {
                message: error.message,
                code: error.code,
                config: {
                    url: error.config.url,
                    baseURL: error.config.baseURL,
                    method: error.config.method
                },
                response: error.response ? {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                } : undefined
            });
            throw error;
        }
    }

    async testConnection() {
        try {
            console.log('Testing ERPNext connection...');
            const response = await this.makeRequest('GET', '/api/method/frappe.auth.get_logged_user');
            console.log('Connection test successful:', response.data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Connection test failed:', error.message);
            return { 
                success: false, 
                error: error.message,
                details: {
                    code: error.code,
                    baseURL: error.config?.baseURL,
                    url: error.config?.url
                }
            };
        }
    }

    async validateLogin(email, password) {
        try {
            console.log('Attempting to validate login for:', email);
            
            // First test the connection
            const connectionTest = await this.testConnection();
            if (!connectionTest.success) {
                console.error('Connection test failed during login');
                return connectionTest;
            }

            // Then try to get user details
            const userDetails = await this.getDoc('User', email);
            console.log('User details result:', userDetails);

            if (!userDetails.success) {
                return {
                    success: false,
                    error: 'Invalid credentials or user not found'
                };
            }

            return { 
                success: true, 
                user: userDetails.data 
            };
        } catch (error) {
            console.error('Login validation failed:', error.message);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async getList(doctype, filters = {}) {
        try {
            console.log('Getting list for doctype:', doctype, { filters });
            
            // Construire l'URL avec les paramètres
            let url = `/api/resource/${doctype}`;
            let params = new URLSearchParams();

            // Ajouter les champs par défaut si non spécifiés
            if (!filters.fields) {
                params.append('fields', '["name"]');
            }

            // Traiter les filtres spéciaux
            if (filters.fields) {
                params.append('fields', JSON.stringify(filters.fields));
            }
            
            if (filters.filters) {
                params.append('filters', JSON.stringify(filters.filters));
            }

            if (filters.order_by) {
                params.append('order_by', filters.order_by);
            }

            if (filters.limit_page_length) {
                params.append('limit_page_length', filters.limit_page_length);
            }

            // Ajouter d'autres filtres simples
            Object.entries(filters).forEach(([key, value]) => {
                if (!['fields', 'filters', 'order_by', 'limit_page_length'].includes(key)) {
                    if (Array.isArray(value)) {
                        params.append('filters', JSON.stringify([[doctype, key, value[0], value[1]]]));
                    } else {
                        params.append('filters', JSON.stringify([[doctype, key, '=', value]]));
                    }
                }
            });

            const finalUrl = `${url}?${params.toString()}`;
            console.log('Making request to:', finalUrl);

            const response = await this.api.get(finalUrl);
            return { success: true, data: response.data.data };
        } catch (error) {
            console.error(`Error getting list for ${doctype}:`, error.message);
            return { success: false, data: [], error: error.message };
        }
    }

    async getDoc(doctype, name) {
        try {
            const response = await this.makeRequest('GET', `/api/resource/${doctype}/${name}`);
            return { success: true, data: response.data.data };
        } catch (error) {
            console.error(`Error getting ${doctype}:`, error);
            return { success: false, error };
        }
    }

    async getPrintFormat(doctype, name, printFormat = 'Standard') {
        try {
            const response = await this.api.post('/api/method/frappe.utils.print_format.download_pdf', {
                doctype: doctype,
                name: name,
                format: printFormat,
                no_letterhead: 0
            }, {
                responseType: 'arraybuffer'  // Important pour recevoir le PDF en binaire
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`Error getting print format for ${doctype}:`, error);
            return { success: false, error };
        }
    }

    async createDoc(doctype, doc) {
        try {
            console.log(`Creating document in ${doctype}:`, doc);
            const response = await this.makeRequest('POST', erpConfig.apiEndpoints.getResource(doctype), {
                data: doc
            });
            return { success: true, data: response.data.data };
        } catch (error) {
            console.error(`Error creating document in ${doctype}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async updateDoc(doctype, name, doc) {
        try {
            console.log(`Updating document: ${doctype}/${name}`, doc);
            const response = await this.makeRequest('PUT', `${erpConfig.apiEndpoints.getResource(doctype)}/${name}`, {
                data: doc
            });
            return { success: true, data: response.data.data };
        } catch (error) {
            console.error(`Error updating document ${doctype}/${name}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async deleteDoc(doctype, name) {
        try {
            console.log(`Deleting document: ${doctype}/${name}`);
            const response = await this.makeRequest('DELETE', `${erpConfig.apiEndpoints.getResource(doctype)}/${name}`);
            return { success: true, data: response.data.data };
        } catch (error) {
            console.error(`Error deleting document ${doctype}/${name}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async submitDoc(doctype, name) {
        try {
            console.log(`Submitting document: ${doctype}/${name}`);
            
            // 1. D'abord récupérer le document complet
            const docResult = await this.getDoc(doctype, name);
            if (!docResult.success) {
                throw new Error('Document not found');
            }

            // 2. Soumettre le document
            const response = await this.makeRequest('POST', `/api/method/frappe.client.submit`, {
                data: {
                    doc: docResult.data
                }
            });
            
            return { success: true, data: response.data.data };
        } catch (error) {
            console.error(`Error submitting document ${doctype}/${name}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ERPNextService();
