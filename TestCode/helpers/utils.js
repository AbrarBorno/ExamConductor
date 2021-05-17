const SEND = 0,
      RENDER = 1,
      REDIRECT = 2;

class Response {
    constructor() {
        this._sent = null;
        this._rendered = null;
        this._redirected = null;
        this._status = 200;
        this._attach = null;
        this.method = -1;
    }
    send(payload) {
        this._sent = payload;
        this.method = SEND;
        return this;
    }
    render(path, data) {
        this._rendered = { path, data };
        this.method = RENDER;
        return this;
    }
    redirect(location) {
        this._redirected = location;
        this.method = REDIRECT;
        return this;
    }
    status(code) {
        this._status = code;
        return this;
    }
    attachment(atc) {
        this._attach = atc;
        return this;
    }
    getSent() { return this._sent; };
    getRendered() { return this._rendered; }
    getRedirected() { return this._redirected };
}

class Request {
    constructor(user) {
        this.body = null;
        this.query = null;
        this.host = 'localhost';
        this.protocol = 'http';
        this.session = {
            destroy: () => { this.session.user = {}; },
            user: user ? user : {}
        };
    }
    setBody(obj) { this.body = obj; }
    setQuery(obj) { this.query = obj; }
    get(key) { return this[key]; }
}

module.exports = { Request, Response, SEND, RENDER, REDIRECT };