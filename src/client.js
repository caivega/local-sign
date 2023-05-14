import axios from 'axios';

function Client(url, root) {
    console.log(url, root);
    return {
        id:0,
        url: url,
        root:root,
        post: function(data, callback) {
            data.id = this.id ++;
            if(this.root != null){
                if (data.params.length > 0) {
                    for(var i in data.params) {
                        data.params[i].root = this.root;
                    }
                }else{
                    data.params = [{root:this.root}]
                }
            }
            console.log(data.id, data.method, data.params);
            axios.post(this.url, data)
            .then(function (response) {
                console.log(response.data);
                callback && callback(response.data);
            }).catch(function (error) {
                console.log(error);
                callback && callback(error);
            });
        },
        block_number(callback) {
            this.post({
                method:"blockNumber",
                params:[]
            }, callback);
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
        get_meta(symbol, callback) {
            this.post({
                method:"getMeta",
                params:[
                    {
                        symbol
                    }
                ]
            }, callback);
        },
        get_block_by_number(num, callback){
            this.post({
                method:"getBlockByNumber",
                params:[
                    {
                        num
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