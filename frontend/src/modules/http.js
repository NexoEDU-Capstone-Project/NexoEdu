import { API_URL } from "../src/modules/auth"
const http= {
    async request (method, endpoint, body = null) {
        const options = {
            method, //specifies method in function call
            headers: {
                "Content-Type": "application/json"
            }
        }

        if (body) {
            options.body= JSON.stringify(body)
        }

        return fetch(`${API_URL}/${endpoint}`, options)
    },

    get(endpoint) {
        return this.request("GET", endpoint)
    },
    post(endpoint, data) {
        return this.request("POST", endpoint, data);
    },
    put(endpoint, id, user) {
        return this.request("PUT", `${endpoint}/${id}`, user);
    },
    delete(endpoint, id) {
        return this.request("DELETE", `${endpoint}/${id}`);
    }

/*
    example
    await http.post({
        "students",
        {
            name: "Nathan Yahoo",
            age: 24
        }
        
    })
*/
}

export default http