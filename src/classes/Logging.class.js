export default class Logging{
    status; user; data; response; details;
    constructor (user, data, response){
        this.user = user;
        if(data.password)  {
            const dataClone = JSON.parse(JSON.stringify(data));
            delete dataClone.password;
            this.data = dataClone;
        } else this.data = data;
        this.response = response;
    }
    SentDetails = (method, url, headers) => {
        //add ip taker and more details like local time
        this.details = {method, url, headers};
        return this;
    }
}
