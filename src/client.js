import axios from 'axios';

function Client(url, root) {
    console.log(url, root);
    return {
        id:0,
        url: url,
        root:root,
        with: function(root) {
            return new Client(this.url, root);
        },
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
            this.blockNumber(callback);
        },
        blockNumber(callback){
            this.post({
                method:"blockNumber",
                params:[]
            }, callback);
        },
        get_balance(address, callback) {
            this.getBalance({
                address
            }, callback);
        },
        getBalance(p, callback){
            this.post({
                method:"getBalance",
                params:[
                    p
                ]
            }, callback);
        },
        get_meta(symbol, callback) {
            this.getMeta({
                symbol
            }, callback);
        },
        getMeta(p, callback){
            this.post({
                method:"getMeta",
                params:[
                    p
                ]
            }, callback);
        },
        get_block_by_number(num, callback){
            this.getBlockByNumber({
                num
            }, callback);
        },
        getBlockByNumber(p, callback){
            this.post({
                method:"getBlockByNumber",
                params:[
                    p
                ]
            }, callback);
        },
        get_transaction_by_hash(hash, callback){
            this.getTransactionByHash({
                hash
            }, callback);
        },
        getTransactionByHash(p, callback){
            this.post({
                method:"getTransactionByHash",
                params:[
                    p
                ]
            }, callback);
        },
        get_data(hash, format, callback) {
            this.getData({
                hash,
                format
            }, callback);
        },
        getData(p, callback){
            this.post({
                method:"getData",
                params:[
                    p
                ]
            }, callback);
        },
        get_user_data(address, account, callback){
            this.getUserData({
                address,
                account
            }, callback);
        },
        getUserData(p, callback){
            this.post({
                method:"getUserData",
                params:[
                    p
                ]
            }, callback);
        },
        get_contract_data(from, to, format, callback){
            this.getContractData({
                from,
                to,
                format
            }, callback);
        },
        getContractData(p, callback){
            this.post({
                method:"getContractData",
                params:[
                    p
                ]
            }, callback);
        },
        get_account(address, callback) {
            this.getAccount({
                type: "AccountState", 
                address: address
            }, callback);
        },
        getAccount(p, callback){
            this.post({
                method:"getStateByAddress",
                params:[
                    p
                ]
            }, callback);
        },
        call_contract(data_address, code_address, method, params, callback){
            this.callContract({
                from: data_address, 
                to: code_address,
                method: method,
                params: params
            }, callback);
        },
        callContract(p, callback){
            this.post({
                method:"callContract",
                params:[
                    p
                ]
            }, callback);
        },
        get_transaction_count(address, callback) {
            this.getTransactionCount({
                address
            }, callback);
        },
        getTransactionCount(p, callback){
            this.post({
                method:"getTransactionCount",
                params:[
                    p
                ]
            }, callback);
        },
        send_raw_transaction(blob, callback) {
            this.sendRawTransaction({
                blob
            }, callback);
        },
        sendRawTransaction(p, callback) {
            this.post({
                method:"sendRawTransaction",
                params:[ 
                    p
                ]
            }, callback);
        }
    };
}

export default Client;