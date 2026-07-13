export const API_URL = "http://localhost:3000"

const Auth = {
    _currentUser: null,
    _listeners: [],

    // Inicializamos obteniendo el localStorage
    init() {
        const stored = localStorage.getItem("currentUser");
        this._currentUser = stored ? JSON.parse(stored) : null // aqui verificamos que si el usuario ha sido logueado pues lo scanea y sino pues manda un null
    },

    getUser() {
        return this._currentUser; // retornamos currentUser porque es la variable que contiene el usuario actalizado obtenido por el getItem
    },

    isAuthenticated() {
        return this._currentUser !== null // verifica si hay usauario actualizado. osea si no esta nulo, entonces si hay un usuario actualizado pues retorna true 
    },

    isAdmin() {
        return this._currentUser?.role === "admin"
    },

    isUser() {
        return this._currentUser?.role === "user"
    },

    async Login(email, password) {
        const res = await fetch(`${API_URL}/users?email=${email}`);
        const users = await res.json()

        if (users.length === 0 || users[0].password !== password) {
            throw new Error("Credenciales incorrectas")
        }

        const user = users[0] //obtiene el primer usuario encontrado
        localStorage.setItem("currentUser", JSON.stringify(user))
        this._currentUser = user
        this._notify()
        return user
    },

    logout() {
        localStorage.removeItem("currentUser") //para la salida de sesion y elimina el elemento guardado
        this._currentUser = null
        this._notify()
    },

    onChange(callback) {
        this._listeners.push(callback)
    },

    _notify() {
        this._listeners.forEach(cb => cb(this._currentUser))
    }
}

export default Auth;