import axios from 'axios';

function Client(url) {
    console.log(url);
    return {
        id:0,
        url: url,
        post: function(data, callback) {
            data.id = this.id ++;

            console.log(data.id, data.method);
            axios.post(this.url, data)
            .then(function (response) {
                console.log(response.data);
                callback && callback(response.data);
            }).catch(function (error) {
                console.log(error);
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
        get_data(hash, format, callback) {
            this.post({
                method:"getData",
                params:[
                    {
                        hash,
                        format
                    }
                ]
            }, callback);
        },
        get_user_data(address, account, callback){
            this.post({
                method:"getUserData",
                params:[
                    {
                        address,
                        account
                    }
                ]
            }, callback);
        },
        get_contract_data(from, to, format, callback){
            this.post({
                method:"getContractData",
                params:[
                    {
                        from,
                        to,
                        format
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
        call_contract(data_address, code_address, method, params, callback){
            this.post({
                method:"callContract",
                params:[
                    {
                        from: data_address, 
                        to: code_address,
                        method: method,
                        params: params
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
        },
        send_raw_transaction(blob, callback) {
            this.post({
                method:"sendRawTransaction",
                params:[ {
                    blob
                } ]
            }, callback);
        }
    };
}

export default Client;