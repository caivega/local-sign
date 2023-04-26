import axios from 'axios';

function Client(url) {
    return {
        url: url,
        post: function(data, callback) {
            axios.post(this.url, data)
              .then(function (response) {
                callback && callback(response.data);
              })
              .catch(function (error) {
                callback && callback(error);
              });
        },
        get_balance(address, callback) {
            this.post({
                method:"getBalance",
                params:[
                    {
                        address
                    }
                ]
            }, callback);
        },
        get_account(address, callback) {
            this.post({
                method:"getStateByAddress",
                params:[
                    {
                        type: "AccountState", 
                        address: address
                    }
                ]
            }, callback);
        },
        get_transaction_count(address, callback) {
            this.post({
                method:"getTransactionCount",
                params:[
                    {
                        address
                    }
                ]
            }, callback);
        }
    };
}

export default Client;