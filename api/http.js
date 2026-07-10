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

        return await fetch(`${API_URL}/${endpoint}`, options)
    },

    get(endpoint) {
        return this.request("GET", endpoint)
    },
    create(endpoint, data) {
        return this.request("POST", endpoint, data);
    },
    update(endpoint, identifier, user) {
        return this.request("PUT", `${endpoint}/${identifier}`, user);
    },
    delete(id) {
        return this.request("DELETE", `users/${id}`);
    }

/*
    example
    await http.createUser({
        name: "Nathan Yahoo",
        age: 24
    })
*/
}

export default http